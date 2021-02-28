const express = require('express');
const User = require('../models/user');
const catchAsync = require('../utils/catchAsync');
const passport = require('passport');
const router = express.Router();
const {notLoggedIn} = require('../middleware');

router.get('/register', notLoggedIn, (req, res) => {
    res.render('users/register');
})

router.post('/register', notLoggedIn, catchAsync(async (req, res, next) => {
    try {
        const {username, email, password} = req.body;
        const user = new User({email, username});
        const registeredUser = await User.register(user, password);
        req.login(registeredUser, err => {
            if (err) return next(err);
            req.flash('success', 'Welcome to Yelp Camp!');
            res.redirect('/campgrounds');
        });
    } catch (e) {
        req.flash('error', e.message);
        res.redirect('/register');
    }
}))

router.get('/login', notLoggedIn, (req, res) => {
    res.render('users/login');
})

router.post('/login', notLoggedIn, passport.authenticate('local', {
    failureFlash: true,
    failureRedirect: '/login'
}), async (req, res) => {
    const redirectUrl = req.session.returnTo || '/campgrounds';
    delete req.session.returnTo;
    req.flash('success', 'Welcome back!');
    res.redirect(redirectUrl);
})

router.get('/logout', (req, res) => {
    req.logout();
    req.flash('success', 'Goodbye!');
    res.redirect('/campgrounds');
})

module.exports = router;