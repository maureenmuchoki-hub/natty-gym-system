import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Payment from "@/models/Payment";
import { getAuthUser, requireRole } from "@/lib/requireAuth";

// PATCH /api/payments/:id — correct a payment's amount, method, or status (admin only)
export async function PATCH(request, { params }) {
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
    const body = await request.json();

    const payment = await Payment.findById(id);
    if (!payment) {
      return NextResponse.json(
        { success: false, message: "Payment not found" },
        { status: 404 }
      );
    }

    if (typeof body.amount === "number" && body.amount >= 0) {
      payment.amount = body.amount;
    }
    if (typeof body.method === "string") {
      payment.method = body.method;
    }
    if (typeof body.status === "string") {
      payment.status = body.status; // e.g. "failed" if it turned out not to go through
    }
    if (typeof body.transactionId === "string") {
      payment.transactionId = body.transactionId;
    }

    await payment.save();

    return NextResponse.json({ success: true, payment });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Failed to update payment", error: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/payments/:id — remove a payment record entirely (admin only).
// Use for genuine mistakes — e.g. a payment that never actually went through.
// Note: this does NOT automatically cancel the linked membership; cancel that
// separately from the Memberships page if the client isn't going to pay.
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

    const payment = await Payment.findByIdAndDelete(id);
    if (!payment) {
      return NextResponse.json(
        { success: false, message: "Payment not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: "Payment deleted" });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Failed to delete payment", error: error.message },
      { status: 500 }
    );
  }
}