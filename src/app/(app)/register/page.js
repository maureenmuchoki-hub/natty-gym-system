import { getAuthUser } from "@/lib/requireAuth";
import dbConnect from "@/lib/dbConnect";
import Membership from "@/models/Membership";
import Attendance from "@/models/Attendance";
import Member from "@/models/Member";
import MembershipPlan from "@/models/MembershipPlan";
import Branch from "@/models/Branch";
import RegisterTable from "./RegisterTable";

const UNTRACKED_TYPES = ["daily", "kids"];

export default async function RegisterPage() {
  const user = await getAuthUser();
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

    const uniqueDays = new Set(memberAttendance.map((a) => new Date(a.checkInTime).toDateString()));

    // Build one entry per visit with duration, most recent first
    const visits = memberAttendance
      .map((a) => {
        const checkIn = new Date(a.checkInTime);
        const checkOut = a.checkOutTime ? new Date(a.checkOutTime) : null;
        const durationMinutes = checkOut
          ? Math.round((checkOut - checkIn) / (1000 * 60))
          : null;
        return {
          date: checkIn.toDateString(),
          checkIn: checkIn.toISOString(),
          checkOut: checkOut ? checkOut.toISOString() : null,
          durationMinutes,
        };
      })
      .sort((a, b) => new Date(b.checkIn) - new Date(a.checkIn));

    const totalMinutes = visits.reduce((sum, v) => sum + (v.durationMinutes || 0), 0);

    // Find stretches of 7+ consecutive days with no check-in, within the paid period.
    // Boundaries are the membership start, each attended day, and today (or expiry).
    const MIN_GAP_DAYS = 7;
    const DAY_MS = 1000 * 60 * 60 * 24;
    const attendedTimes = [...uniqueDays]
      .map((d) => new Date(d).getTime())
      .sort((a, b) => a - b);
    const boundaries = [start.getTime(), ...attendedTimes, effectiveEnd.getTime()];

    const absenceGaps = [];
    for (let i = 0; i < boundaries.length - 1; i++) {
      const gapDays = Math.floor((boundaries[i + 1] - boundaries[i]) / DAY_MS) - 1;
      if (gapDays >= MIN_GAP_DAYS) {
        absenceGaps.push({
          days: gapDays,
          from: new Date(boundaries[i] + DAY_MS).toISOString(),
          to: new Date(boundaries[i + 1] - DAY_MS).toISOString(),
        });
      }
    }
    const eligibleDays = absenceGaps.reduce((sum, g) => sum + g.days, 0);

    const totalDays = m.plan?.durationDays || 1;
    const rate = Math.min(100, Math.round((uniqueDays.size / totalDays) * 100));
    const isExpired = end < now;

    return {
      id: m._id.toString(),
      memberName: m.member ? `${m.member.firstName} ${m.member.lastName}` : "Unknown",
      planName: m.plan?.name || "Unknown plan",
      branchName: m.branch?.name || "Unknown",
      status: m.status === "cancelled" ? "cancelled" : isExpired ? "expired" : "active",
      daysAttended: uniqueDays.size,
      totalDays,
      rate,
      totalMinutes,
      visits,
      absenceGaps,
      eligibleDays,
      creditedDays: m.creditedDays || 0,
      endDate: end.toISOString(),
    };
  });

  return (
    <div>
      <h1 className="font-display text-4xl text-[var(--ng-accent)] mb-1">Register</h1>
      <p className="text-sm text-[var(--ng-text-muted)] mb-8">
        Track how often — and how long — members are actually using their memberships.
      </p>

      <RegisterTable rows={rows} currentUserRole={user.role} />
    </div>
  );
}