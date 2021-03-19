const User = require('../models/user');
const VerificationToken = require('../models/verificationToken');
const ExpressError = require('../utils/ExpressError');
const {transporter, verificationMail} = require('../utils/mailTransport');

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
    req.flash('success', 'Welcome back!');
    res.redirect(redirectUrl);
}

module.exports.logout = (req, res) => {
    req.logout();
    req.flash('success', 'Goodbye!');
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

module.exports.renderResendForm = (req, res) => {
    res.render('users/resend');
}

module.exports.resendMail = async (req, res) => {
    const foundUser = await User.findOne({email: req.body.email})

    if (!foundUser) throw new ExpressError('Could not find that email!', 400);
    if (foundUser.isActive) throw new ExpressError('This account has been already verified. Please log in.', 400);

    await VerificationToken.findOneAndDelete({_id: foundUser._id})

    const newToken = new VerificationToken({_id: foundUser._id})

    const savedToken = await newToken.save();

    await transporter.sendMail(verificationMail(foundUser, savedToken.token, req.headers.host))

    req.flash('success', `A verification email has been sent to ${foundUser.email}. It will be expire after one day. 
                                If you did not get verification email, click <a href='/resend'>here</a> to resend token!`)
    res.redirect('/campgrounds');
}