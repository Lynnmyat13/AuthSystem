import express from "express";
import cors, { CorsOptions } from "cors";
import dotenv from "dotenv";
import session from "express-session";
import passport from "passport";
import connectDB from "./config/db";
import "./config/googleOAuth";
import authRoutes from "./routes/authRoutes";

dotenv.config();
connectDB();

const app = express();

if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

const allowedOrigins = new Set(
  [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
    "https://auth-system-eta-gilt.vercel.app",
    process.env.FRONTEND_URL,
    ...(process.env.ALLOWED_ORIGINS || "").split(","),
  ]
    .filter((origin): origin is string => Boolean(origin?.trim()))
    .map((origin) => origin.trim().replace(/\/$/, "")),
);

const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    // Requests without an Origin header are not browser cross-origin requests.
    callback(null, !origin || allowedOrigins.has(origin.replace(/\/$/, "")));
  },
  credentials: true,
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
app.use(express.json());

// Session configuration for OAuth
app.use(
  session({
    secret: process.env.SESSION_SECRET || "your-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    },
  }),
);

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// 👇 This line is critical — must match frontend baseURL
app.use("/api/auth", authRoutes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
