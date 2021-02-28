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
    .post(notLoggedIn,
        passport.authenticate('local', {
            failureFlash: true,
            failureRedirect: '/login'
        }), users.login)

router.get('/logout', users.logout)

module.exports = router;