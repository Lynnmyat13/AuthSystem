"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.googleAuthFailure = exports.googleAuthSuccess = exports.googleCallback = exports.googleAuth = exports.logoutAll = exports.logout = exports.refreshToken = exports.verifyOTPAndLogin = exports.login = exports.verifyOTP = exports.register = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const passport_1 = __importDefault(require("passport"));
const User_1 = __importDefault(require("../models/User"));
const sentEmail_1 = __importDefault(require("../utils/sentEmail"));
const axios_1 = __importDefault(require("axios"));
const tokenManager_1 = require("../utils/tokenManager");
// Function to generate numeric OTP
const generateNumericOTP = (length = 6) => {
    const min = Math.pow(10, length - 1);
    const max = Math.pow(10, length) - 1;
    return Math.floor(Math.random() * (max - min + 1)) + min;
};
// REGISTER
const register = async (req, res) => {
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
                message: "Password must be at least 8 characters and include uppercase, lowercase, number, and special character.",
            });
        }
        const existingUser = await User_1.default.findOne({ email });
        if (existingUser) {
            return res
                .status(400)
                .json({ message: "User already exists with this email." });
        }
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        const otp = generateNumericOTP(6);
        const user = new User_1.default({
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
    }
    catch (error) {
        console.error("Registration error:", error.message);
        res.status(500).json({ message: "Internal server error." });
    }
};
exports.register = register;
// VERIFY OTP
const verifyOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;
        const user = await User_1.default.findOne({ email });
        if (!user)
            return res.status(400).json({ message: "User not found" });
        if (user.otp !== parseInt(otp))
            return res.status(400).json({ message: "Invalid OTP" });
        user.isVerified = true;
        user.otp = null;
        await user.save();
        res.status(200).json({ message: "OTP verified successfully" });
    }
    catch (error) {
        res.status(500).json({ message: "Error verifying OTP" });
    }
};
exports.verifyOTP = verifyOTP;
// LOGIN (Send OTP)
const login = async (req, res) => {
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
            const response = await axios_1.default.post("https://www.google.com/recaptcha/api/siteverify", params);
            const captchaData = response.data;
            console.debug("reCAPTCHA verification result:", captchaData);
            if (!captchaData.success) {
                return res
                    .status(400)
                    .json({ message: "reCAPTCHA verification failed" });
            }
        }
        catch (captchaErr) {
            console.error("reCAPTCHA verification error:", captchaErr);
            return res.status(500).json({ message: "Error verifying reCAPTCHA" });
        }
        // Continue your login logic
        const user = await User_1.default.findOne({ email });
        console.debug("Login attempt for:", email, "userFound:", !!user);
        if (!user)
            return res.status(400).json({ message: "User not found" });
        if (!password || typeof password !== "string") {
            return res.status(400).json({ message: "Password is required" });
        }
        if (!user.password || typeof user.password !== "string") {
            return res.status(400).json({ message: "Invalid credentials" });
        }
        const isMatch = await bcryptjs_1.default.compare(password, user.password);
        console.debug("Password match result for", email, ":", isMatch);
        if (!isMatch)
            return res.status(400).json({ message: "Invalid credentials" });
        const otp = Math.floor(100000 + Math.random() * 900000);
        user.otp = otp;
        await user.save();
        await (0, sentEmail_1.default)(email, "Login OTP Code", `Your login OTP code is ${otp}`);
        res.status(200).json({ message: "OTP sent to email for login" });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error during login" });
    }
};
exports.login = login;
// VERIFY OTP AND GENERATE TOKENS (Only returns access token to client)
const verifyOTPAndLogin = async (req, res) => {
    try {
        const { email, otp } = req.body;
        // find email in db
        const user = await User_1.default.findOne({ email });
        if (!user)
            return res.status(400).json({ message: "User not found" });
        // if OTP is wrong, send error
        if (user.otp !== parseInt(otp))
            return res.status(400).json({ message: "Invalid OTP" });
        // Clear OTP and update last login
        user.otp = null;
        user.lastLogin = new Date();
        await user.save();
        // Generate tokens
        const accessToken = (0, tokenManager_1.generateAccessToken)(user._id.toString());
        const refreshToken = (0, tokenManager_1.generateRefreshToken)(); // Server-side only
        // Store tokens in database (refresh token never sent to client)
        await (0, tokenManager_1.storeTokens)(user._id.toString(), accessToken, refreshToken);
        res.status(200).json({
            message: "Login successful",
            accessToken, // Only access token sent to client
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
            },
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error during login verification" });
    }
};
exports.verifyOTPAndLogin = verifyOTPAndLogin;
// REFRESH ACCESS TOKEN (Server-side refresh token lookup)
const refreshToken = async (req, res) => {
    try {
        const { accessToken } = req.body;
        if (!accessToken) {
            return res.status(400).json({ message: "Access token required" });
        }
        // Use server-side logic that refreshes based on an active access token
        const newAccessToken = await (0, tokenManager_1.refreshAccessTokenByAccessToken)(accessToken);
        res.status(200).json({
            message: "Access token refreshed successfully",
            accessToken: newAccessToken,
        });
    }
    catch (error) {
        console.error(error);
        res.status(401).json({ message: "Invalid or expired access token" });
    }
};
exports.refreshToken = refreshToken;
// LOGOUT
const logout = async (req, res) => {
    try {
        const { accessToken } = req.body;
        if (accessToken) {
            // Revoke specific token
            await (0, tokenManager_1.revokeToken)(accessToken);
        }
        res.status(200).json({ message: "Logout successful" });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error during logout" });
    }
};
exports.logout = logout;
// LOGOUT ALL DEVICES
const logoutAll = async (req, res) => {
    try {
        const { userId } = req.body;
        if (!userId) {
            return res.status(400).json({ message: "User ID required" });
        }
        // Revoke all tokens for user
        await (0, tokenManager_1.revokeUserTokens)(userId);
        res.status(200).json({ message: "Logged out from all devices" });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error during logout" });
    }
};
exports.logoutAll = logoutAll;
// GOOGLE OAUTH ROUTES
exports.googleAuth = passport_1.default.authenticate("google", {
    scope: ["profile", "email"],
});
const googleCallback = async (req, res) => {
    try {
        const user = req.user;
        if (!user) {
            return res.status(400).json({ message: "Google authentication failed" });
        }
        // Generate tokens for the user
        const accessToken = (0, tokenManager_1.generateAccessToken)(user._id.toString());
        const refreshToken = (0, tokenManager_1.generateRefreshToken)();
        // Store tokens in database
        await (0, tokenManager_1.storeTokens)(user._id.toString(), accessToken, refreshToken);
        // Redirect to frontend with tokens
        const frontendURL = process.env.FRONTEND_URL || "http://localhost:5173";
        const redirectURL = `${frontendURL}/dashboard?token=${accessToken}&user=${encodeURIComponent(JSON.stringify({
            id: user._id,
            name: user.name,
            email: user.email,
        }))}`;
        res.redirect(redirectURL);
    }
    catch (error) {
        console.error("Google callback error:", error);
        const frontendURL = process.env.FRONTEND_URL || "http://localhost:5173";
        res.redirect(`${frontendURL}/login?error=google_auth_failed`);
    }
};
exports.googleCallback = googleCallback;
// GOOGLE OAUTH SUCCESS/Failure handlers
const googleAuthSuccess = (req, res) => {
    res.json({ message: "Google authentication successful", user: req.user });
};
exports.googleAuthSuccess = googleAuthSuccess;
const googleAuthFailure = (req, res) => {
    res.status(400).json({ message: "Google authentication failed" });
};
exports.googleAuthFailure = googleAuthFailure;
