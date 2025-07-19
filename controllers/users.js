import bcrypt from 'bcrypt';
import { cloudinary, uploadImageFromMemory } from '../cloudinary.js';
import { User } from '../models/user.js';
import { VerificationToken, PasswordToken } from '../models/token.js';
import { ExpressError } from '../utils/ExpressError.js';
import * as mailTransport from '../utils/mailTransport.js';

const login = async (req, res) => {
  const redirectUrl = getPathToReturnTo(req);
  setSessionAge(req);

  req.flash('success', 'Welcome back!');
  res.redirect(redirectUrl);
};

const getPathToReturnTo = (req) => {
  const redirectUrl = req.session.returnTo || '/campgrounds';
  delete req.session.returnTo;
  return redirectUrl;
};

const setSessionAge = (req) => {
  const month = 1000 * 60 * 60 * 24 * 30;
  const halfHour = 1000 * 60 * 30;
  const isRememberMeChecked = req.body.rememberMe;
  req.session.cookie.maxAge = isRememberMeChecked ? month : halfHour;
};

const logout = (req, res) => {
  req.logout((err) => {
    if (err) {
      throw new ExpressError('Logout failed', 500);
    }

    req.flash('success', 'Successfully logged out!');
    res.redirect(req.get('Referrer') || '/');
  });
};

const register = async (req, res) => {
  const { username, email, password } = req.body;
  const newUser = new User({ email, username });
  const registeredUser = await User.register(newUser, password);

  const token = await issueNewVerificationToken(registeredUser._id);
  await mailTransport.sendVerificationMail(registeredUser, token);

  req.flash(
    'success',
    `A verification email has been sent to ${registeredUser.email.address}. It will be expire after one day. If you did not get verification email, click <a href='/resend'>here</a> to resend token!`
  );
  res.redirect('/campgrounds');
};

const sendVerificationMail = async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ 'email.address': email });

  if (user) {
    if (user.isActive) {
      throw new ExpressError(
        'This account has been already verified. Please log in.',
        400,
        '/login'
      );
    }

    const token = await issueNewVerificationToken(user._id);
    await mailTransport.sendVerificationMail(user, token);
  }

  req.flash(
    'success',
    `A verification email has been sent to ${email}. It will be expire after one hour. If you did not get the email, click <a href='/resend'>here</a> to resend token!`
  );

  res.redirect('/campgrounds');
};

const issueNewVerificationToken = async (userID) => {
  await VerificationToken.findOneAndDelete({ _id: userID });

  const newToken = new VerificationToken({ _id: userID });
  const savedToken = await newToken.save();

  return savedToken.token;
};

const sendPasswordResetMail = async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ 'email.address': email });

  if (user) {
    const token = await issueNewPasswordToken(user._id);
    await mailTransport.sendPasswordResetMail(user, token);
  }

  req.flash(
    'success',
    `A password reset email has been sent to ${email}. It will be expire after one hour. If you did not get the email, click <a href='/forgot'>here</a> to resend token!`
  );
  res.redirect('/campgrounds');
};

const issueNewPasswordToken = async (userID) => {
  await PasswordToken.findOneAndDelete({ _id: userID });

  const newToken = new PasswordToken({ _id: userID });
  const token = newToken.token;
  newToken.token = await bcrypt.hash(newToken.token, 12);
  await newToken.save();

  return token;
};

const verifyUser = async (req, res) => {
  const { token } = req.params,
    deletedToken = await VerificationToken.findOneAndDelete({ token }),
    user = await User.findById(deletedToken._id);
  user.isActive = true;
  await user.save();
  req.flash('success', 'Successfully Verified Your Account!');
  res.redirect('/login');
};

const resetPassword = async (req, res) => {
  const { id } = req.query;
  const user = await User.findById(id);

  await user.setPassword(req.body.password);
  await user.save();
  await PasswordToken.findByIdAndDelete(id);

  req.flash('success', 'Successfully Changed Your Password!');
  res.redirect('/login');
};

const updateUserProfile = async (req, res) => {
  const { name, bio, showEmail, phoneNumber, deletePicture } = req.body;
  const { user } = res.locals;
  const imageFile = req.file;

  await user.updateOne({
    name,
    bio,
    phoneNumber,
    'email.public': showEmail === 'yes',
  });

  if (user.profilePicture && (deletePicture === 'yes' || imageFile)) {
    await cloudinary.uploader.destroy(user.profilePicture.filename);
    user.profilePicture = null;
  }

  if (imageFile) {
    const { secure_url, public_id } = await uploadImageFromMemory(imageFile);

    user.profilePicture = {
      url: secure_url,
      filename: public_id,
    };
  }

  await user.save();

  req.flash('success', 'Successfully updated profile!');
  res.redirect(`/users/${user._id}`);
};

const changePassword = async (req, res) => {
  const user = res.locals.user;

  await user.setPassword(req.body.password);
  await user.save();

  req.flash('success', 'Successfully Changed Your Password!');
  res.redirect(`/users/${user._id}`);
};

const deleteUser = async (req, res) => {
  const user = res.locals.user;

  await user.deleteOne();

  req.flash('success', 'Successfully deleted user!');
  res.redirect('/campgrounds');
};

const renderLogin = (req, res) => {
  res.render('users/login');
};

const renderRegister = (req, res) => {
  res.render('users/register');
};

const renderUserProfile = async (req, res) => {
  const user = await res.locals.user.populate([
    {
      path: 'campgrounds',
      options: { sort: { dateCreated: -1 } },
    },
  ]);

  res.render('users/show', { user });
};

const renderEditForm = async (req, res) => {
  const user = res.locals.user;

  res.render('users/edit', { user });
};

const renderPasswordChangeForm = (req, res) => {
  const { id } = req.params;

  res.render('users/changePassword', { id });
};

const renderVerifyForm = (req, res) => {
  res.render('users/sendToken', {
    title: 'Verify Account',
    description:
      'We will resend you an email with instructions on how to verify your account',
    action: '/resend',
  });
};

const renderForgotForm = (req, res) => {
  res.render('users/sendToken', {
    title: 'Forgot Password',
    description:
      'We will send you an email with instructions on how to reset your password',
    action: '/forgot',
  });
};

const renderResetForm = (req, res) => {
  const { token } = req.params;
  const { id } = req.query;

  res.render('users/reset', { token, id });
};

export {
  login,
  logout,
  register,
  sendVerificationMail,
  sendPasswordResetMail,
  verifyUser,
  resetPassword,
  updateUserProfile,
  changePassword,
  deleteUser,
  renderLogin,
  renderRegister,
  renderUserProfile,
  renderEditForm,
  renderPasswordChangeForm,
  renderVerifyForm,
  renderForgotForm,
  renderResetForm,
};
