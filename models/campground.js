const mongoose = require('mongoose')
    , Schema = mongoose.Schema
    , Review = require('./review')
    , {cloudinary} = require('../cloudinary')
    , format = require('date-fns/format')
    , mongoosePaginate = require('mongoose-paginate-v2');

const options = {toJSON: {virtuals: true}};

const imageSchema = new Schema({
    url: {
        type: String,
        required: true
    },
    filename: {
        type: String,
        required: true
    }
}, options);

imageSchema.virtual('thumbnail').get(function() {
    return this.url.replace('/upload', '/upload/q_100,w_200,ar_1:1,c_fill,g_center,x_0,y_0');
});

imageSchema.virtual('square').get(function() {
    return this.url.replace('/upload', '/upload/q_100,w_600,ar_1:1,c_fill,g_center,x_0,y_0');
});


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
    dateCreated: {
        type: Date,
        default: Date.now,
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
}, options);

campgroundSchema.virtual('properties.popUpMarkup').get(function() {
    return `<strong>${this.title}</strong><br><a href="/campgrounds/${this._id}"
            class="text-decoration-none badge bg-success text-white text-wrap text-uppercase">Show Camp</a>`;
});

campgroundSchema.virtual('dateFormatted').get(function() {
    return format(this.dateCreated, "dd-MM-yyyy");
});

campgroundSchema.virtual('priceFormatted').get(function() {
    return Math.round((this.price + Number.EPSILON) * 100) / 100;
});

campgroundSchema.post('remove', async function(doc) {
    if(doc) {
        await Review.deleteMany({
            _id: {
                $in: doc.reviews
            }
        });
        for(let image of doc.images) {
            await cloudinary.uploader.destroy(image.filename);
        }
    }
});

campgroundSchema.plugin(mongoosePaginate);
const Campground = mongoose.model('Campground', campgroundSchema);
module.exports = Campground;