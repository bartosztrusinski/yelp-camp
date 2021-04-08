const User = require('../models/user')
    , {VerificationToken, PasswordToken} = require('../models/token')
    , ExpressError = require('../utils/ExpressError')
    , {sendVerificationMail, sendPasswordMail} = require('../utils/mailTransport')
    , bcrypt = require('bcrypt')
    , {cloudinary} = require('../cloudinary');


module.exports.login = async(req, res) => {
    const redirectUrl = getPathToReturnTo(req);
    setSessionAge(req);
    req.brute.reset(function() {
        req.flash('success', 'Welcome back!');
        res.redirect(redirectUrl);
    });
}

const getPathToReturnTo = (req) => {
    const redirectUrl = req.session.returnTo || '/campgrounds';
    delete req.session.returnTo;
    return redirectUrl;
}

const setSessionAge = (req) => {
    const month = 1000 * 60 * 60 * 24 * 30;
    const halfHour = 1000 * 60 * 30;
    const isRememberMeChecked = req.body.remember_me;
    req.session.cookie.maxAge = isRememberMeChecked ? month : halfHour;
}

module.exports.logout = (req, res) => {
    req.logout();
    req.flash('success', 'Goodbye!');
    res.redirect('back');
}

module.exports.register = async(req, res) => {
    const {username, email, password} = req.body
        , newUser = new User({email, username})
        , registeredUser = await User.register(newUser, password)
        , token = await issueNewVerificationToken(registeredUser._id);
    await sendVerificationMail(registeredUser, token);
    req.flash('success',
        `A verification email has been sent to ${registeredUser.email.address}. It will be expire after one day. 
        If you did not get verification email, click <a href='/resend'>here</a> to resend token!`);
    res.redirect('/campgrounds');
}

module.exports.sendVerifyMail = async(req, res) => {
    const {email} = req.body
        , user = await User.findOne({'email.address': email});
    if(user) {
        if(user.isActive)
            throw new ExpressError('This account has been already verified. Please log in.', 400, '/login');
        const token = await issueNewVerificationToken(user._id);
        await sendVerificationMail(user, token);
    }
    req.flash('success', `A verification email has been sent to ${email}. It will be expire after one hour. 
                                If you did not get the email, click <a href='/resend'>here</a> to resend token!`);
    res.redirect('/campgrounds');
}

const issueNewVerificationToken = async(userID) => {
    await VerificationToken.findOneAndDelete({_id: userID});
    const newToken = new VerificationToken({_id: userID});
    const savedToken = await newToken.save();
    return savedToken.token;
}

module.exports.sendPasswordMail = async(req, res) => {
    const {email} = req.body
        , user = await User.findOne({'email.address': email});
    if(user) {
        const token = await issueNewPasswordToken(user._id);
        await sendPasswordMail(user, token);
    }
    req.flash('success', `A password reset email has been sent to ${email}. It will be expire after one hour.
                            If you did not get the email, click <a href='/forgot'>here</a> to resend token!`);
    res.redirect('/campgrounds');
}

const issueNewPasswordToken = async(userID) => {
    await PasswordToken.findOneAndDelete({_id: userID});
    const newToken = new PasswordToken({_id: userID});
    const token = newToken.token;
    newToken.token = await bcrypt.hash(newToken.token, 12);
    await newToken.save();
    return token;
}

module.exports.verifyUser = async(req, res) => {
    const {token} = req.params
        , deletedToken = await VerificationToken.findOneAndDelete({token})
        , user = await User.findById(deletedToken._id);
    user.isActive = true;
    await user.save();
    req.flash('success', 'Successfully Verified Your Account!');
    res.redirect('/login');
}

module.exports.resetPassword = async(req, res) => {
    const {id} = req.query
        , user = await User.findById(id);
    await user.setPassword(req.body.password);
    await user.save();
    await PasswordToken.findByIdAndDelete(id);
    req.flash('success', 'Successfully Changed Your Password!');
    res.redirect('/login');
}

module.exports.updateUserProfile = async(req, res) => {
    const {name, bio, showEmail, phoneNumber} = req.body
        , user = res.locals.user
        , isPublic = showEmail === 'yes';
    await user.updateOne({name, bio, phoneNumber, 'email.public': isPublic});
    if(req.body.deletePicture === 'yes') {
        await updateProfilePictureTo(null, user);
    } else if(req.file) {
        const profilePicture = {url: req.file.path, filename: req.file.filename};
        await updateProfilePictureTo(profilePicture, user);
    }
    req.flash('success', 'Successfully updated profile!');
    res.redirect(`/users/${user._id}`);
}

const updateProfilePictureTo = async(picture, user) => {
    if(user.profilePicture)
        await cloudinary.uploader.destroy(user.profilePicture.filename);
    user.profilePicture = picture;
    await user.save();
}

module.exports.changePassword = async(req, res) => {
    const user = res.locals.user;
    await user.setPassword(req.body.password);
    await user.save();
    req.flash('success', 'Successfully Changed Your Password!');
    res.redirect(`/users/${user._id}`);
}

module.exports.deleteUser = async(req, res) => {
    const user = res.locals.user;
    await user.remove();
    req.flash('success', 'Successfully deleted user!');
    res.redirect('/campgrounds');
}


module.exports.renderLogin = (req, res) => {
    res.render('users/login');
}

module.exports.renderRegister = (req, res) => {
    res.render('users/register');
}

module.exports.renderUserProfile = async(req, res) => {
    const user = await res.locals.user
        .populate({
            path: 'campgrounds',
            options: {
                sort: {'dateCreated': -1}
            }
        })
        .execPopulate();
    res.render('users/show', {user});
}

module.exports.renderEditForm = async(req, res) => {
    const user = res.locals.user;
    res.render('users/edit', {user});
}

module.exports.renderPasswordChangeForm = (req, res) => {
    const {id} = req.params;
    res.render('users/changePassword', {id});
}

module.exports.renderVerifyForm = (req, res) => {
    res.render('users/sendToken', {
        title: 'Verify Account',
        description: 'We will resend you an email with instructions on how to verify your account',
        action: '/resend'
    });
}

module.exports.renderForgotForm = (req, res) => {
    res.render('users/sendToken', {
        title: 'Forgot Password',
        description: 'We will send you an email with instructions on how to reset your password',
        action: '/forgot'
    });
}

module.exports.renderResetForm = (req, res) => {
    const {token} = req.params;
    const {id} = req.query;
    res.render('users/reset', {token, id});
}