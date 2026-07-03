"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const passport_1 = __importDefault(require("passport"));
const passport_google_oauth20_1 = require("passport-google-oauth20");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const User_1 = __importDefault(require("../models/User"));
// Configure Google OAuth Strategy
const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
const googleCallbackUrl = process.env.GOOGLE_CALLBACK_URL || "http://localhost:4000/api/auth/google/callback";
if (!googleClientId || !googleClientSecret) {
    console.warn("Google OAuth not configured: GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET is missing.");
}
else {
    passport_1.default.use(new passport_google_oauth20_1.Strategy({
        clientID: googleClientId,
        clientSecret: googleClientSecret,
        callbackURL: googleCallbackUrl,
    }, async (accessToken, refreshToken, profile, done) => {
        try {
            let user = await User_1.default.findOne({ email: profile.emails?.[0]?.value });
            if (user) {
                user.lastLogin = new Date();
                await user.save();
                return done(null, user);
            }
            else {
                user = new User_1.default({
                    name: profile.displayName,
                    email: profile.emails?.[0]?.value,
                    password: null, // No password for OAuth users
                    role: "User",
                    isVerified: true,
                    googleId: profile.id,
                    provider: "google",
                });
                await user.save();
                return done(null, user);
            }
        }
        catch (error) {
            return done(error);
        }
    }));
}
// Serialize user for session
passport_1.default.serializeUser((user, done) => {
    done(null, user._id);
});
// Deserialize user from session
passport_1.default.deserializeUser(async (id, done) => {
    try {
        const user = await User_1.default.findById(id);
        if (user) {
            done(null, user);
        }
        else {
            done(null, false); // ✅ Use 'false' instead of 'null' when user not found
        }
    }
    catch (error) {
        done(error, false); // ✅ Use 'false' for the user param
    }
});
exports.default = passport_1.default;
