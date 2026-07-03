"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const nodemailer_1 = __importDefault(require("nodemailer"));
// Email configuration with multiple fallback options
const createTransporter = () => {
    // Check if environment variables are set
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.warn("⚠️ Email credentials not configured. Using console fallback.");
        return null;
    }
    try {
        // Try Gmail with different configurations
        const transporter = nodemailer_1.default.createTransport({
            service: "gmail",
            host: "smtp.gmail.com",
            port: 587,
            secure: false, // Use TLS
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
            tls: {
                rejectUnauthorized: false,
            },
            connectionTimeout: 10000, // 10 seconds
            greetingTimeout: 10000, // 10 seconds
            socketTimeout: 10000, // 10 seconds
        });
        return transporter;
    }
    catch (error) {
        console.error("Failed to create email transporter:", error);
        return null;
    }
};
const sendEmail = async (to, subject, text) => {
    try {
        const transporter = createTransporter();
        if (!transporter) {
            // Fallback: Log to console instead of sending email
            console.log("\n" + "=".repeat(50));
            console.log("📧 EMAIL NOTIFICATION (Console Fallback)");
            console.log("=".repeat(50));
            console.log(`To: ${to}`);
            console.log(`Subject: ${subject}`);
            console.log(`Message: ${text}`);
            console.log("=".repeat(50));
            console.log("⚠️ To enable real email sending, configure EMAIL_USER and EMAIL_PASS environment variables");
            console.log("=".repeat(50) + "\n");
            return;
        }
        // Verify transporter configuration
        await transporter.verify();
        console.log("Email transporter verified successfully");
        const info = await transporter.sendMail({
            from: `"Authentication System" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            text,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #333;">Authentication System</h2>
                    <div style="background-color: #f4f4f4; padding: 20px; border-radius: 5px;">
                        <h3 style="color: #666; margin-top: 0;">${subject}</h3>
                        <p style="font-size: 16px; line-height: 1.5;">${text}</p>
                    </div>
                    <p style="color: #999; font-size: 12px; margin-top: 20px;">
                        This is an automated message from the Authentication System.
                    </p>
                </div>
            `,
        });
        console.log("Email sent successfully:", info.response);
    }
    catch (error) {
        console.error("Email sending error:", error.message);
        // Fallback: Log to console
        console.log("\n" + "=".repeat(50));
        console.log("📧 EMAIL FALLBACK (Due to Error)");
        console.log("=".repeat(50));
        console.log(`To: ${to}`);
        console.log(`Subject: ${subject}`);
        console.log(`Message: ${text}`);
        console.log("=".repeat(50) + "\n");
        // Don't throw error in development - just log it
        if (process.env.NODE_ENV === "production") {
            throw new Error("Failed to send email");
        }
    }
};
exports.default = sendEmail;
