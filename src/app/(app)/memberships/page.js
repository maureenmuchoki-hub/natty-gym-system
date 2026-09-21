import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/requireAuth";
import dbConnect from "@/lib/dbConnect";
import Member from "@/models/Member";
import MembershipPlan from "@/models/MembershipPlan";
import Membership from "@/models/Membership";
import Payment from "@/models/Payment";
import Branch from "@/models/Branch";
import EnrollForm from "./EnrollForm";
import MembershipsTable from "./MembershipsTable";

export default async function MembershipsPage() {
  const user = await getAuthUser();

  await dbConnect();

  const members = await Member.find({ isActive: true }).sort({ firstName: 1 }).lean();
  const branches = await Branch.find({ isActive: true }).sort({ name: 1 }).lean();
  const plans = await MembershipPlan.find({ isActive: true }).sort({ price: 1 }).lean();

  const memberships = await Membership.find()
    .populate("member")
    .populate("plan")
    .populate("branch")
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();

  const membershipIds = memberships.map((m) => m._id);
  const payments = await Payment.find({ membership: { $in: membershipIds } }).lean();
  const paymentByMembership = {};
  for (const p of payments) {
    paymentByMembership[p.membership.toString()] = { amount: p.amount, method: p.method };
  }

  const membershipsWithPayment = memberships
    .map((m) => ({
      ...m,
      payment: paymentByMembership[m._id.toString()] || null,
    }))
    .sort((a, b) => {
      const nameA = `${a.member?.firstName || ""} ${a.member?.lastName || ""}`;
      const nameB = `${b.member?.firstName || ""} ${b.member?.lastName || ""}`;
      if (nameA !== nameB) return nameA.localeCompare(nameB);
      return new Date(b.startDate) - new Date(a.startDate);
    });

  const data = JSON.parse(
    JSON.stringify({ members, branches, plans, memberships: membershipsWithPayment })
  );

  return (
    <div>
      <h1 className="font-display text-4xl text-[var(--ng-accent)] mb-1">Memberships</h1>
      <p className="text-sm text-[var(--ng-text-muted)] mb-8">
        Enroll members, track renewals, and manage active periods.
      </p>

      <div className="grid lg:grid-cols-[1fr_360px] gap-6 items-start">
        <MembershipsTable
          memberships={data.memberships}
          plans={data.plans}
          currentUserRole={user.role}
        />
        <EnrollForm members={data.members} branches={data.branches} plans={data.plans} />
      </div>
    </div>
  );
}