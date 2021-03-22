const express = require('express');
// const User = require('../models/user');
const catchAsync = require('../utils/catchAsync');
const passport = require('passport');
const router = express.Router();
const {
    isLoggedIn,
    notLoggedIn,
    isActive,
    isRememberMeChecked,
    validateUser,
    validatePassword
} = require('../middleware');
const users = require('../controllers/users');
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

const failLogin = function (req, res, next, nextValidRequestDate) {
    req.flash('error', "You've made too many failed attempts to log in, please try again in " +
        formatDistanceToNowStrict(nextValidRequestDate));
    res.redirect('/login');
};

const failPasswordReset = function (req, res, next, nextValidRequestDate) {
    req.flash('error', "You've made too many failed attempts to reset password, please try again in " +
        formatDistanceToNowStrict(nextValidRequestDate));
    res.redirect(`/reset/${req.params.token}`);
};

const failAccountCreate = function (req, res, next, nextValidRequestDate) {
    req.flash('error', "You've made too many user accounts, please try again in " +
        formatDistanceToNowStrict(nextValidRequestDate));
    res.redirect(`/register`);
};

const handleStoreError = function (error) {
    log.error(error); // log this error so we can figure out what went wrong
    // cause node to exit, hopefully restarting the process fixes the problem
    throw {
        message: error.message,
        parent: error.parent
    };
}

const passwordResetBruteForce = new ExpressBrute(store, {
    freeRetries: 3,
    minWait: 20 * 1000, // 20 seconds
    maxWait: 45 * 1000, // 45 seconds
    failCallback: failPasswordReset,
    handleStoreError: handleStoreError
});

const loginBruteforce = new ExpressBrute(store, {
    freeRetries: 3,
    minWait: 20 * 1000, // 20 seconds
    maxWait: 45 * 1000, // 45 seconds
    failCallback: failLogin,
    handleStoreError: handleStoreError
});

const registerBruteforce = new ExpressBrute(store, {
    freeRetries: 4,
    attachResetToRequest: false,
    refreshTimeoutOnRequest: false,
    minWait: 25 * 60 * 60 * 1000, // 1 day 1 hour (should never reach this wait time)
    maxWait: 25 * 60 * 60 * 1000, // 1 day 1 hour (should never reach this wait time)
    lifetime: 24 * 60 * 60, // 1 day (seconds not milliseconds)
    failCallback: failAccountCreate,
    handleStoreError: handleStoreError
});

router.route('/register')
    .get(notLoggedIn, users.renderRegister)
    .post(notLoggedIn, validateUser, registerBruteforce.prevent, catchAsync(users.register))

router.route('/login')
    .get(notLoggedIn, users.renderLogin)
    .post(
        loginBruteforce.getMiddleware({
            key: function (req, res, next) {
                // prevent too many attempts for the same username
                next(req.body.username);
            }
        }),
        notLoggedIn,
        catchAsync(isActive),
        passport.authenticate('local', {
            failureFlash: true,
            failureRedirect: '/login'
        }),
        isRememberMeChecked,
        users.login
    );

router.get('/logout', isLoggedIn, users.logout)

router.get('/verify/:token', notLoggedIn, catchAsync(users.verifyUser))

router.route('/reset/:token')
    .get(notLoggedIn, users.renderResetForm)
    .post(
        notLoggedIn,
        passwordResetBruteForce.getMiddleware({
            key: function (req, res, next) {
                // prevent too many attempts for the same token
                next(req.params.token);
            }
        }),
        validatePassword,
        catchAsync(users.resetPassword)
    )

router.route('/resend')
    .get(notLoggedIn, users.renderResendForm)
    .post(notLoggedIn, catchAsync(users.sendVerifyMail))

router.route('/forgot')
    .get(notLoggedIn, users.renderForgotForm)
    .post(notLoggedIn, catchAsync(users.sendPasswordMail))

module.exports = router;