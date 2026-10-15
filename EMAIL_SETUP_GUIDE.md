# Resend email setup

The backend sends OTP messages through the official Resend SDK over HTTPS.

## Local development

Add these variables to `backend/.env`:

```env
RESEND_API_KEY=<secret Resend API key>
RESEND_FROM_EMAIL=Authentication System <onboarding@resend.dev>
```

The Resend testing sender is suitable only for development and is restricted to recipients permitted by the Resend account.

## Production

Verify a domain in Resend, then configure the Render service with:

```env
RESEND_API_KEY=<secret production Resend API key>
RESEND_FROM_EMAIL=Authentication System <auth@your-verified-domain.example>
```

The backend validates both variables at startup. Delivery failures log only the provider error type and numeric status. API keys, recipients, OTP values, and provider response messages are never logged.

If delivery fails during login, the generated OTP is removed and the endpoint returns `502`; authentication cannot continue with that OTP.
