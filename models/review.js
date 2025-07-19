import mongoose, { Schema } from 'mongoose';
import { formatDistanceToNow } from 'date-fns';

const reviewSchema = new Schema({
  body: { type: String, required: true, min: 5, max: 500 },
  rating: { type: Number, required: true, min: 1, max: 5 },
  dateCreated: { type: Date, required: true, default: Date.now },
  author: { type: Schema.Types.ObjectId, ref: 'User' },
});

reviewSchema.virtual('dateFormatted').get(function () {
  return formatDistanceToNow(this.dateCreated, { addSuffix: true });
});

const Review = mongoose.model('Review', reviewSchema);

export { Review };
