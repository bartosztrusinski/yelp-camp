const mailTransport = require('../utils/mailTransport');

const renderContactPage = (req, res) => {
  res.render('contact');
};

const sendContactMail = async (req, res) => {
  const { name, email, message } = req.body;

  await mailTransport.sendContactMail(name, email, message);

  req.flash(
    'success',
    'A contact message has been sent! Please await for our response'
  );
  res.redirect('/campgrounds');
};

module.exports = { renderContactPage, sendContactMail };
