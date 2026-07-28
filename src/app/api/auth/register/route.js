import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import { generateToken } from "@/lib/auth";

export async function POST(request) {
  try {
    await dbConnect();

    const { name, email, password, role, branch } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, message: "Name, email, and password are required" },
        { status: 400 }
      );
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json(
        { success: false, message: "An account with this email already exists" },
        { status: 409 }
      );
    }

    const user = await User.create({
      name,
      email,
      password, // hashed automatically by the User model's pre-save hook
      role: role || "staff",
      branch: branch || undefined,
    });

    const token = generateToken(user);

    const response = NextResponse.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        branch: user.branch,
      },
    });

    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Registration failed", error: error.message },
      { status: 500 }
    );
  }
}