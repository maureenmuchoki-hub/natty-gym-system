import { getAuthUser } from "@/lib/requireAuth";
import dbConnect from "@/lib/dbConnect";
import Member from "@/models/Member";
import Branch from "@/models/Branch";
import AddMemberForm from "./AddMemberForm";
import MembersTable from "./MembersTable";

export default async function MembersPage() {
  const user = await getAuthUser();

  await dbConnect();
  const members = await Member.find().populate("branch").sort({ createdAt: -1 }).lean();
  const branches = await Branch.find({ isActive: true }).sort({ name: 1 }).lean();

  const membersData = JSON.parse(JSON.stringify(members));
  const branchesData = JSON.parse(JSON.stringify(branches));

  return (
    <div>
      <h1 className="font-display text-4xl text-[var(--ng-accent)] mb-1">Members</h1>
      <p className="text-sm text-[var(--ng-text-muted)] mb-8">
        Add and manage gym members across all branches.
      </p>

      <div className="grid lg:grid-cols-[1fr_320px] gap-6 items-start">
        <MembersTable members={membersData} currentUserRole={user.role} />
        <AddMemberForm branches={branchesData} />
      </div>
    </div>
  );
}