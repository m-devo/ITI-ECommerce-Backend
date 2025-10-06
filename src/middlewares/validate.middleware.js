import Joi from 'joi';
import ApiError from '../utils/ApiError.js';

export const validate = (schema) => (req, res, next) => {
    const { value, error } = schema.validate(req.params);
    
    if (error) {
        const errorMessage = error.details.map((details) => details.message).join(', ');
        return next(new ApiError(400, errorMessage));
    }
    
    return next();
};