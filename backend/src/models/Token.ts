import mongoose from "mongoose";

const tokenSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
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

export default mongoose.model("Token", tokenSchema);
