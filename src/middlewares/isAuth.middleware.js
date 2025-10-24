import jwt from "jsonwebtoken";
import { User } from "../models/users.model.js";
import ApiError from "../utils/ApiError.js";

const isAuth = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    const error = new ApiError(401, "Access denied. No token provided.");
    return next(error);
  }

  try {
    const currentUser = jwt.verify(token, process.env.JWT_SECRET_KEY);

    // Check if the token matches the active session token in the database
    const user = await User.findById(currentUser.id);
    if (!user) {
      const error = new ApiError(401, "User not found");
      return next(error);
    }

    if (user.activeSessionToken !== token) {
      const error = new ApiError(401, "Session expired or invalid. You have logged in from another device.");
      return next(error);
    }

    req.currentUser = currentUser;
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      const error = new ApiError(401, "Token has expired. Please login again.");
      return next(error);
    } else if (err.name === "JsonWebTokenError") {
      const error = new ApiError(403, "Invalid token. Please login again.");
      return next(error);
    } else {
      const error = new ApiError(403, "Authentication failed.");
      return next(error);
    }
  }
};

export { isAuth };