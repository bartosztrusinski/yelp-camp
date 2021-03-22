const express = require('express');
const router = express.Router({mergeParams: true});
const Campground = require('../models/campground');
const Review = require('../models/review');
// const {reviewSchema} = require('../schemas');
const catchAsync = require('../utils/catchAsync');
// const ExpressError = require('../utils/ExpressError');
const {validateReview, isLoggedIn, isReviewAuthorOrAdmin} = require('../middleware');
const reviews = require('../controllers/reviews');

const ExpressBrute = require('express-brute');
const redis = require('redis');
const RedisStore = require('express-brute-redis');
const formatDistanceToNowStrict = require('date-fns/formatDistanceToNowStrict');

const redisClient = redis.createClient({
    host: 'redis-10268.c135.eu-central-1-1.ec2.cloud.redislabs.com',
    port: 10268,
    password: process.env.REDIS_PASSWORD
})
const store = new RedisStore({client: redisClient});

const failReviewCreate = function (req, res, next, nextValidRequestDate) {
    req.flash('error', "You've made too many reviews, please try again in " +
        formatDistanceToNowStrict(nextValidRequestDate));
    res.redirect(`/campgrounds/${req.params.id}`);
};

const handleStoreError = function (error) {
    log.error(error); // log this error so we can figure out what went wrong
    // cause node to exit, hopefully restarting the process fixes the problem
    throw {
        message: error.message,
        parent: error.parent
    };
}


const reviewCreateBruteforce = new ExpressBrute(store, {
    freeRetries: 9,
    attachResetToRequest: false,
    refreshTimeoutOnRequest: false,
    minWait: 60 * 60 * 1000, // 1 hour
    maxWait: 60 * 60 * 1000, // 1 hour
    lifetime: 60 * 60, // 1 day (seconds not milliseconds)
    failCallback: failReviewCreate,
    handleStoreError: handleStoreError
});


router.post('/', isLoggedIn, validateReview, reviewCreateBruteforce.prevent, catchAsync(reviews.createReview))

router.delete('/:reviewId', isLoggedIn, isReviewAuthorOrAdmin, catchAsync(reviews.destroyReview))

module.exports = router;