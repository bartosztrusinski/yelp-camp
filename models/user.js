const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose');
const Schema = mongoose.Schema;
const {PasswordToken, VerificationToken} = require('./token');

const userSchema = new Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    isActive: {
        type: Boolean,
        default: false,
        required: true
    }
})
userSchema.plugin(passportLocalMongoose)

userSchema.post('findOneAndDelete', async function (doc) {
    if (doc) {
        await VerificationToken.findOneAndDelete({_id: doc._id})
        await PasswordToken.findOneAndDelete({_id: doc._id})
    }
})

const User = mongoose.model('User', userSchema);

module.exports = User;