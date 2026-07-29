"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";

export default function CheckInPanel({ members, initialOpenAttendance }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState(null); // { type: "success" | "error", text }
  const [busyId, setBusyId] = useState(null);
  const [openAttendance, setOpenAttendance] = useState(initialOpenAttendance);

  const filteredMembers = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return members
      .filter(
        (m) =>
          `${m.firstName} ${m.lastName}`.toLowerCase().includes(q) || m.phone.includes(q)
      )
      .slice(0, 6);
  }, [query, members]);

  async function handleCheckIn(member) {
    setBusyId(member._id);
    setMessage(null);

    try {
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ member: member._id }),
      });
      const data = await res.json();

      if (!data.success) {
        setMessage({ type: "error", text: data.message });
        return;
      }

      setMessage({ type: "success", text: `${member.firstName} ${member.lastName} checked in.` });
      setOpenAttendance((prev) => [data.attendance, ...prev]);
      setQuery("");
      router.refresh();
    } catch {
      setMessage({ type: "error", text: "Couldn't reach the server. Try again." });
    } finally {
      setBusyId(null);
    }
  }

  async function handleCheckOut(attendanceId) {
    setBusyId(attendanceId);

    try {
      const res = await fetch(`/api/attendance/${attendanceId}`, { method: "PATCH" });
      const data = await res.json();

      if (!data.success) {
        setMessage({ type: "error", text: data.message });
        return;
      }

      setOpenAttendance((prev) => prev.filter((a) => a._id !== attendanceId));
      router.refresh();
    } catch {
      setMessage({ type: "error", text: "Couldn't reach the server. Try again." });
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="grid lg:grid-cols-[1fr_360px] gap-6 items-start">
      {/* Search + check-in */}
      <div className="bg-[var(--ng-surface)] border border-[var(--ng-border)] rounded-xl p-6">
        <label className="block text-xs uppercase tracking-wide text-[var(--ng-text-muted)] mb-2">
          Find member
        </label>
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name or phone..."
          className="w-full bg-[var(--ng-bg)] border border-[var(--ng-border)] rounded-lg px-4 py-3 text-[var(--ng-text)] focus:outline-none focus:ring-2 focus:ring-[var(--ng-accent)]"
        />

        {message && (
          <p
            className={`mt-4 text-sm rounded-lg px-4 py-3 border ${
              message.type === "success"
                ? "text-[var(--ng-accent)] bg-[var(--ng-accent)]/10 border-[var(--ng-accent-dim)]"
                : "text-red-400 bg-red-950/40 border-red-900"
            }`}
          >
            {message.text}
          </p>
        )}

        {query.trim() && (
          <div className="mt-4 space-y-2">
            {filteredMembers.length === 0 ? (
              <p className="text-sm text-[var(--ng-text-muted)]">No matching members.</p>
            ) : (
              filteredMembers.map((member) => (
                <button
                  key={member._id}
                  onClick={() => handleCheckIn(member)}
                  disabled={busyId === member._id}
                  className="w-full flex items-center justify-between bg-[var(--ng-bg)] border border-[var(--ng-border)] rounded-lg px-4 py-3 text-left hover:border-[var(--ng-accent)] transition-colors disabled:opacity-60"
                >
                  <div>
                    <p className="text-[var(--ng-text)] font-medium">
                      {member.firstName} {member.lastName}
                    </p>
                    <p className="text-xs text-[var(--ng-text-muted)]">
                      {member.phone} · {member.branch?.name || "No branch"}
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-[var(--ng-accent)]">
                    {busyId === member._id ? "Checking in..." : "Check in →"}
                  </span>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* Currently checked in */}
      <div className="bg-[var(--ng-surface)] border border-[var(--ng-border)] rounded-xl p-6">
        <h2 className="font-display text-2xl text-[var(--ng-text)] mb-1">Currently in</h2>
        <p className="text-xs text-[var(--ng-text-muted)] mb-4">
          {openAttendance.length} {openAttendance.length === 1 ? "member" : "members"} checked in
        </p>

        {openAttendance.length === 0 ? (
          <p className="text-sm text-[var(--ng-text-muted)]">No one's checked in right now.</p>
        ) : (
          <ul className="space-y-2">
            {openAttendance.map((a) => (
              <li
                key={a._id}
                className="flex items-center justify-between bg-[var(--ng-bg)] border border-[var(--ng-border)] rounded-lg px-4 py-3"
              >
                <div>
                  <p className="text-sm text-[var(--ng-text)] font-medium">
                    {a.member?.firstName} {a.member?.lastName}
                  </p>
                  <p className="text-xs text-[var(--ng-text-muted)]">
                    {new Date(a.checkInTime).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <button
                  onClick={() => handleCheckOut(a._id)}
                  disabled={busyId === a._id}
                  className="text-xs font-semibold text-[var(--ng-text-muted)] hover:text-[var(--ng-accent)] disabled:opacity-60"
                >
                  {busyId === a._id ? "..." : "Check out"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}