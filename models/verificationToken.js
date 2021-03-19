const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const {nanoid} = require('nanoid');

const verificationTokenSchema = new Schema({
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
        expires: 60 * 60 * 24
    }
})

const verificationToken = mongoose.model('verificationToken', verificationTokenSchema);

module.exports = verificationToken;