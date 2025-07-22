import { Router } from 'express';
import passport from 'passport';
import { saveImageToMemory } from '../cloudinary.js';
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
import {
  authLimiter,
  registrationLimiter,
  contentLimiter,
  mailLimiter,
  resetLimiter,
} from '../utils/rateLimit.js';

const router = Router();

router
  .route('/login')
  .get(isLoggedOut, renderLogin)
  .post(
    authLimiter('log in', 'login:', (req) => req.body.username),
    isLoggedOut,
    isActive,
    passport.authenticate('local', {
      failureFlash: true,
      failureRedirect: '/login',
    }),
    resetLimiter('login:auth:short:', (req) => req.body.username),
    login
  );

router.post(
  '/logout',
  contentLimiter('log out', 'logout:'),
  isLoggedIn,
  logout
);

router
  .route('/register')
  .get(isLoggedOut, renderRegister)
  .post(registrationLimiter, isLoggedOut, validateUser, register);

router
  .route('/users/:id')
  .get(isValidUserID, renderUserProfile)
  .patch(
    contentLimiter('update a profile', 'updateProfile:'),
    isLoggedIn,
    isValidUserID,
    isProfileOwnerOrAdmin,
    saveImageToMemory.single('profilePicture'),
    validateUserProfile,
    updateUserProfile
  )
  .put(
    authLimiter('change a password', 'changePassword:'),
    isLoggedIn,
    isValidUserID,
    isProfileOwnerOrAdmin,
    validatePassword,
    isPasswordCorrect,
    changePassword
  )
  .delete(
    contentLimiter('delete a user', 'deleteUser:'),
    isLoggedIn,
    isValidUserID,
    isProfileOwnerOrAdmin,
    deleteUser
  );

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
  .post(
    mailLimiter(
      'resend a verification email',
      'resend:',
      (req) => req.body.email
    ),
    isLoggedOut,
    sendVerificationMail
  );

router.get(
  '/verify/:token',
  authLimiter('verify an account', 'verify:', (req) => req.params.token),
  isLoggedOut,
  isValidVerificationToken,
  resetLimiter('verify:auth:short:', (req) => req.params.token),
  verifyUser
);

router
  .route('/forgot')
  .get(isLoggedOut, renderForgotForm)
  .post(
    mailLimiter(
      'send a password reset email',
      'passwordReset:',
      (req) => req.body.email
    ),
    isLoggedOut,
    sendPasswordResetMail
  );

router
  .route('/reset/:token')
  .get(isLoggedOut, isValidPasswordToken, renderResetForm)
  .post(
    authLimiter(
      'reset a password',
      'passwordReset:',
      (req) => req.params.token
    ),
    isLoggedOut,
    isValidPasswordToken,
    validatePassword,
    resetLimiter('passwordReset:auth:short:', (req) => req.params.token),
    resetPassword
  );

export default router;
