import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Member from "@/models/Member";
import { getAuthUser, requireRole } from "@/lib/requireAuth";

// GET /api/members — list members (optionally filter by branch)
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
    const branchId = searchParams.get("branch");

    const filter = branchId ? { branch: branchId } : {};
    const members = await Member.find(filter).populate("branch").sort({ createdAt: -1 });

    return NextResponse.json({ success: true, count: members.length, members });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Failed to fetch members", error: error.message },
      { status: 500 }
    );
  }
}

// POST /api/members — create a new member
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
    const {
      firstName,
      lastName,
      email,
      phone,
      dateOfBirth,
      gender,
      branch,
      emergencyContactName,
      emergencyContactPhone,
      verificationDocumentUrl,
    } = body;

    if (!firstName || !lastName || !phone || !branch) {
      return NextResponse.json(
        { success: false, message: "firstName, lastName, phone, and branch are required" },
        { status: 400 }
      );
    }

    const member = await Member.create({
      firstName,
      lastName,
      email,
      phone,
      dateOfBirth,
      gender,
      branch,
      emergencyContactName,
      emergencyContactPhone,
      verificationDocumentUrl,
    });

    return NextResponse.json({ success: true, member }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Failed to create member", error: error.message },
      { status: 500 }
    );
  }
}