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

    Object.assign(req, value);
    
    return next();
};