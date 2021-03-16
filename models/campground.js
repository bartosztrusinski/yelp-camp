const mongoose = require('mongoose');
const Review = require('./review');
const Schema = mongoose.Schema;
const {cloudinary} = require('../cloudinary');

const imageSchema = new Schema({
    url: {
        type: String,
        required: true
    },
    filename: {
        type: String,
        required: true
    }
})

imageSchema.virtual('thumbnail').get(function () {
    return this.url.replace('/upload', '/upload/q_100,w_200,ar_1:1,c_fill,g_center,x_0,y_0')
})

imageSchema.virtual('square').get(function () {
    return this.url.replace('/upload', '/upload/q_100,w_600,ar_1:1,c_fill,g_center,x_0,y_0')
})

const opts = {toJSON: {virtuals: true}};

const campgroundSchema = new Schema({
    title: {
        type: String,
        required: true,
        min: 3,
        max: 30
    },
    price: {
        type: Number,
        required: true,
        min: 0,
        max: 100
    },
    description: {
        type: String,
        required: true,
        min: 10,
        max: 500,
    },
    location: {
        type: String,
        min: 3,
        max: 100,
        required: true
    },
    geometry: {
        type: {
            type: String,
            enum: ['Point'],
            required: true
        },
        coordinates: {
            type: [Number],
            required: true
        }
    },
    images: [imageSchema],
    author: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    reviews: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Review'
        }
    ]
}, opts);

campgroundSchema.virtual('properties.popUpMarkup').get(function () {
    return `<strong>${this.title}</strong><br><a href="/campgrounds/${this._id}" class="text-decoration-none badge bg-success text-white text-wrap text-uppercase">Show Camp</a>`
})

campgroundSchema.post('findOneAndDelete', async function (doc) {
    if (doc) {
        await Review.deleteMany({
            _id: {
                $in: doc.reviews
            }
        })
        for (let image of doc.images) {
            await cloudinary.uploader.destroy(image.filename)
        }
    }
})

const Campground = mongoose.model('Campground', campgroundSchema);

module.exports = Campground;