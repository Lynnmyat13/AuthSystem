# Gmail SMTP email setup

The backend sends OTP messages through Gmail SMTP with Nodemailer.

Add these variables to `backend/.env` locally and to the backend hosting environment in production:

```env
EMAIL_USER=your-gmail-address@gmail.com
EMAIL_PASS=your-google-app-password
SMTP_PORT=587
```

`SMTP_PORT=587` uses STARTTLS and is the default. Use `SMTP_PORT=465` for implicit SSL/TLS. Other ports are rejected.

`EMAIL_PASS` must be a Google App Password, not the account's normal password. Enable two-step verification for the Google account, create an App Password, and never expose it to the frontend or commit it to Git.

When delivery fails, the backend logs only safe SMTP diagnostics (`code`, `command`, and numeric response code), clears the newly generated login OTP, and returns an error. It never logs the OTP, email password, or SMTP response text.

Some hosting networks block outbound SMTP. If a deployed service times out while local delivery succeeds, verify that the hosting plan permits outbound connections to the selected SMTP port.
