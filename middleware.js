const ExpressError = require('./utils/ExpressError')
    , Campground = require('./models/campground')
    , Review = require('./models/review')
    , User = require('./models/user')
    , {VerificationToken, PasswordToken} = require('./models/token')
    , mongoose = require('mongoose')
    , mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding')
    , mapBoxToken = process.env.MAPBOX_TOKEN
    , geocoder = mbxGeocoding({accessToken: mapBoxToken})
    , bcrypt = require('bcrypt')
    , {deleteUploadedImages} = require('./cloudinary');

const {
    campgroundSchema,
    reviewSchema,
    userSchema,
    passwordSchema,
    userProfileSchema
} = require('./schemas');


module.exports.isLoggedIn = (req, res, next) => {
    if(!req.isAuthenticated()) {
        req.session.returnTo = req.originalUrl;
        throw new ExpressError('You must be signed in first!', 400, '/login');
    }
    next();
}

module.exports.isLoggedOut = (req, res, next) => {
    if(!req.isAuthenticated()) {
        return next();
    }
    req.flash('success', 'You are already verified and signed in.');
    res.redirect('/campgrounds');
};

module.exports.isActive = async(req, res, next) => {
    const user = await User.findOne({username: req.body.username});
    if(!user) return next();
    if(!user.isActive)
        throw new ExpressError(`Your email has not been verified. 
                            Please click <a href='/resend'>here</a> to resend token!`, 400, '/login');
    next();
}

module.exports.isValidVerificationToken = async(req, res, next) => {
    const {token} = req.params;
    const verificationToken = await VerificationToken.findOne({token});
    if(!verificationToken)
        throw new ExpressError('Verification token expired!', 400, '/resend');
    next();
}

module.exports.isValidPasswordToken = async(req, res, next) => {
    const {token} = req.params;
    const {id} = req.query;
    if(!id)
        throw new ExpressError('Something went wrong!', 400, '/forgot');
    validateIDLength(id);
    const passwordToken = await PasswordToken.findById(id);
    if(!passwordToken)
        throw new ExpressError('Reset token expired!', 400, '/forgot');
    const isValidToken = bcrypt.compare(token, passwordToken.token);
    if(!isValidToken)
        throw new ExpressError('Invalid or expired password reset token', 400, '/forgot');
    next();
}

module.exports.isValidCampgroundID = async(req, res, next) => {
    const {id} = req.params;
    validateIDLength(id);
    const campground = await findByIDAndValidate(id, Campground);
    res.locals.campground = campground;
    next();
}

module.exports.isValidUserID = async(req, res, next) => {
    const {id} = req.params;
    validateIDLength(id);
    const user = await findByIDAndValidate(id, User);
    res.locals.user = user;
    next();
}

module.exports.isValidReviewID = async(req, res, next) => {
    const {reviewId} = req.params;
    validateIDLength(reviewId);
    const review = await findByIDAndValidate(reviewId, Review);
    res.locals.review = review;
    next();
}

const validateIDLength = id => {
    if(!isIDLengthValid(id))
        throw new ExpressError('Could not find that path!', 400, '/campgrounds');
}

const isIDLengthValid = id => mongoose.Types.ObjectId.isValid(id);

const findByIDAndValidate = async(id, model) => {
    const document = await model.findById(id);
    if(!document)
        throw new ExpressError(`Cannot find that ${model.modelName.toLowerCase()}!`, 400, '/campgrounds');
    return document;
}

module.exports.isProfileOwnerOrAdmin = (req, res, next) => {
    const currentUser = req.user
        , profileOwner = res.locals.user;
    if(isUserOwnerOrAdmin(currentUser, profileOwner)) {
        allowPermission(next);
    } else {
        denyPermissionAndRedirect(`/users/${profileOwner._id}`);
    }

}

module.exports.isCampAuthorOrAdmin = (req, res, next) => {
    const currentUser = req.user
        , campground = res.locals.campground;
    if(isUserOwnerOrAdmin(currentUser, campground.author)) {
        allowPermission(next);
    } else {
        denyPermissionAndRedirect(`/campgrounds/${campground._id}`);
    }
}

module.exports.isReviewAuthorOrAdmin = (req, res, next) => {
    const {id} = req.params
        , currentUser = req.user
        , review = res.locals.review;
    if(isUserOwnerOrAdmin(currentUser, review.author)) {
        allowPermission(next);
    } else {
        denyPermissionAndRedirect(`/campgrounds/${id}`);
    }
}

const isUserOwnerOrAdmin = (user, owner) => {
    return !!(user.equals(owner) || user.isAdmin);
}

const allowPermission = (next) => {
    return next();
}

const denyPermissionAndRedirect = (path) => {
    throw new ExpressError('You do not have permission to do that', 403, path);
}

module.exports.validateReview = async(req, res, next) => {
    await reviewSchema.validateAsync(req.body);
    next();
}

module.exports.validateUser = async(req, res, next) => {
    await userSchema.validateAsync(req.body);
    next();
}

module.exports.validateUserProfile = async(req, res, next) => {
    await userProfileSchema.validateAsync(req.body, {allowUnknown: true});
    next();
}

module.exports.validatePassword = async(req, res, next) => {
    await passwordSchema.validateAsync(req.body, {allowUnknown: true});
    next();
}

module.exports.validateCampground = async(req, res, next) => {
    await campgroundSchema.validateAsync(req.body);
    const geoData = await getAndValidateGeometry(req.body.campground.location)
        , location = getLocation(geoData);
    res.locals.geometry = geoData.body.features[0].geometry;
    res.locals.location = location;
    next();
}

const getAndValidateGeometry = async(location) => {
    const geoData = await geocoder.forwardGeocode({
        query: location,
        limit: 1
    }).send();
    if(!geoData.body.features[0])
        throw new ExpressError('Could not find that location!', 400);
    return geoData;
}

const getLocation = (geoData) => {
    const place = geoData.body.features[0].text
        , country = geoData.body.features[0].context.pop().text;
    return `${place}, ${country}`;
}

module.exports.validateImageCount = (req, res, next) => {
    const campground = res.locals.campground
        , amountOfCurrentImages = campground.images.length
        , amountOfImagesToUpload = req.files.length
        , amountOfImagesToDelete = req.body.deleteImages ? req.body.deleteImages.length : 0;
    if(amountOfCurrentImages + amountOfImagesToUpload - amountOfImagesToDelete > 3) {
        deleteUploadedImages(req);
        throw new ExpressError('Campground cannot have more than 3 images', 400, `/campgrounds/${campground._id}/edit`);
    }
    next();
}

module.exports.isPasswordCorrect = async(req, res, next) => {
    const userToUpdate = res.locals.user
        , passwordMatch = await userToUpdate.authenticate(req.body.currentPassword);
    if(!passwordMatch.user)
        throw new ExpressError('The Given Password Is Incorrect!', 400);
    next();
}