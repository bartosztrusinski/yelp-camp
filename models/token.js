const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const {nanoid} = require('nanoid');

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
        default: Date.now(),
        expires: 60 * 60 // 1 hour
    }
})

module.exports.VerificationToken = mongoose.model('verificationToken', Token);

module.exports.PasswordToken = mongoose.model('passwordToken', Token);