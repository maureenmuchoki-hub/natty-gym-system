import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Branch from "@/models/Branch";
import Product from "@/models/Product";

const PRODUCTS = [
  { name: "Water 500ml", category: "drinks", price: 50, unit: "500ml" },
  { name: "Water 1L", category: "drinks", price: 100, unit: "1L" },
  { name: "Predator", category: "drinks", price: 100, unit: "500ml" },
  { name: "Creatine", category: "supplements", price: 3500, unit: "tub" },
  { name: "Hardcore Whey", category: "supplements", price: 6500, unit: "tub" },
  { name: "Blue Whey", category: "supplements", price: 6000, unit: "tub" },
  { name: "Hardcore ALL9", category: "supplements", price: 4500, unit: "tub" },
  { name: "Anabolic Carb", category: "supplements", price: 5000, unit: "tub" },
  { name: "Gym Gloves", category: "apparel", price: 1500, unit: "pair" },
  { name: "Bathing Towel", category: "apparel", price: 100, unit: "piece" },
  { name: "Face Towel", category: "apparel", price: 50, unit: "piece" },
];

const STARTING_STOCK = 20;

export async function GET() {
  try {
    await dbConnect();

    const branches = await Branch.find({ isActive: true });
    let createdCount = 0;
    let skippedCount = 0;

    for (const branch of branches) {
      for (const item of PRODUCTS) {
        const existing = await Product.findOne({ branch: branch._id, name: item.name });
        if (existing) {
          skippedCount++;
          continue;
        }

        await Product.create({
          ...item,
          branch: branch._id,
          stock: STARTING_STOCK,
        });
        createdCount++;
      }
    }

    return NextResponse.json({
      success: true,
      created: createdCount,
      skipped: skippedCount,
      message: "Products seeded. Safe to re-run.",
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Seeding failed", error: error.message },
      { status: 500 }
    );
  }
}