import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/requireAuth";
import dbConnect from "@/lib/dbConnect";
import Attendance from "@/models/Attendance";
import Branch from "@/models/Branch";

const HOUR_LABELS = Array.from({ length: 24 }, (_, h) => {
  const period = h < 12 ? "AM" : "PM";
  const display = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${display}${period}`;
});

// Gyms are rarely busy 12am-5am — trim the chart to opening hours for readability
const DISPLAY_START_HOUR = 5;
const DISPLAY_END_HOUR = 22;

export default async function PeakHoursPage() {
  const user = await getAuthUser();
  if (user.role !== "admin" && user.role !== "accountant") {
    redirect("/dashboard");
  }

  await dbConnect();

  const branches = await Branch.find({ isActive: true }).sort({ name: 1 }).lean();
  const attendance = await Attendance.find().select("branch checkInTime").lean();

  const branchData = branches.map((branch) => {
    const hourCounts = Array(24).fill(0);
    const branchAttendance = attendance.filter(
      (a) => a.branch.toString() === branch._id.toString()
    );
    for (const a of branchAttendance) {
      const hour = new Date(a.checkInTime).getHours();
      hourCounts[hour]++;
    }

    const displayHours = hourCounts
      .map((count, hour) => ({ hour, count }))
      .filter((h) => h.hour >= DISPLAY_START_HOUR && h.hour <= DISPLAY_END_HOUR);

    const maxCount = Math.max(...displayHours.map((h) => h.count), 1);
    const peak = displayHours.reduce((max, h) => (h.count > max.count ? h : max), {
      hour: DISPLAY_START_HOUR,
      count: 0,
    });

    return {
      name: branch.name,
      totalVisits: branchAttendance.length,
      peakHourLabel: peak.count > 0 ? HOUR_LABELS[peak.hour] : "—",
      displayHours,
      maxCount,
    };
  });

  return (
    <div>
      <h1 className="font-display text-4xl text-[var(--ng-accent)] mb-1">Peak Hours</h1>
      <p className="text-sm text-[var(--ng-text-muted)] mb-8">
        When each branch gets busiest, based on all recorded check-ins.
      </p>

      <div className="grid md:grid-cols-2 gap-5">
        {branchData.map((branch) => (
          <div
            key={branch.name}
            className="bg-[var(--ng-surface)] border border-[var(--ng-border)] rounded-xl p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-2xl text-[var(--ng-text)]">{branch.name}</h2>
              <div className="text-right">
                <p className="text-xs text-[var(--ng-text-muted)]">Busiest hour</p>
                <p className="text-[var(--ng-accent)] font-semibold">{branch.peakHourLabel}</p>
              </div>
            </div>

            {branch.totalVisits === 0 ? (
              <p className="text-sm text-[var(--ng-text-muted)]">No check-in data yet.</p>
            ) : (
              <div className="flex items-end gap-1 h-32">
                {branch.displayHours.map(({ hour, count }) => (
                  <div key={hour} className="flex-1 flex flex-col items-center gap-1 group">
                    <div className="w-full flex-1 flex items-end">
                      <div
                        className="w-full bg-[var(--ng-accent)] rounded-sm transition-all"
                        style={{
                          height: `${Math.max((count / branch.maxCount) * 100, count > 0 ? 4 : 0)}%`,
                          opacity: count === 0 ? 0.15 : 1,
                        }}
                        title={`${HOUR_LABELS[hour]}: ${count} check-in${count === 1 ? "" : "s"}`}
                      />
                    </div>
                    {hour % 3 === 0 && (
                      <span className="text-[10px] text-[var(--ng-text-muted)] rotate-0">
                        {HOUR_LABELS[hour]}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}

            <p className="text-xs text-[var(--ng-text-muted)] mt-4">
              {branch.totalVisits} total check-in{branch.totalVisits === 1 ? "" : "s"} recorded
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}