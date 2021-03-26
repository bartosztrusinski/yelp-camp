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
    validatePassword,
    changeProfilePicture,
    validateUserProfile,
    isProfileOwnerOrAdmin
} = require('../middleware');
const users = require('../controllers/users');
const {
    passwordResetBruteForce,
    passwordChangeBruteForce,
    loginBruteForce,
    registerBruteForce
} = require('../utils/expressBrute');
const upload = require('../cloudinary/upload');

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

router.route('/users/:id')
    .get(users.renderUserProfile)
    .patch(isLoggedIn, catchAsync(isProfileOwnerOrAdmin), upload.single('profilePicture'), catchAsync(validateUserProfile), catchAsync(changeProfilePicture), catchAsync(users.updateUserProfile))
    .delete(isLoggedIn, catchAsync(isProfileOwnerOrAdmin), catchAsync(users.deleteUser))
    .put(isLoggedIn, catchAsync(isProfileOwnerOrAdmin), validatePassword, passwordChangeBruteForce.prevent, catchAsync(users.changePassword));

router.get('/users/:id/edit', isLoggedIn, catchAsync(isProfileOwnerOrAdmin), users.renderEditForm)

router.get('/users/:id/change-password', isLoggedIn, catchAsync(isProfileOwnerOrAdmin), users.renderPasswordChangeForm);

module.exports = router;