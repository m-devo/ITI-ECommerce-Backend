import clients from "./chat.clients.js";

function notifyUserAboutReply(customerId, replyMessage, complaintId = null) {

    const customerWs = clients.customerClients.get(customerId); 

    if (customerWs && customerWs.readyState === customerWs.OPEN) {

        console.log(`Sending live reply notification to customer ${customerId}`);
        
        try {
            customerWs.send(JSON.stringify({

                type: "new_reply",
                message: `New reply for your complaint ${complaintId ? ` No. ${complaintId.slice(-6)}` : ""}:`,
                replyContent: replyMessage,
                timestamp: new Date().toISOString()

            }));
            return true;
        } catch (error) {
            console.error(`Failed to send reply notification to ${customerId}:`, error);
            return false;
        }
    } else {
        console.log(`Customer ${customerId} is not connected. Reply saved but not live.`);
        return false;
    }
}

export default notifyUserAboutReply;