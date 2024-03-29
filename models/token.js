const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { nanoid } = require('nanoid');

const Token = new Schema({
  _id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  token: { type: 'String', default: () => nanoid(), required: true },
  dateCreated: { type: Date, default: Date.now, expires: 60 * 60 },
});

const VerificationToken = mongoose.model('verificationToken', Token);
const PasswordToken = mongoose.model('passwordToken', Token);

module.exports = { VerificationToken, PasswordToken };
