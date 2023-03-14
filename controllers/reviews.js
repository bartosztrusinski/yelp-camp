const Review = require('../models/review');

const createReview = async (req, res) => {
  const { id } = req.params;
  const currentUser = req.user;
  const campground = res.locals.campground;
  const newReview = new Review(req.body.review);

  newReview.author = currentUser._id;
  await newReview.save();
  await associateReviewWithCampground(newReview, campground);

  req.flash('success', 'Created new review!');
  res.redirect(`/campgrounds/${id}`);
};

const associateReviewWithCampground = async (review, camp) => {
  camp.reviews.push(review);
  await camp.save();
};

const destroyReview = async (req, res) => {
  const review = res.locals.review;
  const campground = res.locals.campground;
  const { reviewId } = req.params;

  await campground.updateOne({ $pull: { reviews: reviewId } });
  await review.remove();

  req.flash('success', 'Successfully deleted review!');
  res.redirect(`/campgrounds/${campground._id}`);
};

module.exports = {
  createReview,
  destroyReview,
};
