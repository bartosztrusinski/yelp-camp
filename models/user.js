const mongoose = require('mongoose')
    , Schema = mongoose.Schema
    , passportLocalMongoose = require('passport-local-mongoose')
    , {PasswordToken, VerificationToken} = require('./token')
    , {cloudinary} = require('../cloudinary');

const imageSchema = new Schema({
    url: {
        type: String,
    },
    filename: {
        type: String,
    }
});

imageSchema.virtual('rounded').get(function() {
    return this.url.replace('/upload', '/upload/c_fill,g_auto:face,r_max,w_300,ar_1:1').replace('.jpg', '.png');
});

imageSchema.virtual('thumbnail').get(function() {
    return this.url.replace('/upload', '/upload/c_fill,g_auto:face,r_max,w_35,ar_1:1').replace('.jpg', '.png');
});

const userSchema = new Schema({
    email: {
        address: {
            type: String,
            required: true,
            unique: true,
        },
        public: {
            type: Boolean,
            default: false,
            required: true
        }
    },
    isActive: {
        type: Boolean,
        default: false,
        required: true
    },
    isAdmin: {
        type: Boolean,
        default: false,
        required: true
    },
    name: {
        type: String,
        min: 5,
        max: 30
    },
    bio: {
        type: String,
        min: 10,
        max: 200
    },
    phoneNumber: {
        type: String,
        min: 6,
        max: 15
    },
    profilePicture: imageSchema,
    campgrounds: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Campground'
        }
    ]
});

userSchema.post('remove', async function(doc) {
    if(doc) {
        await VerificationToken.findOneAndDelete({_id: doc._id});
        await PasswordToken.findOneAndDelete({_id: doc._id});
        if(doc.profilePicture)
            await cloudinary.uploader.destroy(doc.profilePicture.filename);
    }
});

userSchema.plugin(passportLocalMongoose);
const User = mongoose.model('User', userSchema);
module.exports = User;