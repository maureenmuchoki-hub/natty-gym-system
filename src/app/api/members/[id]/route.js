import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Member from "@/models/Member";
import Branch from "@/models/Branch"; // needed so populate("branch") can resolve the schema
import { getAuthUser, requireRole } from "@/lib/requireAuth";

// GET /api/members/:id — fetch a single member
export async function GET(request, { params }) {
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

// PATCH /api/members/:id — update a member's details
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

// DELETE /api/members/:id — deactivate a member (soft delete, keeps history intact)
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

    const member = await Member.findByIdAndUpdate(id, { isActive: false }, { new: true });
    if (!member) {
      return NextResponse.json(
        { success: false, message: "Member not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: "Member deactivated", member });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Failed to deactivate member", error: error.message },
      { status: 500 }
    );
  }
}