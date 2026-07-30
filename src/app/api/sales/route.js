import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Sale from "@/models/Sale";
import Product from "@/models/Product";
import Branch from "@/models/Branch";
import Member from "@/models/Member";
import { getAuthUser, requireRole } from "@/lib/requireAuth";

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

    const filter = {};
    if (branchId) filter.branch = branchId;

    const sales = await Sale.find(filter)
      .populate("branch")
      .populate("member")
      .sort({ createdAt: -1 });

    return NextResponse.json({ success: true, count: sales.length, sales });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Failed to fetch sales", error: error.message },
      { status: 500 }
    );
  }
}

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

    const { branch, items, paymentMethod, transactionId, member } = await request.json();

    if (!branch || !Array.isArray(items) || items.length === 0 || !paymentMethod) {
      return NextResponse.json(
        { success: false, message: "branch, items, and paymentMethod are required" },
        { status: 400 }
      );
    }

    const saleItems = [];
    let totalAmount = 0;

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return NextResponse.json(
          { success: false, message: `Product not found: ${item.productId}` },
          { status: 404 }
        );
      }
      if (product.stock < item.quantity) {
        return NextResponse.json(
          {
            success: false,
            message: `Not enough stock for ${product.name}. Only ${product.stock} left.`,
          },
          { status: 409 }
        );
      }

      saleItems.push({
        product: product._id,
        name: product.name,
        quantity: item.quantity,
        priceAtSale: product.price,
      });
      totalAmount += product.price * item.quantity;
    }

    for (const item of items) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { stock: -item.quantity },
      });
    }

    const sale = await Sale.create({
      branch,
      items: saleItems,
      totalAmount,
      paymentMethod,
      transactionId: transactionId || undefined,
      member: member || undefined,
      soldBy: user._id,
    });

    const populated = await Sale.findById(sale._id).populate("branch").populate("member");

    return NextResponse.json({ success: true, sale: populated }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Checkout failed", error: error.message },
      { status: 500 }
    );
  }
}