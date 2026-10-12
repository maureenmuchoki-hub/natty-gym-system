"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Receipt from "@/components/Receipt";

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

export default function EnrollForm({ members, plans }) {
  const router = useRouter();
  const [memberId, setMemberId] = useState(members[0]?._id || "");
  const [planId, setPlanId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [transactionId, setTransactionId] = useState("");
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [receiptData, setReceiptData] = useState(null);

  const selectedMember = useMemo(
    () => members.find((m) => m._id === memberId),
    [members, memberId]
  );

  const memberBranchId = selectedMember?.branch?._id;

  const plansForMember = useMemo(
    () => plans.filter((p) => (p.branch?._id || p.branch) === memberBranchId),
    [plans, memberBranchId]
  );

  const selectedPlan = useMemo(() => plans.find((p) => p._id === planId), [plans, planId]);

  function handleMemberChange(id) {
    setMemberId(id);
    setPlanId(""); // plan list depends on the member's branch, so reset it
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage(null);

    if (!planId) {
      setMessage({ type: "error", text: "Pick a plan first." });
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

      if (data.renewed) {
        const startDate = new Date(m.startDate).toLocaleDateString();
        setMessage({
          type: "success",
          text: `Renewed early — their current membership is still active, so the new period starts on ${startDate} once it ends. No days lost.`,
        });
      } else {
        setMessage({ type: "success", text: "Member enrolled and payment recorded." });
      }

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
            onChange={(e) => handleMemberChange(e.target.value)}
            className="w-full bg-[var(--ng-bg)] border border-[var(--ng-border)] rounded-lg px-3 py-2 text-sm text-[var(--ng-text)] focus:outline-none focus:ring-2 focus:ring-[var(--ng-accent)]"
          >
            {members.map((m) => (
              <option key={m._id} value={m._id}>
                {m.firstName} {m.lastName}
              </option>
            ))}
          </select>
        </Field>

        {/* Branch is shown, not chosen — locked to the member's registered branch */}
        {selectedMember && (
          <div className="bg-[var(--ng-bg)] border border-[var(--ng-border)] rounded-lg px-4 py-2.5 flex items-center justify-between">
            <span className="text-xs text-[var(--ng-text-muted)]">Branch</span>
            <span className="text-sm text-[var(--ng-text)]">
              {selectedMember.branch?.name || "No branch on file"}
            </span>
          </div>
        )}

        <Field label="Plan">
          <select
            value={planId}
            onChange={(e) => setPlanId(e.target.value)}
            disabled={plansForMember.length === 0}
            className="w-full bg-[var(--ng-bg)] border border-[var(--ng-border)] rounded-lg px-3 py-2 text-sm text-[var(--ng-text)] focus:outline-none focus:ring-2 focus:ring-[var(--ng-accent)] disabled:opacity-50"
          >
            <option value="">Select a plan...</option>
            {plansForMember.map((p) => (
              <option key={p._id} value={p._id}>
                {PLAN_TYPE_LABELS[p.type] || p.name} — KSh {p.price.toLocaleString()}
              </option>
            ))}
          </select>
          {plansForMember.length === 0 && selectedMember && (
            <p className="text-xs text-red-400 mt-1">
              No plans found for {selectedMember.branch?.name || "this member's branch"}.
            </p>
          )}
        </Field>

        {selectedPlan && (
          <div className="bg-[var(--ng-bg)] border border-[var(--ng-border)] rounded-lg px-4 py-3 flex items-center justify-between">
            <span className="text-xs text-[var(--ng-text-muted)]">Amount to charge</span>
            <span className="font-display text-2xl text-[var(--ng-accent)]">
              KSh {selectedPlan.price.toLocaleString()}
            </span>
          </div>
        )}

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
          disabled={loading || plansForMember.length === 0}
          className="w-full bg-[var(--ng-accent)] text-[#151511] font-semibold rounded-lg py-2.5 text-sm hover:bg-[var(--ng-accent-dim)] transition-colors disabled:opacity-60"
        >
          {loading ? "Enrolling..." : "Enroll & record payment"}
        </button>
      </form>

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