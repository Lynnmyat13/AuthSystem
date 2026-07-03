import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import passport from "passport";
import User from "../models/User";
import sendEmail from "../utils/sentEmail";
import axios from "axios";
import {
  generateAccessToken,
  generateRefreshToken,
  storeTokens,
  revokeUserTokens,
  revokeToken,
  refreshAccessToken,
  refreshAccessTokenByAccessToken,
} from "../utils/tokenManager";
// Function to generate numeric OTP
const generateNumericOTP = (length: number = 6): number => {
  const min = Math.pow(10, length - 1);
  const max = Math.pow(10, length) - 1;
  return Math.floor(Math.random() * (max - min + 1)) + min;
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

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res
        .status(400)
        .json({ message: "User already exists with this email." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const otp = generateNumericOTP(6);

    const user = new User({
      name,
      email,
      password: hashedPassword,
      role: "User",
      otp: otp,
      isVerified: false,
    });

    await user.save();

    res
      .status(201)
      .json({ message: "User registered successfully. OTP sent to email." });
  } catch (error: any) {
    console.error("Registration error:", error.message);
    res.status(500).json({ message: "Internal server error." });
  }
};

// VERIFY OTP
export const verifyOTP = async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.status(400).json({ message: "User not found" });
    if (user.otp !== parseInt(otp))
      return res.status(400).json({ message: "Invalid OTP" });

    user.isVerified = true;
    user.otp = null;
    await user.save();

    res.status(200).json({ message: "OTP verified successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error verifying OTP" });
  }
};

// LOGIN (Send OTP)
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password, token } = req.body;

    if (!token) {
      return res.status(400).json({ message: "reCAPTCHA token missing" });
    }

    // ✅ Verify reCAPTCHA (POST form-encoded for reliability)
    try {
      const secret = process.env.RECAPTCHA_SECRET_KEY;
      const params = new URLSearchParams();
      params.append("secret", secret || "");
      params.append("response", token);

      const response = await axios.post(
        "https://www.google.com/recaptcha/api/siteverify",
        params
      );
      const captchaData: any = response.data;

      console.debug("reCAPTCHA verification result:", captchaData);

      if (!captchaData.success) {
        return res
          .status(400)
          .json({ message: "reCAPTCHA verification failed" });
      }
    } catch (captchaErr) {
      console.error("reCAPTCHA verification error:", captchaErr);
      return res.status(500).json({ message: "Error verifying reCAPTCHA" });
    }

    // Continue your login logic
    const user = await User.findOne({ email });
    console.debug("Login attempt for:", email, "userFound:", !!user);
    if (!user) return res.status(400).json({ message: "User not found" });

    if (!password || typeof password !== "string") {
      return res.status(400).json({ message: "Password is required" });
    }

    if (!user.password || typeof user.password !== "string") {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    console.debug("Password match result for", email, ":", isMatch);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid credentials" });

    const otp = Math.floor(100000 + Math.random() * 900000);
    user.otp = otp;
    await user.save();

    await sendEmail(email, "Login OTP Code", `Your login OTP code is ${otp}`);
    res.status(200).json({ message: "OTP sent to email for login" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error during login" });
  }
};

// VERIFY OTP AND GENERATE TOKENS (Only returns access token to client)
export const verifyOTPAndLogin = async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;
    // find email in db
    const user = await User.findOne({ email });

    if (!user) return res.status(400).json({ message: "User not found" });

    // if OTP is wrong, send error
    if (user.otp !== parseInt(otp))
      return res.status(400).json({ message: "Invalid OTP" });

    // Clear OTP and update last login
    user.otp = null;
    user.lastLogin = new Date();
    await user.save();

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
