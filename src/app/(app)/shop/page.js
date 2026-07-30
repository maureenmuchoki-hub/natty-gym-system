import { redirect } from "next/navigation";
import Link from "next/link";
import { getAuthUser } from "@/lib/requireAuth";
import dbConnect from "@/lib/dbConnect";
import Product from "@/models/Product";
import Branch from "@/models/Branch";
import ShopPanel from "./ShopPanel";

export default async function ShopPage() {
  const user = await getAuthUser();
  if (!user) {
    redirect("/login");
  }

  await dbConnect();

  const branches = await Branch.find({ isActive: true }).sort({ name: 1 }).lean();
  const products = await Product.find({ isActive: true }).sort({ category: 1, name: 1 }).lean();

  const data = JSON.parse(JSON.stringify({ branches, products }));

  return (
    <div className="min-h-screen bg-[var(--ng-bg)] px-6 py-10">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="text-xs uppercase tracking-widest text-[var(--ng-text-muted)] hover:text-[var(--ng-accent)]"
          >
            ← Dashboard
          </Link>
          <h1 className="font-display text-4xl text-[var(--ng-accent)] mt-2">Shop</h1>
        </div>

        <ShopPanel branches={data.branches} allProducts={data.products} />
      </div>
    </div>
  );
}
