import redisClient from "../../config/redis.js";

export async function deleteRedisCache(key) {
    if (!key) {
        console.error('Redis DEL error: No key provided.');
        return;
    }
    
    try {
        // Delete the key that was passed directly
        await redisClient.del(key);
    } catch (err) {
        console.error(`Redis DEL error for key ${key}:`, err);
    }
}