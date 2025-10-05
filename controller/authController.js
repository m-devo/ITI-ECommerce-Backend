import { User } from "../models/users.model.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { sendVerificationEmail } from "../utils/sendEmail.js";

const getUsers = async (req, res) => {
  try {
    const query = req.query;
    const limit = query.limit ? parseInt(query.limit) : 2;
    const page = query.page ? parseInt(query.page) : 1;
    const users = await User.find({}, { __v: 0, password: 0 })
      .limit(limit)
      .skip((page - 1) * limit);
    res.json({ status: "success", data: { users } });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
};

// register a new user
const registerUser = async (req, res) => {
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
  const token = jwt.sign(
    { email: user.email, id: user._id, role: user.role },
    process.env.JWT_SECRET_KEY,
    { expiresIn: "1h" }
  );
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

export { getUsers, registerUser, loginUser, verifyEmail };
