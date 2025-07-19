import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import mbxGeocoding from '@mapbox/mapbox-sdk/services/geocoding.js';
import { deleteUploadedImages } from './cloudinary.js';
import { Campground } from './models/campground.js';
import { Review } from './models/review.js';
import { User } from './models/user.js';
import { VerificationToken, PasswordToken } from './models/token.js';
import { ExpressError } from './utils/ExpressError.js';
import {
  campgroundSchema,
  reviewSchema,
  userSchema,
  passwordSchema,
  userProfileSchema,
} from './schemas.js';

const geocoder = mbxGeocoding({ accessToken: process.env.MAPBOX_PUBLIC_TOKEN });

const isLoggedIn = (req, res, next) => {
  if (!req.isAuthenticated()) {
    req.session.returnTo = req.originalUrl;
    throw new ExpressError('You must be signed in first!', 400, '/login');
  }

  next();
};

const isLoggedOut = (req, res, next) => {
  if (!req.isAuthenticated()) {
    return next();
  }

  req.flash('success', 'You are already verified and signed in.');
  res.redirect('/campgrounds');
};

const isActive = async (req, res, next) => {
  const user = await User.findOne({ username: req.body.username });

  if (user && !user.isActive) {
    throw new ExpressError(
      `Your email has not been verified. 
      Please click <a href='/resend'>here</a> to resend token!`,
      400,
      '/login'
    );
  }

  next();
};

const isValidVerificationToken = async (req, res, next) => {
  const { token } = req.params;
  const verificationToken = await VerificationToken.findOne({ token });

  if (!verificationToken) {
    throw new ExpressError('Verification token expired!', 400, '/resend');
  }

  next();
};

const isValidPasswordToken = async (req, res, next) => {
  const { token } = req.params;
  const { id } = req.query;

  if (!id) {
    throw new ExpressError('Something went wrong!', 400, '/forgot');
  }

  handleInvalidID(id);

  const passwordToken = await PasswordToken.findById(id);
  if (!passwordToken) {
    throw new ExpressError('Reset token expired!', 400, '/forgot');
  }

  const isValidToken = await bcrypt.compare(token, passwordToken.token);
  if (!isValidToken) {
    throw new ExpressError(
      'Invalid or expired password reset token',
      400,
      '/forgot'
    );
  }

  next();
};

const isValidCampgroundID = async (req, res, next) => {
  const { id } = req.params;

  handleInvalidID(id);

  const campground = await findByIDAndValidate(id, Campground);
  res.locals.campground = campground;

  next();
};

const isValidUserID = async (req, res, next) => {
  const { id } = req.params;

  handleInvalidID(id);

  const user = await findByIDAndValidate(id, User);
  res.locals.user = user;

  next();
};

const isValidReviewID = async (req, res, next) => {
  const { reviewId } = req.params;

  handleInvalidID(reviewId);

  const review = await findByIDAndValidate(reviewId, Review);
  res.locals.review = review;

  next();
};

const handleInvalidID = (id) => {
  if (!mongoose.isValidObjectId(id)) {
    throw new ExpressError('Could not find that path!', 400, '/campgrounds');
  }
};

const findByIDAndValidate = async (id, model) => {
  const document = await model.findById(id);

  if (!document) {
    throw new ExpressError(
      `Cannot find that ${model.modelName.toLowerCase()}!`,
      400,
      '/campgrounds'
    );
  }

  return document;
};

const isProfileOwnerOrAdmin = (req, res, next) => {
  const currentUser = req.user;
  const profileOwner = res.locals.user;

  if (!isOwnerOrAdmin(currentUser, profileOwner)) {
    throw new ExpressError(
      'You do not have permission to do that',
      403,
      `/users/${profileOwner._id}`
    );
  }

  next();
};

const isCampAuthorOrAdmin = (req, res, next) => {
  const currentUser = req.user;
  const campground = res.locals.campground;

  if (!isOwnerOrAdmin(currentUser, campground.author)) {
    throw new ExpressError(
      'You do not have permission to do that',
      403,
      `/campgrounds/${campground._id}`
    );
  }

  next();
};

const isReviewAuthorOrAdmin = (req, res, next) => {
  const { id } = req.params;
  const currentUser = req.user;
  const review = res.locals.review;

  if (!isOwnerOrAdmin(currentUser, review.author)) {
    throw new ExpressError(
      'You do not have permission to do that',
      403,
      `/campgrounds/${id}`
    );
  }

  next();
};

const isOwnerOrAdmin = (user, owner) => {
  return Boolean(user.equals(owner) || user.isAdmin);
};

const validateReview = async (req, res, next) => {
  await reviewSchema.validateAsync(req.body);
  next();
};

const validateUser = async (req, res, next) => {
  await userSchema.validateAsync(req.body);
  next();
};

const validateUserProfile = async (req, res, next) => {
  await userProfileSchema.validateAsync(req.body, { allowUnknown: true });
  next();
};

const validatePassword = async (req, res, next) => {
  await passwordSchema.validateAsync(req.body, { allowUnknown: true });
  next();
};

const validateCampground = async (req, res, next) => {
  await campgroundSchema.validateAsync(req.body);

  const geoData = await getGeometry(req.body.campground.location);
  const location = getLocation(geoData);

  res.locals.geometry = geoData.body.features[0].geometry;
  res.locals.location = location;

  next();
};

const getGeometry = async (location) => {
  const geoData = await geocoder
    .forwardGeocode({ query: location, limit: 1 })
    .send();

  if (!geoData.body.features[0]) {
    throw new ExpressError('Could not find that location!', 400);
  }

  return geoData;
};

const getLocation = (geoData) => {
  const place = geoData.body.features[0].text;
  const country = geoData.body.features[0].context.pop().text;

  return `${place}, ${country}`;
};

const validateImageCount = (req, res, next) => {
  const campground = res.locals.campground;
  const currentImagesCount = campground.images.length;
  const newImagesCount = req.files.length;
  const deletedImagesCount = req.body.deleteImages
    ? req.body.deleteImages.length
    : 0;

  if (currentImagesCount + newImagesCount - deletedImagesCount > 3) {
    deleteUploadedImages(req);

    throw new ExpressError(
      'Campground cannot have more than 3 images',
      400,
      `/campgrounds/${campground._id}/edit`
    );
  }

  next();
};

const isPasswordCorrect = async (req, res, next) => {
  const userToUpdate = res.locals.user;
  const passwordMatch = await userToUpdate.authenticate(
    req.body.currentPassword
  );

  if (!passwordMatch.user) {
    throw new ExpressError('The Given Password Is Incorrect!', 400);
  }

  next();
};

export {
  isLoggedIn,
  isLoggedOut,
  isActive,
  isValidVerificationToken,
  isValidPasswordToken,
  isValidCampgroundID,
  isValidUserID,
  isValidReviewID,
  isProfileOwnerOrAdmin,
  isCampAuthorOrAdmin,
  isReviewAuthorOrAdmin,
  validateReview,
  validateUser,
  validateUserProfile,
  validatePassword,
  validateCampground,
  validateImageCount,
  isPasswordCorrect,
};
