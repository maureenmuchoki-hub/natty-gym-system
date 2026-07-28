import mongoose from "mongoose";

const PLAN_TYPES = [
  "daily",
  "weekly",
  "biweekly",
  "monthly",
  "quarterly",
  "half_yearly",
  "yearly",
  "student",
  "kids",
];

const MembershipPlanSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: PLAN_TYPES,
      required: true,
    },
    branch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    durationDays: {
      type: Number,
      required: true,
      min: 1,
    },
    requiresVerification: {
      type: Boolean,
      default: false,
    },
    verificationDocument: {
      type: String, // e.g. "Valid Student ID", "Birth Certificate"
    },
    description: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export const MEMBERSHIP_PLAN_TYPES = PLAN_TYPES;

export default mongoose.models.MembershipPlan ||
  mongoose.model("MembershipPlan", MembershipPlanSchema);