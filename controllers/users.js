const User = require('../models/user');
const {VerificationToken, PasswordToken} = require('../models/token');
const ExpressError = require('../utils/ExpressError');
const {transporter, verificationMail, passwordMail} = require('../utils/mailTransport');
const bcrypt = require('bcrypt')

module.exports.renderRegister = (req, res) => {
    res.render('users/register');
}

module.exports.register = async (req, res) => {
    const {username, email, password} = req.body;
    const user = new User({email, username});
    const registeredUser = await User.register(user, password);
    await VerificationToken.findOneAndDelete({_id: registeredUser._id})
    const newToken = new VerificationToken({_id: registeredUser._id});
    const savedToken = await newToken.save();
    await transporter.sendMail(verificationMail(registeredUser, savedToken.token, req.headers.host))
    req.flash('success', `A verification email has been sent to ${registeredUser.email}. It will be expire after one day. 
                                If you did not get verification email, click <a href='/resend'>here</a> to resend token!`)
    res.redirect('/campgrounds');
}

module.exports.renderLogin = (req, res) => {
    res.render('users/login');
}

module.exports.login = async (req, res) => {
    const redirectUrl = req.session.returnTo || '/campgrounds';
    delete req.session.returnTo;
    req.brute.reset(function () {
        req.flash('success', 'Welcome back!');
        res.redirect(redirectUrl);
    });
}

module.exports.logout = (req, res) => {
    req.logout();
    req.flash('success', 'Goodbye!');
    res.redirect('back');
}

module.exports.renderResendForm = (req, res) => {
    res.render('users/sendToken', {
        title: 'Verify Account',
        description: 'We will resend you an email with instructions on how to verify your account',
        action: '/resend'
    });
}

module.exports.sendVerifyMail = async (req, res) => {
    const foundUser = await User.findOne({email: req.body.email})
    if (!foundUser) throw new ExpressError('Could not find that email!', 400);
    if (foundUser.isActive) throw new ExpressError('This account has been already verified. Please log in.', 400);
    await VerificationToken.findOneAndDelete({_id: foundUser._id})
    const newToken = new VerificationToken({_id: foundUser._id})
    const savedToken = await newToken.save();
    await transporter.sendMail(verificationMail(foundUser, savedToken.token, req.headers.host))
    req.flash('success', `A verification email has been sent to ${foundUser.email}. It will be expire after one hour. 
                                If you did not get the email, click <a href='/resend'>here</a> to resend token!`)
    res.redirect('/campgrounds');
}

module.exports.verifyUser = async (req, res) => {
    const {token} = req.params;
    const foundToken = await VerificationToken.findOneAndDelete({token: token});
    if (!foundToken) throw new ExpressError('Verification token expired!', 400);
    const foundUser = await User.findOne({_id: foundToken._id});
    if (!foundUser) throw new ExpressError('Could not find that user!', 400);
    foundUser.isActive = true;
    await foundUser.save();
    req.flash('success', 'Successfully Verified Your Account!');
    res.redirect('/login');
}


module.exports.renderForgotForm = (req, res) => {
    res.render('users/sendToken', {
        title: 'Forgot Password',
        description: 'We will send you an email with instructions on how to reset your password',
        action: '/forgot'
    });
}

module.exports.sendPasswordMail = async (req, res) => {
    const foundUser = await User.findOne({email: req.body.email})
    if (!foundUser) throw new ExpressError('Could not find that email!', 400);
    if (!foundUser.isActive) throw new ExpressError('This account needs to be verified first.', 400);
    await PasswordToken.findOneAndDelete({_id: foundUser._id})
    const newToken = new PasswordToken({_id: foundUser._id})
    const token = newToken.token;
    newToken.token = await bcrypt.hash(newToken.token, 12);
    await newToken.save();
    await transporter.sendMail(passwordMail(foundUser, token, req.headers.host))
    req.flash('success', `A password reset email has been sent to ${foundUser.email}. It will be expire after one hour.
                            If you did not get the email, click <a href='/forgot'>here</a> to resend token!`)
    res.redirect('/campgrounds');
}

module.exports.renderResetForm = (req, res) => {
    const {token} = req.params;
    const {id} = req.query;
    res.render('users/reset', {token, id});
}

module.exports.resetPassword = async (req, res) => {
    const {token} = req.params;
    const {id} = req.query;
    const foundToken = await PasswordToken.findById(id);
    if (!foundToken) throw new ExpressError('Reset token expired!', 400);
    const isValid = bcrypt.compare(token, foundToken.token);
    if (!isValid) throw new ExpressError("Invalid or expired password reset token", 400);
    const foundUser = await User.findById(id);
    if (!foundUser) throw new ExpressError('Could not find that user!', 400);
    await foundUser.setPassword(req.body.password);
    await foundUser.save();
    await PasswordToken.findByIdAndDelete(foundToken._id);
    req.flash('success', 'Successfully Changed Your Password!');
    res.redirect('/login');
}