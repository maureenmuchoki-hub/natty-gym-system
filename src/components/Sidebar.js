"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Logo from "./Logo";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/members", label: "Members" },
  { href: "/check-in", label: "Check-in" },
  { href: "/memberships", label: "Memberships" },
  { href: "/register", label: "Register" },
  { href: "/shop", label: "Shop" },
  { href: "/revenue", label: "Revenue" },
  { href: "/branches", label: "Branches" },
];

export default function Sidebar({ user }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="w-60 shrink-0 bg-[var(--ng-surface)] border-r border-[var(--ng-border)] min-h-screen flex flex-col">
      <div className="px-6 py-6">
        <Logo size="sm" />
      </div>

      <nav className="flex-1 px-3 space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-[var(--ng-accent)]/15 text-[var(--ng-accent)]"
                  : "text-[var(--ng-text-muted)] hover:text-[var(--ng-text)] hover:bg-[var(--ng-bg)]"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-6 py-5 border-t border-[var(--ng-border)]">
        <p className="text-sm text-[var(--ng-text)] font-medium truncate">{user.name}</p>
        <p className="text-xs text-[var(--ng-text-muted)] mb-3 capitalize">{user.role}</p>
        <button
          onClick={handleLogout}
          className="text-xs text-[var(--ng-text-muted)] hover:text-[var(--ng-accent)] transition-colors"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}