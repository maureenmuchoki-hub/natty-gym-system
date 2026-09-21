import mongoose from "mongoose";

const CreditNoteSchema = new mongoose.Schema(
  {
    days: { type: Number, required: true },
    reason: { type: String },
    appliedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

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
    // Days credited back to this membership (e.g. long absence)
    creditedDays: {
      type: Number,
      default: 0,
    },
    creditNotes: {
      type: [CreditNoteSchema],
      default: [],
    },
  },
  { timestamps: true }
);

MembershipSchema.index({ member: 1, status: 1 });

export default mongoose.models.Membership || mongoose.model("Membership", MembershipSchema);