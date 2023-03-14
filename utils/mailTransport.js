const nodemailer = require('nodemailer');

const sendVerificationMail = async (user, token) => {
  await transporter.sendMail(verificationMail(user, token));
};

const sendPasswordResetMail = async (user, token) => {
  await transporter.sendMail(passwordResetMail(user, token));
};

const sendContactMail = async (name, email, message) => {
  await transporter.sendMail(contactMail(name, email, message));
};

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: true,
  auth: {
    user: process.env.SMTP_USERNAME,
    pass: process.env.SMTP_PASSWORD,
  },
});

const verificationMail = (user, token) => ({
  from: '"Yelp Camp 🏕" <yelp@camp.com>',
  to: user.email.address,
  subject: 'Yelp Camp - Verify Account',
  text: `Hello ${user.username},\n\n
    Please verify your account by clicking the link:\n
    ${process.env.BASE_URL}/verify/${token}\n\n
    Thank You!\n`,
  html: `<h1>Hello, ${user.username}!</h1>
    <p>Please verify your account by clicking the link below. Thank You!</p>
    <a href='${process.env.BASE_URL}/verify/${token}'>Click here to verify!</a>`,
});

const passwordResetMail = (user, token) => ({
  from: '"Yelp Camp 🏕" <yelp@camp.com>',
  to: user.email.address,
  subject: 'Yelp Camp - Reset Password',
  text: `Hello ${user.username},\n\n
    Please reset your password by clicking the link:\n
    ${process.env.BASE_URL}/reset/${token}?id=${user._id}\n\n
    Thank You!\n`,
  html: `<h1>Hello, ${user.username}!</h1>
    <p>Please reset your password by clicking the link below. Thank You!</p>
    <a href='${process.env.BASE_URL}/reset/${token}?id=${user._id}'>Click here to verify!</a>`,
});

const contactMail = (name, email, message) => ({
  from: '"Yelp Camp 🏕" <yelp@camp.com>',
  to: process.env.SMTP_USERNAME,
  subject: 'Yelp Camp - Contact Message',
  text: `${name} sent message:\n\n${message}\n\n`,
  html: `<h1>${name} sent message:</h1>
    <pre>${message}</pre>
    <ul>
        <li>Name: ${name}</li>
        <li>Email address: ${email}</li>
    </ul>`,
});

module.exports = {
  sendVerificationMail,
  sendPasswordResetMail,
  sendContactMail,
};
