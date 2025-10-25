import clients from "./chat.clients.js";
import chatStateService from "./chat.state.js";
import liveChatService from "./chat.livechat.js";
import chatRoutingService from "./chat.routing.js";

function handleAdminConnection(ws, adminId, user) {

    ws.user = user; 
    clients.adminClients.set(adminId, ws);
    
    chatStateService.updateChatState(adminId, "admin_available")
    .catch(error => 

        console.error("Failed to set initial admin state:", error
        ));
    console.log(`Admin connected: ${adminId} (${user?.email}). Total admins: ${clients.adminClients.size}`)

    ws.send(JSON.stringify(
        { type: "welcome_admin", message: "Connected to Admin Live Channel. Status: Available" }
    ));

    ws.on("message", async (message) => {
        try {
            const msgStr = message.toString();
            const currentState = await chatStateService.getChatState(adminId);

            if (currentState && currentState.startsWith("in_live_chat_with:")) {
                
                if (msgStr.trim().toLowerCase() === "/endchat") { 

                    const targetCustomerId = currentState.split(":")[1];

                    console.log(`Admin ${adminId} requested to end chat with ${targetCustomerId}`);
                    await liveChatService.endLiveChat(adminId, targetCustomerId, "Chat ended by admin.");
                    return; 
                }

                const targetCustomerId = currentState.split(":")[1];

                const targetCustomerWs = clients.customerClients.get(targetCustomerId);

                if (targetCustomerWs && targetCustomerWs.readyState === ws.OPEN) {

                    targetCustomerWs.send(JSON.stringify({
                        type: "live_chat_message",
                        sender: "admin",
                        senderName: user?.firstName || "Admin",
                        message: msgStr 
                    }));
                } else {
        console.log(`Cannot send message from admin ${adminId}: Customer ${targetCustomerId} not found or disconnected.`);
                    ws.send(JSON.stringify({ 
                        type: "error", 
                        message: `User ${targetCustomerId.substring(0,4)} is no longer connected.` 
                    }));
                    await liveChatService.endLiveChat(adminId, targetCustomerId);
                }
            } 
            else {

                const parsedMsg = JSON.parse(msgStr);

                if (parsedMsg.type === "admin_accept_chat" && 
                    (parsedMsg.data?.customerId || parsedMsg.data?.customerId)) {
                    
                    if (currentState === "admin_available") { 

                        const customerIdToConnect = parsedMsg.data?.customerId || parsedMsg.data?.customerId;

                        console.log(`Admin ${adminId} attempting to accept chat with customer ${customerIdToConnect}`);
                        await liveChatService.pairAdminAndCustomer(adminId, customerIdToConnect);
                    } else {
                        console.log(`Admin ${adminId} tried to accept chat but is not available (state: ${currentState})`);
                        ws.send(JSON.stringify({ type: "error", message: "Cannot accept chat, you are currently busy or unavailable." }));
                    }
                }
                 else if (parsedMsg.type === "admin_end_chat" 
                    && currentState && currentState.startsWith("in_live_chat_with:")) {

                    const targetCustomerId = currentState.split(":")[1];

                    console.log(`Admin ${adminId} requested to end chat with ${targetCustomerId}`);

                    await liveChatService.endLiveChat(adminId, targetCustomerId, "Chat ended by admin.");
                }
                 else {
                    console.log(
                        `Received unhandled JSON command from admin ${adminId} in state ${currentState}:`, parsedMsg);
                     ws.send(JSON.stringify(
                        { type: "info", 
                        message: "Message type not recognized or invalid state." 
                    }));
                }
            }
        } catch (error) {

            console.error(`Error processing message from admin ${adminId}:`, error);
            if (ws.readyState === ws.OPEN) { 
                ws.send(JSON.stringify({ 
                    type: "error", 
                    message: "Error processing your request. If sending a command, ensure it is valid JSON." 
                }));
            }
        }
    });

    ws.on("close", async function () {
        const adminState = await chatStateService.getChatState(adminId);

        clients.adminClients.delete(adminId);

        console.log(`Admin disconnected: ${adminId}. Total admins: ${clients.adminClients.size}`);

        if (adminState && adminState.startsWith("in_live_chat_with:")) {

            const customerId = adminState.split(":")[1];

            await liveChatService.endLiveChat(null, customerId, "Admin disconnected.");
        }
        await chatStateService.cleanupChatState(adminId);
    });

    ws.on("error", async function (error) { 

        const adminState = await chatStateService.getChatState(adminId);

        console.error("Admin web socket error for " + adminId + ":", error);

        clients.adminClients.delete(adminId);

        if (adminState && adminState.startsWith("in_live_chat_with:")) {

            const customerId = adminState.split(":")[1];

            await liveChatService.endLiveChat(null, customerId, "Admin connection error.");
        }
        await chatStateService.cleanupChatState(adminId);
    });
}

