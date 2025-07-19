import * as mailTransport from '../utils/mailTransport.js';

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

export { renderContactPage, sendContactMail };
