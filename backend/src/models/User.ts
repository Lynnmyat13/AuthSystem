import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
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

export default mongoose.model("User", userSchema);
