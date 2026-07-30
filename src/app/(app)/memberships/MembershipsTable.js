"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function MembershipsTable({ memberships }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState(null);

  async function handleCancel(membershipId) {
    setBusyId(membershipId);
    try {
      await fetch(`/api/memberships/${membershipId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelled" }),
      });
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  if (memberships.length === 0) {
    return (
      <p className="text-[var(--ng-text-muted)] text-sm p-8 text-center">
        No memberships yet. Enroll your first member using the form.
      </p>
    );
  }

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-[var(--ng-border)] text-left text-[var(--ng-text-muted)] uppercase text-xs tracking-wide">
          <th className="px-5 py-3 font-medium">Member</th>
          <th className="px-5 py-3 font-medium">Plan</th>
          <th className="px-5 py-3 font-medium">Expires</th>
          <th className="px-5 py-3 font-medium">Status</th>
          <th className="px-5 py-3 font-medium"></th>
        </tr>
      </thead>
      <tbody>
        {memberships.map((m) => {
          const isExpired = new Date(m.endDate) < new Date();
          const isCancelled = m.status === "cancelled";
          const displayStatus = isCancelled ? "cancelled" : isExpired ? "expired" : m.status;
          const canCancel = !isCancelled && !isExpired;

          return (
            <tr key={m._id} className="border-b border-[var(--ng-border)] last:border-0">
              <td className="px-5 py-3 text-[var(--ng-text)]">
                {m.member?.firstName} {m.member?.lastName}
              </td>
              <td className="px-5 py-3 text-[var(--ng-text-muted)]">{m.plan?.name}</td>
              <td className="px-5 py-3 text-[var(--ng-text-muted)]">
                {new Date(m.endDate).toLocaleDateString()}
              </td>
              <td className="px-5 py-3">
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    displayStatus === "active"
                      ? "bg-[var(--ng-accent)]/20 text-[var(--ng-accent)]"
                      : "bg-red-950/40 text-red-400"
                  }`}
                >
                  {displayStatus}
                </span>
              </td>
              <td className="px-5 py-3 text-right">
                {canCancel && (
                  <button
                    onClick={() => handleCancel(m._id)}
                    disabled={busyId === m._id}
                    className="text-xs text-[var(--ng-text-muted)] hover:text-red-400 disabled:opacity-60"
                  >
                    {busyId === m._id ? "..." : "Cancel"}
                  </button>
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}