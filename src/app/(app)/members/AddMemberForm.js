"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AddMemberForm({ branches }) {
  const router = useRouter();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    branch: branches[0]?._id || "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setLoading(true);

    try {
      const res = await fetch("/api/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!data.success) {
        setError(data.message || "Couldn't add this member.");
        setLoading(false);
        return;
      }

      setForm({ firstName: "", lastName: "", phone: "", branch: branches[0]?._id || "" });
      setSuccess(true);
      router.refresh();
    } catch (err) {
      setError("Couldn't reach the server. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-[var(--ng-surface)] border border-[var(--ng-border)] rounded-xl p-6">
      <h2 className="font-display text-2xl text-[var(--ng-text)] mb-4">Add member</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="First name">
          <input
            required
            value={form.firstName}
            onChange={(e) => update("firstName", e.target.value)}
            className="w-full bg-[var(--ng-bg)] border border-[var(--ng-border)] rounded-lg px-3 py-2 text-sm text-[var(--ng-text)] focus:outline-none focus:ring-2 focus:ring-[var(--ng-accent)]"
          />
        </Field>

        <Field label="Last name">
          <input
            required
            value={form.lastName}
            onChange={(e) => update("lastName", e.target.value)}
            className="w-full bg-[var(--ng-bg)] border border-[var(--ng-border)] rounded-lg px-3 py-2 text-sm text-[var(--ng-text)] focus:outline-none focus:ring-2 focus:ring-[var(--ng-accent)]"
          />
        </Field>

        <Field label="Phone">
          <input
            required
            value={form.phone}
            onChange={(e) => update("phone", e.target.value)}
            placeholder="07XXXXXXXX"
            className="w-full bg-[var(--ng-bg)] border border-[var(--ng-border)] rounded-lg px-3 py-2 text-sm text-[var(--ng-text)] focus:outline-none focus:ring-2 focus:ring-[var(--ng-accent)]"
          />
        </Field>

        <Field label="Branch">
          <select
            required
            value={form.branch}
            onChange={(e) => update("branch", e.target.value)}
            className="w-full bg-[var(--ng-bg)] border border-[var(--ng-border)] rounded-lg px-3 py-2 text-sm text-[var(--ng-text)] focus:outline-none focus:ring-2 focus:ring-[var(--ng-accent)]"
          >
            {branches.map((branch) => (
              <option key={branch._id} value={branch._id}>
                {branch.name}
              </option>
            ))}
          </select>
        </Field>

        {error && (
          <p className="text-xs text-red-400 bg-red-950/40 border border-red-900 rounded-lg px-3 py-2">
            {error}
          </p>
        )}
        {success && (
          <p className="text-xs text-[var(--ng-accent)] bg-[var(--ng-accent)]/10 border border-[var(--ng-accent-dim)] rounded-lg px-3 py-2">
            Member added.
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[var(--ng-accent)] text-[#151511] font-semibold rounded-lg py-2.5 text-sm hover:bg-[var(--ng-accent-dim)] transition-colors disabled:opacity-60"
        >
          {loading ? "Adding..." : "Add member"}
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