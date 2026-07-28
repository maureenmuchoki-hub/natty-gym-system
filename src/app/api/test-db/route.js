import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";

export async function GET() {
  try {
    await dbConnect();
    return NextResponse.json({ success: true, message: "Connected to MongoDB successfully!" });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Connection failed", error: error.message },
      { status: 500 }
    );
  }
}