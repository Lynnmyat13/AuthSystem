"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const userSchema = new mongoose_1.default.Schema({
    name: { type: String },
    email: { type: String, required: true, unique: true },
    password: { type: String }, // Made optional for OAuth users
    otp: { type: Number },
    isVerified: { type: Boolean, default: false },
    lastLogin: { type: Date },
    isActive: { type: Boolean, default: true },
    googleId: { type: String, unique: true, sparse: true },
    provider: { type: String, enum: ["local", "google"], default: "local" },
});
exports.default = mongoose_1.default.model("User", userSchema);
