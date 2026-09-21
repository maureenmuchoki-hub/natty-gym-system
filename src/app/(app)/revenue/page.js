import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/requireAuth";
import dbConnect from "@/lib/dbConnect";
import Payment from "@/models/Payment";
import Sale from "@/models/Sale";
import Branch from "@/models/Branch";
import Member from "@/models/Member";
import TransactionsTable from "./TransactionsTable";

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