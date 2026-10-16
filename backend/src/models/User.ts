import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String },
  email: { type: String, required: true, unique: true, trim: true, lowercase: true },
  password: { type: String }, // Made optional for OAuth users
  otp: { type: Number, select: false },
  otpExpiresAt: { type: Date, select: false },
  otpAttempts: { type: Number, default: 0, select: false },
  otpLastSentAt: { type: Date, select: false },
  otpPurpose: {
    type: String,
    enum: ["login"],
    select: false,
  },
  isVerified: { type: Boolean, default: false },
  lastLogin: { type: Date },
  isActive: { type: Boolean, default: true },
  googleId: { type: String, unique: true, sparse: true },
  provider: { type: String, enum: ["local", "google"], default: "local" },
});

export default mongoose.model("User", userSchema);
