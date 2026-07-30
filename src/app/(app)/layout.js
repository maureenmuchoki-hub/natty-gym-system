import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/requireAuth";
import Sidebar from "@/components/Sidebar";

export default async function AppLayout({ children }) {
  const user = await getAuthUser();

  if (!user) {
    redirect("/login");
  }

  const plainUser = { name: user.name, role: user.role };

  return (
    <div className="flex min-h-screen bg-[var(--ng-bg)]">
      <Sidebar user={plainUser} />
      <main className="flex-1 px-8 py-10">{children}</main>
    </div>
  );
}