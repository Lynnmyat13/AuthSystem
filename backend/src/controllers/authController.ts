import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import passport from "passport";
import User from "../models/User";
import sendEmail from "../utils/sentEmail";
import axios from "axios";
import crypto from "crypto";
import {
  exactEmailPattern,
  normalizeValidEmail,
} from "../utils/emailValidation";
import {
  generateAccessToken,
  generateRefreshToken,
  storeTokens,
  revokeUserTokens,
  revokeToken,
  refreshAccessToken,
  refreshAccessTokenByAccessToken,
} from "../utils/tokenManager";
const OTP_EXPIRY_MS = 10 * 60 * 1000;
const OTP_MAX_ATTEMPTS = 5;
const OTP_SELECT = "+otp +otpExpiresAt +otpAttempts +otpLastSentAt +otpPurpose";
const OTP_STATE_FIELDS = {
  otp: 1,
  otpExpiresAt: 1,
  otpAttempts: 1,
  otpPurpose: 1,
};
const OTP_FIELDS = { ...OTP_STATE_FIELDS, otpLastSentAt: 1 };

const parseOTP = (value: unknown): number | null => {
  const text = String(value ?? "");
  return /^\d{6}$/.test(text) ? Number(text) : null;
};

// REGISTER
export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ message: "Name, email, and password are required." });
    }

    const normalizedEmail = normalizeValidEmail(email);
    if (!normalizedEmail) {
      return res.status(400).json({
        message: "Please enter a valid email address with a domain extension.",
      });
    }

    // Validate password strength:
    // - At least 8 characters
    // - At least one uppercase letter
    // - At least one lowercase letter
    // - At least one number
    // - At least one special character
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        message:
          "Password must be at least 8 characters and include uppercase, lowercase, number, and special character.",
      });
    }

    const existingUser = await User.findOne({
      email: exactEmailPattern(normalizedEmail),
    });

    if (existingUser) {
      return res
        .status(400)
        .json({ message: "User already exists with this email." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      name,
      email: normalizedEmail,
      password: hashedPassword,
      role: "User",
      isVerified: true,
    });

    await user.save();

    res
      .status(201)
      .json({ message: "Registration successful. You can now log in." });
  } catch (error: unknown) {
    if ((error as { code?: number }).code === 11000) {
      return res.status(400).json({ message: "User already exists with this email." });
    }
    console.error("Registration request failed");
    res.status(500).json({ message: "Internal server error." });
  }
};

// LOGIN (Send OTP)
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password, token } = req.body;

    const normalizedEmail = normalizeValidEmail(email);
    if (!normalizedEmail) {
      return res.status(400).json({ message: "Please enter a valid email address." });
    }

    if (!token) {
      return res.status(400).json({ message: "reCAPTCHA token missing" });
    }

    // ✅ Verify reCAPTCHA (POST form-encoded for reliability)
    try {
      const secret = process.env.RECAPTCHA_SECRET_KEY;
      if (!secret) {
        return res.status(503).json({ message: "reCAPTCHA is not configured" });
      }

      const params = new URLSearchParams();
      params.append("secret", secret);
      params.append("response", token);

      const response = await axios.post(
        "https://www.google.com/recaptcha/api/siteverify",
        params
      );
      const captchaData: any = response.data;

      if (!captchaData.success) {
        return res
          .status(400)
          .json({ message: "reCAPTCHA verification failed" });
      }
    } catch {
      console.error("reCAPTCHA verification request failed");
      return res.status(500).json({ message: "Error verifying reCAPTCHA" });
    }

    // Continue your login logic
    const user = await User.findOne({
      email: exactEmailPattern(normalizedEmail),
    });
    if (!user) return res.status(400).json({ message: "User not found" });

    if (!password || typeof password !== "string") {
      return res.status(400).json({ message: "Password is required" });
    }

    if (!user.password || typeof user.password !== "string") {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid credentials" });

    const otp = crypto.randomInt(100000, 1000000);
    const now = new Date();
    user.otp = otp;
    user.otpExpiresAt = new Date(now.getTime() + OTP_EXPIRY_MS);
    user.otpAttempts = 0;
    user.otpLastSentAt = now;
    user.otpPurpose = "login";
    await user.save();

    try {
      await sendEmail(
        normalizedEmail,
        "Login OTP Code",
        `Your login verification code is ${otp}. It expires in 10 minutes.`,
      );
    } catch {
      await User.updateOne({ _id: user._id, otp }, { $unset: OTP_FIELDS });
      console.error("OTP email delivery failed");
      return res.status(502).json({ message: "Unable to deliver OTP. Please try again." });
    }

    res.status(200).json({ message: "OTP sent to email for login" });
  } catch (error) {
    console.error("Login request failed");
    res.status(500).json({ message: "Error during login" });
  }
};

