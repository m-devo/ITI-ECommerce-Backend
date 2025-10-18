
const errorHandler = (err, req, res, next) => {

    const resHasErrorStatus = typeof res.statusCode === 'number' && res.statusCode >= 400;
    const statusCode = err.statusCode || (resHasErrorStatus ? res.statusCode : 500);

    if (process.env.NODE_ENV !== 'production') {
        console.error(err);
    }

    res.status(statusCode).json({
        statusCode,
        message: err.message || 'Internal Server Error',
        success: false,
        stack: process.env.NODE_ENV === 'production' ? undefined : err.stack
    });
};

export default errorHandler;