const express = require('express')
    , router = express.Router({mergeParams: true})
    , catchAsync = require('../utils/catchAsync')
    , reviews = require('../controllers/reviews')
    , {reviewCreateBruteForce} = require('../utils/expressBrute');

const {
    validateReview,
    isLoggedIn,
    isReviewAuthorOrAdmin,
    isValidCampgroundID,
    isValidReviewID
} = require('../middleware');


router.post('/', isLoggedIn,
    catchAsync(isValidCampgroundID),
    catchAsync(validateReview),
    reviewCreateBruteForce.prevent,
    catchAsync(reviews.createReview))

router.delete('/:reviewId',
    isLoggedIn,
    catchAsync(isValidCampgroundID),
    catchAsync(isValidReviewID),
    isReviewAuthorOrAdmin,
    catchAsync(reviews.destroyReview))

module.exports = router;