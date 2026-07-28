import mongoose from "mongoose";

const BranchSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    location: {
      type: String,
      required: true,
    },
    address: {
      type: String,
    },
    contactPhone: {
      type: String,
    },
    services: {
      type: [String],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export default mongoose.models.Branch || mongoose.model("Branch", BranchSchema);