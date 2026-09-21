"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const METHOD_LABELS = {
  cash: "Cash",
  mpesa: "M-Pesa",
  card: "Card",
  bank_transfer: "Bank Transfer",
};

export default function TransactionsTable({ transactions, currentUserRole }) {
  const router = useRouter();
  const [editingId, setEditingId] = useState(null);
  const [editAmount, setEditAmount] = useState("");
  const [editMethod, setEditMethod] = useState("cash");
  const [busyId, setBusyId] = useState(null);
  const [message, setMessage] = useState(null);

  const canManage = currentUserRole === "admin";

  function openEdit(t) {
    setEditingId(t.id);
    setEditAmount(String(t.amount));
    setEditMethod(t.method);
    setMessage(null);
  }

  async function saveEdit(t) {
    const amount = Number(editAmount);
    if (Number.isNaN(amount) || amount < 0) {
      setMessage({ type: "error", text: "Enter a valid amount." });
      return;
    }

    setBusyId(t.id);
    try {
      const res = await fetch(`/api/payments/${t.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, method: editMethod }),
      });
      const data = await res.json();
      if (!data.success) {
        setMessage({ type: "error", text: data.message });
        return;
      }
      setEditingId(null);
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  async function markFailed(t) {
    if (
      !confirm(
        "Mark this payment as failed? It will be removed from revenue totals but kept on record."
      )
    ) {
      return;
    }
    setBusyId(t.id);
    try {
      await fetch(`/api/payments/${t.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "failed" }),
      });
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(t) {
    if (
      !confirm(
        "Permanently delete this payment record? Use this only for entries created in error. Consider 'Mark failed' instead, which keeps an audit trail."
      )
    ) {
      return;
    }
    setBusyId(t.id);
    try {
      await fetch(`/api/payments/${t.id}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  if (transactions.length === 0) {
    return (
      <p className="text-[var(--ng-text-muted)] text-sm p-6 pt-0">
        No transactions recorded yet.
      </p>
    );
  }

  return (
    <>
      {message && (
        <p className="text-xs text-red-400 bg-red-950/40 border border-red-900 rounded-lg px-3 py-2 mx-6 mb-3">
          {message.text}
        </p>
      )}
      <table className="w-full text-sm">
        <thead>
          <tr className="border-t border-b border-[var(--ng-border)] text-left text-[var(--ng-text-muted)] uppercase text-xs tracking-wide">
            <th className="px-6 py-3 font-medium">Type</th>
            <th className="px-6 py-3 font-medium">Member</th>
            <th className="px-6 py-3 font-medium">Branch</th>
            <th className="px-6 py-3 font-medium">Method</th>
            <th className="px-6 py-3 font-medium">Date</th>
            <th className="px-6 py-3 font-medium text-right">Amount</th>
            {canManage && <th className="px-6 py-3 font-medium"></th>}
          </tr>
        </thead>
        <tbody>
          {transactions.map((t) => {
            const isEditing = editingId === t.id;
            const editable = canManage && t.type === "membership";

            return (
              <tr
                key={`${t.type}-${t.id}`}
                className="border-b border-[var(--ng-border)] last:border-0"
              >
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
                  {isEditing ? (
                    <select
                      value={editMethod}
                      onChange={(e) => setEditMethod(e.target.value)}
                      className="bg-[var(--ng-bg)] border border-[var(--ng-border)] rounded-md px-2 py-1 text-xs text-[var(--ng-text)]"
                    >
                      <option value="cash">Cash</option>
                      <option value="mpesa">M-Pesa</option>
                      <option value="card">Card</option>
                      <option value="bank_transfer">Bank Transfer</option>
                    </select>
                  ) : (
                    METHOD_LABELS[t.method] || t.method
                  )}
                </td>
                <td className="px-6 py-3 text-[var(--ng-text-muted)]">
                  {new Date(t.date).toLocaleDateString()}
                </td>
                <td className="px-6 py-3 text-right text-[var(--ng-accent)] font-medium">
                  {isEditing ? (
                    <input
                      type="number"
                      value={editAmount}
                      onChange={(e) => setEditAmount(e.target.value)}
                      className="w-24 bg-[var(--ng-bg)] border border-[var(--ng-border)] rounded-md px-2 py-1 text-xs text-right text-[var(--ng-text)]"
                    />
                  ) : (
                    `KSh ${t.amount.toLocaleString()}`
                  )}
                </td>
                {canManage && (
                  <td className="px-6 py-3 text-right whitespace-nowrap">
                    {!editable ? (
                      <span className="text-xs text-[var(--ng-text-muted)]">—</span>
                    ) : isEditing ? (
                      <>
                        <button
                          onClick={() => saveEdit(t)}
                          disabled={busyId === t.id}
                          className="text-xs text-[var(--ng-accent)] hover:text-[var(--ng-accent-dim)] mr-3 disabled:opacity-60"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="text-xs text-[var(--ng-text-muted)] hover:text-[var(--ng-text)]"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => openEdit(t)}
                          className="text-xs text-[var(--ng-text-muted)] hover:text-[var(--ng-accent)] mr-3"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => markFailed(t)}
                          disabled={busyId === t.id}
                          className="text-xs text-[var(--ng-text-muted)] hover:text-amber-400 mr-3 disabled:opacity-60"
                        >
                          Mark failed
                        </button>
                        <button
                          onClick={() => handleDelete(t)}
                          disabled={busyId === t.id}
                          className="text-xs text-[var(--ng-text-muted)] hover:text-red-400 disabled:opacity-60"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </>
  );
}