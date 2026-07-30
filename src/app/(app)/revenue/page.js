import { redirect } from "next/navigation";
import Link from "next/link";
import { getAuthUser } from "@/lib/requireAuth";
import dbConnect from "@/lib/dbConnect";
import Payment from "@/models/Payment";
import Sale from "@/models/Sale";
import Branch from "@/models/Branch";
import Member from "@/models/Member";

const METHOD_LABELS = {
  cash: "Cash",
  mpesa: "M-Pesa",
  card: "Card",
  bank_transfer: "Bank Transfer",
};

export default async function RevenuePage() {
  const user = await getAuthUser();
  if (!user) {
    redirect("/login");
  }

  await dbConnect();

  const payments = await Payment.find({ status: "completed" })
    .populate("branch")
    .populate("member")
    .lean();

  const sales = await Sale.find().populate("branch").populate("member").lean();

  const paymentsData = JSON.parse(JSON.stringify(payments));
  const salesData = JSON.parse(JSON.stringify(sales));

  // Normalize both into one shape so they can be combined and sorted together
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
    <div className="min-h-screen bg-[var(--ng-bg)] px-6 py-10">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="text-xs uppercase tracking-widest text-[var(--ng-text-muted)] hover:text-[var(--ng-accent)]"
          >
            ← Dashboard
          </Link>
          <h1 className="font-display text-4xl text-[var(--ng-accent)] mt-2">Revenue</h1>
        </div>

        {/* Total + source split */}
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
          {/* By branch */}
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

          {/* By payment method */}
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

        {/* Recent transactions — combined */}
        <div className="bg-[var(--ng-surface)] border border-[var(--ng-border)] rounded-xl overflow-hidden">
          <h2 className="font-display text-2xl text-[var(--ng-text)] p-6 pb-4">
            Recent transactions
          </h2>
          {allTxns.length === 0 ? (
            <p className="text-[var(--ng-text-muted)] text-sm p-6 pt-0">
              No transactions recorded yet.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-t border-b border-[var(--ng-border)] text-left text-[var(--ng-text-muted)] uppercase text-xs tracking-wide">
                  <th className="px-6 py-3 font-medium">Type</th>
                  <th className="px-6 py-3 font-medium">Member</th>
                  <th className="px-6 py-3 font-medium">Branch</th>
                  <th className="px-6 py-3 font-medium">Method</th>
                  <th className="px-6 py-3 font-medium">Date</th>
                  <th className="px-6 py-3 font-medium text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {allTxns.slice(0, 25).map((t) => (
                  <tr key={`${t.type}-${t.id}`} className="border-b border-[var(--ng-border)] last:border-0">
                    <td className="px-6 py-3">
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          t.type === "membership"
                            ? "bg-[var(--ng-accent)]/20 text-[var(--ng-accent)]"
                            : "bg-blue-950/40 text-blue-300"
                        }`}
                      >
                        {t.label}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-[var(--ng-text)]">{t.memberName}</td>
                    <td className="px-6 py-3 text-[var(--ng-text-muted)]">{t.branchName}</td>
                    <td className="px-6 py-3 text-[var(--ng-text-muted)]">
                      {METHOD_LABELS[t.method] || t.method}
                    </td>
                    <td className="px-6 py-3 text-[var(--ng-text-muted)]">
                      {new Date(t.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-3 text-right text-[var(--ng-accent)] font-medium">
                      KSh {t.amount.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}