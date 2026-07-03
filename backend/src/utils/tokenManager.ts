import jwt from "jsonwebtoken";
import crypto from "crypto";
import Token from "../models/Token";
import User from "../models/User";

// JWT configuration
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const ACCESS_TOKEN_EXPIRY = "5m"; // 5 minute as requested

/**
 * Generate a new access token
 */
export const generateAccessToken = (userId: string): string => {
  return jwt.sign(
    {
      userId,
      type: "access",
      iat: Math.floor(Date.now() / 1000),
    },
    JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );
};

/**
 * Generate a new refresh token
 */
export const generateRefreshToken = (): string => {
  return crypto.randomBytes(64).toString("hex");
};

/**
 * Store tokens in database (refresh token stays server-side only)
 */
export const storeTokens = async (
  userId: string,
  accessToken: string,
  refreshToken: string
): Promise<void> => {
  // Access token: 5 minutes
  const accessTokenExpiresAt = new Date(Date.now() + 5 * 60 * 1000);

  // Refresh token: 30 days
  const refreshTokenExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  // Deactivate any existing tokens for this user
  await Token.updateMany({ userId, isActive: true }, { isActive: false });

  // Store new tokens (refresh token never leaves the server)
  const tokenDoc = new Token({
    userId,
    accessToken,
    refreshToken,
    accessTokenExpiresAt,
    refreshTokenExpiresAt,
    isActive: true,
  });

  await tokenDoc.save();
};

/**
 * Verify access token from database
 */
export const verifyAccessToken = async (token: string): Promise<any> => {
  try {
    // First verify JWT signature
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    // Check if token exists and is active in database
    const tokenDoc = await Token.findOne({
      accessToken: token,
      isActive: true,
      accessTokenExpiresAt: { $gt: new Date() },
    }).populate("userId");

    if (!tokenDoc) {
      throw new Error("Token not found or expired");
    }

    return {
      userId: decoded.userId,
      user: tokenDoc.userId,
    };
  } catch (error) {
    throw new Error("Invalid or expired token");
  }
};

/**
 * Refresh access token using access token (server-side refresh token lookup)
 */
export const refreshAccessTokenByAccessToken = async (
  accessToken: string
): Promise<string> => {
  // Find token in DB using the provided access token
  const tokenDoc = await Token.findOne({
    accessToken,
    isActive: true,
    accessTokenExpiresAt: { $gt: new Date() }, // make sure it's still valid
  });

  if (!tokenDoc) {
    throw new Error("Invalid or expired access token");
  }

  // Generate new access token
  const newAccessToken = generateAccessToken(tokenDoc.userId.toString());

  // Update the token document
  tokenDoc.accessToken = newAccessToken;
  tokenDoc.accessTokenExpiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now
  await tokenDoc.save();

  return newAccessToken;
};

/**
 * Refresh access token using refresh token (legacy method - not used in client)
 */
export const refreshAccessToken = async (
  refreshToken: string
): Promise<{ accessToken: string; refreshToken: string }> => {
  const tokenDoc = await Token.findOne({
    refreshToken,
    isActive: true,
    refreshTokenExpiresAt: { $gt: new Date() }, // check refresh token validity
  });

  if (!tokenDoc) {
    throw new Error("Invalid or expired refresh token");
  }

  // Generate new tokens
  const newAccessToken = generateAccessToken(tokenDoc.userId.toString());
  const newRefreshToken = generateRefreshToken();

  // Update token data
  tokenDoc.accessToken = newAccessToken;
  tokenDoc.refreshToken = newRefreshToken;
  tokenDoc.accessTokenExpiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
  tokenDoc.refreshTokenExpiresAt = new Date(
    Date.now() + 7 * 24 * 60 * 60 * 1000
  ); // 7 days

  await tokenDoc.save();

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  };
};

/**
 * Revoke all tokens for a user
 */
export const revokeUserTokens = async (userId: string): Promise<void> => {
  await Token.updateMany({ userId, isActive: true }, { isActive: false });
};

/**
 * Revoke specific token
 */
export const revokeToken = async (accessToken: string): Promise<void> => {
  await Token.updateOne({ accessToken }, { isActive: false });
};

/**
 * Clean up expired tokens (can be called periodically)
 */
export const cleanupExpiredTokens = async (): Promise<void> => {
  await Token.deleteMany({
    $or: [
      { accessTokenExpiresAt: { $lt: new Date() } },
      { refreshTokenExpiresAt: { $lt: new Date() } },
      { isActive: false },
    ],
  });
};
