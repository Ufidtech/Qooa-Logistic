const axios = require("axios");

// WhatsApp API client using Facebook Graph API (WhatsApp Business API)
class WhatsAppService {
  constructor() {
    this.accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    this.apiUrl =
      process.env.WHATSAPP_API_URL || "https://graph.facebook.com/v18.0";
  }

  // Send text message
  async sendMessage(to, message, language = "en") {
    try {
      const response = await axios.post(
        `${this.apiUrl}/${this.phoneNumberId}/messages`,
        {
          messaging_product: "whatsapp",
          to: to.replace(/[^0-9]/g, ""), // Clean phone number
          type: "text",
          text: {
            body: message,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            "Content-Type": "application/json",
          },
        },
      );

      console.log(`WhatsApp message sent to ${to}`);
      return response.data;
    } catch (error) {
      console.error(
        "WhatsApp send error:",
        error.response?.data || error.message,
      );
      throw error;
    }
  }

  // Send template message (pre-approved templates)
  async sendTemplateMessage(
    to,
    templateName,
    language = "en",
    parameters = [],
  ) {
    try {
      const response = await axios.post(
        `${this.apiUrl}/${this.phoneNumberId}/messages`,
        {
          messaging_product: "whatsapp",
          to: to.replace(/[^0-9]/g, ""),
          type: "template",
          template: {
            name: templateName,
            language: {
              code: language === "pidgin" ? "en" : language,
            },
            components:
              parameters.length > 0
                ? [
                    {
                      type: "body",
                      parameters: parameters.map((p) => ({
                        type: "text",
                        text: p,
                      })),
                    },
                  ]
                : [],
          },
        },
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            "Content-Type": "application/json",
          },
        },
      );

