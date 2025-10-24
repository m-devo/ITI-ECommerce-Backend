import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import redisClient from "../../config/redis.js";

export async function handleIdempotency(req, res, next) {
    const idempotencyKey = req.headers['idempotency-key'];

    if (!idempotencyKey) {
        // Use ApiError for consistency
        throw new ApiError(400, 'Idempotency-Key header is required.');
    }

    try {
        const cachedResult = await redisClient.get(idempotencyKey);

        if (cachedResult) {
        
            if (cachedResult === 'processing') {
                throw new ApiError(429, 'Request is already processing. Please wait.');
                
            } else {
                console.warn(`Duplicate request detected (returning cached result): ${idempotencyKey}`);
                
                return res.status(200).json(new ApiResponse(
                    200, 
                    JSON.parse(cachedResult), 
                    "Data retrieved successfully"
                ));
            }
        }

        await redisClient.set(idempotencyKey, 'processing', {
            EX: 3600,
            NX: true 
        });

        res.locals.idempotencyKey = idempotencyKey;
        next();

    } catch (error) {
        next(error);
    }
}