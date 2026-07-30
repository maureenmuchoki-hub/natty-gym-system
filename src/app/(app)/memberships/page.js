import { redirect } from "next/navigation";
import Link from "next/link";
import { getAuthUser } from "@/lib/requireAuth";
import dbConnect from "@/lib/dbConnect";
import Member from "@/models/Member";
import MembershipPlan from "@/models/MembershipPlan";
import Membership from "@/models/Membership";
import Branch from "@/models/Branch";
import EnrollForm from "./EnrollForm";
import MembershipsTable from "./MembershipsTable";

export default async function MembershipsPage() {
  const user = await getAuthUser();
  if (!user) {
    redirect("/login");
  }

  await dbConnect();

  const members = await Member.find({ isActive: true }).sort({ firstName: 1 }).lean();
  const branches = await Branch.find({ isActive: true }).sort({ name: 1 }).lean();
  const plans = await MembershipPlan.find({ isActive: true }).sort({ price: 1 }).lean();

  const memberships = await Membership.find()
    .populate("member")
    .populate("plan")
    .populate("branch")
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();

  const data = JSON.parse(
    JSON.stringify({ members, branches, plans, memberships })
  );

  return (
    <div className="min-h-screen bg-[var(--ng-bg)] px-6 py-10">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="text-xs uppercase tracking-widest text-[var(--ng-text-muted)] hover:text-[var(--ng-accent)]"
          >
            ← Dashboard
          </Link>
          <h1 className="font-display text-4xl text-[var(--ng-accent)] mt-2">Memberships</h1>
        </div>

        <div className="grid lg:grid-cols-[1fr_360px] gap-6 items-start">
          <div className="bg-[var(--ng-surface)] border border-[var(--ng-border)] rounded-xl overflow-hidden">
            <MembershipsTable memberships={data.memberships} />
          </div>

          <EnrollForm members={data.members} branches={data.branches} plans={data.plans} />
        </div>
      </div>
    </div>
  );
}