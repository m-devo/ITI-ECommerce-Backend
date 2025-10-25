import clients from "./chat.clients.js";
import chatStateService from "./chat.state.js";

function sendToAdmins(message) {
    console.log("Sending message to all available admins")

    let sentCount = 0;
    for (const [adminId, ws] of clients.adminClients.entries()) {

        try {
            // Send only to available admins
            chatStateService.getChatState(adminId).then(state => {
                if (state === "admin_available" && ws.readyState === ws.OPEN) {
                    ws.send(JSON.stringify(message));
                    sentCount++;
                }
            }).catch(err => console.error(`Redis error checking admin state for ${adminId} before sending:`, err));

        } catch (error) {
            console.error(`Failed to send message to admin ${adminId}:`, error); 
        }
    }
    console.log(`Sent message to ${sentCount} available admins.`)
}

async function pairAdminAndCustomer(adminId, customerId) {
    const customerWs = clients.customerClients.get(customerId);
    const adminWs = clients.adminClients.get(adminId);

    if (!customerWs || !adminWs) { // Check both

        console.log(`Pairing failed: Admin ${adminId} or Customer ${customerId} not found/disconnected.`);
        if (adminWs && adminWs.readyState === adminWs.OPEN) {
            adminWs.send(JSON.stringify({ 
                type: "pairing_failed", 
                message: `User ${customerId.substring(0, 4)} is no longer available.` }
            ));
        }

        return;
    }

    try {
        const customerState = await chatStateService.getChatState(customerId);
        const adminState = await chatStateService.getChatState(adminId);

        if (customerState !== "live_chat_pending" || adminState !== "admin_available") {

            console.log(`Pairing aborted. Customer state: ${customerState}, Admin state: ${adminState}`);
            if (adminWs.readyState === adminWs.OPEN) {

                adminWs.send(JSON.stringify({ 
                    type: "pairing_failed", 
                    message: `User ${customerId.substring(0, 4)} is no longer waiting or you are not available.` 
                }));
            }
            if (customerState === "live_chat_pending" && customerWs.readyState === customerWs.OPEN) {
                customerWs.send(JSON.stringify({ 
                    type: "pairing_failed", 
                    message: `Could not connect to an admin at this time. Please try again later or register a complaint.`
                }));
                await chatStateService.updateChatState(customerId, "main_menu");
            }
            return;
        }

        if (customerWs.liveChatTimeout) {
            clearTimeout(customerWs.liveChatTimeout);
            delete customerWs.liveChatTimeout;

            console.log(`Cancelled wait timeout for customer ${customerId}`);
        } else {
            console.warn(`Could not find timeout for customer ${customerId} to cancel.`);
        }

        //Make admin busy (before) customer to avoid race condition
        await chatStateService.updateChatState(adminId, `in_live_chat_with:${customerId}`);
        await chatStateService.updateChatState(customerId, `in_live_chat_with:${adminId}`);

        // Use admin name
        const adminName = adminWs.user?.firstName || "Admin";
        if (customerWs.readyState === customerWs.OPEN) {
            customerWs.send(JSON.stringify({
                type: "live_chat_started",
                message: `You are now connected with ${adminName}. Please describe your issue.`
            }));
        }

        if (adminWs.readyState === adminWs.OPEN) {
            adminWs.send(JSON.stringify({
                type: "live_chat_started",
                message: `Connected with customer ${customerWs.user?.firstName || customerId.substring(0, 4)}.`,
                data: { customerId: customerId }
            }));
        }

        console.log(`Successfully paired Admin ${adminId} with Customer ${customerId}`);

    } catch (error) {
        console.error(`Error pairing admin ${adminId} and customer ${customerId}:`, error);
        // Attempt to reset states on error

        const resetTasks = [];
        if (customerId) resetTasks.push(chatStateService.updateChatState(customerId, "main_menu")
        .catch(error => console.error(`Pairing failed:failed to reset customer state to 'main_menu':`, error)));

        if (adminId) resetTasks.push(chatStateService.updateChatState(adminId, "admin_available")
        .catch(error => console.error(`Pairing failed:failed to reset admin state to 'admin_available':`, error)));
        
        await Promise.all(resetTasks);

        if (customerWs && customerWs.readyState === customerWs.OPEN) {
            customerWs.send(JSON.stringify({ 
                error: "Failed to connect to admin due to a technical error. Please try again." }
            ));
        }
        if (adminWs && adminWs.readyState === adminWs.OPEN) {
            adminWs.send(JSON.stringify({ error: `Failed to connect to customer ${customerId} due to a technical error.` }));
        }
    }
}

async function endLiveChat(adminId, customerId, endMessage = "Chat ended.") {
    console.log(`Trying to end live chat between Admin: ${adminId} and Customer: ${customerId}`);
    let resetTasks = [];

    if (customerId) {
        const customerWs = clients.customerClients.get(customerId);

        if (customerWs && customerWs.readyState === customerWs.OPEN) {

            customerWs.send(JSON.stringify({ type: "live_chat_ended", message: endMessage }));

            if(customerWs.liveChatTimeout) clearTimeout(customerWs.liveChatTimeout);
        }
        resetTasks.push(chatStateService.updateChatState(customerId, "main_menu"))

        if (customerWs && customerWs.readyState === customerWs.OPEN) {

            setTimeout(() => {

                if(customerWs.readyState === customerWs.OPEN) {

                    customerWs.send(JSON.stringify({

                        message: "How else can I help you?",
                        options: ["1. I have a compliant", "2. Following an order", "3. Nominate a book"]
                    }));
                }
            }, 300); 
        }
    }

    if (adminId) {
        const adminWs = clients.adminClients.get(adminId);

        if (adminWs && adminWs.readyState === adminWs.OPEN) {

            adminWs.send(JSON.stringify({ 
                type: "live_chat_ended", 
                message: `Chat with ${customerId ? customerId.substring(0,4) : "user"} ended.` }
            ));
        }
        resetTasks.push(chatStateService.updateChatState(adminId, "admin_available"));
    }

    try {
        await Promise.all(resetTasks)

        console.log(`Successfully ended chat and cleaned states for Admin: ${adminId}, Customer: ${customerId}`);
    } catch (error) {

        console.error(`Error during live chat cleanup for Admin: ${adminId}, Customer: ${customerId}:`, error);
    }
}


export default { sendToAdmins, pairAdminAndCustomer, endLiveChat };