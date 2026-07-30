import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Membership from "@/models/Membership";
import { getAuthUser, requireRole } from "@/lib/requireAuth";

// PATCH /api/memberships/:id — update a membership's status (e.g. cancel it)
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
    const { status } = await request.json();

    const allowedStatuses = ["active", "expired", "cancelled"];
    if (!allowedStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, message: "Invalid status value" },
        { status: 400 }
      );
    }

    const membership = await Membership.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    )
      .populate("member")
      .populate("plan")
      .populate("branch");

    if (!membership) {
      return NextResponse.json(
        { success: false, message: "Membership not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, membership });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Failed to update membership", error: error.message },
      { status: 500 }
    );
  }
}