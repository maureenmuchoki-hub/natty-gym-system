import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Product from "@/models/Product";
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
    const category = searchParams.get("category");

    const filter = { isActive: true };
    if (branchId) filter.branch = branchId;
    if (category) filter.category = category;

    const products = await Product.find(filter).populate("branch").sort({ category: 1, name: 1 });

    return NextResponse.json({ success: true, count: products.length, products });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Failed to fetch products", error: error.message },
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

    const { name, category, branch, price, stock, unit } = await request.json();

    if (!name || !category || !branch || price === undefined) {
      return NextResponse.json(
        { success: false, message: "name, category, branch, and price are required" },
        { status: 400 }
      );
    }

    const product = await Product.create({
      name,
      category,
      branch,
      price,
      stock: stock ?? 0,
      unit,
    });

    return NextResponse.json({ success: true, product }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Failed to create product", error: error.message },
      { status: 500 }
    );
  }
}