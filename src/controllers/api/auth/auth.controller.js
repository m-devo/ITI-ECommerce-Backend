import { User } from "../../../models/users.model.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import {
  sendVerificationEmail,
  sendDeviceVerificationEmail,
} from "../../../utils/sendEmail.js";

// register a new user
const registerUser = async (req, res) => {
  console.log(req);
  const { firstName, lastName, email, password, role } = req.body;
  // if the user already exists check it
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(409).json({
      status: "error",
      message: "User already exists",
    });
  }
  // password hashing
  const hashedPassword = await bcrypt.hash(password, 10);

  // generate verification token
  const verificationToken = crypto.randomBytes(32).toString("hex");
  const expires = Date.now() + 60 * 60 * 1000;

  // create new user
  const newUser = new User({
    firstName,
    lastName,
    email,
    password: hashedPassword,
    role,
    verificationToken,
    verificationTokenExpires: expires,
    isVerified: false,
  });

  await newUser.save();

  try {
    await sendVerificationEmail(email, verificationToken);
    res.status(201).json({
      status: "success",
      message:
        "User registered successfully. Please check your email to verify your account.",
      data: { firstName, lastName, email, role },
    });
  } catch (emailError) {
    await User.findByIdAndDelete(newUser._id);
    return res.status(500).json({
      status: "error",
      message: "Failed to send verification email. Please try again.",
    });
  }
};

// login a user
const loginUser = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    const error = new Error("Email and Password are required");
    error.status = 400;
    throw error;
  }
  const user = await User.findOne({ email });
  if (!user) {
    return res
      .status(400)
      .json({ status: "error", message: "Invalid email or password" });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res
      .status(401)
      .json({ status: "error", message: "Invalid email or password" });
  }

  if (!user.isVerified) {
    return res.status(403).json({
      status: "error",
      message: "Please verify your email before logging in",
    });
  }

  // Check if the user has an active session
  if (user.activeSessionToken) {
    // Generate device verification token
    const deviceToken = crypto.randomBytes(32).toString("hex");
    const deviceTokenExpires = Date.now() + 15 * 60 * 1000; // 15 minutes

    // Store pending device token
    user.pendingDeviceToken = deviceToken;
    user.pendingDeviceTokenExpires = deviceTokenExpires;
    await user.save();

    // Send verification email
    try {
      await sendDeviceVerificationEmail(email, deviceToken);
      return res.status(200).json({
        status: "pending",
        message:
          "You are already logged in from another device. We've sent a verification email to confirm this new login. Please check your email.",
      });
    } catch (emailError) {
      return res.status(500).json({
        status: "error",
        message: "Failed to send verification email. Please try again.",
      });
    }
  }

  // Generate new token
  const token = jwt.sign(
    { email: user.email, id: user._id, role: user.role },
    process.env.JWT_SECRET_KEY,
    { expiresIn: "1h" }
  );

  // Store the active session token
  user.activeSessionToken = token;
  await user.save();

  res.json({ status: "success", data: { email }, token, role: user.role });
};

// verify email
const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    const user = await User.findOne({
      verificationToken: token,
      verificationTokenExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        status: "error",
        message: "Invalid or expired verification token",
      });
    }

    if (user.isVerified) {
      return res.status(400).json({
        status: "error",
        message: "Email already verified",
      });
    }

    user.isVerified = true;
    user.verificationToken = null;
    await user.save();

    res.json({
      status: "success",
      message: "Email verified successfully. You can now login.",
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
};

// verify device login
const verifyDeviceLogin = async (req, res) => {
  try {
    const { token } = req.params;

    const user = await User.findOne({
      pendingDeviceToken: token,
      pendingDeviceTokenExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        status: "error",
        message: "Invalid or expired verification token",
      });
    }

    // Generate new token for the new device
    const newToken = jwt.sign(
      { email: user.email, id: user._id, role: user.role },
      process.env.JWT_SECRET_KEY,
      { expiresIn: "1h" }
    );

    // Clear old session and set new one
    user.activeSessionToken = newToken;
    user.pendingDeviceToken = null;
    user.pendingDeviceTokenExpires = null;
    await user.save();

    res.json({
      status: "success",
      message:
        "Device verified successfully. Your previous session has been terminated.",
      token: newToken,
      data: {
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
};

// logout user
const logoutUser = async (req, res) => {
  try {
    const userId = req.currentUser.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

    // Clear the active session token
    user.activeSessionToken = null;
    await user.save();

    res.json({
      status: "success",
      message: "Logged out successfully",
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
};

export { registerUser, loginUser, verifyEmail, verifyDeviceLogin, logoutUser };
