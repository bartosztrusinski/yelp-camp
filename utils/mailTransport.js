import { Resend } from 'resend';
import { ExpressError } from './ExpressError.js';

const resend = new Resend(process.env.RESEND_API_KEY);

const sendVerificationMail = async (user, token) => {
  const { error } = await resend.emails.send(verificationMail(user, token));

  if (error) {
    throw new ExpressError(
      'There was an error sending the verification email. Please try again later.',
      500
    );
  }
};

const sendPasswordResetMail = async (user, token) => {
  const { error } = await resend.emails.send(passwordResetMail(user, token));

  if (error) {
    throw new ExpressError(
      'There was an error sending the password reset email. Please try again later.',
      500
    );
  }
};

const sendContactMail = async (name, email, message) => {
  const { error } = await resend.emails.send(contactMail(name, email, message));

  if (error) {
    throw new ExpressError(
      'There was an error sending the contact email. Please try again later.',
      500
    );
  }
};

const verificationMail = (user, token) => ({
  from: `"Yelp Camp 🏕" <${process.env.FROM_EMAIL_ADDRESS}>`,
  to: user.email.address,
  subject: 'Yelp Camp - Verify Account',
  text: `Hello ${user.username},\n\n
    Please verify your account by clicking the link:\n
    ${process.env.BASE_URL}/verify/${token}\n\n
    Thank You!\n`,
  html: `<h1>Hello, ${user.username}!</h1>
    <p>Please verify your account by clicking the link below. Thank You!</p>
    <a href='${process.env.BASE_URL}/verify/${token}'>Click here to verify</a>`,
});

const passwordResetMail = (user, token) => ({
  from: `"Yelp Camp 🏕" <${process.env.FROM_EMAIL_ADDRESS}>`,
  to: user.email.address,
  subject: 'Yelp Camp - Reset Password',
  text: `Hello ${user.username},\n\n
    Please reset your password by clicking the link:\n
    ${process.env.BASE_URL}/reset/${token}?id=${user._id}\n\n
    Thank You!\n`,
  html: `<h1>Hello, ${user.username}!</h1>
    <p>Please reset your password by clicking the link below. Thank You!</p>
    <a href='${process.env.BASE_URL}/reset/${token}?id=${user._id}'>Click here to reset</a>`,
});

const contactMail = (name, email, message) => ({
  from: `"Yelp Camp 🏕" <${process.env.FROM_EMAIL_ADDRESS}>`,
  to: process.env.CONTACT_EMAIL_ADDRESS,
  subject: 'Yelp Camp - Contact Message',
  text: `${name} sent message:\n\n${message}\n\n`,
  html: `<h1>${name} sent message:</h1>
    <pre>${message}</pre>
    <ul>
        <li>Name: ${name}</li>
        <li>Email address: ${email}</li>
    </ul>`,
});

export { sendVerificationMail, sendPasswordResetMail, sendContactMail };
