"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const tokenSchema = new mongoose_1.default.Schema({
    userId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    accessToken: {
        type: String,
        required: true,
        unique: true,
    },
    refreshToken: {
        type: String,
        required: true,
        unique: true,
    },
    accessTokenExpiresAt: {
        type: Date,
        required: true,
    },
    refreshTokenExpiresAt: {
        type: Date,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
});
// Automatically delete expired refresh tokens
tokenSchema.index({ refreshTokenExpiresAt: 1 }, { expireAfterSeconds: 0 });
tokenSchema.index({ userId: 1, isActive: 1 });
exports.default = mongoose_1.default.model("Token", tokenSchema);
