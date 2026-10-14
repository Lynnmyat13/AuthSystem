"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const escapeHtml = (value) => value.replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
}[character]));
const sendEmail = async (to, subject, text) => {
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.RESEND_FROM_EMAIL;
    if (!apiKey || !from) {
        throw new Error("Email delivery is not configured");
    }
    const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            from,
            to: [to],
            subject,
            text,
            html: `<h2>Authentication System</h2><p>${escapeHtml(text)}</p>`,
        }),
        signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) {
        throw new Error(`Email provider rejected the request (${response.status})`);
    }
};
exports.default = sendEmail;
