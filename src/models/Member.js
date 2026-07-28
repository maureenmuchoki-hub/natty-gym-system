import mongoose from "mongoose";

const MemberSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
    },
    dateOfBirth: {
      type: Date,
    },
    gender: {
      type: String,
      enum: ["male", "female", "other"],
    },
    branch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      required: true,
    },
    photoUrl: {
      type: String,
    },
    emergencyContactName: {
      type: String,
    },
    emergencyContactPhone: {
      type: String,
    },
    // For student / kids packages requiring verification documents
    verificationDocumentUrl: {
      type: String,
    },
    joinDate: {
      type: Date,
      default: Date.now,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export default mongoose.models.Member || mongoose.model("Member", MemberSchema);