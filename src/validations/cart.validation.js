import Joi from 'joi';

const bookUpdateItemSchema = Joi.object({
    bookId: Joi.string().hex().length(24).required(),
    quantity: Joi.number().integer().min(0).required()
});

export const updateBookSchema = Joi.object({
    body: Joi.array()
        .items(bookUpdateItemSchema)
        .min(0)
        .required()
});


export const bookIdParamSchema = Joi.object({
    params: Joi.object({
        bookId: Joi.string().hex().length(24).required()
    })
});