import { prisma } from "@/lib/prisma";
import { createStockReceipt } from "@/lib/actions/stock";
import { Card, Field, inputClass, SubmitButton } from "@/components/ui";

export default async function NewStockPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string }>;
}) {
  const params = await searchParams;
  const products = await prisma.product.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-bold text-zinc-900">Record New Stock</h1>
      {params.success && (
        <div className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">Stock recorded successfully.</div>
      )}
      <Card>
        <form action={createStockReceipt} className="space-y-4">
          <Field label="Product">
            <select name="productId" required className={inputClass} defaultValue="">
              <option value="" disabled>
                Select a product
              </option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.unit})
                </option>
              ))}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Quantity received">
              <input type="number" name="quantity" min={1} required className={inputClass} />
            </Field>
            <Field label="Unit cost">
              <input type="number" name="unitCost" min={0} step="0.01" required className={inputClass} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Supplier (optional)">
              <input type="text" name="supplier" className={inputClass} />
            </Field>
            <Field label="Paid via">
              <select name="paidVia" className={inputClass} defaultValue="CASH">
                <option value="CASH">Cash</option>
                <option value="MOBILE_MONEY">Mobile Money</option>
                <option value="CARD">Card</option>
                <option value="CREDIT">Credit (pay supplier later)</option>
              </select>
            </Field>
          </div>
          <Field label="Note (optional)">
            <input type="text" name="note" className={inputClass} />
          </Field>
          <SubmitButton>Record Stock Received</SubmitButton>
        </form>
      </Card>
      <p className="text-xs text-zinc-400">
        Need a brand-new product added to the list? Ask your admin — new products are added from the Admin{" "}
        &gt; Stock page.
      </p>
    </div>
  );
}
