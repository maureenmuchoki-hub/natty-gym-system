"use client";

import { useState, useMemo, Fragment } from "react";
import { useRouter } from "next/navigation";
import Receipt from "@/components/Receipt";

const METHOD_LABELS = {
  cash: "Cash",
  mpesa: "M-Pesa",
  card: "Card",
  bank_transfer: "Bank Transfer",
};

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

const TABS = ["All", "Active", "Upcoming", "Daily", "Expired", "Cancelled"];

const DAILY_TYPES = ["daily", "kids"];

export default function MembershipsTable({ memberships, plans, currentUserRole }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState(null);
  const [activeTab, setActiveTab] = useState("All");
  const [renewingId, setRenewingId] = useState(null);
  const [renewPlanId, setRenewPlanId] = useState("");
  const [renewPaymentMethod, setRenewPaymentMethod] = useState("cash");
  const [renewTransactionId, setRenewTransactionId] = useState("");
  const [message, setMessage] = useState(null);
  const [receiptData, setReceiptData] = useState(null);

  const enriched = useMemo(() => {
    const now = new Date();
    return memberships.map((m) => {
      const start = new Date(m.startDate);
      const end = new Date(m.endDate);
      const isCancelled = m.status === "cancelled";
      const isExpired = !isCancelled && end < now;
      const isUpcoming = !isCancelled && !isExpired && start > now;
      const displayStatus = isCancelled
        ? "cancelled"
        : isExpired
        ? "expired"
        : isUpcoming
        ? "upcoming"
        : "active";

      const isDaily = DAILY_TYPES.includes(m.plan?.type);

      // Has this member since started a later membership? If so, this expired
      // one was renewed and doesn't need follow-up — keep it out of the
      // Expired tab, even though it still exists in the full history.
      const supersededByRenewal =
        displayStatus === "expired" &&
        memberships.some(
          (other) =>
            other._id !== m._id &&
            other.member?._id === m.member?._id &&
            new Date(other.startDate) > start
        );

      return { ...m, displayStatus, supersededByRenewal, isDaily };
    });
  }, [memberships]);

  const filtered = useMemo(() => {
    if (activeTab === "All") return enriched;
    if (activeTab === "Daily") {
      return [...enriched.filter((m) => m.isDaily)].sort(
        (a, b) => new Date(b.startDate) - new Date(a.startDate)
      );
    }
    if (activeTab === "Expired") {
      // Daily/kids passes expire every day by design — they live in the Daily
      // tab, not here. Expired is only for lapsed memberships worth following up.
      return enriched.filter(
        (m) => m.displayStatus === "expired" && !m.supersededByRenewal && !m.isDaily
      );
    }
    return enriched.filter((m) => m.displayStatus === activeTab.toLowerCase());
  }, [enriched, activeTab]);

  const counts = useMemo(() => {
    const c = { All: enriched.length, Active: 0, Upcoming: 0, Daily: 0, Expired: 0, Cancelled: 0 };
    for (const m of enriched) {
      if (m.isDaily) c.Daily++;
      if (m.displayStatus === "active") c.Active++;
      if (m.displayStatus === "upcoming") c.Upcoming++;
      if (m.displayStatus === "expired" && !m.supersededByRenewal && !m.isDaily) c.Expired++;
      if (m.displayStatus === "cancelled") c.Cancelled++;
    }
    return c;
  }, [enriched]);

  async function handleCancel(membershipId) {
    setBusyId(membershipId);
    setMessage(null);
    try {
      const res = await fetch(`/api/memberships/${membershipId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelled" }),
      });
      const data = await res.json();
      if (!data.success) {
        setMessage({ type: "error", text: data.message || "Couldn't cancel this membership." });
        return;
      }
      setMessage({
        type: "success",
        text: data.refunded
          ? "Membership cancelled. They hadn't used it, so the payment was automatically marked as refunded and removed from revenue."
          : "Membership cancelled.",
      });
      router.refresh();
    } catch {
      setMessage({ type: "error", text: "Couldn't reach the server. Try again." });
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(membershipId) {
    if (!confirm("Permanently delete this membership record? The payment history stays intact.")) {
      return;
    }
    setBusyId(membershipId);
    setMessage(null);
    try {
      const res = await fetch(`/api/memberships/${membershipId}`, { method: "DELETE" });
      const data = await res.json();
      if (!data.success) {
        setMessage({ type: "error", text: data.message || "Couldn't delete this membership." });
        return;
      }
      router.refresh();
    } catch {
      setMessage({ type: "error", text: "Couldn't reach the server. Try again." });
    } finally {
      setBusyId(null);
    }
  }

  function openRenew(row) {
    setRenewingId(row._id);
    setRenewPlanId("");
    setRenewPaymentMethod("cash");
    setRenewTransactionId("");
    setMessage(null);
  }

  async function confirmRenew(row) {
    if (!renewPlanId) {
      setMessage({ type: "error", text: "Pick a plan first." });
      return;
    }
    setBusyId(row._id);
    setMessage(null);
    try {
      const res = await fetch("/api/memberships", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          member: row.member._id,
          plan: renewPlanId,
          paymentMethod: renewPaymentMethod,
          transactionId: renewTransactionId || undefined,
        }),
      });
      const data = await res.json();

      if (!data.success) {
        setMessage({ type: "error", text: data.message });
        return;
      }

      const m = data.membership;
      setReceiptData({
        title: data.renewed ? "Membership renewal" : "Membership enrollment",
        branchName: m.branch?.name || "",
        date: data.payment.paidAt,
        lines: [
          { label: "Member", value: `${m.member?.firstName} ${m.member?.lastName}` },
          { label: "Plan", value: m.plan?.name },
          { label: "Valid from", value: new Date(m.startDate).toLocaleDateString() },
          { label: "Valid until", value: new Date(m.endDate).toLocaleDateString() },
        ],
        total: data.payment.amount,
        paymentMethod: data.payment.method,
        transactionId: data.payment.transactionId,
      });

      setRenewingId(null);
      router.refresh();
    } catch {
      setMessage({ type: "error", text: "Couldn't reach the server. Try again." });
    } finally {
      setBusyId(null);
    }
  }

  // Furthest paid-through date across all this member's active + upcoming periods
  function paidThroughDate(memberId) {
    const relevant = enriched.filter(
      (r) =>
        r.member?._id === memberId &&
        (r.displayStatus === "active" || r.displayStatus === "upcoming")
    );
    if (relevant.length === 0) return null;
    return relevant.reduce(
      (latest, r) => (new Date(r.endDate) > latest ? new Date(r.endDate) : latest),
      new Date(0)
    );
  }

  // Plans for the same branch as this membership
  function plansForRow(row) {
    const branchId = row.branch?._id || row.branch;
    return plans.filter((p) => (p.branch?._id || p.branch) === branchId);
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-1 mb-4">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab
                ? "bg-[var(--ng-accent)]/15 text-[var(--ng-accent)]"
                : "text-[var(--ng-text-muted)] hover:text-[var(--ng-text)]"
            }`}
          >
            {tab} <span className="text-xs opacity-70">({counts[tab]})</span>
          </button>
        ))}
      </div>

      {message && (
        <p
          className={`text-xs rounded-lg px-3 py-2 border mb-3 ${
            message.type === "error"
              ? "text-red-400 bg-red-950/40 border-red-900"
              : "text-[var(--ng-accent)] bg-[var(--ng-accent)]/10 border-[var(--ng-accent-dim)]"
          }`}
        >
          {message.text}
        </p>
      )}

      <div className="bg-[var(--ng-surface)] border border-[var(--ng-border)] rounded-xl overflow-hidden">
        {filtered.length === 0 ? (
          <p className="text-[var(--ng-text-muted)] text-sm p-8 text-center">
            {activeTab === "Daily"
              ? "No daily or kids passes recorded yet."
              : `No ${activeTab !== "All" ? activeTab.toLowerCase() : ""} memberships to show.`}
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--ng-border)] text-left text-[var(--ng-text-muted)] uppercase text-xs tracking-wide">
                <th className="px-5 py-3 font-medium">Member</th>
                <th className="px-5 py-3 font-medium">Plan</th>
                <th className="px-5 py-3 font-medium">Period</th>
                <th className="px-5 py-3 font-medium">Payment</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((m) => {
                const canCancel = m.displayStatus === "active" || m.displayStatus === "upcoming";
                const canDelete =
                  (m.displayStatus === "expired" || m.displayStatus === "cancelled") &&
                  currentUserRole === "admin";
                const canRenew = m.displayStatus === "active" || m.displayStatus === "expired";
                const isRenewing = renewingId === m._id;

                return (
                  <Fragment key={m._id}>
                    <tr className="border-b border-[var(--ng-border)] last:border-0">
                      <td className="px-5 py-3 text-[var(--ng-text)]">
                        {m.member?.firstName} {m.member?.lastName}
                      </td>
                      <td className="px-5 py-3 text-[var(--ng-text-muted)]">{m.plan?.name}</td>
                      <td className="px-5 py-3 text-[var(--ng-text-muted)] text-xs">
                        {new Date(m.startDate).toLocaleDateString()} –{" "}
                        {new Date(m.endDate).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-3 text-[var(--ng-text-muted)] text-xs">
                        {m.payment ? (
                          <>
                            KSh {m.payment.amount.toLocaleString()} ·{" "}
                            {METHOD_LABELS[m.payment.method] || m.payment.method}
                          </>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            m.displayStatus === "active"
                              ? "bg-[var(--ng-accent)]/20 text-[var(--ng-accent)]"
                              : m.displayStatus === "upcoming"
                              ? "bg-blue-950/40 text-blue-300"
                              : "bg-red-950/40 text-red-400"
                          }`}
                        >
                          {m.displayStatus}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right whitespace-nowrap">
                        {canRenew && (
                          <button
                            onClick={() => (isRenewing ? setRenewingId(null) : openRenew(m))}
                            className="text-xs text-[var(--ng-accent)] hover:text-[var(--ng-accent-dim)] mr-3"
                          >
                            {isRenewing ? "Close" : "Renew"}
                          </button>
                        )}
                        {canCancel && (
                          <button
                            onClick={() => handleCancel(m._id)}
                            disabled={busyId === m._id}
                            className="text-xs text-[var(--ng-text-muted)] hover:text-red-400 disabled:opacity-60 mr-3"
                          >
                            {busyId === m._id ? "..." : "Cancel"}
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => handleDelete(m._id)}
                            disabled={busyId === m._id}
                            className="text-xs text-[var(--ng-text-muted)] hover:text-red-400 disabled:opacity-60"
                          >
                            {busyId === m._id ? "..." : "Delete"}
                          </button>
                        )}
                      </td>
                    </tr>

                    {isRenewing && (
                      <tr className="border-b border-[var(--ng-border)] bg-[var(--ng-bg)]">
                        <td colSpan={6} className="px-5 py-4">
                          <div className="flex flex-wrap items-end gap-3">
                            <div>
                              <label className="block text-xs uppercase tracking-wide text-[var(--ng-text-muted)] mb-1">
                                Plan
                              </label>
                              <select
                                value={renewPlanId}
                                onChange={(e) => setRenewPlanId(e.target.value)}
                                className="bg-[var(--ng-surface)] border border-[var(--ng-border)] rounded-lg px-3 py-2 text-sm text-[var(--ng-text)] focus:outline-none focus:ring-2 focus:ring-[var(--ng-accent)]"
                              >
                                <option value="">Select plan...</option>
                                {plansForRow(m).map((p) => (
                                  <option key={p._id} value={p._id}>
                                    {PLAN_TYPE_LABELS[p.type] || p.name} — KSh{" "}
                                    {p.price.toLocaleString()}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs uppercase tracking-wide text-[var(--ng-text-muted)] mb-1">
                                Payment method
                              </label>
                              <select
                                value={renewPaymentMethod}
                                onChange={(e) => setRenewPaymentMethod(e.target.value)}
                                className="bg-[var(--ng-surface)] border border-[var(--ng-border)] rounded-lg px-3 py-2 text-sm text-[var(--ng-text)] focus:outline-none focus:ring-2 focus:ring-[var(--ng-accent)]"
                              >
                                <option value="cash">Cash</option>
                                <option value="mpesa">M-Pesa</option>
                                <option value="card">Card</option>
                                <option value="bank_transfer">Bank Transfer</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs uppercase tracking-wide text-[var(--ng-text-muted)] mb-1">
                                Transaction ID
                              </label>
                              <input
                                value={renewTransactionId}
                                onChange={(e) => setRenewTransactionId(e.target.value)}
                                placeholder="Optional"
                                className="bg-[var(--ng-surface)] border border-[var(--ng-border)] rounded-lg px-3 py-2 text-sm text-[var(--ng-text)] w-36 focus:outline-none focus:ring-2 focus:ring-[var(--ng-accent)]"
                              />
                            </div>
                            <button
                              onClick={() => confirmRenew(m)}
                              disabled={busyId === m._id}
                              className="bg-[var(--ng-accent)] text-[#151511] font-semibold rounded-lg px-4 py-2 text-sm hover:bg-[var(--ng-accent-dim)] transition-colors disabled:opacity-60"
                            >
                              {busyId === m._id ? "Renewing..." : "Confirm renewal"}
                            </button>
                          </div>
                          <p className="text-xs text-[var(--ng-text-muted)] mt-2">
                            {(() => {
                              const paidThrough = paidThroughDate(m.member?._id);
                              return paidThrough
                                ? `Already paid through ${paidThrough.toLocaleDateString()}. This renewal will start right after that — no days lost.`
                                : "The new period starts today since there's nothing currently active.";
                            })()}
                          </p>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {receiptData && (
        <Receipt
          title={receiptData.title}
          branchName={receiptData.branchName}
          date={receiptData.date}
          lines={receiptData.lines}
          total={receiptData.total}
          paymentMethod={receiptData.paymentMethod}
          transactionId={receiptData.transactionId}
          onClose={() => setReceiptData(null)}
        />
      )}
    </div>
  );
}