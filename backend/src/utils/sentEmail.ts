import nodemailer from "nodemailer";

interface SmtpError {
  code?: string;
  command?: string;
  responseCode?: number;
}

const sendEmail = async (to: string, subject: string, text: string): Promise<void> => {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;
  const port = Number(process.env.SMTP_PORT || 587);

  if (!user || !pass) {
    throw new Error("Email delivery is not configured");
  }

  if (port !== 465 && port !== 587) {
    throw new Error("SMTP_PORT must be 465 or 587");
  }

  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port,
    secure: port === 465,
    requireTLS: port === 587,
    auth: { user, pass },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 15_000,
  });

  try {
    await transporter.sendMail({
      from: `"Authentication System" <${user}>`,
      to,
      subject,
      text,
    });
  } catch (error) {
    const smtpError = error as SmtpError;
    console.error("SMTP email delivery failed", {
      code: smtpError.code,
      command: smtpError.command,
      responseCode: smtpError.responseCode,
    });
    throw new Error("Failed to send email");
  }
};

export default sendEmail;
