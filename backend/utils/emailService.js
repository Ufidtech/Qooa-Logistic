const nodemailer = require("nodemailer");
const crypto = require("crypto");

// Create email transporter
const createTransporter = () => {
  // nodemailer uses createTransport (not createTransporter)
  return nodemailer.createTransport({
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

  // Build verification URL that points to the backend verify endpoint by default.
  // Prefer explicit BACKEND_URL if set, fall back to BASE_URL for compatibility.
  const backendBase = process.env.BACKEND_URL || process.env.BASE_URL || '';
  const verificationUrl = `${backendBase.replace(/\/$/, '')}/api/auth/verify-email?token=${token}&email=${vendor.email}`;

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
  // Password reset link is intended to open the frontend reset page (so user can enter a new password).
  // Prefer FRONTEND_URL if set, otherwise fall back to BASE_URL for compatibility.
    // Prefer BACKEND_URL so the link hits the backend reset endpoint which can validate and redirect to the frontend.
    const backendUrl = process.env.BACKEND_URL && process.env.BACKEND_URL.trim();
    const frontendBase = process.env.FRONTEND_URL || process.env.BASE_URL || '';
    let resetUrl;
    if (backendUrl) {
      resetUrl = `${backendUrl.replace(/\/$/, '')}/api/auth/reset-password?token=${resetToken}&email=${vendor.email}`;
      console.log(`Building password reset link using BACKEND_URL: ${resetUrl}`);
    } else {
      // Fallback to direct frontend token flow (frontend will POST to backend to complete reset)
      // Note: frontend file is `resetpassword.html` (no hyphen)
      resetUrl = `${frontendBase.replace(/\/$/, '')}/resetpassword.html?token=${resetToken}&email=${vendor.email}`;
      console.log(`BACKEND_URL not set — building password reset link to FRONTEND for token flow: ${resetUrl}`);
    }

  const mailOptions = {
    from: `${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_FROM_ADDRESS}>`,
    to: vendor.email,
    subject: "Reset Your QOOA Password",
    html: `
      <!doctype html>
      <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial; background:#f3f4f6; margin:0; padding:0; }
          .email-wrap { width:100%; background:#f3f4f6; padding:24px 0; }
          .email-body { max-width:600px; margin:0 auto; background:#ffffff; border-radius:8px; overflow:hidden; box-shadow:0 6px 18px rgba(15,23,42,0.08); }
          .header { background: linear-gradient(90deg,#059669,#047857); color:#fff; padding:28px 24px; text-align:center; }
          .header h1 { margin:0; font-size:20px; }
          .content { padding:24px; color:#0f172a; }
          .button { display:inline-block; background:#047857; color:#fff; text-decoration:none; padding:12px 22px; border-radius:6px; font-weight:600; }
          .small { color:#6b7280; font-size:13px; }
          .footer { padding:16px 24px; text-align:center; font-size:12px; color:#9ca3af; }
          .link { word-break: break-all; color:#047857; }
        </style>
      </head>
      <body>
        <div class="email-wrap">
          <div class="email-body">
            <div class="header">
              <h1>QOOA — Password Reset</h1>
            </div>
            <div class="content">
              <p style="margin:0 0 12px 0;">Hi ${vendor.vendorName || 'there'},</p>
              <p style="margin:0 0 16px 0;">You (or someone using your email) requested a password reset for your QOOA account. Click the button below to set a new password. This link is valid for 1 hour.</p>

              <p style="text-align:center; margin:18px 0;">
                <a href="${resetUrl}" class="button">Reset Password</a>
              </p>

              <p style="margin:12px 0 0 0;" class="small">If the button doesn't work, copy and paste the link below into your browser:</p>
              <p class="link" style="margin:6px 0 0 0;"><a href="${resetUrl}" style="color:#047857; text-decoration:none;">${resetUrl}</a></p>

              <hr style="border:none;border-top:1px solid #eef2f7;margin:20px 0" />

              <p class="small" style="margin:0 0 8px 0;">If you didn't request a password reset, you can safely ignore this email — no changes will be made to your account.</p>
              <p class="small" style="margin:0 0 8px 0;">Need help? Contact us at <a href="mailto:${process.env.EMAIL_FROM_ADDRESS}" style="color:#047857;text-decoration:none;">${process.env.EMAIL_FROM_ADDRESS}</a></p>
            </div>
            <div class="footer">QOOA • Fresh Tomatoes, Fair Prices</div>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `Reset your QOOA password\n\nOpen this link to reset your password (valid 1 hour): ${resetUrl}\n\nIf you didn't request this, ignore this email.`,
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

// Verify transporter - useful at startup to confirm email settings
const verifyTransporter = async () => {
  try {
    const transporter = createTransporter();
    // nodemailer transports expose verify()
    await transporter.verify();
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message || String(err) };
  }
};

module.exports.verifyTransporter = verifyTransporter;
