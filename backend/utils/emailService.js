const nodemailer = require("nodemailer");
const crypto = require("crypto");

// Create email transporter
const createTransporter = () => {
  return nodemailer.createTransporter({
    service: process.env.EMAIL_SERVICE || "gmail",
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT || 587,
    secure: process.env.EMAIL_SECURE === "true",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
};

// Generate verification token
const generateVerificationToken = () => {
  return crypto.randomBytes(32).toString("hex");
};

// Send verification email
const sendVerificationEmail = async (vendor, token) => {
  const transporter = createTransporter();

  const verificationUrl = `${process.env.BASE_URL}/verify-email?token=${token}&email=${vendor.email}`;

  const mailOptions = {
    from: `${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_FROM_ADDRESS}>`,
    to: vendor.email,
    subject: "Verify Your QOOA Vendor Account",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #059669, #047857); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; padding: 15px 30px; background: #047857; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🍅 Welcome to QOOA!</h1>
          </div>
          <div class="content">
            <h2>Hello ${vendor.vendorName},</h2>
            <p>Thank you for registering with QOOA - Quality Out Of Africa. We're excited to have you join our network of vendors!</p>
            
            <p>To complete your registration and start ordering fresh tomatoes, please verify your email address by clicking the button below:</p>
            
            <div style="text-align: center;">
              <a href="${verificationUrl}" class="button">Verify Email Address</a>
            </div>
            
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #047857;">${verificationUrl}</p>
            
            <p><strong>Your Account Details:</strong></p>
            <ul>
              <li>Vendor ID: ${vendor.vendorId}</li>
              <li>Market: ${vendor.marketCluster}</li>
              <li>Stall: ${vendor.stallNumber}</li>
            </ul>
            
            <p>This verification link will expire in 24 hours.</p>
            
            <p>If you didn't create this account, please ignore this email.</p>
            
            <p>Best regards,<br>The QOOA Team</p>
          </div>
          <div class="footer">
            <p>QOOA - Fresh Tomatoes, Fair Prices</p>
            <p>This is an automated email. Please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Verification email sent to ${vendor.email}`);
    return true;
  } catch (error) {
    console.error("Error sending verification email:", error);
    throw error;
  }
};

// Send order confirmation email
const sendOrderConfirmationEmail = async (vendor, order) => {
  if (!vendor.email || !vendor.emailVerified) return;

  const transporter = createTransporter();

  const mailOptions = {
    from: `${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_FROM_ADDRESS}>`,
    to: vendor.email,
    subject: `Order Confirmed - ${order.orderId}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #047857; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #fff; padding: 30px; border: 1px solid #e5e7eb; border-radius: 0 0 8px 8px; }
          .order-details { background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
          .total-row { font-size: 18px; font-weight: bold; border-top: 2px solid #047857; margin-top: 10px; padding-top: 15px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Order Confirmed!</h1>
          </div>
          <div class="content">
            <h2>Hi ${vendor.vendorName},</h2>
            <p>Your order has been confirmed and is being prepared for delivery.</p>
            
            <div class="order-details">
              <h3>Order Details</h3>
              <div class="detail-row">
                <span>Order ID:</span>
                <strong>${order.orderId}</strong>
              </div>
              <div class="detail-row">
                <span>Quantity:</span>
                <strong>${order.crateQuantity} crates</strong>
              </div>
              <div class="detail-row">
                <span>Price per Crate:</span>
                <strong>₦${order.pricePerCrate.toLocaleString()}</strong>
              </div>
              <div class="detail-row">
                <span>Delivery Date:</span>
                <strong>${new Date(order.deliveryDate).toLocaleDateString()}</strong>
              </div>
              <div class="detail-row">
                <span>Delivery Time:</span>
                <strong>${order.deliveryTime}</strong>
              </div>
              <div class="detail-row total-row">
                <span>Total Amount:</span>
                <strong>₦${order.totalAmount.toLocaleString()}</strong>
              </div>
            </div>
            
            <p><strong>Payment Status:</strong> ${order.paymentStatus}</p>
            
            <p>You can track your order status in real-time through your vendor portal.</p>
            
            <p>Thank you for choosing QOOA!</p>
            
            <p>Best regards,<br>The QOOA Team</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Order confirmation email sent to ${vendor.email}`);
    return true;
  } catch (error) {
    console.error("Error sending order confirmation email:", error);
    return false;
  }
};

// Send password reset email
const sendPasswordResetEmail = async (vendor, resetToken) => {
  if (!vendor.email) return;

  const transporter = createTransporter();
  const resetUrl = `${process.env.BASE_URL}/reset-password?token=${resetToken}&email=${vendor.email}`;

  const mailOptions = {
    from: `${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_FROM_ADDRESS}>`,
    to: vendor.email,
    subject: "Reset Your QOOA Password",
    html: `
      <!DOCTYPE html>
      <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2>Password Reset Request</h2>
          <p>Hi ${vendor.vendorName},</p>
          <p>We received a request to reset your QOOA account password. Click the button below to reset it:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="display: inline-block; padding: 15px 30px; background: #047857; color: white; text-decoration: none; border-radius: 6px;">Reset Password</a>
          </div>
          <p>Or copy and paste this link: ${resetUrl}</p>
          <p>This link will expire in 1 hour.</p>
          <p>If you didn't request this, please ignore this email.</p>
          <p>Best regards,<br>The QOOA Team</p>
        </div>
      </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error("Error sending password reset email:", error);
    throw error;
  }
};

module.exports = {
  sendVerificationEmail,
  sendOrderConfirmationEmail,
  sendPasswordResetEmail,
  generateVerificationToken,
};
