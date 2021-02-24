const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const reviewSchema = new Schema({
    body: String,
    rating: Number,
})

const ReviewModel = mongoose.model('Review', reviewSchema);

module.exports = ReviewModel;