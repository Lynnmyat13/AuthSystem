"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanupExpiredTokens = exports.revokeToken = exports.revokeUserTokens = exports.refreshAccessToken = exports.refreshAccessTokenByAccessToken = exports.verifyAccessToken = exports.storeTokens = exports.generateRefreshToken = exports.generateAccessToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = __importDefault(require("crypto"));
const Token_1 = __importDefault(require("../models/Token"));
// JWT configuration
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const ACCESS_TOKEN_EXPIRY = "5m"; // 5 minute as requested
/**
 * Generate a new access token
 */
const generateAccessToken = (userId) => {
    return jsonwebtoken_1.default.sign({
        userId,
        type: "access",
        iat: Math.floor(Date.now() / 1000),
    }, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
};
exports.generateAccessToken = generateAccessToken;
/**
 * Generate a new refresh token
 */
const generateRefreshToken = () => {
    return crypto_1.default.randomBytes(64).toString("hex");
};
exports.generateRefreshToken = generateRefreshToken;
/**
 * Store tokens in database (refresh token stays server-side only)
 */
const storeTokens = async (userId, accessToken, refreshToken) => {
    // Access token: 5 minutes
    const accessTokenExpiresAt = new Date(Date.now() + 5 * 60 * 1000);
    // Refresh token: 30 days
    const refreshTokenExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    // Deactivate any existing tokens for this user
    await Token_1.default.updateMany({ userId, isActive: true }, { isActive: false });
    // Store new tokens (refresh token never leaves the server)
    const tokenDoc = new Token_1.default({
        userId,
        accessToken,
        refreshToken,
        accessTokenExpiresAt,
        refreshTokenExpiresAt,
        isActive: true,
    });
    await tokenDoc.save();
};
exports.storeTokens = storeTokens;
/**
 * Verify access token from database
 */
const verifyAccessToken = async (token) => {
    try {
        // First verify JWT signature
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        // Check if token exists and is active in database
        const tokenDoc = await Token_1.default.findOne({
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
    }
    catch (error) {
        throw new Error("Invalid or expired token");
    }
};
exports.verifyAccessToken = verifyAccessToken;
/**
 * Refresh access token using access token (server-side refresh token lookup)
 */
const refreshAccessTokenByAccessToken = async (accessToken) => {
    // Find token in DB using the provided access token
    const tokenDoc = await Token_1.default.findOne({
        accessToken,
        isActive: true,
        accessTokenExpiresAt: { $gt: new Date() }, // make sure it's still valid
    });
    if (!tokenDoc) {
        throw new Error("Invalid or expired access token");
    }
    // Generate new access token
    const newAccessToken = (0, exports.generateAccessToken)(tokenDoc.userId.toString());
    // Update the token document
    tokenDoc.accessToken = newAccessToken;
    tokenDoc.accessTokenExpiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now
    await tokenDoc.save();
    return newAccessToken;
};
exports.refreshAccessTokenByAccessToken = refreshAccessTokenByAccessToken;
/**
 * Refresh access token using refresh token (legacy method - not used in client)
 */
const refreshAccessToken = async (refreshToken) => {
    const tokenDoc = await Token_1.default.findOne({
        refreshToken,
        isActive: true,
        refreshTokenExpiresAt: { $gt: new Date() }, // check refresh token validity
    });
    if (!tokenDoc) {
        throw new Error("Invalid or expired refresh token");
    }
    // Generate new tokens
    const newAccessToken = (0, exports.generateAccessToken)(tokenDoc.userId.toString());
    const newRefreshToken = (0, exports.generateRefreshToken)();
    // Update token data
    tokenDoc.accessToken = newAccessToken;
    tokenDoc.refreshToken = newRefreshToken;
    tokenDoc.accessTokenExpiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
    tokenDoc.refreshTokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    await tokenDoc.save();
    return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
    };
};
exports.refreshAccessToken = refreshAccessToken;
/**
 * Revoke all tokens for a user
 */
const revokeUserTokens = async (userId) => {
    await Token_1.default.updateMany({ userId, isActive: true }, { isActive: false });
};
exports.revokeUserTokens = revokeUserTokens;
/**
 * Revoke specific token
 */
const revokeToken = async (accessToken) => {
    await Token_1.default.updateOne({ accessToken }, { isActive: false });
};
exports.revokeToken = revokeToken;
/**
 * Clean up expired tokens (can be called periodically)
 */
const cleanupExpiredTokens = async () => {
    await Token_1.default.deleteMany({
        $or: [
            { accessTokenExpiresAt: { $lt: new Date() } },
            { refreshTokenExpiresAt: { $lt: new Date() } },
            { isActive: false },
        ],
    });
};
exports.cleanupExpiredTokens = cleanupExpiredTokens;
