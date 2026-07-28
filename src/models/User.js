import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      select: false, // never return password by default in queries
    },
    role: {
      type: String,
      enum: ["admin", "staff", "member"],
      default: "staff",
    },
    branch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Hash password before saving, only if it was changed
// NOTE: no `next` parameter here — since this is an async function,
// Mongoose treats it as "self-completing" and does not pass a next callback.
// Just return when done; do not call next().
UserSchema.pre("save", async function () {
  if (!this.isModified("password")) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Instance method to compare a plaintext password against the hash
UserSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.models.User || mongoose.model("User", UserSchema);