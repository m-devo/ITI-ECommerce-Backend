import jwt from "jsonwebtoken";
import { User } from "../models/users.model.js";

const verifyToken = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      status: "fail",
      message: "Access denied. No token provided.",
    });
  }

  try {
    const currentUser = jwt.verify(token, process.env.JWT_SECRET_KEY);

    // Check if the token matches the active session token in the database
    const user = await User.findById(currentUser.id);
    if (!user) {
      return res.status(401).json({
        status: "fail",
        message: "User not found",
      });
    }

    if (user.activeSessionToken !== token) {
      return res.status(401).json({
        status: "fail",
        message:
          "Session expired or invalid. You have logged in from another device.",
      });
    }

    req.currentUser = currentUser;
    next();
  } catch (err) {
    return res.status(403).json({
      status: "fail",
      message: "Invalid token",
    });
  }
};

export { verifyToken };
