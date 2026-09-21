"use client";

import { useState, Fragment } from "react";
import { useRouter } from "next/navigation";

const STATUS_STYLES = {
  active: "bg-[var(--ng-accent)]/20 text-[var(--ng-accent)]",
  expired: "bg-[var(--ng-text-muted)]/20 text-[var(--ng-text-muted)]",
  cancelled: "bg-red-950/40 text-red-400",
};

function formatDuration(minutes) {
  if (minutes === null || minutes === undefined) return "In progress";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

export default function RegisterTable({ rows, currentUserRole }) {
  const router = useRouter();
  const [expandedId, setExpandedId] = useState(null);
  const [busyId, setBusyId] = useState(null);

  async function creditDays(row) {
    const input = prompt(
      `${row.memberName} has ${row.eligibleDays} day(s) across absences of 7+ consecutive days.\n\nHow many days do you want to credit back? Their membership end date will move forward by this amount.`,
      String(row.eligibleDays)
    );
    if (input === null) return;

    const days = parseInt(input, 10);
    if (!days || days <= 0) return;

    setBusyId(row.id);
    try {
      const res = await fetch(`/api/memberships/${row.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          extendDays: days,
          extendReason: "Credited for consecutive days missed",
        }),
      });
      const data = await res.json();
      if (!data.success) {
        alert(data.message || "Couldn't credit those days.");
        return;
      }
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  if (rows.length === 0) {
    return (
      <p className="text-[var(--ng-text-muted)] text-sm bg-[var(--ng-surface)] border border-[var(--ng-border)] rounded-xl p-8 text-center">
        No trackable memberships yet — this fills in once members enroll in weekly/monthly/etc.
        plans.
      </p>
    );
  }

  return (
    <div className="bg-[var(--ng-surface)] border border-[var(--ng-border)] rounded-xl overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--ng-border)] text-left text-[var(--ng-text-muted)] uppercase text-xs tracking-wide">
            <th className="px-5 py-3 font-medium">Member</th>
            <th className="px-5 py-3 font-medium">Plan</th>
            <th className="px-5 py-3 font-medium">Branch</th>
            <th className="px-5 py-3 font-medium">Attendance</th>
            <th className="px-5 py-3 font-medium">Time spent</th>
            <th className="px-5 py-3 font-medium">Missed (7+ days)</th>
            <th className="px-5 py-3 font-medium">Status</th>
            <th className="px-5 py-3 font-medium"></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const isExpanded = expandedId === row.id;
            return (
              <Fragment key={row.id}>
                <tr className="border-b border-[var(--ng-border)] last:border-0">
                  <td className="px-5 py-3 text-[var(--ng-text)]">{row.memberName}</td>
                  <td className="px-5 py-3 text-[var(--ng-text-muted)]">{row.planName}</td>
                  <td className="px-5 py-3 text-[var(--ng-text-muted)]">{row.branchName}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2 w-40">
                      <div className="flex-1 h-1.5 bg-[var(--ng-bg)] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[var(--ng-accent)] rounded-full"
                          style={{ width: `${row.rate}%` }}
                        />
                      </div>
                      <span className="text-xs text-[var(--ng-text-muted)] whitespace-nowrap">
                        {row.daysAttended}/{row.totalDays}d
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-[var(--ng-text-muted)] text-xs">
                    {formatDuration(row.totalMinutes)}
                  </td>
                  <td className="px-5 py-3 text-xs">
                    {row.eligibleDays > 0 ? (
                      <span className="text-amber-400">
                        {row.eligibleDays}d eligible
                      </span>
                    ) : (
                      <span className="text-[var(--ng-text-muted)]">—</span>
                    )}
                    {row.creditedDays > 0 && (
                      <span className="block text-[var(--ng-accent)]">
                        {row.creditedDays}d credited
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${STATUS_STYLES[row.status]}`}
                    >
                      {row.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right whitespace-nowrap">
                    {row.eligibleDays > 0 &&
                      (currentUserRole === "admin" || currentUserRole === "accountant") && (
                        <button
                          onClick={() => creditDays(row)}
                          disabled={busyId === row.id}
                          className="text-xs text-[var(--ng-accent)] hover:text-[var(--ng-accent-dim)] mr-3 disabled:opacity-60"
                        >
                          {busyId === row.id ? "..." : "Credit days"}
                        </button>
                      )}
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : row.id)}
                      className="text-xs text-[var(--ng-text-muted)] hover:text-[var(--ng-accent)]"
                    >
                      {isExpanded ? "Hide" : "View log"}
                    </button>
                  </td>
                </tr>
                {isExpanded && (
                  <tr className="border-b border-[var(--ng-border)]">
                    <td colSpan={8} className="px-5 py-4 bg-[var(--ng-bg)]">
                      {row.absenceGaps.length > 0 && (
                        <div className="mb-4">
                          <p className="text-xs uppercase tracking-wide text-[var(--ng-text-muted)] mb-2">
                            Absences of 7+ consecutive days
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {row.absenceGaps.map((g, i) => (
                              <span
                                key={i}
                                className="text-xs text-amber-400 border border-amber-900 rounded-full px-2.5 py-1"
                              >
                                {g.days}d ·{" "}
                                {new Date(g.from).toLocaleDateString(undefined, {
                                  month: "short",
                                  day: "numeric",
                                })}{" "}
                                –{" "}
                                {new Date(g.to).toLocaleDateString(undefined, {
                                  month: "short",
                                  day: "numeric",
                                })}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {row.visits.length === 0 ? (
                        <p className="text-xs text-[var(--ng-text-muted)]">
                          No check-ins recorded for this membership period yet.
                        </p>
                      ) : (
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="text-left text-[var(--ng-text-muted)] uppercase tracking-wide">
                              <th className="pb-2 pr-4 font-medium">Date</th>
                              <th className="pb-2 pr-4 font-medium">Check-in</th>
                              <th className="pb-2 pr-4 font-medium">Check-out</th>
                              <th className="pb-2 font-medium">Duration</th>
                            </tr>
                          </thead>
                          <tbody>
                            {row.visits.map((v, i) => (
                              <tr key={i} className="border-t border-[var(--ng-border)]">
                                <td className="py-2 pr-4 text-[var(--ng-text)]">
                                  {new Date(v.checkIn).toLocaleDateString(undefined, {
                                    month: "short",
                                    day: "numeric",
                                  })}
                                </td>
                                <td className="py-2 pr-4 text-[var(--ng-text-muted)]">
                                  {new Date(v.checkIn).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </td>
                                <td className="py-2 pr-4 text-[var(--ng-text-muted)]">
                                  {v.checkOut
                                    ? new Date(v.checkOut).toLocaleTimeString([], {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })
                                    : "—"}
                                </td>
                                <td className="py-2 text-[var(--ng-accent)]">
                                  {formatDuration(v.durationMinutes)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}