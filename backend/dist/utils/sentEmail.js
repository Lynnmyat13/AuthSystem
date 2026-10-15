"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const nodemailer_1 = __importDefault(require("nodemailer"));
const sendEmail = async (to, subject, text) => {
    const user = process.env.EMAIL_USER;
    const pass = process.env.EMAIL_PASS;
    const port = Number(process.env.SMTP_PORT || 587);
    if (!user || !pass) {
        throw new Error("Email delivery is not configured");
    }
    if (port !== 465 && port !== 587) {
        throw new Error("SMTP_PORT must be 465 or 587");
    }
    const transporter = nodemailer_1.default.createTransport({
        host: "smtp.gmail.com",
        port,
        secure: port === 465,
        requireTLS: port === 587,
        auth: { user, pass },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 15000,
    });
    try {
        await transporter.sendMail({
            from: `"Authentication System" <${user}>`,
            to,
            subject,
            text,
        });
    }
    catch (error) {
        const smtpError = error;
        console.error("SMTP email delivery failed", {
            code: smtpError.code,
            command: smtpError.command,
            responseCode: smtpError.responseCode,
        });
        throw new Error("Failed to send email");
    }
};
exports.default = sendEmail;
