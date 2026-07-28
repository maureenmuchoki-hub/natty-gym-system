import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import { generateToken } from "@/lib/auth";

export async function POST(request) {
  try {
    await dbConnect();

    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: "Email and password are required" },
        { status: 400 }
      );
    }

    // password field has `select: false` in the model, so explicitly request it
    const user = await User.findOne({ email: email.toLowerCase() }).select("+password");

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Invalid email or password" },
        { status: 401 }
      );
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return NextResponse.json(
        { success: false, message: "Invalid email or password" },
        { status: 401 }
      );
    }

    if (!user.isActive) {
      return NextResponse.json(
        { success: false, message: "This account has been deactivated" },
        { status: 403 }
      );
    }

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
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Login failed", error: error.message },
      { status: 500 }
    );
  }
}