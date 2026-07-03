// Test script to verify email configuration
require("dotenv").config();
const nodemailer = require("nodemailer");

const testEmail = async () => {
  console.log("🔍 Testing email configuration...\n");

  // Check environment variables
  console.log("Environment Variables:");
  console.log(`EMAIL_USER: ${process.env.EMAIL_USER ? "Set" : "Not set"}`);
  console.log(`EMAIL_PASS: ${process.env.EMAIL_PASS ? "Set" : "Not set"}\n`);

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log("❌ Email credentials not configured.");
    console.log("Please set EMAIL_USER and EMAIL_PASS in your .env file.\n");
    console.log("Example .env file:");
    console.log("EMAIL_USER=your-email@gmail.com");
    console.log("EMAIL_PASS=your-app-password");
    return;
  }

  try {
    // Create transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false,
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 10000,
    });

    console.log("🔗 Verifying email connection...");
    await transporter.verify();
    console.log("Email connection verified successfully!\n");

    // Send test email
    console.log("📧 Sending test email...");
    const info = await transporter.sendMail({
      from: `"Authentication System" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER, // Send to yourself
      subject: "Test Email - Authentication System",
      text: "This is a test email from the Authentication System. If you receive this, your email configuration is working correctly!",
      html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #333;">Test Email - Authentication System</h2>
                    <div style="background-color: #f4f4f4; padding: 20px; border-radius: 5px;">
                        <p style="font-size: 16px; line-height: 1.5;">
                            This is a test email from the Authentication System. 
                            If you receive this, your email configuration is working correctly!
                        </p>
                    </div>
                    <p style="color: #999; font-size: 12px; margin-top: 20px;">
                        This is an automated test message.
                    </p>
                </div>
            `,
    });

    console.log("Test email sent successfully!");
    console.log(`Message ID: ${info.messageId}`);
    console.log(`Response: ${info.response}`);
  } catch (error) {
    console.error("❌ Email test failed:", error.message);
    console.log("\nTroubleshooting tips:");
    console.log(
      "1. Make sure you're using an App Password, not your regular password"
    );
    console.log("2. Enable 2-Step Verification on your Google account");
    console.log("3. Check your internet connection");
    console.log("4. Try using a VPN if your ISP blocks SMTP");
  }
};

testEmail();
