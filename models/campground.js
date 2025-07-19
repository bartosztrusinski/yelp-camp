import mongoose, { Schema } from 'mongoose';
import { format } from 'date-fns';
import mongoosePaginate from 'mongoose-paginate-v2';
import { cloudinary } from '../cloudinary.js';
import { Review } from './review.js';

const options = { toJSON: { virtuals: true } };

const imageSchema = new Schema(
  {
    url: { type: String, required: true },
    filename: { type: String, required: true },
  },
  options
);

imageSchema.virtual('thumbnail').get(function () {
  return this.url.replace(
    '/upload',
    '/upload/q_100,w_200,ar_1:1,c_fill,g_center,x_0,y_0'
  );
});

imageSchema.virtual('square').get(function () {
  return this.url.replace(
    '/upload',
    '/upload/q_100,w_600,ar_1:1,c_fill,g_center,x_0,y_0'
  );
});

const campgroundSchema = new Schema(
  {
    title: { type: String, required: true, min: 3, max: 30 },
    price: { type: Number, required: true, min: 0, max: 100 },
    description: { type: String, required: true, min: 10, max: 500 },
    location: { type: String, required: true, min: 3, max: 100 },
    dateCreated: { type: Date, required: true, default: Date.now },
    images: [imageSchema],
    author: { type: Schema.Types.ObjectId, ref: 'User' },
    reviews: [{ type: Schema.Types.ObjectId, ref: 'Review' }],
    geometry: {
      type: { type: String, required: true, enum: ['Point'] },
      coordinates: { type: [Number], required: true },
    },
  },
  options
);

campgroundSchema.virtual('properties.popUpMarkup').get(function () {
  return `<strong>${this.title}</strong><br><a href="/campgrounds/${this._id}"
            class="text-decoration-none badge bg-success text-light text-wrap text-uppercase">Show Camp</a>`;
});

campgroundSchema.virtual('dateFormatted').get(function () {
  return format(this.dateCreated, 'dd-MM-yyyy');
});

campgroundSchema.virtual('priceFormatted').get(function () {
  return Math.round((this.price + Number.EPSILON) * 100) / 100;
});

campgroundSchema.post(
  'deleteOne',
  { document: true, query: false },
  async function (doc) {
    await Review.deleteMany({ _id: { $in: doc.reviews } });

    for (let image of doc.images) {
      await cloudinary.uploader.destroy(image.filename);
    }
  }
);

campgroundSchema.plugin(mongoosePaginate);

const Campground = mongoose.model('Campground', campgroundSchema);

export { Campground };
