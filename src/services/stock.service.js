import cron from "node-cron";
import Book from "../models/bookSchema.js";
import { sendLowStockEmail } from "./../utils/sendEmail.js";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

const checkLowStock = async () => {
    const lowStockBooks = await Book.find({ stock: { $lte: 5 } });

    if (lowStockBooks.length > 0) {
        const bookList = lowStockBooks
            .map((b) => `<li>${b.title} - ${b.stock} left</li>`)
            .join("");

        const mailOptions = {
            from: `"Book Store" <${process.env.EMAIL_USER}>`,
            to: process.env.EMAIL_USER,
            subject: "Low Stock Alert",
            html: `
        <h3 style="color:red;">Low Stock Alert</h3>
        <p>The following books are running low on stock:</p>
        <ul>${bookList}</ul>
        <p>Please restock soon.</p>
      `,
        };

        await transporter.sendMail(mailOptions);
        console.log(" Low stock alert sent to admin");
    } else {
        console.log("All stock levels are fine");
    }
};
// display message

// checkLowStock();

cron.schedule("0 * * * *", async () => {
    console.log("Running hourly stock check...");
    await checkLowStock();
});

