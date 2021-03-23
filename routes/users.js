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
const {passwordResetBruteForce, loginBruteForce, registerBruteForce} = require('../utils/expressBrute');

router.route('/register')
    .get(notLoggedIn, users.renderRegister)
    .post(notLoggedIn, validateUser, registerBruteForce.prevent, catchAsync(users.register))

router.route('/login')
    .get(notLoggedIn, users.renderLogin)
    .post(
        loginBruteForce.getMiddleware({
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