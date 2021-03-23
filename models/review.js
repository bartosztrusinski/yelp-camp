const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const formatDistanceToNow = require('date-fns/formatDistanceToNow');

const reviewSchema = new Schema({
    body: {
        type: String,
        required: true,
        min: 5,
        max: 500
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    dateCreated: {
        type: Date,
        default: Date.now,
        required: true
    },
    author: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    }
})

reviewSchema.virtual('dateFormatted').get(function () {
    return formatDistanceToNow(this.dateCreated, {addSuffix: true});
})

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;