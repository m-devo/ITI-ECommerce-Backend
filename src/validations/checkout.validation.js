import Joi from 'joi';

export const checkoutSchema = Joi.object({
    body: {
        billingData: Joi.object({
            firstName: Joi.string().required(),
            lastName: Joi.string().required(),
            email: Joi.string().email({ tlds: { allow: false } }).required(),
            phone: Joi.string().required(),
            country: Joi.string().required(),
            state: Joi.string().required(),
            city: Joi.string().required()
        }).required(),

        paymentMethod: Joi.string().valid('paymob').required()
    }
});


