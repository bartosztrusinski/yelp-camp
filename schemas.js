import BaseJoi from 'joi';
import sanitizeHtml from 'sanitize-html';

const extension = (joi) => ({
  type: 'string',
  base: joi.string(),
  messages: { 'string.escapeHTML': '{{#label}} must not include HTML!' },
  rules: {
    escapeHTML: {
      validate(value, helpers) {
        const clean = sanitizeHtml(value, {
          allowedTags: [],
          allowedAttributes: {},
        });

        if (clean !== value) {
          return helpers.error('string.escapeHTML', { value });
        }
        return clean;
      },
    },
  },
});

const Joi = BaseJoi.extend(extension);

const password = Joi.string()
  .required()
  .pattern(new RegExp('^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9]).{8,}'))
  .messages({
    'string.pattern.base':
      'Password must contain at least one uppercase letter, one lowercase letter, a number and must be at least 8 characters',
  })
  .escapeHTML();

const retypePassword = Joi.string().valid(Joi.ref('password')).messages({
  'any.only': 'Password fields need to match!',
});

const userSchema = Joi.object({
  email: Joi.object({
    address: Joi.string().required().email().escapeHTML(),
  }).required(),
  username: Joi.string().required().min(3).max(20).escapeHTML(),
  password,
  retypePassword,
});

const passwordSchema = Joi.object({ password, retypePassword });

const campgroundSchema = Joi.object({
  campground: Joi.object({
    title: Joi.string().required().min(3).max(30).escapeHTML(),
    price: Joi.number().required().min(0).max(100),
    location: Joi.string().required().min(3).max(100).escapeHTML(),
    description: Joi.string().required().min(10).max(500).escapeHTML(),
    images: Joi.array()
      .items(
        Joi.object({
          url: Joi.string().required(),
          filename: Joi.string().required(),
        }).required()
      )
      .max(3),
  }).required(),
  deleteImages: Joi.array().max(3),
});

const reviewSchema = Joi.object({
  review: Joi.object({
    body: Joi.string().required().min(5).max(500).escapeHTML(),
    rating: Joi.number().required().min(1).max(5),
  }).required(),
});

const userProfileSchema = Joi.object({
  name: Joi.string().min(5).max(30).allow('').escapeHTML(),
  bio: Joi.string().min(10).max(200).allow('').escapeHTML(),
  phoneNumber: Joi.string().min(6).max(15).allow('').escapeHTML(),
  profilePicture: Joi.object({
    url: Joi.string().required(),
    filename: Joi.string().required(),
  }),
});

export {
  campgroundSchema,
  reviewSchema,
  userSchema,
  passwordSchema,
  userProfileSchema,
};
