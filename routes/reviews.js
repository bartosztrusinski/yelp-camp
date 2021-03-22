const express = require('express');
const router = express.Router({mergeParams: true});
const Campground = require('../models/campground');
const Review = require('../models/review');
// const {reviewSchema} = require('../schemas');
const catchAsync = require('../utils/catchAsync');
// const ExpressError = require('../utils/ExpressError');
const {validateReview, isLoggedIn, isReviewAuthorOrAdmin} = require('../middleware');
const reviews = require('../controllers/reviews');


router.post('/', isLoggedIn, validateReview, catchAsync(reviews.createReview))

router.delete('/:reviewId', isLoggedIn, isReviewAuthorOrAdmin, catchAsync(reviews.destroyReview))

module.exports = router;