import dbConnect from "@/lib/dbConnect";
import Member from "@/models/Member";
import Membership from "@/models/Membership";
import Attendance from "@/models/Attendance";
import Payment from "@/models/Payment";
import Sale from "@/models/Sale";
import Product from "@/models/Product";
import Branch from "@/models/Branch";
import MembershipPlan from "@/models/MembershipPlan";

export default async function DashboardPage() {
  await dbConnect();

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const threeDaysFromNow = new Date(now);
  threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

  const [
    activeMembersCount,
    activeMembershipsCount,
    checkedInNow,
    lowStockCount,
    todayPayments,
    todaySales,
    monthPayments,
    monthSales,
    allTimePayments,
    allTimeSales,
    recentCheckIns,
    expiringSoon,
  ] = await Promise.all([
    Member.countDocuments({ isActive: true }),
    Membership.countDocuments({ status: "active", endDate: { $gte: now } }),
    Attendance.countDocuments({ checkOutTime: null }),
    Product.countDocuments({ isActive: true, stock: { $lte: 5 } }),
    Payment.find({ status: "completed", paidAt: { $gte: startOfToday } })
      .populate("branch")
      .lean(),
    Sale.find({ createdAt: { $gte: startOfToday } }).populate("branch").lean(),
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
    Membership.find({
      status: "active",
      endDate: { $gte: now, $lte: threeDaysFromNow },
    })
      .populate("member")
      .populate("plan")
      .populate("branch")
      .sort({ endDate: 1 })
      .lean(),
  ]);

  const METHOD_LABELS = { cash: "Cash", mpesa: "M-Pesa", card: "Card", bank_transfer: "Bank Transfer" };

  const todayTxns = [
    ...todayPayments.map((p) => ({
      amount: p.amount,
      method: p.method,
      branchName: p.branch?.name || "Unknown",
    })),
    ...todaySales.map((s) => ({
      amount: s.totalAmount,
      method: s.paymentMethod,
      branchName: s.branch?.name || "Unknown",
    })),
  ];

  const todayTotal = todayTxns.reduce((sum, t) => sum + t.amount, 0);

  const todayByMethod = {};
  const todayByBranch = {};
  for (const t of todayTxns) {
    const methodLabel = METHOD_LABELS[t.method] || t.method;
    todayByMethod[methodLabel] = (todayByMethod[methodLabel] || 0) + t.amount;
    todayByBranch[t.branchName] = (todayByBranch[t.branchName] || 0) + t.amount;
  }
  const todayByMethodSorted = Object.entries(todayByMethod).sort((a, b) => b[1] - a[1]);
  const todayByBranchSorted = Object.entries(todayByBranch).sort((a, b) => b[1] - a[1]);

  const monthRevenue =
    monthPayments.reduce((sum, p) => sum + p.amount, 0) +
    monthSales.reduce((sum, s) => sum + s.totalAmount, 0);

  const allTimeRevenue =
    allTimePayments.reduce((sum, p) => sum + p.amount, 0) +
    allTimeSales.reduce((sum, s) => sum + s.totalAmount, 0);

  const checkIns = JSON.parse(JSON.stringify(recentCheckIns));
  const expiring = JSON.parse(JSON.stringify(expiringSoon));

  return (
    <div>
      <h1 className="font-display text-4xl text-[var(--ng-accent)] mb-1">Dashboard</h1>
      <p className="text-sm text-[var(--ng-text-muted)] mb-8">Overview across all branches.</p>

      {/* Today's Sales — for closing out the till at end of day */}
      <div className="bg-[var(--ng-surface)] border border-[var(--ng-accent-dim)] rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-display text-2xl text-[var(--ng-text)]">Today's sales</h2>
            <p className="text-xs text-[var(--ng-text-muted)]">
              {now.toLocaleDateString(undefined, {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}{" "}
              — for closing out at end of day
            </p>
          </div>
          <p className="font-display text-4xl text-[var(--ng-accent)]">
            KSh {todayTotal.toLocaleString()}
          </p>
        </div>

        {todayTxns.length === 0 ? (
          <p className="text-sm text-[var(--ng-text-muted)]">No sales recorded yet today.</p>
        ) : (
          <div className="grid sm:grid-cols-2 gap-6">
            <div>
              <p className="text-xs uppercase tracking-widest text-[var(--ng-text-muted)] mb-2">
                By payment method
              </p>
              <ul className="space-y-1.5">
                {todayByMethodSorted.map(([method, amount]) => (
                  <li key={method} className="flex items-center justify-between text-sm">
                    <span className="text-[var(--ng-text)]">{method}</span>
                    <span className="text-[var(--ng-accent)] font-medium">
                      KSh {amount.toLocaleString()}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-[var(--ng-text-muted)] mb-2">
                By branch
              </p>
              <ul className="space-y-1.5">
                {todayByBranchSorted.map(([branchName, amount]) => (
                  <li key={branchName} className="flex items-center justify-between text-sm">
                    <span className="text-[var(--ng-text)]">{branchName}</span>
                    <span className="text-[var(--ng-text-muted)]">
                      KSh {amount.toLocaleString()}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Expiring soon alert banner */}
      {expiring.length > 0 && (
        <div className="bg-amber-950/30 border border-amber-800 rounded-xl p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-xl text-amber-400">
              {expiring.length} membership{expiring.length === 1 ? "" : "s"} expiring within 3
              days
            </h2>
          </div>
          <ul className="space-y-1.5">
            {expiring.map((m) => (
              <li key={m._id} className="flex items-center justify-between text-sm">
                <span className="text-[var(--ng-text)]">
                  {m.member?.firstName} {m.member?.lastName}{" "}
                  <span className="text-[var(--ng-text-muted)]">
                    · {m.plan?.name} · {m.branch?.name}
                  </span>
                </span>
                <span className="text-amber-400 font-medium">
                  Expires {new Date(m.endDate).toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <StatCard label="Active members" value={activeMembersCount} />
        <StatCard label="Active memberships" value={activeMembershipsCount} />
        <StatCard label="Checked in now" value={checkedInNow} accent />
        <StatCard label="Revenue this month" value={`KSh ${monthRevenue.toLocaleString()}`} />
        <StatCard label="Low stock items" value={lowStockCount} warn={lowStockCount > 0} />
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
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