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
        //#FIX IMAGE VALIDATION
        // image: Joi.string().required(),
        location: Joi.string()
            .required()
            .min(3)
            .max(100)
            .escapeHTML(),
        description: Joi.string()
            .required()
            .min(10)
            .max(500)
            .escapeHTML()
    }).required(),
    deleteImages: Joi.array()
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