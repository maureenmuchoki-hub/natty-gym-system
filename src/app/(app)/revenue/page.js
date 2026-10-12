import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/requireAuth";
import dbConnect from "@/lib/dbConnect";
import Payment from "@/models/Payment";
import Sale from "@/models/Sale";
import Branch from "@/models/Branch";
import Member from "@/models/Member";
import Membership from "@/models/Membership";
import MembershipPlan from "@/models/MembershipPlan";
import TransactionsTable from "./TransactionsTable";
import BranchTrendChart from "./BranchTrendChart";

const METHOD_LABELS = {
  cash: "Cash",
  mpesa: "M-Pesa",
  card: "Card",
  bank_transfer: "Bank Transfer",
};

export default async function RevenuePage() {
  const user = await getAuthUser();
  if (user.role !== "admin" && user.role !== "accountant") {
    redirect("/dashboard");
  }

  await dbConnect();

  const payments = await Payment.find({ status: "completed" })
    .populate("branch")
    .populate("member")
    .lean();

  const sales = await Sale.find().populate("branch").populate("member").lean();

  const branches = await Branch.find({ isActive: true }).sort({ name: 1 }).lean();
  const allMemberships = await Membership.find().populate("plan").populate("branch").lean();
  const allMembers = await Member.find().select("createdAt").lean();

  const paymentsData = JSON.parse(JSON.stringify(payments));
  const salesData = JSON.parse(JSON.stringify(sales));

  const membershipTxns = paymentsData.map((p) => ({
    id: p._id,
    type: "membership",
    amount: p.amount,
    branchName: p.branch?.name || "Unknown",
    memberName: p.member ? `${p.member.firstName} ${p.member.lastName}` : "—",
    method: p.method,
    date: p.paidAt,
    label: "Membership payment",
  }));

  const shopTxns = salesData.map((s) => ({
    id: s._id,
    type: "shop",
    amount: s.totalAmount,
    branchName: s.branch?.name || "Unknown",
    memberName: s.member ? `${s.member.firstName} ${s.member.lastName}` : "Walk-in",
    method: s.paymentMethod,
    date: s.createdAt,
    label: `Shop sale (${s.items.length} item${s.items.length === 1 ? "" : "s"})`,
  }));

  const allTxns = [...membershipTxns, ...shopTxns].sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  );

  const totalRevenue = allTxns.reduce((sum, t) => sum + t.amount, 0);
  const membershipTotal = membershipTxns.reduce((sum, t) => sum + t.amount, 0);
  const shopTotal = shopTxns.reduce((sum, t) => sum + t.amount, 0);

  const byBranch = {};
  const byMethod = {};

  for (const t of allTxns) {
    byBranch[t.branchName] = (byBranch[t.branchName] || 0) + t.amount;
    const methodLabel = METHOD_LABELS[t.method] || t.method;
    byMethod[methodLabel] = (byMethod[methodLabel] || 0) + t.amount;
  }

  const byBranchSorted = Object.entries(byBranch).sort((a, b) => b[1] - a[1]);
  const byMethodSorted = Object.entries(byMethod).sort((a, b) => b[1] - a[1]);
  const maxBranchAmount = byBranchSorted[0]?.[1] || 1;

  // Last 12 months of combined revenue, oldest to newest
  const now = new Date();
  const monthBuckets = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    monthBuckets.push({
      key: `${d.getFullYear()}-${d.getMonth()}`,
      month: d.toLocaleDateString(undefined, { month: "short", year: "2-digit" }),
      revenue: 0,
    });
  }
  const bucketByKey = Object.fromEntries(monthBuckets.map((b) => [b.key, b]));
  for (const t of allTxns) {
    const d = new Date(t.date);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    if (bucketByKey[key]) {
      bucketByKey[key].revenue += t.amount;
    }
  }
  const trendData = monthBuckets.map(({ month, revenue }) => ({ month, revenue }));

  // Per-branch monthly revenue trend
  const branchNames = branches.map((b) => b.name);
  const branchMonthBuckets = monthBuckets.map(({ key, month }) => {
    const row = { key, month };
    branchNames.forEach((name) => (row[name] = 0));
    return row;
  });
  const branchBucketByKey = Object.fromEntries(branchMonthBuckets.map((b) => [b.key, b]));
  for (const t of allTxns) {
    const d = new Date(t.date);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    if (branchBucketByKey[key] && branchBucketByKey[key][t.branchName] !== undefined) {
      branchBucketByKey[key][t.branchName] += t.amount;
    }
  }
  const branchTrendData = branchMonthBuckets.map(({ key, ...rest }) => rest);

  // Plan type popularity — which tiers actually sell, by enrollment count and revenue
  const PLAN_TYPE_LABELS = {
    daily: "Daily",
    weekly: "Weekly",
    biweekly: "Bi-Weekly",
    monthly: "Monthly",
    quarterly: "Quarterly",
    half_yearly: "Half-Yearly",
    yearly: "Yearly",
    student: "Student",
    kids: "Kids",
  };
  const planStats = {};
  for (const m of allMemberships) {
    const type = m.plan?.type || "unknown";
    if (!planStats[type]) planStats[type] = { count: 0, revenue: 0 };
    planStats[type].count += 1;
    planStats[type].revenue += m.plan?.price || 0;
  }
  const planStatsSorted = Object.entries(planStats)
    .map(([type, stats]) => ({ type, label: PLAN_TYPE_LABELS[type] || type, ...stats }))
    .sort((a, b) => b.revenue - a.revenue);
  const maxPlanRevenue = planStatsSorted[0]?.revenue || 1;

  // New member signups per month, last 12 months
  const memberMonthBuckets = monthBuckets.map(({ key, month }) => ({ key, month, count: 0 }));
  const memberBucketByKey = Object.fromEntries(memberMonthBuckets.map((b) => [b.key, b]));
  for (const mem of allMembers) {
    const d = new Date(mem.createdAt);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    if (memberBucketByKey[key]) {
      memberBucketByKey[key].count += 1;
    }
  }
  const maxNewMembers = Math.max(...memberMonthBuckets.map((b) => b.count), 1);

  return (
    <div>
      <h1 className="font-display text-4xl text-[var(--ng-accent)] mb-1">Revenue</h1>
      <p className="text-sm text-[var(--ng-text-muted)] mb-8">
        Combined income across memberships and shop sales.
      </p>

      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-[var(--ng-surface)] border border-[var(--ng-border)] rounded-xl p-6 sm:col-span-1">
          <p className="text-xs uppercase tracking-widest text-[var(--ng-text-muted)] mb-1">
            Total revenue
          </p>
          <p className="font-display text-4xl text-[var(--ng-accent)]">
            KSh {totalRevenue.toLocaleString()}
          </p>
          <p className="text-xs text-[var(--ng-text-muted)] mt-1">
            {allTxns.length} transaction{allTxns.length === 1 ? "" : "s"}
          </p>
        </div>

        <div className="bg-[var(--ng-surface)] border border-[var(--ng-border)] rounded-xl p-6">
          <p className="text-xs uppercase tracking-widest text-[var(--ng-text-muted)] mb-1">
            Memberships
          </p>
          <p className="font-display text-3xl text-[var(--ng-text)]">
            KSh {membershipTotal.toLocaleString()}
          </p>
          <p className="text-xs text-[var(--ng-text-muted)] mt-1">
            {membershipTxns.length} payment{membershipTxns.length === 1 ? "" : "s"}
          </p>
        </div>

        <div className="bg-[var(--ng-surface)] border border-[var(--ng-border)] rounded-xl p-6">
          <p className="text-xs uppercase tracking-widest text-[var(--ng-text-muted)] mb-1">
            Shop sales
          </p>
          <p className="font-display text-3xl text-[var(--ng-text)]">
            KSh {shopTotal.toLocaleString()}
          </p>
          <p className="text-xs text-[var(--ng-text-muted)] mt-1">
            {shopTxns.length} sale{shopTxns.length === 1 ? "" : "s"}
          </p>
        </div>
      </div>

      <BranchTrendChart data={branchTrendData} branchNames={branchNames} />

      <div className="grid md:grid-cols-2 gap-5 mb-6">
        <div className="bg-[var(--ng-surface)] border border-[var(--ng-border)] rounded-xl p-6">
          <h2 className="font-display text-2xl text-[var(--ng-text)] mb-4">By branch</h2>
          {byBranchSorted.length === 0 ? (
            <p className="text-sm text-[var(--ng-text-muted)]">No revenue recorded yet.</p>
          ) : (
            <div className="space-y-3">
              {byBranchSorted.map(([branchName, amount]) => (
                <div key={branchName}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-[var(--ng-text)]">{branchName}</span>
                    <span className="text-[var(--ng-text-muted)]">
                      KSh {amount.toLocaleString()}
                    </span>
                  </div>
                  <div className="h-1.5 bg-[var(--ng-bg)] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[var(--ng-accent)] rounded-full"
                      style={{ width: `${(amount / maxBranchAmount) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-[var(--ng-surface)] border border-[var(--ng-border)] rounded-xl p-6">
          <h2 className="font-display text-2xl text-[var(--ng-text)] mb-4">By payment method</h2>
          {byMethodSorted.length === 0 ? (
            <p className="text-sm text-[var(--ng-text-muted)]">No revenue recorded yet.</p>
          ) : (
            <ul className="space-y-2">
              {byMethodSorted.map(([method, amount]) => (
                <li
                  key={method}
                  className="flex items-center justify-between text-sm border-b border-[var(--ng-border)] pb-2 last:border-0"
                >
                  <span className="text-[var(--ng-text)]">{method}</span>
                  <span className="text-[var(--ng-accent)] font-medium">
                    KSh {amount.toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-5 mb-6">
        <div className="bg-[var(--ng-surface)] border border-[var(--ng-border)] rounded-xl p-6">
          <h2 className="font-display text-2xl text-[var(--ng-text)] mb-1">
            Plan popularity
          </h2>
          <p className="text-xs text-[var(--ng-text-muted)] mb-4">
            What's actually selling — worth promoting the top ones, reconsidering the bottom.
          </p>
          {planStatsSorted.length === 0 ? (
            <p className="text-sm text-[var(--ng-text-muted)]">No enrollments yet.</p>
          ) : (
            <div className="space-y-3">
              {planStatsSorted.map((p) => (
                <div key={p.type}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-[var(--ng-text)]">
                      {p.label} <span className="text-[var(--ng-text-muted)]">({p.count})</span>
                    </span>
                    <span className="text-[var(--ng-text-muted)]">
                      KSh {p.revenue.toLocaleString()}
                    </span>
                  </div>
                  <div className="h-1.5 bg-[var(--ng-bg)] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[var(--ng-accent)] rounded-full"
                      style={{ width: `${(p.revenue / maxPlanRevenue) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-[var(--ng-surface)] border border-[var(--ng-border)] rounded-xl p-6">
          <h2 className="font-display text-2xl text-[var(--ng-text)] mb-1">
            New members per month
          </h2>
          <p className="text-xs text-[var(--ng-text-muted)] mb-4">
            Signup growth over the last year — flat or falling months are worth digging into.
          </p>
          <div className="flex items-end gap-1 h-28">
            {memberMonthBuckets.map(({ key, month, count }) => (
              <div key={key} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex-1 flex items-end">
                  <div
                    className="w-full bg-[var(--ng-accent)] rounded-sm"
                    style={{
                      height: `${Math.max((count / maxNewMembers) * 100, count > 0 ? 4 : 0)}%`,
                      opacity: count === 0 ? 0.15 : 1,
                    }}
                    title={`${month}: ${count} new member${count === 1 ? "" : "s"}`}
                  />
                </div>
                <span className="text-[9px] text-[var(--ng-text-muted)]">{month}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-[var(--ng-surface)] border border-[var(--ng-border)] rounded-xl overflow-hidden">
        <h2 className="font-display text-2xl text-[var(--ng-text)] p-6 pb-4">
          Recent transactions
        </h2>
        <TransactionsTable
          transactions={allTxns.slice(0, 25)}
          currentUserRole={user.role}
        />
      </div>
    </div>
  );
}