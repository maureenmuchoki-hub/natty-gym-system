import { redirect } from "next/navigation";
import Link from "next/link";
import { getAuthUser } from "@/lib/requireAuth";
import dbConnect from "@/lib/dbConnect";
import Branch from "@/models/Branch";
import MembershipPlan from "@/models/MembershipPlan";

const PLAN_ORDER = [
  "daily",
  "weekly",
  "biweekly",
  "monthly",
  "quarterly",
  "half_yearly",
  "yearly",
  "student",
  "kids",
];

const PLAN_TYPE_LABELS = {
  daily: "Daily",
  weekly: "Weekly",
  biweekly: "Bi-Weekly",
  monthly: "Monthly",
  quarterly: "Quarterly (3 mo)",
  half_yearly: "Half-Yearly (6 mo)",
  yearly: "Yearly",
  student: "Student",
  kids: "Kids",
};

export default async function BranchesPage() {
  const user = await getAuthUser();
  if (!user) {
    redirect("/login");
  }

  await dbConnect();

  const branches = await Branch.find({ isActive: true }).sort({ name: 1 }).lean();
  const plans = await MembershipPlan.find({ isActive: true }).lean();

  const data = JSON.parse(JSON.stringify({ branches, plans }));

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
          <h1 className="font-display text-4xl text-[var(--ng-accent)] mt-2">Branches</h1>
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          {data.branches.map((branch) => {
            const branchPlans = data.plans
              .filter((p) => p.branch === branch._id)
              .sort((a, b) => PLAN_ORDER.indexOf(a.type) - PLAN_ORDER.indexOf(b.type));

            return (
              <div
                key={branch._id}
                className="bg-[var(--ng-surface)] border border-[var(--ng-border)] rounded-xl p-6"
              >
                <h2 className="font-display text-3xl text-[var(--ng-text)]">{branch.name}</h2>
                <p className="text-sm text-[var(--ng-text-muted)] mt-1 mb-5">
                  {branch.location}
                </p>

                <p className="text-xs uppercase tracking-widest text-[var(--ng-text-muted)] mb-2">
                  Pricing
                </p>
                <ul className="border-t border-[var(--ng-border)] mb-6">
                  {branchPlans.map((plan) => (
                    <li
                      key={plan._id}
                      className="flex items-center justify-between py-2 border-b border-[var(--ng-border)] text-sm"
                    >
                      <span className="text-[var(--ng-text)]">
                        {PLAN_TYPE_LABELS[plan.type] || plan.name}
                      </span>
                      <span className="text-[var(--ng-accent)] font-medium">
                        KSh {plan.price.toLocaleString()}
                      </span>
                    </li>
                  ))}
                </ul>

                <p className="text-xs uppercase tracking-widest text-[var(--ng-text-muted)] mb-2">
                  Services
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {branch.services.map((service) => (
                    <span
                      key={service}
                      className="text-xs text-[var(--ng-text-muted)] border border-[var(--ng-border)] rounded-full px-2.5 py-1"
                    >
                      {service}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}