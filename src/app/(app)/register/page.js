import dbConnect from "@/lib/dbConnect";
import Membership from "@/models/Membership";
import Attendance from "@/models/Attendance";
import Member from "@/models/Member";
import MembershipPlan from "@/models/MembershipPlan";
import Branch from "@/models/Branch";
import RegisterTable from "./RegisterTable";

const UNTRACKED_TYPES = ["daily", "kids"];

export default async function RegisterPage() {
  await dbConnect();

  const memberships = await Membership.find()
    .populate("member")
    .populate("plan")
    .populate("branch")
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();

  const trackable = memberships.filter((m) => !UNTRACKED_TYPES.includes(m.plan?.type));
  const memberIds = [...new Set(trackable.map((m) => m.member?._id?.toString()).filter(Boolean))];

  const attendanceRecords = await Attendance.find({ member: { $in: memberIds } })
    .sort({ checkInTime: 1 })
    .lean();

  const rows = trackable.map((m) => {
    const start = new Date(m.startDate);
    const end = new Date(m.endDate);
    const now = new Date();
    const effectiveEnd = end < now ? end : now;

    const memberAttendance = attendanceRecords.filter(
      (a) =>
        a.member.toString() === m.member?._id?.toString() &&
        new Date(a.checkInTime) >= start &&
        new Date(a.checkInTime) <= effectiveEnd
    );

    const uniqueDays = [
      ...new Set(memberAttendance.map((a) => new Date(a.checkInTime).toDateString())),
    ].sort((a, b) => new Date(a) - new Date(b));

    const totalDays = m.plan?.durationDays || 1;
    const rate = Math.min(100, Math.round((uniqueDays.length / totalDays) * 100));
    const isExpired = end < now;

    return {
      id: m._id.toString(),
      memberName: m.member ? `${m.member.firstName} ${m.member.lastName}` : "Unknown",
      planName: m.plan?.name || "Unknown plan",
      branchName: m.branch?.name || "Unknown",
      startDate: m.startDate.toISOString(),
      endDate: m.endDate.toISOString(),
      status: m.status === "cancelled" ? "cancelled" : isExpired ? "expired" : "active",
      daysAttended: uniqueDays.length,
      totalDays,
      rate,
      attendanceDates: uniqueDays, // already strings from toDateString()
    };
  });

  return (
    <div>
      <h1 className="font-display text-4xl text-[var(--ng-accent)] mb-1">Register</h1>
      <p className="text-sm text-[var(--ng-text-muted)] mb-8">
        Track how often members are actually using their memberships.
      </p>

      <RegisterTable rows={rows} />
    </div>
  );
}