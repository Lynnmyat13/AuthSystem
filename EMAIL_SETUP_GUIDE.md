# Email Configuration Setup Guide

## Problem
You're getting a connection timeout error when trying to send emails:
```
❌ Email sending error: connect ETIMEDOUT 172.253.118.109:465
```

## Solutions

### Option 1: Configure Gmail (Recommended for Production)

#### Step 1: Create a Gmail App Password
1. Go to your Google Account settings
2. Navigate to Security → 2-Step Verification
3. Enable 2-Step Verification if not already enabled
4. Go to Security → App passwords
5. Generate a new app password for "Mail"
6. Copy the 16-character password

#### Step 2: Set Environment Variables
Create a `.env` file in your `backend` directory:

```env
# Database Configuration
MONGODB_URL=mongodb://127.0.0.1:27017/authentication_db

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here-make-it-long-and-random

# Email Configuration (Gmail)
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-16-character-app-password

# Server Configuration
PORT=4000
NODE_ENV=development
```

#### Step 3: Install dotenv (if not already installed)
```bash
npm install dotenv
```

#### Step 4: Load Environment Variables
Make sure your `server.ts` loads the environment variables:
```typescript
import dotenv from 'dotenv';
dotenv.config();
```

### Option 2: Use Console Fallback (For Development)

The updated email utility now includes a fallback mechanism. If email credentials are not configured or if there's a connection error, the system will:

1. **Log the email content to console** instead of sending it
2. **Continue the authentication flow** without throwing errors
3. **Display the OTP in the console** for testing

### Option 3: Alternative Email Services

If Gmail doesn't work, you can use other email services:

#### Using Outlook/Hotmail
```typescript
const transporter = nodemailer.createTransport({
    service: "hotmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});
```

#### Using Custom SMTP
```typescript
const transporter = nodemailer.createTransport({
    host: "smtp.your-provider.com",
    port: 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});
```

## Testing the Email Configuration

### 1. Check Environment Variables
```bash
# In your backend directory
node -e "console.log('EMAIL_USER:', process.env.EMAIL_USER); console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? 'Set' : 'Not set');"
```

### 2. Test Email Connection
```bash
# Run your server and try to register/login
npm run dev
```

### 3. Check Console Output
If email fails, you should see:
```
==================================================
📧 EMAIL NOTIFICATION (Console Fallback)
==================================================
To: user@example.com
Subject: Your OTP Code
Message: Your OTP code is 123456
==================================================
⚠️ To enable real email sending, configure EMAIL_USER and EMAIL_PASS environment variables
==================================================
```

## Common Issues and Solutions

### Issue 1: "Less secure app access" error
**Solution**: Use App Passwords instead of your regular password

### Issue 2: Connection timeout
**Solutions**:
- Check your internet connection
- Try different ports (587, 465)
- Use a VPN if your ISP blocks SMTP
- Check firewall settings

### Issue 3: Authentication failed
**Solutions**:
- Make sure you're using an App Password, not your regular password
- Enable 2-Step Verification first
- Check that the email address is correct

### Issue 4: "Invalid login" error
**Solutions**:
- Use the full email address as EMAIL_USER
- Generate a new App Password
- Make sure 2-Step Verification is enabled

## Development vs Production

### Development
- Console fallback is enabled
- No errors thrown for email failures
- OTP is displayed in console for testing

### Production
- Email failures will throw errors
- Real email sending is required
- Console fallback is disabled

## Quick Fix for Immediate Testing

If you just want to test the authentication system without setting up email:

1. The system will now log OTPs to the console
2. You can copy the OTP from the console output
3. Continue with the authentication flow normally

The updated email utility handles this gracefully, so your authentication system will work even without email configuration.
