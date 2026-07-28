import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Membership from "@/models/Membership";
import MembershipPlan from "@/models/MembershipPlan";
import Payment from "@/models/Payment";
import Member from "@/models/Member";
import { getAuthUser, requireRole } from "@/lib/requireAuth";

// GET /api/memberships — list memberships (optionally filter by member or branch)
export async function GET(request) {
  try {
    const user = await getAuthUser();
    if (!requireRole(user, ["admin", "staff"])) {
      return NextResponse.json(
        { success: false, message: "Not authorized" },
        { status: 401 }
      );
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get("member");
    const branchId = searchParams.get("branch");
    const status = searchParams.get("status");

    const filter = {};
    if (memberId) filter.member = memberId;
    if (branchId) filter.branch = branchId;
    if (status) filter.status = status;

    const memberships = await Membership.find(filter)
      .populate("member")
      .populate("plan")
      .populate("branch")
      .sort({ createdAt: -1 });

    return NextResponse.json({ success: true, count: memberships.length, memberships });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Failed to fetch memberships", error: error.message },
      { status: 500 }
    );
  }
}

// POST /api/memberships — enroll a member into a plan + record the payment for it
export async function POST(request) {
  try {
    const user = await getAuthUser();
    if (!requireRole(user, ["admin", "staff"])) {
      return NextResponse.json(
        { success: false, message: "Not authorized" },
        { status: 401 }
      );
    }

    await dbConnect();

    const body = await request.json();
    const { member: memberId, plan: planId, paymentMethod, transactionId, startDate } = body;

    if (!memberId || !planId || !paymentMethod) {
      return NextResponse.json(
        { success: false, message: "member, plan, and paymentMethod are required" },
        { status: 400 }
      );
    }

    const member = await Member.findById(memberId);
    if (!member) {
      return NextResponse.json(
        { success: false, message: "Member not found" },
        { status: 404 }
      );
    }

    const plan = await MembershipPlan.findById(planId);
    if (!plan) {
      return NextResponse.json(
        { success: false, message: "Membership plan not found" },
        { status: 404 }
      );
    }

    // Calculate start/end dates based on the plan's durationDays
    const start = startDate ? new Date(startDate) : new Date();
    const end = new Date(start);
    end.setDate(end.getDate() + plan.durationDays);

    const membership = await Membership.create({
      member: member._id,
      plan: plan._id,
      branch: plan.branch,
      startDate: start,
      endDate: end,
      status: "active",
    });

    const payment = await Payment.create({
      member: member._id,
      membership: membership._id,
      branch: plan.branch,
      amount: plan.price,
      method: paymentMethod,
      transactionId: transactionId || undefined,
      status: "completed",
      paidAt: new Date(),
    });

    const populatedMembership = await Membership.findById(membership._id)
      .populate("member")
      .populate("plan")
      .populate("branch");

    return NextResponse.json(
      { success: true, membership: populatedMembership, payment },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Failed to create membership", error: error.message },
      { status: 500 }
    );
  }
}