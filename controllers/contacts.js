const {sendContactMail} = require('../utils/mailTransport');

module.exports.renderContactPage = (req, res) => {
    res.render('contact');
}

module.exports.sendContactMail = async (req, res) => {
    const {name, email, message} = req.body;
    await sendContactMail(name, email, message);
    req.flash('success', 'A contact message has been sent! Please await for our response');
    res.redirect('/campgrounds');
}