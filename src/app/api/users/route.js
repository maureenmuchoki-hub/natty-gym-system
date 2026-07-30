import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import Branch from "@/models/Branch";
import { getAuthUser, requireRole } from "@/lib/requireAuth";

// GET /api/users — list all staff/admin accounts (admin only)
export async function GET() {
  try {
    const user = await getAuthUser();
    if (!requireRole(user, ["admin"])) {
      return NextResponse.json(
        { success: false, message: "Not authorized" },
        { status: 401 }
      );
    }

    await dbConnect();
    const users = await User.find().populate("branch").sort({ createdAt: -1 });

    return NextResponse.json({ success: true, users });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Failed to fetch users", error: error.message },
      { status: 500 }
    );
  }
}

// POST /api/users — create a new staff/admin account (admin only, doesn't log the new user in)
export async function POST(request) {
  try {
    const user = await getAuthUser();
    if (!requireRole(user, ["admin"])) {
      return NextResponse.json(
        { success: false, message: "Not authorized" },
        { status: 401 }
      );
    }

    await dbConnect();

    const { name, email, password, role, branch } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, message: "Name, email, and password are required" },
        { status: 400 }
      );
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return NextResponse.json(
        { success: false, message: "An account with this email already exists" },
        { status: 409 }
      );
    }

    const newUser = await User.create({
      name,
      email,
      password,
      role: role || "staff",
      branch: branch || undefined,
    });

    return NextResponse.json(
      {
        success: true,
        user: { id: newUser._id, name: newUser.name, email: newUser.email, role: newUser.role },
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Failed to create account", error: error.message },
      { status: 500 }
    );
  }
}