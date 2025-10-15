import { createClient } from "redis";

const redisClient = createClient(
    /*{ url: process.env.REDIS_URL}*/
);

redisClient.on('error', err => console.error('Redis Client Error:', err));

const redisConnection =  async () => {
    if (redisClient.isOpen) {
        console.log("Redis is already connected.");
        return;
    }
    try {
        await redisClient.connect();
        console.log("Redis is connected perfectly :)!");
    } catch (err) {
        console.error("Could not connect to Redis :(", err);
        process.exit(1); 
    }
};

export default redisClient;
export { redisConnection };
