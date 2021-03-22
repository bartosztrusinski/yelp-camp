const nodemailer = require('nodemailer');

module.exports.transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
        user: process.env.EMAIL_ADDRESS,
        pass: process.env.EMAIL_PASSWORD,
    },
});

module.exports.verificationMail = function (user, token, host) {
    return {
        from: '"Yelp Camp 🏕" <yelp@camp.com>',
        to: user.email,
        subject: "Yelp Camp - Verify Account",
        text: 'Hello ' + user.username + ',\n\n' +
            'Please verify your account by clicking the link: ' +
            '\nhttp:\/\/' + host + '\/verify\/' + token + '\n\nThank You!\n',
        html: `<h1>Hello, ${user.username}!</h1>
                <p>Please verify your account by clicking the link below. Thank You!</p>
                <a href='http://localhost:3000/verify/${token}'>Click here to verify!</a>`,
    }
}

module.exports.passwordMail = function (user, token, host) {
    return {
        from: '"Yelp Camp 🏕" <yelp@camp.com>',
        to: user.email,
        subject: "Yelp Camp - Reset Password",
        text: 'Hello ' + user.username + ',\n\n' +
            'Please reset your password by clicking the link: ' +
            '\nhttp:\/\/' + host + '\/reset\/' + token + '?id=' + user._id + '\n\n' +
            'Thank You!\n',
        html: `<h1>Hello, ${user.username}!</h1>
                <p>Please reset your password by clicking the link below. Thank You!</p>
                <a href='http://localhost:3000/reset/${token}?id=${user._id}'>Click here to verify!</a>`,
    }
}