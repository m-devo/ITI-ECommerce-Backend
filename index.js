import express from "express";
import userRouter from "./routes/user.route.js";
import { mongoose } from "mongoose";
import dotenv from "dotenv";

dotenv.config();

mongoose.connect(process.env.MONGO_URL).then(() => {
  console.log("MongoDB connected to database:", mongoose.connection.name);
});
const app = express();
app.use(express.json());

app.use(userRouter);
const db = mongoose.connection;

app.listen(process.env.PORT, () => {
  console.log(`Server is running on http://localhost:${process.env.PORT}`);
});
