const express = require('express')
    , catchAsync = require('../utils/catchAsync')
    , passport = require('passport')
    , router = express.Router()
    , users = require('../controllers/users')
    , upload = require('../cloudinary/upload');

const {
    passwordResetBruteForce,
    passwordChangeBruteForce,
    loginBruteForce,
    registerBruteForce
} = require('../utils/expressBrute');

const {
    isLoggedIn,
    isLoggedOut,
    isActive,
    validateUser,
    validatePassword,
    validateUserProfile,
    isProfileOwnerOrAdmin,
    isValidUserID,
    isValidVerificationToken,
    isValidPasswordToken,
    isPasswordCorrect
} = require('../middleware');


router.route('/login')
    .get(isLoggedOut,
        users.renderLogin)
    .post(isLoggedOut,
        // prevent too many attempts for the same username
        loginBruteForce.getMiddleware({key: (req, res, next) => next(req.body.username)}),
        catchAsync(isActive),
        passport.authenticate('local', {
            failureFlash: true,
            failureRedirect: '/login'
        }),
        users.login)

router.get('/logout',
    isLoggedIn,
    users.logout)

router.route('/register')
    .get(isLoggedOut,
        users.renderRegister)
    .post(isLoggedOut,
        catchAsync(validateUser),
        registerBruteForce.prevent,
        catchAsync(users.register))

router.route('/users/:id')
    .get(catchAsync(isValidUserID),
        users.renderUserProfile)
    .patch(isLoggedIn,
        catchAsync(isValidUserID),
        isProfileOwnerOrAdmin,
        upload.single('profilePicture'),
        catchAsync(validateUserProfile),
        catchAsync(users.updateUserProfile))
    .put(isLoggedIn,
        catchAsync(isValidUserID),
        isProfileOwnerOrAdmin,
        catchAsync(validatePassword),
        passwordChangeBruteForce.prevent,
        catchAsync(isPasswordCorrect),
        catchAsync(users.changePassword))
    .delete(isLoggedIn,
        catchAsync(isValidUserID),
        isProfileOwnerOrAdmin,
        catchAsync(users.deleteUser))

router.get('/users/:id/edit',
    isLoggedIn,
    catchAsync(isValidUserID),
    isProfileOwnerOrAdmin,
    users.renderEditForm)

router.get('/users/:id/change-password',
    isLoggedIn,
    catchAsync(isValidUserID),
    isProfileOwnerOrAdmin,
    users.renderPasswordChangeForm)


router.route('/resend')
    .get(isLoggedOut,
        users.renderVerifyForm)
    .post(isLoggedOut,
        catchAsync(users.sendVerifyMail))

router.get('/verify/:token',
    isLoggedOut,
    catchAsync(isValidVerificationToken),
    catchAsync(users.verifyUser))

router.route('/forgot')
    .get(isLoggedOut,
        users.renderForgotForm)
    .post(isLoggedOut,
        catchAsync(users.sendPasswordMail))

router.route('/reset/:token')
    .get(isLoggedOut,
        catchAsync(isValidPasswordToken),
        users.renderResetForm)
    .post(isLoggedOut,
        catchAsync(isValidPasswordToken),
        // prevent too many attempts for the same token
        passwordResetBruteForce.getMiddleware({key: (req, res, next) => next(req.params.token)}),
        catchAsync(validatePassword),
        catchAsync(users.resetPassword))

module.exports = router;