"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function StaffTable({ users, currentUserId }) {
  const router = useRouter();
  const [resettingId, setResettingId] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [message, setMessage] = useState(null);

  async function confirmReset(userId) {
    if (newPassword.length < 8) {
      setMessage({ type: "error", text: "Password must be at least 8 characters." });
      return;
    }
    setBusyId(userId);
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: newPassword }),
      });
      const data = await res.json();
      if (!data.success) {
        setMessage({ type: "error", text: data.message });
        return;
      }
      setMessage({ type: "success", text: `Password reset for ${data.user.name}.` });
      setResettingId(null);
      setNewPassword("");
    } finally {
      setBusyId(null);
    }
  }

  async function toggleActive(userId, currentlyActive) {
    setBusyId(userId);
    try {
      await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentlyActive }),
      });
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      {message && (
        <p
          className={`text-xs rounded-lg px-3 py-2 border mb-4 ${
            message.type === "success"
              ? "text-[var(--ng-accent)] bg-[var(--ng-accent)]/10 border-[var(--ng-accent-dim)]"
              : "text-red-400 bg-red-950/40 border-red-900"
          }`}
        >
          {message.text}
        </p>
      )}

      <div className="bg-[var(--ng-surface)] border border-[var(--ng-border)] rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--ng-border)] text-left text-[var(--ng-text-muted)] uppercase text-xs tracking-wide">
              <th className="px-5 py-3 font-medium">Name</th>
              <th className="px-5 py-3 font-medium">Email</th>
              <th className="px-5 py-3 font-medium">Role</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const isSelf = u._id === currentUserId;
              const isResetting = resettingId === u._id;

              return (
                <tr key={u._id} className="border-b border-[var(--ng-border)] last:border-0">
                  <td className="px-5 py-3 text-[var(--ng-text)]">
                    {u.name} {isSelf && <span className="text-xs text-[var(--ng-text-muted)]">(you)</span>}
                  </td>
                  <td className="px-5 py-3 text-[var(--ng-text-muted)]">{u.email}</td>
                  <td className="px-5 py-3 text-[var(--ng-text-muted)] capitalize">{u.role}</td>
                  <td className="px-5 py-3">
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        u.isActive
                          ? "bg-[var(--ng-accent)]/20 text-[var(--ng-accent)]"
                          : "bg-red-950/40 text-red-400"
                      }`}
                    >
                      {u.isActive ? "Active" : "Deactivated"}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    {isResetting ? (
                      <div className="flex items-center gap-2">
                        <input
                          autoFocus
                          type="text"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="New password"
                          className="w-32 bg-[var(--ng-bg)] border border-[var(--ng-border)] rounded-md px-2 py-1 text-xs text-[var(--ng-text)] focus:outline-none focus:ring-1 focus:ring-[var(--ng-accent)]"
                        />
                        <button
                          onClick={() => confirmReset(u._id)}
                          disabled={busyId === u._id}
                          className="text-xs font-medium text-[var(--ng-accent)] hover:text-[var(--ng-accent-dim)]"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setResettingId(null);
                            setNewPassword("");
                          }}
                          className="text-xs text-[var(--ng-text-muted)] hover:text-[var(--ng-text)]"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 justify-end">
                        <button
                          onClick={() => {
                            setResettingId(u._id);
                            setNewPassword("");
                            setMessage(null);
                          }}
                          className="text-xs text-[var(--ng-text-muted)] hover:text-[var(--ng-accent)]"
                        >
                          Reset password
                        </button>
                        {!isSelf && (
                          <button
                            onClick={() => toggleActive(u._id, u.isActive)}
                            disabled={busyId === u._id}
                            className="text-xs text-[var(--ng-text-muted)] hover:text-red-400"
                          >
                            {u.isActive ? "Deactivate" : "Activate"}
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}