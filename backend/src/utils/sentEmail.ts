import { Resend } from "resend";

export const validateEmailConfig = (): void => {
  const missing = ["RESEND_API_KEY", "RESEND_FROM_EMAIL"].filter(
    (name) => !process.env[name],
  );

  if (missing.length) {
    throw new Error(`Missing required email environment variables: ${missing.join(", ")}`);
  }
};

const sendEmail = async (to: string, subject: string, text: string): Promise<void> => {
  validateEmailConfig();

  try {
    const resend = new Resend(process.env.RESEND_API_KEY!);
    const { error } = await resend.emails.send(
      {
        from: process.env.RESEND_FROM_EMAIL!,
        to,
        subject,
        text,
      },
      { signal: AbortSignal.timeout(10_000) },
    );

    if (error) {
      console.error("Resend email delivery failed", {
        name: error.name,
        statusCode: error.statusCode,
      });
      throw new Error("Email provider rejected the request");
    }
  } catch (error) {
    if (error instanceof Error && error.message === "Email provider rejected the request") {
      throw error;
    }

    console.error("Resend email request failed", {
      name: error instanceof Error ? error.name : "UnknownError",
    });
    throw new Error("Failed to send email");
  }
};

export default sendEmail;
