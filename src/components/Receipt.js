"use client";

const METHOD_LABELS = {
  cash: "Cash",
  mpesa: "M-Pesa",
  card: "Card",
  bank_transfer: "Bank Transfer",
};

/**
 * Printable receipt shown in a modal.
 *
 * Props:
 *  - title:         e.g. "Shop purchase" or "Membership renewal"
 *  - branchName:    shown under the NATTY GYM header
 *  - date:          ISO string or Date
 *  - items:         optional [{ name, quantity, price }] for shop sales
 *  - lines:         optional [{ label, value }] for details like member / plan / period
 *  - total:         number
 *  - paymentMethod: "cash" | "mpesa" | "card" | "bank_transfer"
 *  - transactionId: optional string
 *  - onClose:       called when the modal is dismissed
 */
export default function Receipt({
  title,
  branchName,
  date,
  items = null,
  lines = [],
  total,
  paymentMethod,
  transactionId,
  onClose,
}) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--ng-surface)] border border-[var(--ng-border)] rounded-xl max-w-sm w-full max-h-[90vh] overflow-y-auto">
        {/* ---- Printable area (everything inside #receipt-print) ---- */}
        <div id="receipt-print" className="p-6">
          <div className="text-center mb-4">
            <p className="font-display text-2xl text-[var(--ng-accent)]">NATTY GYM</p>
            {branchName && (
              <p className="text-xs text-[var(--ng-text-muted)] receipt-muted">{branchName}</p>
            )}
          </div>

          <div className="border-t border-b border-[var(--ng-border)] receipt-border py-3 mb-3">
            <p className="text-sm text-[var(--ng-text)] font-medium">{title}</p>
            <p className="text-xs text-[var(--ng-text-muted)] receipt-muted">
              {new Date(date).toLocaleString()}
            </p>
          </div>

          {items && items.length > 0 && (
            <div className="mb-3 space-y-1.5">
              {items.map((item, i) => (
                <div key={i} className="flex items-center justify-between text-sm gap-3">
                  <span className="text-[var(--ng-text)]">
                    {item.name} × {item.quantity}
                  </span>
                  <span className="text-[var(--ng-text-muted)] receipt-muted whitespace-nowrap">
                    KSh {(item.price * item.quantity).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}

          {lines.length > 0 && (
            <div className="mb-3 space-y-1.5">
              {lines.map((line, i) => (
                <div key={i} className="flex items-start justify-between text-sm gap-3">
                  <span className="text-[var(--ng-text-muted)] receipt-muted">{line.label}</span>
                  <span className="text-[var(--ng-text)] text-right">{line.value}</span>
                </div>
              ))}
            </div>
          )}

          <div className="border-t border-[var(--ng-border)] receipt-border pt-3 mb-3 flex items-center justify-between">
            <span className="text-sm text-[var(--ng-text-muted)] receipt-muted">Total</span>
            <span className="font-display text-2xl text-[var(--ng-accent)]">
              KSh {total.toLocaleString()}
            </span>
          </div>

          <div className="text-xs text-[var(--ng-text-muted)] receipt-muted space-y-1">
            <div className="flex items-center justify-between">
              <span>Payment method</span>
              <span>{METHOD_LABELS[paymentMethod] || paymentMethod}</span>
            </div>
            {transactionId && (
              <div className="flex items-center justify-between">
                <span>Transaction ID</span>
                <span>{transactionId}</span>
              </div>
            )}
          </div>

          <p className="text-center text-xs text-[var(--ng-text-muted)] receipt-muted mt-5">
            Thank you for training with us.
          </p>
        </div>

        {/* ---- Controls (hidden when printing) ---- */}
        <div className="p-4 border-t border-[var(--ng-border)] flex gap-3">
          <button
            onClick={() => window.print()}
            className="flex-1 bg-[var(--ng-accent)] text-[#151511] font-semibold rounded-lg py-2.5 text-sm hover:bg-[var(--ng-accent-dim)] transition-colors"
          >
            Print
          </button>
          <button
            onClick={onClose}
            className="flex-1 border border-[var(--ng-border)] text-[var(--ng-text-muted)] rounded-lg py-2.5 text-sm hover:text-[var(--ng-text)] transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}