async function handleCustomerConnection(ws, customerId, userRole, user) {

    clients.customerClients.set(customerId, ws);
    console.log(`Customer connected: ${customerId}. Role: ${userRole}.`);

    let inActivityTime;

    function resetinActivityTime() {

        clearTimeout(inActivityTime);

        inActivityTime = setTimeout(async function() { 

            console.log(`Closing connection for ${customerId} due to inactivity for ten minutes`);

            if(ws.readyState === ws.OPEN) {
                ws.send(JSON.stringify({
                    message: "Connection has been shut down due to inactivity"
                }));
            }
            const customerState = await chatStateService.getChatState(customerId);

            if (customerState && customerState.startsWith("in_live_chat_with:")) {

                const adminId = customerState.split(":")[1];

                await liveChatService.endLiveChat(adminId, null, "User inactive."); 

            } else {
               await chatStateService.cleanupChatState(customerId);
            }
            clients.customerClients.delete(customerId);
            ws.terminate();
        }, 600000);
    }
    resetinActivityTime();

    try {
        const intialState = "main_menu";
        await chatStateService.updateChatState(customerId, intialState);

        let welcome = user ? user.firstName : "our guest";

        ws.send(JSON.stringify({

            message: `welcome ${welcome} to e-book chat-bot, How I can help you?`,
            
            options: ["1. I have a compliant", "2. Following an order", "3. Nominate a book"]
        }));

    } catch (error) {
        console.error("Redis error setting intial state for " + customerId + ":", error)
        if (ws.readyState === ws.OPEN) {
            ws.send(JSON.stringify({ error: "Error, please reconnect!" }));
        }
        clearTimeout(inActivityTime);
        return ws.close();
    }

    ws.on("message", async function (message) {

        resetinActivityTime();
        try {
            const messageString = message.toString();
            const currentState = await chatStateService.getChatState(customerId);

            if (!currentState) {
                if (ws.readyState === ws.OPEN) {
                    ws.send(JSON.stringify({ error: "Your session has ended, please reconnect again" }));
                }
                return ws.close();
            }

            if (currentState.startsWith("in_live_chat_with:")) {
                const targetAdminId = currentState.split(":")[1];
                const targetAdminWs = clients.adminClients.get(targetAdminId);

                if (messageString.trim().toLowerCase() === "/endchat") {
                    console.log(`Customer ${customerId} requested to end chat with ${targetAdminId}`);
                    await liveChatService.endLiveChat(targetAdminId, customerId, "Chat ended by user.");
                }
                else if (targetAdminWs && targetAdminWs.readyState === ws.OPEN) {
                    targetAdminWs.send(JSON.stringify({
                        type: "live_chat_message",
                        sender: "customer",
                        senderName: user?.firstName || `User ${customerId.substring(0,4)}`,
                        message: messageString,
                        data: { customerId: customerId }
                    }));
                } else {
                    console.log(
                        `Cannot proxy message from customer ${customerId}: Admin ${targetAdminId} not found or disconnected.`);

                    if (ws.readyState === ws.OPEN) {
                        ws.send(JSON.stringify({ 
                            error: `Admin is no longer connected. Ending chat.` }
                        ));
                    }
                    await liveChatService.endLiveChat(targetAdminId, customerId);
                }
            }
            else {
                await chatRoutingService.routeCustomerMessage(ws, customerId, messageString, currentState, userRole, user);
            }

        } catch (error) {
            console.error(`Error handling message for ${customerId}:`, error); 
            if (ws.readyState === ws.OPEN) {
                ws.send(JSON.stringify({ 
                    error: "An error has occured during processing your message, please try again!" }
                ));
            }
        }
    });

    ws.on("close", async function () {
        const customerState = await chatStateService.getChatState(customerId);

        clearTimeout(inActivityTime);

        clients.customerClients.delete(customerId);

        console.log(`Customer disconnected: ${customerId}. Total customers: ${clients.customerClients.size}`);

        if (customerState && customerState.startsWith("in_live_chat_with:")) {

            const adminId = customerState.split(":")[1];

            await liveChatService.endLiveChat(adminId, null, "User disconnected.");
        }
        await chatStateService.cleanupChatState(customerId);
    });

    ws.on("error", async function (error) {

        const customerState = await chatStateService.getChatState(customerId);

        clearTimeout(inActivityTime);

        console.error(`Customer websocket error for ${customerId}:`, error); 

        clients.customerClients.delete(customerId);

        if (customerState && customerState.startsWith("in_live_chat_with:")) {

            const adminId = customerState.split(":")[1];

            await liveChatService.endLiveChat(adminId, null, "User connection error.");
        }
        await chatStateService.cleanupChatState(customerId);
    });
}

export default { handleAdminConnection, handleCustomerConnection };