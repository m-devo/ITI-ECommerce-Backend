import { User } from "../models/users.model.js";
import  Book  from "../models/bookSchema.js";
import { Order } from "../models/orders.model.js";
import emailService from "./email.service.js";

 const sendWeeklyNewsService = async function () {
    console.log("Starting weekly news service...");
    try {
        const subscribers = await User.find({ isSubscribedToNewsService: true }, "firstName email");

        if (subscribers.length === 0) {
            console.log("No one has subscribed to the newsletter service.");
            return;
        }
        
        console.log(`There are ${subscribers.length} users subscribed, loading content...`);

        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

        const [latestBooks, bestsellers] = await Promise.all([
            Book.find({ createdAt: { $gte: sevenDaysAgo } })
                .sort({ createdAt: -1 })
                .limit(5),

            Order.aggregate([
                {
                    $match: {
                        createdAt: { $gte: sevenDaysAgo }, 
                        status: { $in: ["paid", "delivered"] }
                    },
                },
                { $unwind: "$books" },
                {
                    $group: {
                        _id: "$books.book",
                        unitsSold: { $sum: "$books.quantity" }
                    }
                },
                { $sort: { unitsSold: -1 } },
                { $limit: 3 },
                {
                    $lookup: {
                        from: 'books',
                        localField: '_id',
                        foreignField: '_id',
                        as: 'bookDetails'
                    }
                },
                { $unwind: '$bookDetails' }
            ])
        ]);

        if (latestBooks.length === 0 && bestsellers.length === 0) {
            console.log("No new content to send this week.");
            return;
        }

        const header = "E-Book Store Weekly News >>> Discover More...";

        const bestsellersHtml = bestsellers.length > 0 ? `
            <h2 style="color:#cc3333; font-family:Arial, sans-serif; margin-bottom:10px;">
            🔥 Bestsellers This Week
            </h2>
            <ul style="padding:0; list-style:none; font-family:Arial, sans-serif; color:#333;">
            ${bestsellers.map((item) => `
                <li style="margin-bottom:6px; background:#f1f1f1; padding:8px 12px; border-radius:6px;">
                <b>${item.bookDetails.title}</b>
                </li>`).join('')}
            </ul>` : "";

        const latestBooksHtml = latestBooks.length > 0 ? `
            <h2 style="color:#1d3557; font-family:Arial, sans-serif; margin-bottom:10px;">
            🚀 New Arrivals
            </h2>
            <ul style="padding:0; list-style:none; font-family:Arial, sans-serif; color:#333;">
            ${latestBooks.map(book => `
                <li style="margin-bottom:6px; background:#e9ecef; padding:8px 12px; border-radius:6px;">
                <b>${book.title}</b>
                </li>`).join('')}
            </ul>` : "";

        for (const subscriber of subscribers) {
            const emailMainBody = `
                <h1>Welcome ${subscriber.firstName},</h1>
                <h3>This is our latest for this week. We hope you'll pay us a visit!</h3>
                ${bestsellersHtml}
                ${latestBooksHtml}
            `;

            await emailService.sendEmail({
                to: subscriber.email,
                subject: header,
                html: emailMainBody
            });
        }
        console.log("Weekly newsletter sent successfully.");

    } catch (error) {
        console.error("Error from weekly news service:", error);
    }
}

export default sendWeeklyNewsService;