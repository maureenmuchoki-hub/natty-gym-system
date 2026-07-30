import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/requireAuth";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import Branch from "@/models/Branch";
import StaffTable from "./StaffTable";
import AddStaffForm from "./AddStaffForm";

export default async function StaffPage() {
  const user = await getAuthUser();
  if (user.role !== "admin") {
    redirect("/dashboard");
  }

  await dbConnect();

  const users = await User.find().populate("branch").sort({ createdAt: -1 }).lean();
  const branches = await Branch.find({ isActive: true }).sort({ name: 1 }).lean();

  const data = JSON.parse(JSON.stringify({ users, branches }));

  return (
    <div>
      <h1 className="font-display text-4xl text-[var(--ng-accent)] mb-1">Staff</h1>
      <p className="text-sm text-[var(--ng-text-muted)] mb-8">
        Manage staff accounts, reset passwords, and control access.
      </p>

      <div className="grid lg:grid-cols-[1fr_340px] gap-6 items-start">
        <StaffTable users={data.users} currentUserId={user._id.toString()} />
        <AddStaffForm branches={data.branches} />
      </div>
    </div>
  );
}