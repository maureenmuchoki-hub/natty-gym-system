"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";

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

export default function EnrollForm({ members, branches, plans }) {
  const router = useRouter();
  const [memberId, setMemberId] = useState(members[0]?._id || "");
  const [branchId, setBranchId] = useState(branches[0]?._id || "");
  const [planId, setPlanId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [transactionId, setTransactionId] = useState("");
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);

  const plansForBranch = useMemo(
    () => plans.filter((p) => p.branch === branchId || p.branch?._id === branchId),
    [plans, branchId]
  );

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage(null);

    if (!planId) {
      setMessage({ type: "error", text: "Pick a plan for this branch first." });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/memberships", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          member: memberId,
          plan: planId,
          paymentMethod,
          transactionId: transactionId || undefined,
        }),
      });
      const data = await res.json();

      if (!data.success) {
        setMessage({ type: "error", text: data.message });
        return;
      }

      setMessage({ type: "success", text: "Member enrolled and payment recorded." });
      setTransactionId("");
      router.refresh();
    } catch {
      setMessage({ type: "error", text: "Couldn't reach the server. Try again." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-[var(--ng-surface)] border border-[var(--ng-border)] rounded-xl p-6">
      <h2 className="font-display text-2xl text-[var(--ng-text)] mb-4">Enroll member</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Member">
          <select
            value={memberId}
            onChange={(e) => setMemberId(e.target.value)}
            className="w-full bg-[var(--ng-bg)] border border-[var(--ng-border)] rounded-lg px-3 py-2 text-sm text-[var(--ng-text)] focus:outline-none focus:ring-2 focus:ring-[var(--ng-accent)]"
          >
            {members.map((m) => (
              <option key={m._id} value={m._id}>
                {m.firstName} {m.lastName}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Branch">
          <select
            value={branchId}
            onChange={(e) => {
              setBranchId(e.target.value);
              setPlanId("");
            }}
            className="w-full bg-[var(--ng-bg)] border border-[var(--ng-border)] rounded-lg px-3 py-2 text-sm text-[var(--ng-text)] focus:outline-none focus:ring-2 focus:ring-[var(--ng-accent)]"
          >
            {branches.map((b) => (
              <option key={b._id} value={b._id}>
                {b.name}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Plan">
          <select
            value={planId}
            onChange={(e) => setPlanId(e.target.value)}
            className="w-full bg-[var(--ng-bg)] border border-[var(--ng-border)] rounded-lg px-3 py-2 text-sm text-[var(--ng-text)] focus:outline-none focus:ring-2 focus:ring-[var(--ng-accent)]"
          >
            <option value="">Select a plan...</option>
            {plansForBranch.map((p) => (
              <option key={p._id} value={p._id}>
                {PLAN_TYPE_LABELS[p.type] || p.name} — KSh {p.price.toLocaleString()}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Payment method">
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className="w-full bg-[var(--ng-bg)] border border-[var(--ng-border)] rounded-lg px-3 py-2 text-sm text-[var(--ng-text)] focus:outline-none focus:ring-2 focus:ring-[var(--ng-accent)]"
          >
            <option value="cash">Cash</option>
            <option value="mpesa">M-Pesa</option>
            <option value="card">Card</option>
            <option value="bank_transfer">Bank Transfer</option>
          </select>
        </Field>

        <Field label="Transaction ID (optional)">
          <input
            value={transactionId}
            onChange={(e) => setTransactionId(e.target.value)}
            placeholder="e.g. M-Pesa code"
            className="w-full bg-[var(--ng-bg)] border border-[var(--ng-border)] rounded-lg px-3 py-2 text-sm text-[var(--ng-text)] focus:outline-none focus:ring-2 focus:ring-[var(--ng-accent)]"
          />
        </Field>

        {message && (
          <p
            className={`text-xs rounded-lg px-3 py-2 border ${
              message.type === "success"
                ? "text-[var(--ng-accent)] bg-[var(--ng-accent)]/10 border-[var(--ng-accent-dim)]"
                : "text-red-400 bg-red-950/40 border-red-900"
            }`}
          >
            {message.text}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[var(--ng-accent)] text-[#151511] font-semibold rounded-lg py-2.5 text-sm hover:bg-[var(--ng-accent-dim)] transition-colors disabled:opacity-60"
        >
          {loading ? "Enrolling..." : "Enroll & record payment"}
        </button>
      </form>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs uppercase tracking-wide text-[var(--ng-text-muted)] mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}