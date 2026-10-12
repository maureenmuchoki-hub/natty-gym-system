"use client";

import { useState, Fragment } from "react";
import { useRouter } from "next/navigation";

export default function MembersTable({ members, currentUserRole }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState(null);
  const [message, setMessage] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ firstName: "", lastName: "", phone: "", email: "" });

  function openEdit(member) {
    setEditingId(member._id);
    setEditForm({
      firstName: member.firstName || "",
      lastName: member.lastName || "",
      phone: member.phone || "",
      email: member.email || "",
    });
    setMessage(null);
  }

  async function saveEdit(memberId) {
    setBusyId(memberId);
    try {
      const res = await fetch(`/api/members/${memberId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (!data.success) {
        setMessage({ type: "error", text: data.message });
        return;
      }
      setEditingId(null);
      router.refresh();
    } catch {
      setMessage({ type: "error", text: "Couldn't reach the server. Try again." });
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(member) {
    const label = `${member.firstName} ${member.lastName}`;
    if (
      !confirm(
        `Remove ${label}? If they have no membership or attendance history, they'll be permanently deleted. If they do, they'll be deactivated instead so payment records stay intact.`
      )
    ) {
      return;
    }

    setBusyId(member._id);
    try {
      const res = await fetch(`/api/members/${member._id}`, { method: "DELETE" });
      const data = await res.json();
      setMessage({ type: data.success ? "success" : "error", text: data.message });
      if (data.success) {
        router.refresh();
      }
    } catch {
      setMessage({ type: "error", text: "Couldn't reach the server. Try again." });
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
        {members.length === 0 ? (
          <p className="text-[var(--ng-text-muted)] text-sm p-8 text-center">
            No members yet. Add your first one using the form.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--ng-border)] text-left text-[var(--ng-text-muted)] uppercase text-xs tracking-wide">
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Phone</th>
                <th className="px-5 py-3 font-medium">Branch</th>
                <th className="px-5 py-3 font-medium">Joined</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => {
                const isEditing = editingId === member._id;
                return (
                  <Fragment key={member._id}>
                    <tr className="border-b border-[var(--ng-border)] last:border-0">
                      <td className="px-5 py-3 text-[var(--ng-text)]">
                        {member.firstName} {member.lastName}
                      </td>
                      <td className="px-5 py-3 text-[var(--ng-text-muted)]">{member.phone}</td>
                      <td className="px-5 py-3 text-[var(--ng-text-muted)]">
                        {member.branch?.name || "—"}
                      </td>
                      <td className="px-5 py-3 text-[var(--ng-text-muted)] text-xs">
                        {member.joinDate
                          ? new Date(member.joinDate).toLocaleDateString()
                          : "—"}
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            member.isActive
                              ? "bg-[var(--ng-accent)]/20 text-[var(--ng-accent)]"
                              : "bg-red-950/40 text-red-400"
                          }`}
                        >
                          {member.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right whitespace-nowrap">
                        <button
                          onClick={() => (isEditing ? setEditingId(null) : openEdit(member))}
                          className="text-xs text-[var(--ng-text-muted)] hover:text-[var(--ng-accent)] mr-3"
                        >
                          {isEditing ? "Close" : "Edit"}
                        </button>
                        {currentUserRole === "admin" && member.isActive && (
                          <button
                            onClick={() => handleDelete(member)}
                            disabled={busyId === member._id}
                            className="text-xs text-[var(--ng-text-muted)] hover:text-red-400 disabled:opacity-60"
                          >
                            {busyId === member._id ? "..." : "Remove"}
                          </button>
                        )}
                      </td>
                    </tr>
                    {isEditing && (
                      <tr className="border-b border-[var(--ng-border)] bg-[var(--ng-bg)]">
                        <td colSpan={6} className="px-5 py-4">
                          <div className="flex flex-wrap items-end gap-3">
                            <EditField label="First name">
                              <input
                                value={editForm.firstName}
                                onChange={(e) =>
                                  setEditForm((f) => ({ ...f, firstName: e.target.value }))
                                }
                                className="bg-[var(--ng-surface)] border border-[var(--ng-border)] rounded-lg px-3 py-2 text-sm text-[var(--ng-text)] w-32 focus:outline-none focus:ring-2 focus:ring-[var(--ng-accent)]"
                              />
                            </EditField>
                            <EditField label="Last name">
                              <input
                                value={editForm.lastName}
                                onChange={(e) =>
                                  setEditForm((f) => ({ ...f, lastName: e.target.value }))
                                }
                                className="bg-[var(--ng-surface)] border border-[var(--ng-border)] rounded-lg px-3 py-2 text-sm text-[var(--ng-text)] w-32 focus:outline-none focus:ring-2 focus:ring-[var(--ng-accent)]"
                              />
                            </EditField>
                            <EditField label="Phone">
                              <input
                                value={editForm.phone}
                                onChange={(e) =>
                                  setEditForm((f) => ({ ...f, phone: e.target.value }))
                                }
                                className="bg-[var(--ng-surface)] border border-[var(--ng-border)] rounded-lg px-3 py-2 text-sm text-[var(--ng-text)] w-36 focus:outline-none focus:ring-2 focus:ring-[var(--ng-accent)]"
                              />
                            </EditField>
                            <EditField label="Email">
                              <input
                                value={editForm.email}
                                onChange={(e) =>
                                  setEditForm((f) => ({ ...f, email: e.target.value }))
                                }
                                className="bg-[var(--ng-surface)] border border-[var(--ng-border)] rounded-lg px-3 py-2 text-sm text-[var(--ng-text)] w-44 focus:outline-none focus:ring-2 focus:ring-[var(--ng-accent)]"
                              />
                            </EditField>
                            <button
                              onClick={() => saveEdit(member._id)}
                              disabled={busyId === member._id}
                              className="bg-[var(--ng-accent)] text-[#151511] font-semibold rounded-lg px-4 py-2 text-sm hover:bg-[var(--ng-accent-dim)] transition-colors disabled:opacity-60"
                            >
                              {busyId === member._id ? "Saving..." : "Save"}
                            </button>
                          </div>
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
    </div>
  );
}

function EditField({ label, children }) {
  return (
    <div>
      <label className="block text-xs uppercase tracking-wide text-[var(--ng-text-muted)] mb-1">
        {label}
      </label>
      {children}
    </div>
  );
}