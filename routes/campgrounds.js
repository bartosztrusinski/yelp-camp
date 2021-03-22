const express = require('express');
const router = express.Router();
const catchAsync = require('../utils/catchAsync');
const ExpressError = require('../utils/ExpressError');
const Campground = require('../models/campground');
// const {campgroundSchema} = require('../schemas');
const {isLoggedIn, isAuthorOrAdmin, validateCampground, validateImageCount} = require('../middleware');
const campgrounds = require('../controllers/campgrounds');
const {storage, cloudinary} = require('../cloudinary');
const multer = require('multer');
const upload = multer({
    storage, limits: {fileSize: 1024 * 1024 * 2}, fileFilter: function (req, file, cb) {
        if (file.mimetype !== 'image/png' && file.mimetype !== 'image/jpeg') {
            return cb(new ExpressError('You can only upload images!', 400));
        } else {
            cb(null, true);
        }
    }
});

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

const failCampgroundCreate = async function (req, res, next, nextValidRequestDate) {
    for (let file of req.files) {
        await cloudinary.uploader.destroy(file.filename);
    }
    req.flash('error', "You've made too many campgrounds, please try again in " +
        formatDistanceToNowStrict(nextValidRequestDate));
    res.redirect(`/campgrounds/new`);
};

const handleStoreError = function (error) {
    log.error(error); // log this error so we can figure out what went wrong
    // cause node to exit, hopefully restarting the process fixes the problem
    throw {
        message: error.message,
        parent: error.parent
    };
}


const campgroundCreateBruteforce = new ExpressBrute(store, {
    freeRetries: 4,
    attachResetToRequest: false,
    refreshTimeoutOnRequest: false,
    minWait: 25 * 60 * 60 * 1000, // 1 day 1 hour (should never reach this wait time)
    maxWait: 25 * 60 * 60 * 1000, // 1 day 1 hour (should never reach this wait time)
    lifetime: 24 * 60 * 60, // 1 day (seconds not milliseconds)
    failCallback: failCampgroundCreate,
    handleStoreError: handleStoreError
});


router.route('/')
    .get(catchAsync(campgrounds.index))
    .post(isLoggedIn, upload.array('image', 3), catchAsync(validateCampground), campgroundCreateBruteforce.prevent, catchAsync(campgrounds.createCampground))

router.get('/new', isLoggedIn, campgrounds.renderNewForm)

router.route('/:id')
    .get(catchAsync(campgrounds.showCampground))
    .put(isLoggedIn, isAuthorOrAdmin, upload.array('image', 3), catchAsync(validateImageCount), catchAsync(validateCampground), catchAsync(campgrounds.updateCampground))
    .delete(isLoggedIn, isAuthorOrAdmin, catchAsync(campgrounds.destroyCampground))

router.get('/:id/edit', isLoggedIn, isAuthorOrAdmin, catchAsync(campgrounds.renderEditForm))

module.exports = router;