import nodemailer from "nodemailer";


export const sendVerificationEmail = async (email, token) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const verificationLink = `${process.env.BASE_URL}/api/auth/verify/${token}`;

  const mailOptions = {
    from: `"Your Favorite Book Store Website" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Verify your email address",
    html: `
      <h3>Email Verification</h3>
      <p>Please click the link below to verify your email:</p>
      <a href="${verificationLink}">${verificationLink}</a>
      <p>This link will expire in 1 hour.</p>
    `,
  };

  await transporter.sendMail(mailOptions);
};

export const sendDeviceVerificationEmail = async (email, token) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const verificationLink = `${process.env.BASE_URL}/api/auth/verify-device/${token}`;

  const mailOptions = {
    from: `"Your Favorite Book Store Website" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "New Device Login Attempt",
    html: `
      <h3>New Device Login Detected</h3>
      <p>We detected a login attempt from a new device.</p>
      <p>If this was you, please click the link below to verify and login from this device:</p>
      <a href="${verificationLink}">${verificationLink}</a>
      <p><strong>This will logout your previous session and create a new one on this device.</strong></p>
      <p>This link will expire in 15 minutes.</p>
      <p>If you did not attempt to login, please ignore this email and change your password immediately.</p>
    `,
  };

  await transporter.sendMail(mailOptions);
};

export const sendPasswordResetEmail = async (email, token) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const resetLink = `${process.env.BASE_URL}/api/auth/reset-password/${token}`;

  const mailOptions = {
    from: `"Your Favorite Book Store Website" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Password Reset Request",
    html: `
      <h3>Password Reset</h3>
      <p>You requested a password reset for your account.</p>
      <p>Please click the link below to reset your password:</p>
      <a href="${resetLink}">${resetLink}</a>
      <p>This link will expire in 1 hour.</p>
      <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>
    `,
  };

  await transporter.sendMail(mailOptions);
};

export const sendAccountDeleteEmail = async (email, reason) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: `"Your Favorite Book Store Website" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Your Account Has Been Deleted",
    html: `
      <h3>Account Deletion Notice</h3>
      <p>Dear user,</p>
      <p>We regret to inform you that your account has been permanently deleted due to the following reason:</p>
      <blockquote>${reason || "Violation of our terms of service."}</blockquote>
      <p>If you believe this was a mistake, please contact our support team.</p>
      <p>Thank you for your understanding.</p>
      <br>
      <p>— The Book Store Team</p>
    `,
  };

  await transporter.sendMail(mailOptions);
};

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendLowStockEmail = async (productName, quantity) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER,
      subject: `Low Stock Alert: ${productName}`,
      text: `The stock for "${productName}" is running low. Remaining quantity: ${quantity}. Please restock soon.`,
    };

    await transporter.sendMail(mailOptions);
    console.log(` Low stock email sent for ${productName}`);
  } catch (error) {
    console.error(`Failed to send low stock email for ${productName}:`, error.message);
  }
};
