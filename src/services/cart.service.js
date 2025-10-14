import { Cart } from "../models/carts.model.js";
import emailService from "./email.service.js";

const AbandonedCartReminder = async () => {
    console.log("Starting Cron Job 4 - cart reminder loading...");

    try {
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const fourDaysAgo = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000);

        const abandonedCarts = await Cart.find({
            cartItems: { $exists: true, $ne: [] },
            reminderSent: false,
            lastUpdateAt: { $gte: fourDaysAgo, $lt: oneDayAgo }
        }).populate("user", "firstName email").populate("cartItems.book");

        if (abandonedCarts.length === 0) {
            console.log("No abandoned carts to remind.");
            return;
        }

        console.log(`Found ${abandonedCarts.length} abandoned carts. Sending reminders...`);

        for (const abandonedCart of abandonedCarts) {
            if (!abandonedCart.user) {
                console.log(`Skipping cart ${abandonedCart._id} because its user no longer exists.`);
                continue; 
            }
            const validCartItems = abandonedCart.cartItems.filter(item => item.book !== null);

            if (validCartItems.length === 0) {
                console.log(`Skipping cart ${abandonedCart._id} for user ${abandonedCart.user.email} because its books no longer exist.`);
                continue;
            }
    
            const header = "You left something in your cart! 🛒";
            const cartItemsHtml = abandonedCart.cartItems.map(item =>
                `<li><b>${item.book.title}</b> - Price: ${item.book.price} EGP</li>`
            ).join("");

            const emailBody = `
                <h1>Hello frined ${abandonedCart.user.firstName},</h1>
                <p>We noticed you left some items in your shopping cart. Don't miss out!</p>
                <ul>
                    ${cartItemsHtml}
                </ul>
                <p>Complete your purchase now!</p>
                <a href="${process.env.FRONTEND_URL}/cart" style="padding: 10px 15px; background-color: #007bff; 
                color: white; text-decoration: none; border-radius: 5px;">
                Proceed to Cart
                </a>
                <br><br>
                <p>Book Store Team</p>
            `;

            await emailService.sendEmail({
                to: abandonedCart.user.email,
                subject: header,
                html: emailBody
            });

            abandonedCart.reminderSent = true;
            await abandonedCart.save();
        }
        console.log("Abandoned cart reminders sent successfully.");
    } catch (error) {
        console.error("Error in AbandonedCartReminder job:", error);
    }
};

export default { AbandonedCartReminder };