const {campgroundSchema, reviewSchema} = require('./schemas');
const ExpressError = require('./utils/ExpressError');
const Campground = require('./models/campground');
const Review = require("./models/review");
const {cloudinary} = require('./cloudinary');

module.exports.isLoggedIn = (req, res, next) => {
    if (!req.isAuthenticated()) {
        req.session.returnTo = req.originalUrl;
        req.flash('error', 'You must be signed in first!');
        return res.redirect('/login');
    }
    next();
}

module.exports.notLoggedIn = (req, res, next) => {
    if (!req.isAuthenticated()) {
        return next();
    }
    req.flash('success', 'You are already signed in.');
    res.redirect('/campgrounds');
};

module.exports.validateCampground = async (req, res, next) => {
    const {error} = campgroundSchema.validate(req.body);
    if (error) {
        for (let file of req.files) {
            await cloudinary.uploader.destroy(file.filename);
        }
        const msg = error.details.map(el => el.message).join(',');
        throw new ExpressError(msg, 400);
    } else {
        next();
    }
}

module.exports.validateReview = (req, res, next) => {
    const {error} = reviewSchema.validate(req.body);
    if (error) {
        const msg = error.details.map(el => el.message).join(',');
        throw new ExpressError(msg, 400);
    } else {
        next();
    }
}

module.exports.isAuthor = async (req, res, next) => {
    const {id} = req.params;
    const foundCampground = await Campground.findById(id);
    if (!foundCampground.author.equals(req.user._id)) {
        req.flash('error', 'You do not have permission to do that');
        return res.redirect(`/campgrounds/${id}`);
    }
    next();
}

module.exports.isReviewAuthor = async (req, res, next) => {
    const {reviewId, id} = req.params;
    const foundReview = await Review.findById(reviewId);
    if (!foundReview.author.equals(req.user._id)) {
        req.flash('error', 'You do not have permission to do that');
        return res.redirect(`/campgrounds/${id}`);
    }
    next();
}

module.exports.validateImageCount = async (req, res, next) => {
    const {id} = req.params;
    const foundCampground = await Campground.findById(id);

    const deleteImagesLength = req.body.deleteImages ? req.body.deleteImages.length : 0;

    if (foundCampground.images.length + req.files.length - deleteImagesLength > 3) {
        for (let file of req.files) {
            await cloudinary.uploader.destroy(file.filename);
        }
        // req.flash('error', 'Campground cannot have more than 3 images');
        // return res.redirect(`/campgrounds/${id}/edit`);
        throw new ExpressError('Campground cannot have more than 3 images', 400);
    }
    next();
}