import { rateLimit, ipKeyGenerator } from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import ApiError from '../utils/ApiError.js';
import redisClient from '../../config/redis.js';

const rateLimitHandler = (req, res, next, options) => {
    next(new ApiError(options.statusCode, options.message));
};


const secureKeyGenerator = (req) => {
    const ip = req.ip || 'unknown-ip';
    return `ip-${ip.replace(/:/g, '_').replace(/\./g, '_')}`;
};


export function createRateLimiter() {
    const limiterStore = new RedisStore({
        prefix: 'rl:',
        sendCommand: (...args) => redisClient.sendCommand(args),
    });

    return rateLimit({
        store: limiterStore,
        windowMs: 15 * 60 * 1000, // 15 m
        max: 100,
        message: 'Too many requests, please try again after 15 minutes.',
        keyGenerator: secureKeyGenerator,
        handler: rateLimitHandler,
        standardHeaders: true,
        legacyHeaders: false,
    });
}