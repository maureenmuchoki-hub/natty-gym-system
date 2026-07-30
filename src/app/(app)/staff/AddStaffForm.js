"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AddStaffForm({ branches }) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "staff",
    branch: branches[0]?._id || "",
  });
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage(null);
    setLoading(true);

    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!data.success) {
        setMessage({ type: "error", text: data.message });
        return;
      }

      setMessage({ type: "success", text: "Staff account created." });
      setForm({ name: "", email: "", password: "", role: "staff", branch: branches[0]?._id || "" });
      router.refresh();
    } catch {
      setMessage({ type: "error", text: "Couldn't reach the server. Try again." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-[var(--ng-surface)] border border-[var(--ng-border)] rounded-xl p-6">
      <h2 className="font-display text-2xl text-[var(--ng-text)] mb-4">Add staff account</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Name">
          <input
            required
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            className="w-full bg-[var(--ng-bg)] border border-[var(--ng-border)] rounded-lg px-3 py-2 text-sm text-[var(--ng-text)] focus:outline-none focus:ring-2 focus:ring-[var(--ng-accent)]"
          />
        </Field>

        <Field label="Email">
          <input
            required
            type="email"
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
            className="w-full bg-[var(--ng-bg)] border border-[var(--ng-border)] rounded-lg px-3 py-2 text-sm text-[var(--ng-text)] focus:outline-none focus:ring-2 focus:ring-[var(--ng-accent)]"
          />
        </Field>

        <Field label="Temporary password">
          <input
            required
            minLength={8}
            value={form.password}
            onChange={(e) => update("password", e.target.value)}
            placeholder="At least 8 characters"
            className="w-full bg-[var(--ng-bg)] border border-[var(--ng-border)] rounded-lg px-3 py-2 text-sm text-[var(--ng-text)] focus:outline-none focus:ring-2 focus:ring-[var(--ng-accent)]"
          />
        </Field>

        <Field label="Role">
          <select
            value={form.role}
            onChange={(e) => update("role", e.target.value)}
            className="w-full bg-[var(--ng-bg)] border border-[var(--ng-border)] rounded-lg px-3 py-2 text-sm text-[var(--ng-text)] focus:outline-none focus:ring-2 focus:ring-[var(--ng-accent)]"
          >
            <option value="staff">Staff</option>
            <option value="admin">Admin</option>
          </select>
        </Field>

        <Field label="Branch">
          <select
            value={form.branch}
            onChange={(e) => update("branch", e.target.value)}
            className="w-full bg-[var(--ng-bg)] border border-[var(--ng-border)] rounded-lg px-3 py-2 text-sm text-[var(--ng-text)] focus:outline-none focus:ring-2 focus:ring-[var(--ng-accent)]"
          >
            {branches.map((b) => (
              <option key={b._id} value={b._id}>
                {b.name}
              </option>
            ))}
          </select>
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
          {loading ? "Creating..." : "Create account"}
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