import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Product from "@/models/Product";
import { getAuthUser, requireRole } from "@/lib/requireAuth";

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
    const body = await request.json();

    const product = await Product.findById(id);
    if (!product) {
      return NextResponse.json(
        { success: false, message: "Product not found" },
        { status: 404 }
      );
    }

    if (typeof body.price === "number") {
      product.price = body.price;
    }

    if (typeof body.addStock === "number") {
      product.stock += body.addStock;
    } else if (typeof body.stock === "number") {
      product.stock = body.stock;
    }

    await product.save();

    const populated = await Product.findById(product._id).populate("branch");

    return NextResponse.json({ success: true, product: populated });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Failed to update product", error: error.message },
      { status: 500 }
    );
  }
}