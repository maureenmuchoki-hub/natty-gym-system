"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";

const CATEGORY_LABELS = {
  drinks: "Drinks",
  supplements: "Supplements",
  apparel: "Apparel & Accessories",
};

export default function ShopPanel({ branches, allProducts }) {
  const router = useRouter();
  const [branchId, setBranchId] = useState(branches[0]?._id || "");
  const [cart, setCart] = useState({});
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [transactionId, setTransactionId] = useState("");
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);

  // Restock state
  const [restockingId, setRestockingId] = useState(null);
  const [restockAmount, setRestockAmount] = useState("");
  const [restockBusy, setRestockBusy] = useState(false);

  const branchProducts = useMemo(
    () => allProducts.filter((p) => p.branch === branchId || p.branch?._id === branchId),
    [allProducts, branchId]
  );

  const productsByCategory = useMemo(() => {
    const groups = {};
    for (const p of branchProducts) {
      if (!groups[p.category]) groups[p.category] = [];
      groups[p.category].push(p);
    }
    return groups;
  }, [branchProducts]);

  const cartItems = useMemo(() => {
    return Object.entries(cart)
      .filter(([, qty]) => qty > 0)
      .map(([productId, quantity]) => {
        const product = branchProducts.find((p) => p._id === productId);
        return product ? { product, quantity } : null;
      })
      .filter(Boolean);
  }, [cart, branchProducts]);

  const total = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  function updateQty(productId, delta, maxStock) {
    setCart((prev) => {
      const current = prev[productId] || 0;
      const next = Math.max(0, Math.min(maxStock, current + delta));
      return { ...prev, [productId]: next };
    });
  }

  function switchBranch(newBranchId) {
    setBranchId(newBranchId);
    setCart({});
    setMessage(null);
  }

  function openRestock(productId) {
    setRestockingId(productId);
    setRestockAmount("");
  }

  async function confirmRestock(productId) {
    const amount = parseInt(restockAmount, 10);
    if (!amount || amount <= 0) {
      setRestockingId(null);
      return;
    }

    setRestockBusy(true);
    try {
      await fetch(`/api/products/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ addStock: amount }),
      });
      router.refresh();
    } finally {
      setRestockBusy(false);
      setRestockingId(null);
    }
  }

  async function handleCheckout() {
    if (cartItems.length === 0) return;
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          branch: branchId,
          items: cartItems.map((item) => ({
            productId: item.product._id,
            quantity: item.quantity,
          })),
          paymentMethod,
          transactionId: transactionId || undefined,
        }),
      });
      const data = await res.json();

      if (!data.success) {
        setMessage({ type: "error", text: data.message });
        return;
      }

      setMessage({
        type: "success",
        text: `Sale complete — KSh ${data.sale.totalAmount.toLocaleString()}`,
      });
      setCart({});
      setTransactionId("");
      router.refresh();
    } catch {
      setMessage({ type: "error", text: "Couldn't reach the server. Try again." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid lg:grid-cols-[1fr_340px] gap-6 items-start">
      {/* Products */}
      <div>
        <div className="mb-5">
          <label className="block text-xs uppercase tracking-wide text-[var(--ng-text-muted)] mb-2">
            Branch
          </label>
          <select
            value={branchId}
            onChange={(e) => switchBranch(e.target.value)}
            className="bg-[var(--ng-surface)] border border-[var(--ng-border)] rounded-lg px-4 py-2.5 text-sm text-[var(--ng-text)] focus:outline-none focus:ring-2 focus:ring-[var(--ng-accent)]"
          >
            {branches.map((b) => (
              <option key={b._id} value={b._id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>

        {Object.entries(productsByCategory).map(([category, items]) => (
          <div key={category} className="mb-6">
            <h2 className="font-display text-2xl text-[var(--ng-text)] mb-3">
              {CATEGORY_LABELS[category] || category}
            </h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {items.map((product) => {
                const qtyInCart = cart[product._id] || 0;
                const outOfStock = product.stock === 0;
                const lowStock = product.stock > 0 && product.stock <= 5;
                const isRestocking = restockingId === product._id;

                return (
                  <div
                    key={product._id}
                    className="bg-[var(--ng-surface)] border border-[var(--ng-border)] rounded-xl p-4"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="text-[var(--ng-text)] font-medium text-sm">
                          {product.name}
                        </p>
                        <p
                          className={`text-xs ${
                            lowStock ? "text-amber-400" : "text-[var(--ng-text-muted)]"
                          }`}
                        >
                          {product.unit} · {product.stock} in stock
                          {lowStock && !outOfStock && " · Low"}
                        </p>
                      </div>
                      <p className="text-[var(--ng-accent)] font-semibold text-sm">
                        KSh {product.price.toLocaleString()}
                      </p>
                    </div>

                    {outOfStock ? (
                      <p className="text-xs text-red-400 mt-2">Out of stock</p>
                    ) : (
                      <div className="flex items-center gap-3 mt-2">
                        <button
                          onClick={() => updateQty(product._id, -1, product.stock)}
                          className="w-7 h-7 rounded-md border border-[var(--ng-border)] text-[var(--ng-text)] hover:border-[var(--ng-accent)]"
                        >
                          −
                        </button>
                        <span className="text-sm text-[var(--ng-text)] w-4 text-center">
                          {qtyInCart}
                        </span>
                        <button
                          onClick={() => updateQty(product._id, 1, product.stock)}
                          className="w-7 h-7 rounded-md border border-[var(--ng-border)] text-[var(--ng-text)] hover:border-[var(--ng-accent)]"
                        >
                          +
                        </button>
                      </div>
                    )}

                    {/* Restock control */}
                    <div className="mt-3 pt-3 border-t border-[var(--ng-border)]">
                      {isRestocking ? (
                        <div className="flex items-center gap-2">
                          <input
                            autoFocus
                            type="number"
                            min="1"
                            value={restockAmount}
                            onChange={(e) => setRestockAmount(e.target.value)}
                            placeholder="Qty"
                            className="w-16 bg-[var(--ng-bg)] border border-[var(--ng-border)] rounded-md px-2 py-1 text-xs text-[var(--ng-text)] focus:outline-none focus:ring-1 focus:ring-[var(--ng-accent)]"
                          />
                          <button
                            onClick={() => confirmRestock(product._id)}
                            disabled={restockBusy}
                            className="text-xs font-medium text-[var(--ng-accent)] hover:text-[var(--ng-accent-dim)]"
                          >
                            Add
                          </button>
                          <button
                            onClick={() => setRestockingId(null)}
                            className="text-xs text-[var(--ng-text-muted)] hover:text-[var(--ng-text)]"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => openRestock(product._id)}
                          className="text-xs text-[var(--ng-text-muted)] hover:text-[var(--ng-accent)]"
                        >
                          + Restock
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Cart / checkout */}
      <div className="bg-[var(--ng-surface)] border border-[var(--ng-border)] rounded-xl p-6 sticky top-6">
        <h2 className="font-display text-2xl text-[var(--ng-text)] mb-4">Cart</h2>

        {cartItems.length === 0 ? (
          <p className="text-sm text-[var(--ng-text-muted)] mb-4">No items added yet.</p>
        ) : (
          <ul className="space-y-2 mb-4">
            {cartItems.map(({ product, quantity }) => (
              <li key={product._id} className="flex items-center justify-between text-sm">
                <span className="text-[var(--ng-text)]">
                  {product.name} × {quantity}
                </span>
                <span className="text-[var(--ng-text-muted)]">
                  KSh {(product.price * quantity).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        )}

        <div className="border-t border-[var(--ng-border)] pt-3 mb-4 flex items-center justify-between">
          <span className="text-sm text-[var(--ng-text-muted)]">Total</span>
          <span className="font-display text-2xl text-[var(--ng-accent)]">
            KSh {total.toLocaleString()}
          </span>
        </div>

        <label className="block text-xs uppercase tracking-wide text-[var(--ng-text-muted)] mb-1.5">
          Payment method
        </label>
        <select
          value={paymentMethod}
          onChange={(e) => setPaymentMethod(e.target.value)}
          className="w-full bg-[var(--ng-bg)] border border-[var(--ng-border)] rounded-lg px-3 py-2 text-sm text-[var(--ng-text)] mb-3 focus:outline-none focus:ring-2 focus:ring-[var(--ng-accent)]"
        >
          <option value="cash">Cash</option>
          <option value="mpesa">M-Pesa</option>
          <option value="card">Card</option>
          <option value="bank_transfer">Bank Transfer</option>
        </select>

        <input
          value={transactionId}
          onChange={(e) => setTransactionId(e.target.value)}
          placeholder="Transaction ID (optional)"
          className="w-full bg-[var(--ng-bg)] border border-[var(--ng-border)] rounded-lg px-3 py-2 text-sm text-[var(--ng-text)] mb-4 focus:outline-none focus:ring-2 focus:ring-[var(--ng-accent)]"
        />

        {message && (
          <p
            className={`text-xs rounded-lg px-3 py-2 border mb-3 ${
              message.type === "success"
                ? "text-[var(--ng-accent)] bg-[var(--ng-accent)]/10 border-[var(--ng-accent-dim)]"
                : "text-red-400 bg-red-950/40 border-red-900"
            }`}
          >
            {message.text}
          </p>
        )}

        <button
          onClick={handleCheckout}
          disabled={cartItems.length === 0 || loading}
          className="w-full bg-[var(--ng-accent)] text-[#151511] font-semibold rounded-lg py-2.5 text-sm hover:bg-[var(--ng-accent-dim)] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? "Processing..." : "Checkout"}
        </button>
      </div>
    </div>
  );
}