import { getStockLevels } from "@/lib/reports/stock";
import { createProduct } from "@/lib/actions/stock";
import { Card, Field, Table, Badge, inputClass, SubmitButton, money } from "@/components/ui";

export default async function AdminStockPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string }>;
}) {
  const params = await searchParams;
  const stock = await getStockLevels();
  const totalValue = stock.reduce((s, p) => s + p.onHand * p.costPrice, 0);

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-bold text-zinc-900">Stock (Beer & Inventory)</h1>
      {params.success && (
        <div className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">Product added successfully.</div>
      )}

      <Card title={`Current stock — value at cost: ${money(totalValue)}`}>
        <Table headers={["Product", "Category", "Received", "Sold", "On hand", "Cost", "Selling price", "Status"]}>
          {stock.map((p) => (
            <tr key={p.productId}>
              <td className="px-4 py-2">{p.name}</td>
              <td className="px-4 py-2">{p.category}</td>
              <td className="px-4 py-2">{p.received}</td>
              <td className="px-4 py-2">{p.sold}</td>
              <td className="px-4 py-2 font-medium">
                {p.onHand} {p.unit}(s)
              </td>
              <td className="px-4 py-2">{money(p.costPrice)}</td>
              <td className="px-4 py-2">{money(p.sellingPrice)}</td>
              <td className="px-4 py-2">
                {p.lowStock ? <Badge tone="bad">Low stock</Badge> : <Badge tone="good">OK</Badge>}
              </td>
            </tr>
          ))}
        </Table>
      </Card>

      <Card title="Add a new product">
        <form action={createProduct} className="grid grid-cols-2 gap-4">
          <Field label="Name">
            <input type="text" name="name" required className={inputClass} placeholder="e.g. Heineken 500ml" />
          </Field>
          <Field label="Category">
            <select name="category" className={inputClass} defaultValue="Beer">
              <option>Beer</option>
              <option>Spirit</option>
              <option>Soft Drink</option>
              <option>Wine</option>
              <option>Other</option>
            </select>
          </Field>
          <Field label="Unit">
            <input type="text" name="unit" defaultValue="bottle" className={inputClass} />
          </Field>
          <Field label="Reorder level">
            <input type="number" name="reorderLevel" defaultValue={12} min={0} className={inputClass} />
          </Field>
          <Field label="Cost price">
            <input type="number" name="costPrice" step="0.01" min={0} required className={inputClass} />
          </Field>
          <Field label="Selling price">
            <input type="number" name="sellingPrice" step="0.01" min={0} required className={inputClass} />
          </Field>
          <div className="col-span-2">
            <SubmitButton>Add Product</SubmitButton>
          </div>
        </form>
      </Card>
    </div>
  );
}
