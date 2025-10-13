
const errorHandler = (err, req, res, next) => {
    const statusCode = err.statusCode || res.statusCode || 500;

    res.status(statusCode).json({
        statusCode,
        message: err.message || 'Internal Server Error',
        success: false,
        stack: process.env.NODE_ENV === 'production' ? undefined : err.stack
    });
};

export default errorHandler;