import nodemailer from "nodemailer";

// Configure email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail', // Ama isticmaal email service kale
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendPasswordResetEmail = async (email, resetToken) => {
  const resetURL = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
  
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Password Reset Request",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Password Reset Request</h2>
        <p>You requested to reset your password. Click the link below to reset it:</p>
        <a href="${resetURL}" 
           style="background-color: #007bff; color: white; padding: 10px 20px; 
                  text-decoration: none; border-radius: 5px; display: inline-block;">
          Reset Password
        </a>
        <p style="margin-top: 20px; color: #666;">
          This link will expire in 10 minutes. If you didn't request this, please ignore this email.
        </p>
        <p>If the button doesn't work, copy and paste this link in your browser:</p>
        <p>${resetURL}</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Password reset email sent to: ${email}`);
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error("Email sending failed");
  }
};