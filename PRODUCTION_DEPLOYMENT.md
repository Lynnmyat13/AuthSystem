# Production deployment

Replace the example hostnames below with the stable production domains shown in the Vercel and Render dashboards. Do not include a trailing slash.

## Vercel environment variables

Set these for the Production environment, then redeploy:

```env
VITE_API_URL=https://your-render-service.onrender.com/api/auth
VITE_RECAPTCHA_SITE_KEY=<public site key>
```

## Render environment variables

```env
NODE_ENV=production
MONGODB_URL=<MongoDB Atlas connection string>
JWT_SECRET=<long random secret>
SESSION_SECRET=<different long random secret>
FRONTEND_URL=https://your-project.vercel.app
ALLOWED_ORIGINS=https://your-project.vercel.app
EMAIL_USER=<Gmail address>
EMAIL_PASS=<Google App Password>
SMTP_PORT=587
GOOGLE_CLIENT_ID=<Google OAuth client ID>
GOOGLE_CLIENT_SECRET=<Google OAuth client secret>
GOOGLE_CALLBACK_URL=https://your-render-service.onrender.com/api/auth/google/callback
RECAPTCHA_SECRET_KEY=<secret reCAPTCHA key>
```

Render supplies `PORT`; do not hard-code it. The server reads `process.env.PORT` and falls back to `4000` only for local development. `ALLOWED_ORIGINS` accepts a comma-separated list when more than one stable frontend origin is required. Localhost origins are already allowed by the backend.

Remove the obsolete backend `VITE_RECAPTCHA_SITE_KEY` variable from Render. SMTP port `587` uses STARTTLS; port `465` uses implicit TLS. Some hosting plans block outbound SMTP, so verify this capability before relying on Gmail in production.

## Provider configuration

- Google OAuth authorized JavaScript origin: `https://your-project.vercel.app`
- Google OAuth authorized redirect URI: `https://your-render-service.onrender.com/api/auth/google/callback`
- reCAPTCHA allowed domains: `your-project.vercel.app` and `localhost` (hostnames only; no scheme or path)
- MongoDB Atlas: allow Render network access and use a database user with only the permissions this application needs.
- Gmail: enable two-step verification and use a Google App Password in `EMAIL_PASS`; never use the account's normal password.

The Google redirect URI must exactly equal `GOOGLE_CALLBACK_URL`. The Vercel origin must exactly equal both `FRONTEND_URL` and an entry in `ALLOWED_ORIGINS`.

## Production smoke test

Use a fresh email address and keep the browser Network tab open.

1. Register with a valid password. Expect `POST /register` to return `201`; confirm no password, OTP, or secret appears in the response or Render logs.
2. Log in with the registered email and password, complete reCAPTCHA, and expect `POST /login` to return `200`. Confirm one OTP email arrives through Gmail SMTP.
3. Enter an incorrect OTP first and expect `400`, then enter the delivered OTP and expect `POST /verify-otp-login` to return `200` with an access token. Reusing that OTP must fail.
4. Open the dashboard and call the profile endpoint with the bearer token. Expect `200`. After the access token refresh interval, confirm `POST /refresh-token` returns a replacement access token and protected calls still succeed.
5. Log out. Expect `POST /logout` to return `200`; retrying the revoked token against `/profile` must return `401`.
6. Click **Continue with Google** in a private browser window. Confirm Google returns to the Render callback and Render redirects to the Vercel `/dashboard` route without a redirect-URI or CORS error.
7. Repeat the login test with an invalid/expired reCAPTCHA response and expect rejection. Confirm the production Vercel hostname is accepted and an unlisted origin receives no CORS access headers.
8. Temporarily use an invalid Gmail App Password in a non-production test service. `POST /login` must return `502`, no OTP should appear in logs or responses, and the generated OTP must not remain usable. Restore the App Password afterward.

For a direct preflight check, send an `OPTIONS` request to `/api/auth/login` with the production Vercel value in the `Origin` header and `POST` in `Access-Control-Request-Method`. Expect `204` plus an `Access-Control-Allow-Origin` header containing that exact origin and `Access-Control-Allow-Credentials: true`.
