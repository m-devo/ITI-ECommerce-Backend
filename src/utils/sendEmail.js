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
