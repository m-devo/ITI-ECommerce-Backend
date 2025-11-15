import { rateLimit, ipKeyGenerator } from "express-rate-limit";
// import { RedisStore } from 'rate-limit-redis';
import ApiError from "../utils/ApiError.js";
// import redisClient from '../../config/redis.js';

const rateLimitHandler = (req, res, next, options) => {
  next(new ApiError(options.statusCode, options.message));
};

export function createRateLimiter() {
  // Use in-memory store (no Redis required)
  return rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: "Too many requests, please try again after 15 minutes.",
    keyGenerator: ipKeyGenerator,
    handler: rateLimitHandler,
    standardHeaders: true,
    legacyHeaders: false,
  });
}
