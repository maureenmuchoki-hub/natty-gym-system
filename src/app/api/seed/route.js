import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Branch from "@/models/Branch";
import MembershipPlan from "@/models/MembershipPlan";

// ------------------------------------------------------------------
// SERVICES (offered across all branches)
// ------------------------------------------------------------------
const SERVICES = [
  "Gym Access",
  "Weight Training",
  "Cardio Training",
  "Personal Training",
  "Functional Training",
  "Strength Training",
  "Fat Loss Programs",
  "Muscle Building",
  "Group Fitness Classes",
  "Nutrition Guidance",
  "Kids Fitness",
  "Student Packages",
  "Locker Services",
  "Showers",
  "Parking",
  "Supplement Shop",
];

// ------------------------------------------------------------------
// BRANCHES
// ------------------------------------------------------------------
const BRANCHES = [
  {
    name: "Kahawa Sukari",
    code: "KS",
    location: "Kahawa Sukari, Nairobi",
    services: SERVICES,
  },
  {
    name: "Membley",
    code: "MB",
    location: "Membley, Kiambu County",
    services: SERVICES,
  },
  {
    name: "Ruiru Kihunguro",
    code: "RK",
    location: "Kihunguro, Ruiru",
    services: SERVICES,
  },
  {
    name: "Kenyatta Road",
    code: "KR",
    location: "Kenyatta Road, Nairobi",
    services: SERVICES,
  },
];

// ------------------------------------------------------------------
// PRICING RULES
// ------------------------------------------------------------------
const FLAT_RATE_PLANS = [
  { type: "daily", label: "Daily Subscription", price: 450, durationDays: 1 },
  { type: "weekly", label: "Weekly Subscription", price: 1900, durationDays: 7 },
  { type: "biweekly", label: "Bi-Weekly Subscription", price: 2500, durationDays: 14 },
];

const DISCOUNT_BRANCH_CODE = "KR"; // Kenyatta Road gets the lower tiered rate

const TIERED_PLANS = [
  {
    type: "monthly",
    label: "Monthly Subscription",
    durationDays: 30,
    standardPrice: 4500,
    discountPrice: 4000,
  },
  {
    type: "quarterly",
    label: "Quarterly Subscription (3 Months)",
    durationDays: 90,
    standardPrice: 12500,
    discountPrice: 10500,
  },
  {
    type: "yearly",
    label: "Yearly Subscription",
    durationDays: 365,
    standardPrice: 45000,
    discountPrice: 40000,
  },
];

// NOTE: half-yearly rate was never confirmed — placeholder values below.
// Replace standardPrice/discountPrice once you have the real figures.
const HALF_YEAR_PLACEHOLDER = {
  type: "half_yearly",
  label: "Half-Yearly Subscription (6 Months)",
  durationDays: 182,
  standardPrice: 24000, // PLACEHOLDER
  discountPrice: 21000, // PLACEHOLDER
};

const SPECIAL_PLANS = [
  {
    type: "student",
    label: "Student Package",
    price: 3500,
    durationDays: 30,
    requiresVerification: true,
    verificationDocument: "Valid Student ID",
  },
  {
    type: "kids",
    label: "Kids Package",
    price: 450,
    durationDays: 1,
    requiresVerification: true,
    verificationDocument: "Birth Certificate",
  },
];

export async function GET() {
  try {
    await dbConnect();

    // Clear existing data so this route is safely re-runnable
    await Branch.deleteMany({});
    await MembershipPlan.deleteMany({});

    const createdBranches = await Branch.insertMany(BRANCHES);

    const plansToInsert = [];

    for (const branch of createdBranches) {
      FLAT_RATE_PLANS.forEach((plan) => {
        plansToInsert.push({
          name: plan.label,
          type: plan.type,
          branch: branch._id,
          price: plan.price,
          durationDays: plan.durationDays,
        });
      });

      [...TIERED_PLANS, HALF_YEAR_PLACEHOLDER].forEach((plan) => {
        const isDiscountBranch = branch.code === DISCOUNT_BRANCH_CODE;
        const price = isDiscountBranch ? plan.discountPrice : plan.standardPrice;
        plansToInsert.push({
          name: plan.label,
          type: plan.type,
          branch: branch._id,
          price,
          durationDays: plan.durationDays,
        });
      });

      SPECIAL_PLANS.forEach((plan) => {
        plansToInsert.push({
          name: plan.label,
          type: plan.type,
          branch: branch._id,
          price: plan.price,
          durationDays: plan.durationDays,
          requiresVerification: plan.requiresVerification,
          verificationDocument: plan.verificationDocument,
        });
      });
    }

    const createdPlans = await MembershipPlan.insertMany(plansToInsert);

    return NextResponse.json({
      success: true,
      branchesCreated: createdBranches.length,
      plansCreated: createdPlans.length,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Seeding failed", error: error.message },
      { status: 500 }
    );
  }
}