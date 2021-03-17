const express = require('express');
const User = require('../models/user');
const catchAsync = require('../utils/catchAsync');
const passport = require('passport');
const router = express.Router();
const {notLoggedIn} = require('../middleware');
const users = require('../controllers/users');

router.route('/register')
    .get(notLoggedIn, users.renderRegister)
    .post(notLoggedIn, catchAsync(users.register))

router.route('/login')
    .get(notLoggedIn, users.renderLogin)
    .post(
        notLoggedIn,
        passport.authenticate('local', {
            failureFlash: true,
            failureRedirect: '/login'
        }),
        function (req, res, next) {
            if (req.body.remember_me) {
                req.session.cookie.maxAge = 1000 * 60 * 60 * 24; //1 day
            } else {
                req.session.cookie.maxAge = 1000 * 60 * 10; //10 min
            }
            return next();
        },
        users.login
    );

router.get('/logout', users.logout)

module.exports = router;