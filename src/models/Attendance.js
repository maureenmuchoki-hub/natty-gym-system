import mongoose from "mongoose";

const AttendanceSchema = new mongoose.Schema(
  {
    member: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Member",
      required: true,
    },
    branch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      required: true,
    },
    checkInTime: {
      type: Date,
      required: true,
      default: Date.now,
    },
    checkOutTime: {
      type: Date,
    },
  },
  { timestamps: true }
);

AttendanceSchema.index({ member: 1, checkInTime: -1 });

export default mongoose.models.Attendance || mongoose.model("Attendance", AttendanceSchema);