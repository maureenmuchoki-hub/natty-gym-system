import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Attendance from "@/models/Attendance";
import Membership from "@/models/Membership";
import Member from "@/models/Member";
import Branch from "@/models/Branch";
import { getAuthUser, requireRole } from "@/lib/requireAuth";

// GET /api/attendance — list attendance records (optionally filter by member or branch)
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

    const filter = {};
    if (memberId) filter.member = memberId;
    if (branchId) filter.branch = branchId;

    const records = await Attendance.find(filter)
      .populate("member")
      .populate("branch")
      .sort({ checkInTime: -1 });

    return NextResponse.json({ success: true, count: records.length, records });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Failed to fetch attendance", error: error.message },
      { status: 500 }
    );
  }
}

// POST /api/attendance — check a member in (validates they have an active, unexpired membership)
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

    const { member: memberId } = await request.json();

    if (!memberId) {
      return NextResponse.json(
        { success: false, message: "member is required" },
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

    // Check for a currently active, unexpired membership
    const activeMembership = await Membership.findOne({
      member: memberId,
      status: "active",
      endDate: { $gte: new Date() },
    }).sort({ endDate: -1 });

    if (!activeMembership) {
      return NextResponse.json(
        {
          success: false,
          message: "This member does not have an active membership. Check-in denied.",
        },
        { status: 403 }
      );
    }

    // Prevent duplicate check-in if they haven't checked out yet
    const openAttendance = await Attendance.findOne({
      member: memberId,
      checkOutTime: null,
    });

    if (openAttendance) {
      return NextResponse.json(
        {
          success: false,
          message: "This member is already checked in and hasn't checked out yet.",
        },
        { status: 409 }
      );
    }

    const attendance = await Attendance.create({
      member: memberId,
      branch: activeMembership.branch,
      checkInTime: new Date(),
    });

    const populated = await Attendance.findById(attendance._id)
      .populate("member")
      .populate("branch");

    return NextResponse.json({ success: true, attendance: populated }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Check-in failed", error: error.message },
      { status: 500 }
    );
  }
}