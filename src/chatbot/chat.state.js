import redisClient from "../../config/redis.js";

const stateExpire = 10800; // 3 hours

async function updateChatState(id, newState) {

    const key = `chat:state:${id}`

    try {

        await redisClient.setEx(key, stateExpire, newState)

        console.log(`State updated for ${id}: ${newState}`);

    } catch (error) {

        console.error(`Redis error, cannot update state for ${id} to ${newState}:`, error);

        throw error;
    }
}

async function cleanupChatState(id) {

    const key = `chat:state:${id}`;

    try {
        await redisClient.del(key)

        console.log(`Cleaned up state for ${id}`)

    } catch (error) {

        console.error(`Redis error deleting state for ${id}:`, error);
    }
}

 async function getChatState(id) {
    const key = `chat:state:${id}`;
    try {
        return await redisClient.get(key);
    } catch (error) {
        console.error(`Redis error getting state for ${id}:`, error);
        return null;
    }
}

export default {updateChatState, cleanupChatState, getChatState}