      return response.data;
    } catch (error) {
      console.error(
        "WhatsApp template send error:",
        error.response?.data || error.message,
      );
      throw error;
    }
  }

  // Send welcome message
  async sendWelcomeMessage(vendor) {
    const message =
      vendor.language === "pidgin"
        ? `Welcome to QOOA, ${vendor.vendorName}! 🍅\n\nYour vendor account don ready. You fit start to order fresh tomato now.\n\nYour Vendor ID: ${vendor.vendorId}\nMarket: ${vendor.marketCluster}\nStall: ${vendor.stallNumber}\n\nCheck your email to verify your account.\n\nThanks for joining us!`
        : `Welcome to QOOA, ${vendor.vendorName}! 🍅\n\nYour vendor account is now active. You can start ordering fresh tomatoes.\n\nVendor ID: ${vendor.vendorId}\nMarket: ${vendor.marketCluster}\nStall: ${vendor.stallNumber}\n\nPlease check your email to verify your account.\n\nThank you for joining QOOA!`;

    return await this.sendMessage(vendor.phoneNumber, message, vendor.language);
  }

  // Send order confirmation
  async sendOrderConfirmation(vendor, order) {
    const message =
      vendor.language === "pidgin"
        ? `✅ Order Confirmed!\n\nYour order don enter successfully, ${vendor.vendorName}.\n\nOrder ID: ${order.orderId}\nQuantity: ${order.crateQuantity} crates\nTotal: ₦${order.totalAmount.toLocaleString()}\nDelivery Date: ${new Date(order.deliveryDate).toLocaleDateString()}\n\nWe go send you update as your order dey move.\n\nThank you! 🍅`
        : `✅ Order Confirmed!\n\nYour order has been confirmed, ${vendor.vendorName}.\n\nOrder ID: ${order.orderId}\nQuantity: ${order.crateQuantity} crates\nTotal: ₦${order.totalAmount.toLocaleString()}\nDelivery Date: ${new Date(order.deliveryDate).toLocaleDateString()}\n\nWe'll keep you updated on your order status.\n\nThank you! 🍅`;

    return await this.sendMessage(vendor.phoneNumber, message, vendor.language);
  }

  // Send tracking update
  async sendTrackingUpdate(vendor, order, stage) {
    const stageMessages = {
      en: {
        "in-transit": `🚚 Your order ${order.orderId} is now in transit from the North.\n\nEstimated arrival: ${new Date(order.deliveryDate).toLocaleDateString()}`,
        "at-hub": `📦 Your order ${order.orderId} has arrived at Lagos hub.\n\nPreparing for final delivery.`,
        "out-for-delivery": `🛵 Your order ${order.orderId} is out for delivery!\n\nExpected delivery time: ${order.deliveryTime}\n\nDriver: ${order.driverName || "TBA"}`,
        delivered: `✅ Order ${order.orderId} has been delivered!\n\nPlease rate your order in the vendor portal.\n\nThank you for choosing QOOA! 🍅`,
      },
      pidgin: {
        "in-transit": `🚚 Your order ${order.orderId} don leave from North, e dey come.\n\nE go reach: ${new Date(order.deliveryDate).toLocaleDateString()}`,
        "at-hub": `📦 Your order ${order.orderId} don reach Lagos.\n\nWe dey prepare am for delivery.`,
        "out-for-delivery": `🛵 Your order ${order.orderId} don dey for road!\n\nTime: ${order.deliveryTime}\n\nDriver: ${order.driverName || "TBA"}`,
        delivered: `✅ Order ${order.orderId} don deliver!\n\nAbeg rate your order for vendor portal.\n\nThank you! 🍅`,
      },
    };

    const lang = vendor.language === "pidgin" ? "pidgin" : "en";
    const message =
      stageMessages[lang][stage] || `Order ${order.orderId} status: ${stage}`;

    return await this.sendMessage(vendor.phoneNumber, message, vendor.language);
  }

  // Send payment reminder
  async sendPaymentReminder(vendor, order) {
    const message =
      vendor.language === "pidgin"
        ? `⚠️ Payment Reminder\n\nYour order ${order.orderId} never pay.\n\nAmount: ₦${order.totalAmount.toLocaleString()}\n\nAbeg complete your payment make we fit deliver your order.`
        : `⚠️ Payment Reminder\n\nYour order ${order.orderId} is awaiting payment.\n\nAmount: ₦${order.totalAmount.toLocaleString()}\n\nPlease complete payment to process your order.`;

    return await this.sendMessage(vendor.phoneNumber, message, vendor.language);
  }

  // Send broadcast message
  async sendBroadcast(vendors, message, messagePidgin) {
    const results = {
      total: vendors.length,
      success: 0,
      failed: 0,
      errors: [],
    };

    for (const vendor of vendors) {
      try {
        const msg = vendor.language === "pidgin" ? messagePidgin : message;
        await this.sendMessage(vendor.phoneNumber, msg, vendor.language);
        results.success++;

        // Add small delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error) {
        results.failed++;
        results.errors.push({
          vendorId: vendor.vendorId,
          error: error.message,
        });
      }
    }

    return results;
  }

  // Send subscription reminder
  async sendSubscriptionReminder(vendor, subscription) {
    const message =
      vendor.language === "pidgin"
        ? `🔔 Subscription Reminder\n\nYour standing order go run tomorrow.\n\nQuantity: ${subscription.crateQuantity} crates\nDay: ${subscription.frequency}\n\nNo need to do anything, we go process am automatic.`
        : `🔔 Subscription Reminder\n\nYour standing order will be processed tomorrow.\n\nQuantity: ${subscription.crateQuantity} crates\nDay: ${subscription.frequency}\n\nNo action needed - we'll process it automatically.`;

    return await this.sendMessage(vendor.phoneNumber, message, vendor.language);
  }

  // Send quality alert
  async sendQualityAlert(vendor, order, alertType) {
    const alerts = {
      temperature: {
        en: `⚠️ Quality Alert\n\nYour order ${order.orderId} experienced high temperature during transit.\n\nWe're monitoring closely to ensure quality.`,
        pidgin: `⚠️ Quality Alert\n\nYour order ${order.orderId} hot too much for road.\n\nWe dey watch am well to make sure e fresh.`,
      },
      gas: {
        en: `⚠️ Quality Alert\n\nEarly fermentation detected in order ${order.orderId}.\n\nWe're taking corrective action.`,
        pidgin: `⚠️ Quality Alert\n\nYour order ${order.orderId} dey start to spoil small.\n\nWe dey handle am.`,
      },
    };

    const lang = vendor.language === "pidgin" ? "pidgin" : "en";
    const message =
      alerts[alertType]?.[lang] || `Quality alert for order ${order.orderId}`;

    return await this.sendMessage(vendor.phoneNumber, message, vendor.language);
  }
}

// Alternative: Twilio WhatsApp Service
class TwilioWhatsAppService {
  constructor() {
    this.accountSid = process.env.TWILIO_ACCOUNT_SID;
    this.authToken = process.env.TWILIO_AUTH_TOKEN;
    this.whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER;
  }

  async sendMessage(to, message) {
    try {
      const response = await axios.post(
        `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`,
        new URLSearchParams({
          From: this.whatsappNumber,
          To: `whatsapp:${to}`,
          Body: message,
        }),
        {
          auth: {
            username: this.accountSid,
            password: this.authToken,
          },
        },
      );

      console.log(`Twilio WhatsApp message sent to ${to}`);
      return response.data;
    } catch (error) {
      console.error(
        "Twilio WhatsApp error:",
        error.response?.data || error.message,
      );
      throw error;
    }
  }
}

// Export the appropriate service based on configuration
const getWhatsAppService = () => {
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    return new TwilioWhatsAppService();
  }
  return new WhatsAppService();
};

module.exports = getWhatsAppService();
