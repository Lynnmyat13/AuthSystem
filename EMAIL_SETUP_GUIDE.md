# Resend email setup

The backend sends OTP messages through Resend's HTTPS API. SMTP credentials and Nodemailer are not used.

1. Add and verify a sending domain in Resend.
2. Create a restricted Resend API key.
3. Set these variables in the Render service:

```env
RESEND_API_KEY=<secret API key>
RESEND_FROM_EMAIL=Authentication System <auth@your-verified-domain.example>
```

For local development, put the same names in `backend/.env`. Never use a production key in the frontend or prefix it with `VITE_`.

If Resend is unconfigured, times out, or rejects a request, the login endpoint returns an error, clears the newly generated OTP, and does not expose the OTP or provider response in logs.

For initial Resend sandbox testing, send only to an address permitted by the Resend account. Use a verified custom domain before production testing with arbitrary recipients.
