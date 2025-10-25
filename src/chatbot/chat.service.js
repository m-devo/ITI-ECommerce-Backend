import { WebSocketServer } from "ws";
import { v4 as uuidv4 } from "uuid";
import { URL } from "url";
import verifyUserWS from "./WSAuth.service.js";

import clients from "./chat.clients.js";
import chatStateService from "./chat.state.js";
import chatHandlerService from "./chat.handlers.js";
import liveChatService from "./chat.livechat.js";


function initializeChat(httpServer) {
    const wss = new WebSocketServer({ server: httpServer });

    wss.on("connection", async (ws, req) => {
        ws.isAlive = true;
        ws.on("pong", function () { ws.isAlive = true; });

        try {
            const fullUrl = new URL(req.url, `http://${req.headers.host}`);
            const roleParam = fullUrl.searchParams.get("role");
            const token = fullUrl.searchParams.get("token");

            let clientId;
            let userRole = "guest";
            let user = null;

            if(token) {
                try {
                    user = await verifyUserWS(token);
                    clientId = user._id.toString();
                    userRole = user.role;
                    
                    console.log(`Authenticated user connected: ${user.email} (Role: ${userRole})`);
                } catch (error) {

                    ws.send(JSON.stringify({
                        error: `Authentication failed: ${error.message}`
                    })); 

                    return ws.terminate();
                }
            } else {
                clientId = uuidv4();
                console.log(`Guest user connected: ${clientId}`)
            }

            ws.clientId = clientId
            ws.userRole = userRole
            ws.user = user // storing the ful user objeclt

            if (userRole === "admin" && roleParam === "admin") {

                chatHandlerService.handleAdminConnection(ws, clientId, user) // passing the user object
            } else {

                chatHandlerService.handleCustomerConnection(ws, clientId, userRole, user)
            }

        } catch (error) {

            console.error(`Failed to handle new connection:`, error)
            ws.close()
        }
    });

    const interval = setInterval(function () {

        wss.clients.forEach(function each(ws) {

            if (ws.isAlive === false) {
                console.log(`Client ${ws.clientId || "Not Known"} is dead (no pong), terminating...`)
                if (ws.clientId) {

                    // Decide cleanup based on role if known
                    const cleanupRole = ws.userRole === "admin" ? clients.adminClients : clients.customerClients;

                    cleanupRole.delete(ws.clientId)

                    chatStateService.cleanupChatState(ws.clientId).catch(err => console.error("Error cleaning up state on terminate:", err))
                }
                return ws.terminate();
            }
            ws.isAlive = false
            ws.ping()

        });
    }, 30000)

    wss.on("close", function () {
        clearInterval(interval)
    })

    console.log(`✅ Web Socket Server is Runnig Prefectly :) `);
}

const sendToAdmins = liveChatService.sendToAdmins;

export default { initializeChat, sendToAdmins };