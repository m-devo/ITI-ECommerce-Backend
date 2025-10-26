import mongoose from "mongoose";
import { Order } from "../models/orders.model.js";
import { Complaint } from "../models/complaints.model.js";
import Book from "../models/bookSchema.js";

import chatStateService from "./chat.state.js";
import liveChatService from "./chat.livechat.js";
import clients from "./chat.clients.js";


async function routeCustomerMessage(ws, customerId, message, currentState, userRole, user) {
    console.log(`Routing message: "${message}" | for state: "${currentState}" | UserRole: ${userRole}`);
    const cleanMessage = message.toString().trim();

    if (currentState === "main_menu") {
        const comparison = cleanMessage.match(/^(\d)/);
        if (comparison) {
            const selection = comparison[1];

            if (selection === "1") {
                await chatStateService.updateChatState(customerId, "complaint_options");

                ws.send(JSON.stringify({

                    message: "Sorry to hear that. Do you like:",
                    options: ["1. Contact us directly?", "2. Register a complaint?"]
                }));
            } else if (selection === "2") {
                await chatStateService.updateChatState(customerId, "awaiting_order_id");
                ws.send(JSON.stringify({ message: "Sure, please enter your order ID" }));

            } else if (selection === "3") {
                await chatStateService.updateChatState(customerId, "awaiting_nomination_criteria");
                
                ws.send(JSON.stringify({
                    message: "OK, what kind of book do you like? (Fantasy, Science Fiction, etc...) Write a keyword."
                }));
            } else {
                ws.send(JSON.stringify({
                    message: "Sorry, I can't process this. Please choose (1), (2), or (3).",
                    options: ["1. I have a complaint", "2. Following an order", "3. Nominate a book"]
                }));
            }
        }
    }

    else if (currentState === "awaiting_nomination_criteria") {
        const criteria = cleanMessage;
        console.log(`Searching books for criteria: "${criteria}" for user ${customerId}`);

        try {
            const books = await Book.find({
                $or: [
                    { title: { $regex: criteria, $options: "i" } },
                    { category: { $regex: criteria, $options: "i" } },
                    { author: { $regex: criteria, $options: "i" } }
                ]
            }).limit(5).select("title author");

            if (!books || books.length === 0) {
                ws.send(JSON.stringify({ message: `Sorry, we couldn't find any matching books "${criteria}".` }));
            } else {
                const bookList = books.map(book => `${book.title} — ${book.author}`);
                ws.send(JSON.stringify({
                    message: `We found these books matching "${criteria}":\n${bookList.join("\n")}`
                }));
            }

            await chatStateService.updateChatState(customerId, "main_menu");

            setTimeout(() => {
                if (ws.readyState === ws.OPEN) {
                    ws.send(JSON.stringify({
                        message: "Can we help you with anything else?",
                        options: ["1. I have a complaint", "2. Following an order", "3. Nominate a book"]
                    }));
                }
            }, 500);

        } catch (error) {
            console.error(`Error while searching for book "${criteria}"`, error);
            ws.send(JSON.stringify({ error: "An error occurred. Please try again later." }));
            await chatStateService.updateChatState(customerId, "main_menu");
        }
    }
    /**************************complaint_options ***********************/
    else if (currentState === "complaint_options") {

        //Prevent Guests from requesting live chat
        if (userRole === 'guest' && cleanMessage.match(/^1/)) {
            ws.send(JSON.stringify({ message: "Sorry, live chat is available for registered users only. You can register a complaint instead.", options: ["2. Register a compliant?"] }));
            
             return; // option 1
        }

        const comparison = cleanMessage.match(/^(\d)/);
        let selection = comparison ? comparison[1] : null;

        if (selection === "1") { // Request Live Chat can be reached only if guest

            //Check Redis state for available admins
            let availableAdmins = false;

            for (const adminId of clients.adminClients.keys()) {

                const adminState = await chatStateService.getChatState(adminId);
                if (adminState === "admin_available") {
                    availableAdmins = true;
                    break;
                }
            }

            if (!availableAdmins) {
                ws.send(JSON.stringify(
                    { message: "Sorry, customer service is not available now." }
                ));
                await chatStateService.updateChatState(customerId, "awaiting_compliant_details");

                ws.send(JSON.stringify(
                    { message: "Please write your compliant and we will contact you later." }
                ));
            } else {
                await chatStateService.updateChatState(customerId, "live_chat_pending");

                ws.send(JSON.stringify(
                    { message: "Processing your request to customer service, please wait!" }

                ));
                const customerName = user ? user.firstName : `Customer ${customerId.substring(0, 4)}`;

                // Send only to available admins
                liveChatService.sendToAdmins({ 
                    type: "new_chat_request", 
                    data: { customerId: customerId, customerName: customerName } 
                });

                ws.liveChatTimeout = setTimeout(async () => {
                    try {
                        const latestState = await chatStateService.getChatState(customerId);

                        if (latestState === "live_chat_pending") {

                            console.log(`Live chat request for ${customerId} timed out.`);
                            await chatStateService.updateChatState(customerId, "awaiting_compliant_details");

                            if(ws.readyState === ws.OPEN) {

                                ws.send(JSON.stringify({ 
                                    message: "Sorry, all customer service agents seem busy right now." }
                                ));
                                await new Promise(resolve => setTimeout(resolve, 300)); 
                                ws.send(JSON.stringify({ 
                                    message: "Please write your compliant and we will contact you later." }
                                ));
                            }
                        }
                    } catch (err) {
                        console.error("Error during live chat timeout check:", err);
                    }
                }, 60000);
            }
        } else if (selection === "2") { // Register Complaint
            await chatStateService.updateChatState(customerId, "awaiting_compliant_details");

            ws.send(JSON.stringify({ 
                message: "Excellent, please write your compliant to process" }
            ));

        } else { // Invalid selection

            ws.send(JSON.stringify({ 
                message: "Sorry, i can't process your message, please choose:", 
                options: ["1. Contact us directly?", "2. Register a compliant?"] 
            }));
        }
    }
    // State: awaiting_order_id
    else if (currentState === "awaiting_order_id") {
        const orderId = cleanMessage;
        let orderResultResponse = null;
        try {
            if (userRole === "guest") {
                orderResultResponse = { 
                    message: "This service is for only registered customers please login or register first" 
                };
            } else if (!mongoose.Types.ObjectId.isValid(orderId)) {

                orderResultResponse = { 
                    message: `This orderId: ${orderId} is not correct please write the correct one` 
                };
            } else {
                const order = await Order.findOne({ _id: orderId, user: customerId });
                if (!order) {
                    orderResultResponse = { 
                        message: `Sorry i haven't found any order with this id ${orderId} in your account` 
                    };
                } else {
                orderResultResponse = { 
                message: `Order Status: ${order.status}, Payment Method: ${order.paymentMethod}, Total: ${order.totalPrice}` };
                }
            }
        } catch (error) {
            console.error("Error cannot fetch the order from database for user " + customerId + ":", error); 
            orderResultResponse = { error: "Technical error, please try again" };
        }
        await chatStateService.updateChatState(customerId, "main_menu");
        if (orderResultResponse) {
            ws.send(JSON.stringify(orderResultResponse));
        }
        setTimeout(() => {
            if(ws.readyState === ws.OPEN){
                ws.send(JSON.stringify({ 
                    message: "Can i help u in any other thing?", 
                    options: ["1. I have a compliant", "2. Following an order", "3. Nominate a book"] }
                ));
            }
        }, 500); 
    }

    //State: awaiting_compliant_details
    else if (currentState === "awaiting_compliant_details") {
        const complaintDetails = cleanMessage;

        let complaintResultResponse = null;
        let shouldGoToMainMenu = false;

        if (userRole === "guest") {

            complaintResultResponse = {message: `Please login to use this service.`};
            await chatStateService.updateChatState(customerId, "main_menu");

            shouldGoToMainMenu = true;
        } else {
            console.log(`New complaint from ${customerId} (${user?.email}): ${complaintDetails}`); // Add email if available
            try {
                await Complaint.create({ 
                    user: customerId, 
                    details: complaintDetails, 
                    status: "new" 
                });

                liveChatService.sendToAdmins({ 
                    type: "new complaint", 
                    data: 
                    { 
                        customerId: customerId, 
                        userEmail: user?.email, 
                        details: complaintDetails, 
                        timestamp: new Date().toISOString() 
                    }
                    })
                complaintResultResponse = { 
                    message: "Your compliant has been recieved successfully, we will contact you soon." };

                await chatStateService.updateChatState(customerId, "main_menu");

                shouldGoToMainMenu = true;
            } catch (error) {

                console.error("Error cannot save the complaint in database for user " + customerId + ":", error); 
                complaintResultResponse = { 
                    error: "Technical error occured while saving your complaint, please try again" 
                };
            }
        }
        if (complaintResultResponse) {
            ws.send(JSON.stringify(complaintResultResponse));
        }
        if (shouldGoToMainMenu) {
            setTimeout(() => {
                if(ws.readyState === ws.OPEN){
                    ws.send(JSON.stringify({ 
                        message: "Can I help you in any other thing?", 
                        options: ["1. I have a compliant", "2. Following an order", "3. Nominate a book"] 
                    }));
                }
            }, 500); 
        }
    }


    // State: awaiting_book_nomination 
    else if(currentState === "awaiting_book_nomination") {

        ws.send(JSON.stringify({ 
            message: `Thanks for searching for book related to "${cleanMessage}" (Feature coming soon)` 
        }));

        await chatStateService.updateChatState(customerId, "main_menu");
        setTimeout(() => {
            if(ws.readyState === ws.OPEN){
                ws.send(JSON.stringify({ 
                    message: "Can I help you in any other thing?", 
                    options: ["1. I have a compliant", "2. Following an order", "3. Nominate a book"] 
                }));
            }
        }, 500); 
    }
    //State: live_chat_pending
    else if (currentState === "live_chat_pending") {
        // User sent a message while waiting for an admin

        ws.send(JSON.stringify({
            message: "Please wait while we connect you to an admin..."
        }));
    }
    else if (!currentState.startsWith('in_live_chat_with:')) {

        console.warn(`Unhandled state "${currentState}" for customer ${customerId}`);
        await chatStateService.updateChatState(customerId, "main_menu");

        ws.send(JSON.stringify({
            message: "Sorry, something went wrong. Let's start over. How can I help?", 
            options: ["1. I have a compliant", "2. Following an order", "3. Nominate a book"] 
        }));
    }
}

export default {routeCustomerMessage};