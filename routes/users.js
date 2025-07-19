import { Router } from 'express';
const router = Router();
import passport from 'passport';
import { saveImageToMemory } from '../cloudinary.js';
// import {
//   passwordResetBruteForce,
//   passwordChangeBruteForce,
//   loginBruteForce,
//   registerBruteForce,
// } from '../utils/expressBrute.js';
import {
  renderLogin,
  login,
  logout,
  renderRegister,
  register,
  renderUserProfile,
  updateUserProfile,
  changePassword,
  deleteUser,
  renderEditForm,
  renderPasswordChangeForm,
  renderVerifyForm,
  sendVerificationMail,
  verifyUser,
  renderForgotForm,
  sendPasswordResetMail,
  renderResetForm,
  resetPassword,
} from '../controllers/users.js';
import {
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
} from '../middleware.js';

router
  .route('/login')
  .get(isLoggedOut, renderLogin)
  .post(
    isLoggedOut,
    // prevent too many attempts for the same username
    // loginBruteForce.getMiddleware({
    //   key: (req, res, next) => next(req.body.username),
    // }),
    isActive,
    passport.authenticate('local', {
      failureFlash: true,
      failureRedirect: '/login',
    }),
    login
  );

router.get('/logout', isLoggedIn, logout);

router.route('/register').get(isLoggedOut, renderRegister).post(
  isLoggedOut,
  validateUser,
  //  registerBruteForce.prevent,
  register
);

router
  .route('/users/:id')
  .get(isValidUserID, renderUserProfile)
  .patch(
    isLoggedIn,
    isValidUserID,
    isProfileOwnerOrAdmin,
    saveImageToMemory.single('profilePicture'),
    validateUserProfile,
    updateUserProfile
  )
  .put(
    isLoggedIn,
    isValidUserID,
    isProfileOwnerOrAdmin,
    validatePassword,
    // passwordChangeBruteForce.prevent,
    isPasswordCorrect,
    changePassword
  )
  .delete(isLoggedIn, isValidUserID, isProfileOwnerOrAdmin, deleteUser);

router.get(
  '/users/:id/edit',
  isLoggedIn,
  isValidUserID,
  isProfileOwnerOrAdmin,
  renderEditForm
);

router.get(
  '/users/:id/change-password',
  isLoggedIn,
  isValidUserID,
  isProfileOwnerOrAdmin,
  renderPasswordChangeForm
);

router
  .route('/resend')
  .get(isLoggedOut, renderVerifyForm)
  .post(isLoggedOut, sendVerificationMail);

router.get('/verify/:token', isLoggedOut, isValidVerificationToken, verifyUser);

router
  .route('/forgot')
  .get(isLoggedOut, renderForgotForm)
  .post(isLoggedOut, sendPasswordResetMail);

router
  .route('/reset/:token')
  .get(isLoggedOut, isValidPasswordToken, renderResetForm)
  .post(
    isLoggedOut,
    isValidPasswordToken,
    // prevent too many attempts for the same token
    // passwordResetBruteForce.getMiddleware({
    //   key: (req, res, next) => next(req.params.token),
    // }),
    validatePassword,
    resetPassword
  );

export default router;
