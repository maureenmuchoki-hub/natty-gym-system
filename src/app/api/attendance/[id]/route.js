import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Attendance from "@/models/Attendance";
import { getAuthUser, requireRole } from "@/lib/requireAuth";

// PATCH /api/attendance/:id — check a member out
export async function PATCH(request, { params }) {
  try {
    const user = await getAuthUser();
    if (!requireRole(user, ["admin", "staff"])) {
      return NextResponse.json(
        { success: false, message: "Not authorized" },
        { status: 401 }
      );
    }

    await dbConnect();

    const { id } = await params;

    const attendance = await Attendance.findById(id);
    if (!attendance) {
      return NextResponse.json(
        { success: false, message: "Attendance record not found" },
        { status: 404 }
      );
    }

    if (attendance.checkOutTime) {
      return NextResponse.json(
        { success: false, message: "This member has already checked out" },
        { status: 409 }
      );
    }

    attendance.checkOutTime = new Date();
    await attendance.save();

    const populated = await Attendance.findById(attendance._id)
      .populate("member")
      .populate("branch");

    return NextResponse.json({ success: true, attendance: populated });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Check-out failed", error: error.message },
      { status: 500 }
    );
  }
}