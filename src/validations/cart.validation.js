import Joi from 'joi';

export const updateBookSchema = Joi.object({
    body: Joi.object({
        bookId: Joi.string().hex().length(24).required(),
        quantity: Joi.number().integer().min(1).required()
    })
});

export const modifyBookSchema = Joi.object({
    body: Joi.object({
        bookId: Joi.string().hex().length(24).required()
    })
});