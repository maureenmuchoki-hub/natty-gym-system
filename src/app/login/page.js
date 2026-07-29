"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const BRANCHES = ["Kahawa Sukari", "Membley", "Ruiru Kihunguro", "Kenyatta Road"];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!data.success) {
        setError(data.message || "Login failed. Check your details and try again.");
        setLoading(false);
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError("Couldn't reach the server. Check your connection and try again.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--ng-bg)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-4xl grid md:grid-cols-[1.1fr_1fr] rounded-2xl overflow-hidden border border-[var(--ng-border)]">
        {/* Left panel — brand + branch board */}
        <div className="bg-[var(--ng-surface)] p-10 flex flex-col justify-between">
          <div>
            <h1 className="font-display text-6xl text-[var(--ng-accent)] leading-none">
              NATTY GYM
            </h1>
            <p className="text-[var(--ng-text-muted)] mt-3 text-sm tracking-wide uppercase">
              Staff &amp; Admin Portal
            </p>
          </div>

          <div className="mt-10">
            <p className="text-xs uppercase tracking-widest text-[var(--ng-text-muted)] mb-3">
              Locations
            </p>
            <ul className="border-t border-[var(--ng-border)]">
              {BRANCHES.map((branch) => (
                <li
                  key={branch}
                  className="flex items-center justify-between py-3 border-b border-[var(--ng-border)] text-[var(--ng-text)]"
                >
                  <span className="font-medium">{branch}</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--ng-accent)]" />
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right panel — login form */}
        <div className="bg-[var(--ng-bg)] p-10 flex flex-col justify-center">
          <h2 className="font-display text-3xl text-[var(--ng-text)] mb-1">Sign in</h2>
          <p className="text-[var(--ng-text-muted)] text-sm mb-8">
            Enter your staff credentials to continue.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="block text-xs uppercase tracking-wide text-[var(--ng-text-muted)] mb-2"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[var(--ng-surface)] border border-[var(--ng-border)] rounded-lg px-4 py-3 text-[var(--ng-text)] focus:outline-none focus:ring-2 focus:ring-[var(--ng-accent)] focus:border-transparent"
                placeholder="you@nattygym.com"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs uppercase tracking-wide text-[var(--ng-text-muted)] mb-2"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[var(--ng-surface)] border border-[var(--ng-border)] rounded-lg px-4 py-3 text-[var(--ng-text)] focus:outline-none focus:ring-2 focus:ring-[var(--ng-accent)] focus:border-transparent"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p className="text-sm text-red-400 bg-red-950/40 border border-red-900 rounded-lg px-4 py-3">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[var(--ng-accent)] text-[#151511] font-semibold rounded-lg py-3 hover:bg-[var(--ng-accent-dim)] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}