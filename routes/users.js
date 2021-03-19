const express = require('express');
const User = require('../models/user');
const catchAsync = require('../utils/catchAsync');
const passport = require('passport');
const router = express.Router();
const {isLoggedIn, notLoggedIn, isActive, isRememberMeChecked} = require('../middleware');
const users = require('../controllers/users');

router.route('/register')
    .get(notLoggedIn, users.renderRegister)
    .post(notLoggedIn, catchAsync(users.register))

router.route('/login')
    .get(notLoggedIn, users.renderLogin)
    .post(
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

router.route('/resend')
    .get(notLoggedIn, users.renderResendForm)
    .post(notLoggedIn, catchAsync(users.resendMail))

module.exports = router;