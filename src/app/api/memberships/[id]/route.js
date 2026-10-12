import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Membership from "@/models/Membership";
import Payment from "@/models/Payment";
import Attendance from "@/models/Attendance";
import { getAuthUser, requireRole } from "@/lib/requireAuth";

// PATCH /api/memberships/:id — update a membership's status (e.g. cancel it)
export async function PATCH(request, { params }) {
  try {
    const user = await getAuthUser();
    if (!requireRole(user, ["admin", "staff", "accountant"])) {
      return NextResponse.json(
        { success: false, message: "Not authorized" },
        { status: 401 }
      );
    }

    await dbConnect();
    const { id } = await params;
    const { status, extendDays, extendReason } = await request.json();

    const membership = await Membership.findById(id);
    if (!membership) {
      return NextResponse.json(
        { success: false, message: "Membership not found" },
        { status: 404 }
      );
    }

    let refunded = false;

    if (status !== undefined) {
      const allowedStatuses = ["active", "expired", "cancelled"];
      if (!allowedStatuses.includes(status)) {
        return NextResponse.json(
          { success: false, message: "Invalid status value" },
          { status: 400 }
        );
      }
      membership.status = status;

      // If this is being cancelled and the member never actually attended
      // during this period, auto-refund the linked payment — they got no
      // value from it, so it shouldn't count as real revenue. This covers
      // both "cancelled before it even started" and "cancelled early but
      // never went once."
      if (status === "cancelled") {
        const attendanceCount = await Attendance.countDocuments({
          member: membership.member,
          checkInTime: { $gte: membership.startDate, $lte: membership.endDate },
        });

        if (attendanceCount === 0) {
          const payment = await Payment.findOne({ membership: membership._id });
          if (payment && payment.status === "completed") {
            payment.status = "refunded";
            await payment.save();
            refunded = true;
          }
        }
      }
    }

    // Credit days back (e.g. member was away and missed 7+ consecutive days)
    if (typeof extendDays === "number") {
      if (extendDays <= 0 || extendDays > 365) {
        return NextResponse.json(
          { success: false, message: "Days credited must be between 1 and 365" },
          { status: 400 }
        );
      }
      const newEnd = new Date(membership.endDate);
      newEnd.setDate(newEnd.getDate() + extendDays);
      membership.endDate = newEnd;
      membership.creditedDays = (membership.creditedDays || 0) + extendDays;
      membership.creditNotes = [
        ...(membership.creditNotes || []),
        {
          days: extendDays,
          reason: extendReason || "Missed days credited",
          appliedAt: new Date(),
        },
      ];
      // An expired membership that gets credited may become active again
      if (membership.status === "expired" && membership.endDate >= new Date()) {
        membership.status = "active";
      }
    }

    await membership.save();

    const populated = await Membership.findById(membership._id)
      .populate("member")
      .populate("plan")
      .populate("branch");

    return NextResponse.json({ success: true, membership: populated, refunded });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Failed to update membership", error: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/memberships/:id — permanently remove an expired/cancelled membership record.
// Admin only. The linked Payment record is NOT deleted — revenue history stays intact.
export async function DELETE(request, { params }) {
  try {
    const user = await getAuthUser();
    if (!requireRole(user, ["admin"])) {
      return NextResponse.json(
        { success: false, message: "Not authorized" },
        { status: 401 }
      );
    }

    await dbConnect();
    const { id } = await params;

    const membership = await Membership.findById(id);
    if (!membership) {
      return NextResponse.json(
        { success: false, message: "Membership not found" },
        { status: 404 }
      );
    }

    const now = new Date();
    const isExpired = membership.endDate < now;
    const isCancelled = membership.status === "cancelled";

    if (!isExpired && !isCancelled) {
      return NextResponse.json(
        {
          success: false,
          message: "Only expired or cancelled memberships can be deleted. Cancel it first.",
        },
        { status: 400 }
      );
    }

    await Membership.findByIdAndDelete(id);

    return NextResponse.json({ success: true, message: "Membership record deleted" });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Failed to delete membership", error: error.message },
      { status: 500 }
    );
  }
}