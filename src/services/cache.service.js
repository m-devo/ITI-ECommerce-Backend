import redisClient from "../../config/redis.js";

const set = (async function (key, value, expireBySec = 3600) {
    try {
        const turnString = JSON.stringify(value)
        await redisClient.set(key, turnString, {
            EX: expireBySec
            // expire is deprecated
        } )
    } catch(error) {
        console.error("Error setting cache for key ", key, error);    }
}) 

const get = (async function (key) {
    try {
        const value = await redisClient.get(key)
        if(value) {
            return JSON.parse(value)
        } else return null
    } catch(error) {
        console.error("Error setting cache for key ", key, error);
        return null
    }
})              
const del = async function (key) {
    try {
        await redisClient.del(key);
    } catch (error) {
        console.error("Error deleting cache for key ", key, error);
    }
};

export default { set, get, del };
