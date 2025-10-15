import nodemailer from "nodemailer";

const sendEmail = async (options) => {

  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST, 
    port: parseInt(process.env.EMAIL_PORT, 10),
    secure: process.env.EMAIL_PORT === '465',
    auth: {
      user: process.env.EMAIL_USER, 
      pass: process.env.EMAIL_PASS, 
    },
  });

  const mailOptions = {
    from: `"E-Book Store" <${process.env.EMAIL_USER}>`,
    to: options.to,
    subject: options.subject,
    html: options.html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully to ${options.to}`);
    
    if (process.env.NODE_ENV === 'development') {
      console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
    }

  } catch (error) {
    console.error(`Error sending email:`, error);

    throw new Error("Failed to send email.");
  }
};

export default { sendEmail };