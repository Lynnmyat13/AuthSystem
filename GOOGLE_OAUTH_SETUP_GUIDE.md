# Google OAuth Setup Guide

## Backend Setup

### 1. Environment Variables
Add the following variables to your backend `.env` file:

```env
# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:4000/api/auth/google/callback

# Session
SESSION_SECRET=your-session-secret-key

# Frontend URL
FRONTEND_URL=http://localhost:5173
```

### 2. Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client IDs"
5. Set application type to "Web application"
6. Add authorized redirect URIs:
   - `http://localhost:4000/api/auth/google/callback` (for development)
   - `https://yourdomain.com/api/auth/google/callback` (for production)
7. Copy the Client ID and Client Secret to your `.env` file

### 3. Install Required Packages
The following packages have been installed:
- `passport`
- `passport-google-oauth20`
- `passport-jwt`
- `express-session`

## Frontend Setup

### 1. Google Login Button
Google login buttons have been added to both Login and Register pages.

### 2. OAuth Flow
The OAuth flow works as follows:
1. User clicks "Continue with Google"
2. Redirects to Google OAuth consent screen
3. After consent, Google redirects back to backend callback
4. Backend processes the OAuth response and redirects to frontend dashboard
5. Frontend dashboard handles the OAuth success and stores tokens

## Testing

### 1. Start the Backend
```bash
cd backend
npm run dev
```

### 2. Start the Frontend
```bash
cd frontend
npm run dev
```

### 3. Test Google Login
1. Go to `http://localhost:5173`
2. Click "Login" or "Register"
3. Click "Continue with Google"
4. Complete Google OAuth flow
5. You should be redirected to the dashboard

## Features Added

### Backend
- Google OAuth strategy configuration
- Google OAuth routes (`/google`, `/google/callback`)
- Updated User model to support OAuth users
- Session management for OAuth flow

### Frontend
- Google login buttons on Login and Register pages
- OAuth redirect handling in Dashboard
- Updated API utilities for Google authentication

## Security Notes

1. **HTTPS in Production**: Always use HTTPS in production for OAuth
2. **Environment Variables**: Never commit `.env` files to version control
3. **Session Security**: Use strong session secrets
4. **CORS Configuration**: Update CORS settings for production domains

## Troubleshooting

### Common Issues

1. **"Invalid redirect URI"**: Check that the callback URL in Google Console matches your backend callback URL
2. **"Client ID not found"**: Verify your Google Client ID is correct in the `.env` file
3. **CORS errors**: Ensure your frontend URL is added to the backend CORS configuration
4. **Session issues**: Check that SESSION_SECRET is set in your `.env` file

### Debug Steps

1. Check browser console for errors
2. Check backend logs for OAuth errors
3. Verify all environment variables are set
4. Test the OAuth flow step by step
