import redisClient from '../../config/redis.js';
import ApiError from '../utils/ApiError.js';
import logger from '../../config/logger.js'

const errorHandler = async (err, req, res, next) => {
    const { idempotencyKey } = res.locals;

    if (idempotencyKey) {
        try {
            const keyState = await redisClient.get(idempotencyKey);
            
            if (keyState === 'processing') {
                console.warn(`[ErrorHandler] Error during processing. Deleting idempotency key: ${idempotencyKey}`);
                await redisClient.del(idempotencyKey);
            }
        } catch (redisError) {
            console.error('[ErrorHandler] Redis failed during error cleanup:', redisError);
        }
    }
    
    const resHasErrorStatus = typeof res.statusCode === 'number' && res.statusCode >= 400;
    const statusCode = err.statusCode || (resHasErrorStatus ? res.statusCode : 500);

    // Log error to file using winston
    logger.error({
        message: err.message,
        stack: err.stack,
        statusCode: statusCode,
        url: req.originalUrl,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString()
    });

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