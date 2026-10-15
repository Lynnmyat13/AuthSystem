# Gmail SMTP email setup

The local backend sends OTP messages through Gmail SMTP with Nodemailer.

Add these variables to `backend/.env`:

```env
EMAIL_USER=your-gmail-address@gmail.com
EMAIL_PASS=your-google-app-password
SMTP_PORT=587
```

`SMTP_PORT=587` uses STARTTLS and is the default. Port `465` uses implicit SSL/TLS. Other ports are rejected.

`EMAIL_PASS` must be a Google App Password, not the account's normal password. Enable two-step verification for the Gmail account, create an App Password, and never expose it to the frontend or commit it to Git.

When delivery fails, the backend logs only safe SMTP diagnostics (`code`, `command`, and numeric response code), removes the newly generated login OTP, and returns `502`. It never logs the OTP, email password, recipient, or SMTP response text.
