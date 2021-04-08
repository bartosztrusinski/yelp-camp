const mongoose = require('mongoose')
    , Schema = mongoose.Schema
    , {nanoid} = require('nanoid');

const Token = new Schema({
    _id: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    token: {
        type: 'String',
        default: () => nanoid(),
        required: true,
    },
    dateCreated: {
        type: Date,
        default: Date.now,
        expires: 60 * 60
    }
});

module.exports.VerificationToken = mongoose.model('verificationToken', Token);
module.exports.PasswordToken = mongoose.model('passwordToken', Token);