const express = require('express');
const User = require('../models/user');
const catchAsync = require('../utils/catchAsync');
const passport = require('passport');
const router = express.Router();
const {notLoggedIn} = require('../middleware');
const users = require('../controllers/users');

router.get('/register', notLoggedIn, users.renderRegister)

router.post('/register', notLoggedIn, catchAsync(users.register))

router.get('/login', notLoggedIn, users.renderLogin)

router.post('/login', notLoggedIn, passport.authenticate('local', {
    failureFlash: true,
    failureRedirect: '/login'
}), users.login)

router.get('/logout', users.logout)

module.exports = router;