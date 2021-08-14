const nodemailer = require('nodemailer');

module.exports.sendVerificationMail = async (user, token) => {
  await transporter.sendMail(verificationMail(user, token));
}

module.exports.sendPasswordMail = async (user, token) => {
  await transporter.sendMail(passwordMail(user, token));
}

module.exports.sendContactMail = async (name, email, message) => {
  await transporter.sendMail(contactMail(name, email, message));
}

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_ADDRESS,
    pass: process.env.EMAIL_PASSWORD,
  },
});

const verificationMail = (user, token) => {
  return {
    from: '"Yelp Camp 🏕" <yelp@camp.com>',
    to: user.email.address,
    subject: "Yelp Camp - Verify Account",
    text: 'Hello ' + user.username + ',\n\n' +
      'Please verify your account by clicking the link: \n' +
      process.env.BASE_URL + '/verify/' + token + '\n\n' +
      'Thank You!\n',
    html: `<h1>Hello, ${user.username}!</h1>
                <p>Please verify your account by clicking the link below. Thank You!</p>
                <a href='${process.env.BASE_URL}/verify/${token}'>Click here to verify!</a>`,
  }
}

const passwordMail = (user, token) => {
  return {
    from: '"Yelp Camp 🏕" <yelp@camp.com>',
    to: user.email.address,
    subject: "Yelp Camp - Reset Password",
    text: 'Hello ' + user.username + ',\n\n' +
      'Please reset your password by clicking the link: \n' +
      process.env.BASE_URL + '/reset/' + token + '?id=' + user._id + '\n\n' +
      'Thank You!\n',
    html: `<h1>Hello, ${user.username}!</h1>
                <p>Please reset your password by clicking the link below. Thank You!</p>
                <a href='${process.env.BASE_URL}/reset/${token}?id=${user._id}'>Click here to verify!</a>`,
  }
}

const contactMail = (name, email, message) => {
  return {
    from: '"Yelp Camp 🏕" <yelp@camp.com>',
    to: process.env.EMAIL_ADDRESS,
    subject: "Yelp Camp - Contact Message",
    text: name + ' sent message: \n\n' +
      message + '\n',
    html: `<h1>${name} sent message:</h1>
                <pre>${message}</pre>
                <ul>
                    <li>Name: ${name}</li>
                    <li>Email address: ${email}</li>
                </ul>`,
  }
}
