import mongoose from "mongoose";

const MembershipSchema = new mongoose.Schema(
  {
    member: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Member",
      required: true,
    },
    plan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MembershipPlan",
      required: true,
    },
    branch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    endDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "expired", "cancelled"],
      default: "active",
    },
    autoRenew: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Convenience index for quickly finding a member's current active membership
MembershipSchema.index({ member: 1, status: 1 });

export default mongoose.models.Membership || mongoose.model("Membership", MembershipSchema);