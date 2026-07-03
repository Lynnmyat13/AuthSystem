# JWT Token Management Implementation

This document explains the comprehensive JWT token management system implemented for the authentication system with auto-refresh functionality.

## Overview

The implementation provides:

- **Access tokens** with 1-minute expiry (as requested)
- **Refresh tokens** for automatic token renewal
- **Database storage** of tokens for security
- **Auto-refresh mechanism** every 50 seconds
- **Secure logout** with token revocation
- **Protected routes** with token verification

## Backend Implementation

### 1. Token Model (`backend/src/models/Token.ts`)

```typescript
const tokenSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  accessToken: { type: String, required: true, unique: true },
  refreshToken: { type: String, required: true, unique: true },
  accessTokenexpiresAt: {
    type: Date,
    required: true,
    index: { expireAfterSeconds: 0 },
  },
  refreshTokenexpiresAt: {
    type: Date,
    required: true,
    index: { expireAfterSeconds: 0 },
  },
  createdAt: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true },
});
```

**Features:**

- TTL index for automatic cleanup of expired tokens
- Unique constraints on tokens
- User relationship for efficient queries
- Active status for token revocation

### 2. Token Manager (`backend/src/utils/tokenManager.ts`)

**Key Functions:**

- `generateAccessToken()` - Creates JWT with 1-minute expiry
- `generateRefreshToken()` - Creates secure random refresh token
- `storeTokens()` - Saves tokens to database
- `verifyAccessToken()` - Validates token from database
- `refreshAccessToken()` - Issues new tokens
- `revokeUserTokens()` - Revokes all user tokens
- `revokeToken()` - Revokes specific token

**Security Features:**

- Database verification for all tokens
- Automatic token cleanup
- Secure random refresh tokens
- Token expiry management

### 3. Updated Auth Controller

**New Endpoints:**

- `POST /verify-otp-login` - Verify OTP and generate tokens
- `POST /refresh-token` - Refresh access token
- `POST /logout` - Revoke specific token
- `POST /logout-all` - Revoke all user tokens
- `GET /profile` - Protected route example

**Token Flow:**

1. User logs in with email/password
2. OTP is sent to email
3. User verifies OTP
4. Access token (1 min) and refresh token (7 days) are generated
5. Tokens are stored in database
6. Tokens are sent to client

### 4. Enhanced Auth Middleware

```typescript
export const verifyToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const token = req.headers.authorization?.split(" ")[1];
  const tokenData = await verifyAccessToken(token);
  req.user = tokenData.user;
  req.userId = tokenData.userId;
  next();
};
```

**Features:**

- Database token verification
- User information injection
- Automatic token validation

## Frontend Implementation

### 1. Enhanced API Utility (`frontend/src/utils/api.ts`)

**Token Management:**

```typescript
// Token storage
export const setTokens = (accessToken: string, refreshToken: string) => {
  localStorage.setItem(TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
};

// Auto-refresh mechanism
export const startTokenRefresh = () => {
  refreshInterval = setInterval(async () => {
    const { accessToken } = getTokens();
    if (accessToken && isTokenExpired(accessToken)) {
      await refreshAccessToken();
    }
  }, 50000); // 50 seconds
};
```

**Features:**

- Automatic token attachment to requests
- Auto-refresh every 50 seconds
- Token expiry detection
- Request/response interceptors
- Secure token storage

### 2. Updated Components

**Login Flow:**

1. User enters credentials
2. OTP is sent to email
3. User verifies OTP
4. Tokens are stored in localStorage
5. Auto-refresh mechanism starts
6. User is redirected to dashboard

**Logout Flow:**

1. Logout API is called to revoke server token
2. Auto-refresh mechanism stops
3. Local storage is cleared
4. User is redirected to login

**Protected Routes:**

- Token verification on route access
- Automatic redirect to login if invalid
- Auto-refresh mechanism activation

## Security Features

### 1. Token Security

- **Short-lived access tokens** (1 minute)
- **Secure refresh tokens** (crypto.randomBytes)
- **Database storage** for token validation
- **Automatic cleanup** of expired tokens

### 2. Auto-Refresh Security

- **Proactive refresh** (50 seconds before expiry)
- **Automatic retry** on token expiry
- **Secure storage** in localStorage
- **Server-side validation** for all requests

### 3. Logout Security

- **Server-side token revocation**
- **Client-side token clearing**
- **Auto-refresh mechanism stop**
- **Complete session termination**

## API Endpoints

### Public Endpoints

- `POST /register` - User registration
- `POST /verify-otp` - OTP verification (registration)
- `POST /login` - Send login OTP
- `POST /verify-otp-login` - Verify OTP and get tokens
- `POST /refresh-token` - Refresh access token

### Protected Endpoints

- `POST /logout` - Logout (revoke token)
- `POST /logout-all` - Logout all devices
- `GET /profile` - Get user profile

## Usage Examples

### Backend Usage

```typescript
// Protect a route
router.get("/protected", verifyToken, (req, res) => {
  res.json({ user: req.user });
});

// Logout user
router.post("/logout", async (req, res) => {
  const { accessToken } = req.body;
  await revokeToken(accessToken);
  res.json({ message: "Logged out" });
});
```

### Frontend Usage

```typescript
// Login and get tokens
const response = await authAPI.verifyOTPAndLogin(email, otp);
const { accessToken, refreshToken } = response.data;
setTokens(accessToken, refreshToken);
startTokenRefresh();

// Logout
await authAPI.logout();
stopTokenRefresh();
clearTokens();
```

## Configuration

### Environment Variables

```env
JWT_SECRET=your-secret-key
```

### Token Expiry Settings

- **Access Token**: 1 minute (configurable in `tokenManager.ts`)
- **Refresh Token**: 7 days (configurable in `tokenManager.ts`)
- **Auto-refresh**: 50 seconds (configurable in `api.ts`)

## Benefits

1. **Security**: Short-lived tokens with database validation
2. **User Experience**: Seamless auto-refresh without user intervention
3. **Scalability**: Efficient token management with automatic cleanup
4. **Flexibility**: Easy to configure token expiry and refresh intervals
5. **Monitoring**: Complete token lifecycle tracking

## Testing

### Backend Testing

```bash
# Test token generation
curl -X POST http://localhost:4000/api/auth/verify-otp-login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "otp": "123456"}'

# Test protected route
curl -X GET http://localhost:4000/api/auth/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Frontend Testing

1. Register a new user
2. Verify OTP
3. Check tokens in localStorage
4. Navigate to protected routes
5. Wait for auto-refresh (50 seconds)
6. Test logout functionality

## Troubleshooting

### Common Issues

1. **Token not refreshing**: Check if auto-refresh is started
2. **401 errors**: Verify token is not expired
3. **Database errors**: Ensure MongoDB connection
4. **CORS issues**: Check API base URL configuration

### Debug Tips

1. Check browser localStorage for tokens
2. Monitor network requests for token headers
3. Check server logs for token validation errors
4. Verify database token records

This implementation provides a robust, secure, and user-friendly token management system that meets all the specified requirements.