// VERIFY OTP AND GENERATE TOKENS (Only returns access token to client)
export const verifyOTPAndLogin = async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;
    const normalizedEmail = normalizeValidEmail(email);
    const parsedOTP = parseOTP(otp);

    if (!normalizedEmail || parsedOTP === null) {
      return res.status(400).json({ message: "Email and a 6-digit code are required." });
    }

    const user = await User.findOne({
      email: exactEmailPattern(normalizedEmail),
    }).select(OTP_SELECT);

    if (!user) return res.status(400).json({ message: "User not found" });

    if (user.otpPurpose !== "login" || !user.otp) {
      return res.status(400).json({ message: "No login verification is pending." });
    }

    if (!user.otpExpiresAt || user.otpExpiresAt.getTime() <= Date.now()) {
      await User.updateOne({ _id: user._id }, { $unset: OTP_FIELDS });
      return res.status(400).json({ message: "Verification code expired. Please log in again." });
    }

    if ((user.otpAttempts ?? 0) >= OTP_MAX_ATTEMPTS) {
      await User.updateOne({ _id: user._id }, { $unset: OTP_STATE_FIELDS });
      return res.status(429).json({ message: "Too many verification attempts. Please log in again." });
    }

    if (user.otp !== parsedOTP) {
      const attempts = (user.otpAttempts ?? 0) + 1;
      if (attempts >= OTP_MAX_ATTEMPTS) {
        await User.updateOne({ _id: user._id }, { $unset: OTP_FIELDS });
        return res.status(429).json({ message: "Too many verification attempts. Please log in again." });
      }

      user.otpAttempts = attempts;
      await user.save();
      return res.status(400).json({ message: "Invalid verification code." });
    }

    const verified = await User.updateOne(
      { _id: user._id, otp: parsedOTP, otpPurpose: "login" },
      { $set: { lastLogin: new Date() }, $unset: OTP_FIELDS },
    );
    if (!verified.matchedCount) {
      return res.status(400).json({ message: "Invalid verification code." });
    }

    // Generate tokens
    const accessToken = generateAccessToken(user._id.toString());
    const refreshToken = generateRefreshToken(); // Server-side only

    // Store tokens in database (refresh token never sent to client)
    await storeTokens(user._id.toString(), accessToken, refreshToken);

    res.status(200).json({
      message: "Login successful",
      accessToken, // Only access token sent to client
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error during login verification" });
  }
};

// REFRESH ACCESS TOKEN (Server-side refresh token lookup)
export const refreshToken = async (req: Request, res: Response) => {
  try {
    const { accessToken } = req.body;

    if (!accessToken) {
      return res.status(400).json({ message: "Access token required" });
    }

    // Use server-side logic that refreshes based on an active access token
    const newAccessToken = await refreshAccessTokenByAccessToken(accessToken);

    res.status(200).json({
      message: "Access token refreshed successfully",
      accessToken: newAccessToken,
    });
  } catch (error) {
    console.error(error);
    res.status(401).json({ message: "Invalid or expired access token" });
  }
};

// LOGOUT
export const logout = async (req: Request, res: Response) => {
  try {
    const { accessToken } = req.body;

    if (accessToken) {
      // Revoke specific token
      await revokeToken(accessToken);
    }

    res.status(200).json({ message: "Logout successful" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error during logout" });
  }
};

// LOGOUT ALL DEVICES
export const logoutAll = async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "User ID required" });
    }

    // Revoke all tokens for user
    await revokeUserTokens(userId);

    res.status(200).json({ message: "Logged out from all devices" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error during logout" });
  }
};

// GOOGLE OAUTH ROUTES
export const googleAuth = passport.authenticate("google", {
  scope: ["profile", "email"],
});

export const googleCallback = async (req: Request, res: Response) => {
  try {
    const user = req.user as any;

    if (!user) {
      return res.status(400).json({ message: "Google authentication failed" });
    }

    // Generate tokens for the user
    const accessToken = generateAccessToken(user._id.toString());
    const refreshToken = generateRefreshToken();

    // Store tokens in database
    await storeTokens(user._id.toString(), accessToken, refreshToken);

    // Redirect to frontend with tokens
    const frontendURL = process.env.FRONTEND_URL || "http://localhost:5173";
    const redirectURL = `${frontendURL}/dashboard?token=${accessToken}&user=${encodeURIComponent(
      JSON.stringify({
        id: user._id,
        name: user.name,
        email: user.email,
      })
    )}`;

    res.redirect(redirectURL);
  } catch (error) {
    console.error("Google callback error:", error);
    const frontendURL = process.env.FRONTEND_URL || "http://localhost:5173";
    res.redirect(`${frontendURL}/login?error=google_auth_failed`);
  }
};

// GOOGLE OAUTH SUCCESS/Failure handlers
export const googleAuthSuccess = (req: Request, res: Response) => {
  res.json({ message: "Google authentication successful", user: req.user });
};

export const googleAuthFailure = (req: Request, res: Response) => {
  res.status(400).json({ message: "Google authentication failed" });
};
