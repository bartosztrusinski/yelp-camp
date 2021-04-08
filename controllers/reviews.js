const Review = require('../models/review');


module.exports.createReview = async(req, res) => {
    const {id} = req.params
        , currentUser = req.user
        , campground = res.locals.campground
        , newReview = new Review(req.body.review);
    newReview.author = currentUser._id;
    await newReview.save();
    await associateReviewWithCampground(newReview, campground);
    req.flash('success', 'Created new review!');
    res.redirect(`/campgrounds/${id}`);
}

const associateReviewWithCampground = async(review, camp) => {
    camp.reviews.push(review);
    await camp.save();
}

module.exports.destroyReview = async(req, res) => {
    const {reviewId} = req.params
        , review = res.locals.review
        , campground = res.locals.campground;
    await campground.updateOne({$pull: {reviews: reviewId}});
    await review.remove();
    req.flash('success', 'Successfully deleted review!');
    res.redirect(`/campgrounds/${campground._id}`);
}