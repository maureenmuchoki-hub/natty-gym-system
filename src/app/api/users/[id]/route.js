import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import { getAuthUser, requireRole } from "@/lib/requireAuth";

// PATCH /api/users/:id — admin resets a password, changes role/branch, or toggles active status
export async function PATCH(request, { params }) {
  try {
    const currentUser = await getAuthUser();
    if (!requireRole(currentUser, ["admin"])) {
      return NextResponse.json(
        { success: false, message: "Not authorized" },
        { status: 401 }
      );
    }

    await dbConnect();
    const { id } = await params;
    const body = await request.json();

    const targetUser = await User.findById(id);
    if (!targetUser) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    if (typeof body.password === "string" && body.password.length > 0) {
      targetUser.password = body.password; // pre-save hook hashes this automatically
    }
    if (typeof body.role === "string") {
      targetUser.role = body.role;
    }
    if (typeof body.branch === "string") {
      targetUser.branch = body.branch;
    }
    if (typeof body.isActive === "boolean") {
      targetUser.isActive = body.isActive;
    }

    await targetUser.save();

    const populated = await User.findById(targetUser._id).populate("branch");

    return NextResponse.json({
      success: true,
      user: {
        id: populated._id,
        name: populated.name,
        email: populated.email,
        role: populated.role,
        branch: populated.branch,
        isActive: populated.isActive,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Failed to update user", error: error.message },
      { status: 500 }
    );
  }
}