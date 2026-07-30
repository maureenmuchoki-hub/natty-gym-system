import dbConnect from "@/lib/dbConnect";
import Member from "@/models/Member";
import Membership from "@/models/Membership";
import Attendance from "@/models/Attendance";
import Payment from "@/models/Payment";
import Sale from "@/models/Sale";
import Product from "@/models/Product";
import Branch from "@/models/Branch";

export default async function DashboardPage() {
  await dbConnect();

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    activeMembersCount,
    activeMembershipsCount,
    checkedInNow,
    lowStockCount,
    monthPayments,
    monthSales,
    allTimePayments,
    allTimeSales,
    recentCheckIns,
  ] = await Promise.all([
    Member.countDocuments({ isActive: true }),
    Membership.countDocuments({ status: "active", endDate: { $gte: now } }),
    Attendance.countDocuments({ checkOutTime: null }),
    Product.countDocuments({ isActive: true, stock: { $lte: 5 } }),
    Payment.find({ status: "completed", paidAt: { $gte: startOfMonth } }).lean(),
    Sale.find({ createdAt: { $gte: startOfMonth } }).lean(),
    Payment.find({ status: "completed" }).lean(),
    Sale.find().lean(),
    Attendance.find({ checkOutTime: null })
      .populate("member")
      .populate("branch")
      .sort({ checkInTime: -1 })
      .limit(5)
      .lean(),
  ]);

  const monthRevenue =
    monthPayments.reduce((sum, p) => sum + p.amount, 0) +
    monthSales.reduce((sum, s) => sum + s.totalAmount, 0);

  const allTimeRevenue =
    allTimePayments.reduce((sum, p) => sum + p.amount, 0) +
    allTimeSales.reduce((sum, s) => sum + s.totalAmount, 0);

  const checkIns = JSON.parse(JSON.stringify(recentCheckIns));

  return (
    <div>
      <h1 className="font-display text-4xl text-[var(--ng-accent)] mb-1">Dashboard</h1>
      <p className="text-sm text-[var(--ng-text-muted)] mb-8">Overview across all branches.</p>

      {/* Stat cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <StatCard label="Active members" value={activeMembersCount} />
        <StatCard label="Active memberships" value={activeMembershipsCount} />
        <StatCard label="Checked in now" value={checkedInNow} accent />
        <StatCard label="Revenue this month" value={`KSh ${monthRevenue.toLocaleString()}`} />
        <StatCard
          label="Low stock items"
          value={lowStockCount}
          warn={lowStockCount > 0}
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Currently checked in */}
        <div className="bg-[var(--ng-surface)] border border-[var(--ng-border)] rounded-xl p-6">
          <h2 className="font-display text-2xl text-[var(--ng-text)] mb-4">
            Currently checked in
          </h2>
          {checkIns.length === 0 ? (
            <p className="text-sm text-[var(--ng-text-muted)]">No one's checked in right now.</p>
          ) : (
            <ul className="space-y-2">
              {checkIns.map((a) => (
                <li
                  key={a._id}
                  className="flex items-center justify-between text-sm border-b border-[var(--ng-border)] pb-2 last:border-0"
                >
                  <span className="text-[var(--ng-text)]">
                    {a.member?.firstName} {a.member?.lastName}
                  </span>
                  <span className="text-xs text-[var(--ng-text-muted)]">
                    {a.branch?.name} ·{" "}
                    {new Date(a.checkInTime).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* All-time summary */}
        <div className="bg-[var(--ng-surface)] border border-[var(--ng-border)] rounded-xl p-6">
          <h2 className="font-display text-2xl text-[var(--ng-text)] mb-4">All-time revenue</h2>
          <p className="font-display text-4xl text-[var(--ng-accent)] mb-1">
            KSh {allTimeRevenue.toLocaleString()}
          </p>
          <p className="text-xs text-[var(--ng-text-muted)]">
            Combined memberships + shop sales, all branches, since launch.
          </p>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, accent, warn }) {
  return (
    <div className="bg-[var(--ng-surface)] border border-[var(--ng-border)] rounded-xl p-5">
      <p className="text-xs uppercase tracking-widest text-[var(--ng-text-muted)] mb-1">
        {label}
      </p>
      <p
        className={`font-display text-3xl ${
          warn ? "text-amber-400" : accent ? "text-[var(--ng-accent)]" : "text-[var(--ng-text)]"
        }`}
      >
        {value}
      </p>
    </div>
  );
}