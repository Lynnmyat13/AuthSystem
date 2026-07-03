import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import dotenv from "dotenv";
dotenv.config();
import User from "../models/User";
import { generateAccessToken, generateRefreshToken, storeTokens } from "../utils/tokenManager";

// Configure Google OAuth Strategy
const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
const googleCallbackUrl = process.env.GOOGLE_CALLBACK_URL || "http://localhost:4000/api/auth/google/callback";

if (!googleClientId || !googleClientSecret) {
    console.warn("Google OAuth not configured: GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET is missing.");
} else {
    passport.use(
        new GoogleStrategy(
            {
                clientID: googleClientId,
                clientSecret: googleClientSecret,
                callbackURL: googleCallbackUrl,
            },

            async (accessToken, refreshToken, profile, done) => {
                try {
                    let user = await User.findOne({ email: profile.emails?.[0]?.value });

                    if (user) {
                        user.lastLogin = new Date();
                        await user.save();
                        return done(null, user);
                    } else {
                        user = new User({
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
                } catch (error) {
                    return done(error as Error);
                }
            }
        )
    );
}


// Serialize user for session
passport.serializeUser((user: any, done) => {
    done(null, user._id);
});

// Deserialize user from session
passport.deserializeUser(async (id: string, done) => {
    try {
        const user = await User.findById(id);
        if (user) {
            done(null, user);
        } else {
            done(null, false); // ✅ Use 'false' instead of 'null' when user not found
        }
    } catch (error) {
        done(error as Error, false); // ✅ Use 'false' for the user param
    }
});


export default passport;
