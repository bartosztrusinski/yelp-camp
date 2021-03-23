const BaseJoi = require('joi');
const sanitizeHtml = require('sanitize-html');

const extension = (joi) => ({
    type: 'string',
    base: joi.string(),
    messages: {
        'string.escapeHTML': '{{#label}} must not include HTML!'
    },
    rules: {
        escapeHTML: {
            validate(value, helpers) {
                const clean = sanitizeHtml(value, {
                    allowedTags: [],
                    allowedAttributes: {},
                });
                if (clean !== value) return helpers.error('string.escapeHTML', {value})
                return clean;
            }
        }
    }
});

const Joi = BaseJoi.extend(extension);

module.exports.campgroundSchema = Joi.object({
    campground: Joi.object({
        title: Joi.string()
            .required()
            .min(3)
            .max(30)
            .escapeHTML(),
        price: Joi.number()
            .required()
            .min(0)
            .max(100),
        location: Joi.string()
            .required()
            .min(3)
            .max(100)
            .escapeHTML(),
        description: Joi.string()
            .required()
            .min(10)
            .max(500)
            .escapeHTML(),
        images: Joi.array().items(
            Joi.object({
                url: Joi.string()
                    .required(),
                filename: Joi.string()
                    .required()
            }).required()
        ).max(3)

    }).required(),
    deleteImages: Joi.array().max(3)
})

module.exports.reviewSchema = Joi.object({
    review: Joi.object({
        body: Joi.string()
            .required()
            .min(5)
            .max(500)
            .escapeHTML(),
        rating: Joi.number()
            .required()
            .min(1)
            .max(5)
    }).required()
})

module.exports.userSchema = Joi.object({
    email: Joi.string()
        .required()
        .email()
        .escapeHTML(),
    username: Joi.string()
        .required()
        .min(3)
        .max(20)
        .escapeHTML(),
    password: Joi.string()
        .required()
        .pattern(new RegExp('^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9]).{8,}'))
        .escapeHTML(),
})

module.exports.passwordSchema = Joi.object({
    password: Joi.string()
        .required()
        .pattern(new RegExp('^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9]).{8,}'))
        .escapeHTML()
})