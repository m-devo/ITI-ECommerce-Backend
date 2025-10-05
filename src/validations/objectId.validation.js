import Joi from 'joi';

export const objectId = Joi.object({
    id: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required().messages({
        'string.pattern.base': 'Invalid ID format',
        'any.required': 'ID is required',
    }),
});