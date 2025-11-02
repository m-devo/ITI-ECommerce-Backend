import Joi from 'joi';

export const checkoutSchema = Joi.object({
    body: {
        billingData: Joi.object({
            firstName: Joi.string().optional(),
            lastName: Joi.string().optional(),
            email: Joi.string().email({ tlds: { allow: false } }).optional(),
            phone: Joi.string().required(),
            country: Joi.string().required(),
            state: Joi.string().required(),
            city: Joi.string().required()
        }).required(),

        paymentMethod: Joi.string().valid('paymob', 'cod').required()
    }
});


