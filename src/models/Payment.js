import mongoose from "mongoose";

const PaymentSchema = new mongoose.Schema(
  {
    member: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Member",
      required: true,
    },
    membership: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Membership",
      required: true,
    },
    branch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    method: {
      type: String,
      enum: ["cash", "mpesa", "card", "bank_transfer"],
      required: true,
    },
    transactionId: {
      type: String, // e.g. M-Pesa transaction code
      trim: true,
    },
    status: {
      type: String,
      enum: ["pending", "completed", "failed", "refunded"],
      default: "completed",
    },
    paidAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

export default mongoose.models.Payment || mongoose.model("Payment", PaymentSchema);