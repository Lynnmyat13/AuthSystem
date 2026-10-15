"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const express_session_1 = __importDefault(require("express-session"));
const passport_1 = __importDefault(require("passport"));
const db_1 = __importDefault(require("./config/db"));
require("./config/googleOAuth");
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
dotenv_1.default.config();
(0, db_1.default)();
const app = (0, express_1.default)();
if (process.env.NODE_ENV === "production") {
    app.set("trust proxy", 1);
}
const allowedOrigins = new Set([
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
    "https://auth-system-eta-gilt.vercel.app",
    process.env.FRONTEND_URL,
    ...(process.env.ALLOWED_ORIGINS || "").split(","),
]
    .filter((origin) => Boolean(origin?.trim()))
    .map((origin) => origin.trim().replace(/\/$/, "")));
const corsOptions = {
    origin: (origin, callback) => {
        // Requests without an Origin header are not browser cross-origin requests.
        callback(null, !origin || allowedOrigins.has(origin.replace(/\/$/, "")));
    },
    credentials: true,
    optionsSuccessStatus: 204,
};
app.use((0, cors_1.default)(corsOptions));
app.options("*", (0, cors_1.default)(corsOptions));
app.use(express_1.default.json());
// Session configuration for OAuth
app.use((0, express_session_1.default)({
    secret: process.env.SESSION_SECRET || "your-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
    },
}));
// Initialize Passport
app.use(passport_1.default.initialize());
app.use(passport_1.default.session());
// 👇 This line is critical — must match frontend baseURL
app.use("/api/auth", authRoutes_1.default);
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
