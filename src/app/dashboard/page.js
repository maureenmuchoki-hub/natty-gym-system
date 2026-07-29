import { redirect } from "next/navigation";
import Link from "next/link";
import { getAuthUser } from "@/lib/requireAuth";
import LogoutButton from "./LogoutButton";

export default async function DashboardPage() {
  const user = await getAuthUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-[var(--ng-bg)] px-6 py-10">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="font-display text-4xl text-[var(--ng-accent)]">NATTY GYM</h1>
            <p className="text-[var(--ng-text-muted)] text-sm mt-1">
              Signed in as {user.name} · {user.role}
            </p>
          </div>
          <LogoutButton />
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <DashboardCard href="/members" label="Members" description="View and manage gym members" />
          <DashboardCard href="/check-in" label="Check-in" description="Check members in and out" />
          <DashboardCard href="/memberships" label="Memberships" description="Enroll members into plans" />
          <DashboardCard href="/branches" label="Branches" description="View branch details and pricing" />
        </div>
      </div>
    </div>
  );
}

function DashboardCard({ href, label, description }) {
  return (
    <Link
      href={href}
      className="block bg-[var(--ng-surface)] border border-[var(--ng-border)] rounded-xl p-6 hover:border-[var(--ng-accent)] transition-colors cursor-pointer"
    >
      <h3 className="font-display text-2xl text-[var(--ng-text)] mb-1">{label}</h3>
      <p className="text-sm text-[var(--ng-text-muted)]">{description}</p>
    </Link>
  );
}