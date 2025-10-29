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

async function setPairState(adminId, customerId) {
    const adminKey = `chat:state:${adminId}`;
    const customerKey = `chat:state:${customerId}`;
    const adminState = `in_live_chat_with:${customerId}`;
    const customerState = `in_live_chat_with:${adminId}`;

    try {

        await redisClient.multi()
            .setEx(adminKey, stateExpire, adminState)   
            .setEx(customerKey, stateExpire, customerState) 
            .exec(); 
        console.log(`Atomic state updated (PAIR): Admin ${adminId} & Customer ${customerId}`);
    
    } catch (error) {
        console.error(`Redis transaction error setting pair state:`, error);
        throw error;
    }
}
async function setEndChatState(adminId, customerId) {
    const adminKey = `chat:state:${adminId}`;
    const customerKey = `chat:state:${customerId}`;
    const adminState = "admin_available";
    const customerState = "main_menu";

    try {
        const multi = redisClient.multi();
        if (adminId) {
            multi.setEx(adminKey, stateExpire, adminState);
        }
        if (customerId) {
            multi.setEx(customerKey, stateExpire, customerState);
        }
        
        await multi.exec(); 

        console.log(`Atomic state updated (END): Admin ${adminId}, Customer ${customerId}`);
    
    } catch (error) {
        console.error(`Redis transaction error setting end state:`, error);
        throw error; 
    }
}

export default {updateChatState, cleanupChatState, getChatState, setPairState, setEndChatState}