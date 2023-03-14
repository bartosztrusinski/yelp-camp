const express = require('express');
const router = express.Router({ mergeParams: true });
const catchAsync = require('../utils/catchAsync');
const reviewsController = require('../controllers/reviews');
const { reviewCreateBruteForce } = require('../utils/expressBrute');
const {
  validateReview,
  isLoggedIn,
  isReviewAuthorOrAdmin,
  isValidCampgroundID,
  isValidReviewID,
} = require('../middleware');

router.post(
  '/',
  isLoggedIn,
  catchAsync(isValidCampgroundID),
  catchAsync(validateReview),
  reviewCreateBruteForce.prevent,
  catchAsync(reviewsController.createReview)
);

router.delete(
  '/:reviewId',
  isLoggedIn,
  catchAsync(isValidCampgroundID),
  catchAsync(isValidReviewID),
  isReviewAuthorOrAdmin,
  catchAsync(reviewsController.destroyReview)
);

module.exports = router;
