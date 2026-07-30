import { redirect } from "next/navigation";
import Link from "next/link";
import { getAuthUser } from "@/lib/requireAuth";
import dbConnect from "@/lib/dbConnect";
import Member from "@/models/Member";
import Branch from "@/models/Branch";
import AddMemberForm from "./AddMemberForm";

export default async function MembersPage() {
  const user = await getAuthUser();
  if (!user) {
    redirect("/login");
  }

  await dbConnect();
  const members = await Member.find().populate("branch").sort({ createdAt: -1 }).lean();
  const branches = await Branch.find({ isActive: true }).sort({ name: 1 }).lean();

  // Serialize for passing to the client component
  const membersData = JSON.parse(JSON.stringify(members));
  const branchesData = JSON.parse(JSON.stringify(branches));

  return (
    <div className="min-h-screen bg-[var(--ng-bg)] px-6 py-10">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link
              href="/dashboard"
              className="text-xs uppercase tracking-widest text-[var(--ng-text-muted)] hover:text-[var(--ng-accent)]"
            >
              ← Dashboard
            </Link>
            <h1 className="font-display text-4xl text-[var(--ng-accent)] mt-2">Members</h1>
          </div>
        </div>

        <div className="grid lg:grid-cols-[1fr_320px] gap-6 items-start">
          {/* Members table */}
          <div className="bg-[var(--ng-surface)] border border-[var(--ng-border)] rounded-xl overflow-hidden">
            {membersData.length === 0 ? (
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
                    <th className="px-5 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {membersData.map((member) => (
                    <tr
                      key={member._id}
                      className="border-b border-[var(--ng-border)] last:border-0"
                    >
                      <td className="px-5 py-3 text-[var(--ng-text)]">
                        {member.firstName} {member.lastName}
                      </td>
                      <td className="px-5 py-3 text-[var(--ng-text-muted)]">{member.phone}</td>
                      <td className="px-5 py-3 text-[var(--ng-text-muted)]">
                        {member.branch?.name || "—"}
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
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Add member form */}
          <AddMemberForm branches={branchesData} />
        </div>
      </div>
    </div>
  );
}