"use client";

import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      className="text-sm text-[var(--ng-text-muted)] hover:text-[var(--ng-accent)] transition-colors border border-[var(--ng-border)] rounded-lg px-4 py-2"
    >
      Sign out
    </button>
  );
}