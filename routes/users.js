const express = require('express');
const router = express.Router();
const passport = require('passport');
const upload = require('../cloudinary/upload');
const catchAsync = require('../utils/catchAsync');
const usersController = require('../controllers/users');
const {
  passwordResetBruteForce,
  passwordChangeBruteForce,
  loginBruteForce,
  registerBruteForce,
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
  isPasswordCorrect,
} = require('../middleware');

router
  .route('/login')
  .get(isLoggedOut, usersController.renderLogin)
  .post(
    isLoggedOut,
    // prevent too many attempts for the same username
    loginBruteForce.getMiddleware({
      key: (req, res, next) => next(req.body.username),
    }),
    catchAsync(isActive),
    passport.authenticate('local', {
      failureFlash: true,
      failureRedirect: '/login',
    }),
    usersController.login
  );

router.get('/logout', isLoggedIn, usersController.logout);

router
  .route('/register')
  .get(isLoggedOut, usersController.renderRegister)
  .post(
    isLoggedOut,
    catchAsync(validateUser),
    registerBruteForce.prevent,
    catchAsync(usersController.register)
  );

router
  .route('/users/:id')
  .get(catchAsync(isValidUserID), usersController.renderUserProfile)
  .patch(
    isLoggedIn,
    catchAsync(isValidUserID),
    isProfileOwnerOrAdmin,
    upload.single('profilePicture'),
    catchAsync(validateUserProfile),
    catchAsync(usersController.updateUserProfile)
  )
  .put(
    isLoggedIn,
    catchAsync(isValidUserID),
    isProfileOwnerOrAdmin,
    catchAsync(validatePassword),
    passwordChangeBruteForce.prevent,
    catchAsync(isPasswordCorrect),
    catchAsync(usersController.changePassword)
  )
  .delete(
    isLoggedIn,
    catchAsync(isValidUserID),
    isProfileOwnerOrAdmin,
    catchAsync(usersController.deleteUser)
  );

router.get(
  '/users/:id/edit',
  isLoggedIn,
  catchAsync(isValidUserID),
  isProfileOwnerOrAdmin,
  usersController.renderEditForm
);

router.get(
  '/users/:id/change-password',
  isLoggedIn,
  catchAsync(isValidUserID),
  isProfileOwnerOrAdmin,
  usersController.renderPasswordChangeForm
);

router
  .route('/resend')
  .get(isLoggedOut, usersController.renderVerifyForm)
  .post(isLoggedOut, catchAsync(usersController.sendVerificationMail));

router.get(
  '/verify/:token',
  isLoggedOut,
  catchAsync(isValidVerificationToken),
  catchAsync(usersController.verifyUser)
);

router
  .route('/forgot')
  .get(isLoggedOut, usersController.renderForgotForm)
  .post(isLoggedOut, catchAsync(usersController.sendPasswordResetMail));

router
  .route('/reset/:token')
  .get(
    isLoggedOut,
    catchAsync(isValidPasswordToken),
    usersController.renderResetForm
  )
  .post(
    isLoggedOut,
    catchAsync(isValidPasswordToken),
    // prevent too many attempts for the same token
    passwordResetBruteForce.getMiddleware({
      key: (req, res, next) => next(req.params.token),
    }),
    catchAsync(validatePassword),
    catchAsync(usersController.resetPassword)
  );

module.exports = router;
