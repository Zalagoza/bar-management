"use client";

import { useState } from "react";
import { createSale } from "@/lib/actions/sales";
import { inputClass, SubmitButton } from "@/components/ui";

type Product = { id: string; name: string; sellingPrice: number };

export default function SaleForm({ products }: { products: Product[] }) {
  const [rows, setRows] = useState([{ id: crypto.randomUUID() }]);
  const [paymentMethod, setPaymentMethod] = useState("CASH");

  return (
    <form action={createSale} className="space-y-5">
      <div className="space-y-3">
        {rows.map((row, idx) => (
          <div key={row.id} className="flex items-end gap-2">
            <div className="flex-1">
              {idx === 0 && <label className="mb-1 block text-xs font-medium text-zinc-600">Product</label>}
              <select name="productId" required className={inputClass} defaultValue="">
                <option value="" disabled>
                  Select a product
                </option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="w-24">
              {idx === 0 && <label className="mb-1 block text-xs font-medium text-zinc-600">Qty</label>}
              <input type="number" name="quantity" min={1} defaultValue={1} required className={inputClass} />
            </div>
            {rows.length > 1 && (
              <button
                type="button"
                onClick={() => setRows(rows.filter((r) => r.id !== row.id))}
                className="rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-500 hover:bg-zinc-50"
              >
                &times;
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={() => setRows([...rows, { id: crypto.randomUUID() }])}
          className="text-sm font-medium text-zinc-700 underline"
        >
          + Add another item
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-600">Payment method</label>
          <select
            name="paymentMethod"
            className={inputClass}
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
          >
            <option value="CASH">Cash</option>
            <option value="MOBILE_MONEY">Mobile Money</option>
            <option value="CARD">Card</option>
            <option value="CREDIT">Credit (customer owes)</option>
          </select>
        </div>
        {paymentMethod === "CREDIT" && (
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-600">Customer name</label>
            <input type="text" name="customerName" required className={inputClass} />
          </div>
        )}
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-zinc-600">Note (optional)</label>
        <input type="text" name="note" className={inputClass} placeholder="e.g. table 4" />
      </div>

      <SubmitButton>Record Sale</SubmitButton>
    </form>
  );
}
