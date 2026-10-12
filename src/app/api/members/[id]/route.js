import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Member from "@/models/Member";
import Membership from "@/models/Membership";
import Attendance from "@/models/Attendance";
import Branch from "@/models/Branch";
import { getAuthUser, requireRole } from "@/lib/requireAuth";

export async function GET(request, { params }) {
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

    const member = await Member.findById(id).populate("branch");
    if (!member) {
      return NextResponse.json(
        { success: false, message: "Member not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, member });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Failed to fetch member", error: error.message },
      { status: 500 }
    );
  }
}

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
    const updates = await request.json();

    delete updates._id;
    delete updates.createdAt;
    delete updates.updatedAt;

    const member = await Member.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    }).populate("branch");

    if (!member) {
      return NextResponse.json(
        { success: false, message: "Member not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, member });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Failed to update member", error: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/members/:id — admin only.
// If this member has no membership or attendance history at all (e.g. they
// signed up and never actually paid), permanently deletes them so their
// phone number is free to use again. If they DO have history, refuses to
// destroy it and deactivates the account instead.
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

    const member = await Member.findById(id);
    if (!member) {
      return NextResponse.json(
        { success: false, message: "Member not found" },
        { status: 404 }
      );
    }

    const [membershipCount, attendanceCount] = await Promise.all([
      Membership.countDocuments({ member: id }),
      Attendance.countDocuments({ member: id }),
    ]);

    if (membershipCount === 0 && attendanceCount === 0) {
      await Member.findByIdAndDelete(id);
      return NextResponse.json({
        success: true,
        deleted: true,
        message: "Member permanently deleted — no history existed for this record.",
      });
    }

    member.isActive = false;
    await member.save();
    return NextResponse.json({
      success: true,
      deleted: false,
      message:
        "This member has membership or attendance history, so they were deactivated instead of deleted — deleting would have erased real payment records.",
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Failed to remove member", error: error.message },
      { status: 500 }
    );
  }
}