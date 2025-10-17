import ApiError from "../utils/ApiError.js";

export const validate = (schema) => (req, res, next) => {
    const requestDataToValidate = {
        params: req.params,
        body: req.body,
        query: req.query,
    };

    const { error, value } = schema.validate(requestDataToValidate, {
        abortEarly: false,
        allowUnknown: true, 
    });

    if (error) {
        const errorMessage = error.details.map((details) => details.message).join(', ');
        return next(new ApiError(400, errorMessage));
    }


    if (value.body) {
        Object.assign(req.body, value.body);
    }


    if (value.query) {

        Object.keys(req.query).forEach(key => delete req.query[key]);
        Object.assign(req.query, value.query);
    }


    if (value.params) {
        Object.keys(req.params).forEach(key => delete req.params[key]);
        Object.assign(req.params, value.params);
    }
    
    return next();
};