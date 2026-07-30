"use client";

import { useState, Fragment } from "react";

const STATUS_STYLES = {
  active: "bg-[var(--ng-accent)]/20 text-[var(--ng-accent)]",
  expired: "bg-[var(--ng-text-muted)]/20 text-[var(--ng-text-muted)]",
  cancelled: "bg-red-950/40 text-red-400",
};

export default function RegisterTable({ rows }) {
  const [expandedId, setExpandedId] = useState(null);

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
                  <td className="px-5 py-3">
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${STATUS_STYLES[row.status]}`}
                    >
                      {row.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
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
                    <td colSpan={6} className="px-5 py-4 bg-[var(--ng-bg)]">
                      {row.attendanceDates.length === 0 ? (
                        <p className="text-xs text-[var(--ng-text-muted)]">
                          No check-ins recorded for this membership period yet.
                        </p>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {row.attendanceDates.map((date) => (
                            <span
                              key={date}
                              className="text-xs text-[var(--ng-text)] border border-[var(--ng-border)] rounded-full px-2.5 py-1"
                            >
                              {new Date(date).toLocaleDateString(undefined, {
                                month: "short",
                                day: "numeric",
                              })}
                            </span>
                          ))}
                        </div>
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