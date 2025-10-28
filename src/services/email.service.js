import transporter from '../../config/mailer.js';

const sendEmail = async (options) => {
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