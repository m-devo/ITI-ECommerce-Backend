import "dotenv/config";
import express from "express";
import connectDB from "./config/db.js";
import { connectRabbitMQ } from "./config/rabbitmq.js";
import redisClient, { redisConnection } from "./config/redis.js";
import mongoose from "mongoose";
import passport from "./config/passport.js";
import { isAuth } from "./src/middlewares/isAuth.middleware.js";
import errorHandler from "./src/middlewares/error.middleware.js";
import orderRouter from "./src/routes/order.route.js";
import userRoutes from "./src/routes/user.routes.js";
import authRouter from "./src/routes/auth.route.js";
import reportRouter from "./src/routes/report.routes.js";
import featuresRouter from "./src/routes/features.routes.js";
import newsRouter from "./src/routes/news.route.js";
import cartRouter from "./src/routes/cart.routes.js";
import checkoutRouter from "./src/routes/checkout.routes.js";
import { createRateLimiter } from "./src/middlewares/rateLimit.middleware.js";
import complaintsRouter from "./src/routes/complaints.routes.js";
import publicRouter from "./src/routes/booksUser.route.js";
import authorRouter from "./src/routes/authorrequest.route.js";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./docs/swagger.js";
import searchRoutes from "./src/routes/fullTextSearch.route.js";
import bookRouter from "./src/routes/book.route.js";
import userProfileRouter from "./src/routes/userProfile.route.js";
import path from "path";
import "./src/services/stock.service.js";

import "./src/jobs/dailySalesReport.job.js";
import "./src/jobs/updateBookOftheDay.js";
import "./src/jobs/weeklyNews.job.js";
import "./src/jobs/abandonedCart.job.js";
import reviewRoutes from "./src/routes/review.routes.js";
import startOrdersReconciliationCron from "./src/jobs/order-reconciliation.js";
import { consumeEmailQueue } from "./src/utils/orderEmailQueue.js";
import { fileURLToPath } from "url";
/***************Web Socket*************/
import http from "http";
import chatService from "./src/chatbot/chat.service.js";
/***************Web Socket*************/

const app = express();
const PORT = process.env.PORT || 4000;
connectDB();
redisConnection(); // opening redis connection

await connectRabbitMQ();
await consumeEmailQueue();

startOrdersReconciliationCron();

app.set("trust proxy", 1);

const allowedOrigins = [
  'http://localhost:4200',
  process.env.FRONTEND_URL
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1 || origin === process.env.FRONTEND_URL) {
      callback(null, true);
    } else {
      console.log('Blocked Origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

const apiLimiter = createRateLimiter();
app.use("/api", apiLimiter);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.urlencoded({ extended: true }));
app.use(
  "/api/public/images",
  express.static(path.join(__dirname, "public/images"))
);
app.use(express.json());

// Initialize Passport
app.use(passport.initialize());

// auth routes
app.use("/api/auth", authRouter);
// review routes
app.use("/api/reviews", reviewRoutes);

// #todo check is admin middleware
app.use("/api/admin/users", userRoutes);
// book routes
app.use("/api/admin/book", bookRouter);
app.use("/api/admin/order", orderRouter);

app.use("/api/public", publicRouter);
app.use("/api", authorRouter);
//daily report***
app.use("/api/reports", reportRouter);

//GET Book of the Day***
// POST Book of the Day By Admin
app.use("/api/features", featuresRouter);

app.use("/api/news", newsRouter);

app.use("/api/user", isAuth, userProfileRouter);
app.use("/api/cart", isAuth, cartRouter);

app.use("/api/checkout", checkoutRouter);

app.use("/api/complaints/", complaintsRouter);

app.use("/api/search", searchRoutes);

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

////////////////////////////////////////////////////////////////////////////////////////

app.get("/", (req, res) => res.send("Bookstore Search API Running..."));

// app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`))

app.use((req, res, next) => {
  return res.status(404).json({
    status: "fail",
    message: "Route is not found",
  });
});

app.use(errorHandler);

/***************Web Socket*************/
const server = http.createServer(app);
chatService.initializeChat(server);
/***************Web Socket*************/

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

async function softShutdown() {
  console.log("Received kill signal");

  server.close(async () => {
    console.log("HTTP server closed.");

    try {
      //close mongo connection
      await mongoose.connection.close();
      console.log("MongoDB connection closed.");

      //check then clse regis conetion
      if (redisClient && redisClient.isOpen) {
        await redisClient.quit();
        console.log("Redis connection closed.");
      }

      console.log("All connections closed. Exiting process.");
      process.exit(0);
    } catch (error) {
      console.error("Error during so shutdown:", error);
      process.exit(1);
    }
  });

  setTimeout(() => {
    console.error("Closing connection after 10s if couldn't");
    process.exit(1);
  }, 10000);
}

process.once("SIGUSR2", softShutdown);
process.on("SIGINT", softShutdown);
process.on("SIGTERM", softShutdown);
