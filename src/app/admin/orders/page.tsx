import { prisma } from "@/lib/prisma";
import { createOrder, updateOrderStatus } from "@/lib/actions/orders";
import { Card, Field, Table, Badge, inputClass, SubmitButton, money } from "@/components/ui";

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string }>;
}) {
  const params = await searchParams;
  const [orders, products] = await Promise.all([
    prisma.order.findMany({ include: { items: { include: { product: true } } }, orderBy: { createdAt: "desc" } }),
    prisma.product.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-bold text-zinc-900">Orders (to suppliers)</h1>
      {params.success && (
        <div className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">Saved successfully.</div>
      )}

      <Card title="All orders">
        <Table headers={["Date", "Supplier", "Items", "Est. cost", "Status", "Update"]}>
          {orders.map((o) => {
            const estCost = o.items.reduce((s, i) => s + i.quantity * Number(i.unitCost), 0);
            return (
              <tr key={o.id}>
                <td className="px-4 py-2 whitespace-nowrap">{o.createdAt.toLocaleDateString()}</td>
                <td className="px-4 py-2">{o.supplier}</td>
                <td className="px-4 py-2">{o.items.map((i) => `${i.quantity}x ${i.product.name}`).join(", ")}</td>
                <td className="px-4 py-2">{money(estCost)}</td>
                <td className="px-4 py-2">
                  <Badge
                    tone={
                      o.status === "RECEIVED" ? "good" : o.status === "CANCELLED" ? "bad" : "warn"
                    }
                  >
                    {o.status.replace("_", " ")}
                  </Badge>
                </td>
                <td className="px-4 py-2">
                  <form action={updateOrderStatus} className="flex items-center gap-1">
                    <input type="hidden" name="orderId" value={o.id} />
                    <select name="status" defaultValue={o.status} className="rounded-lg border border-zinc-300 px-1 py-1 text-xs">
                      <option value="PENDING">Pending</option>
                      <option value="PARTIALLY_RECEIVED">Partially received</option>
                      <option value="RECEIVED">Received</option>
                      <option value="CANCELLED">Cancelled</option>
                    </select>
                    <button className="rounded-lg bg-zinc-900 px-2 py-1 text-xs font-medium text-white">Update</button>
                  </form>
                </td>
              </tr>
            );
          })}
        </Table>
      </Card>

      <Card title="Place a new order (up to 4 items)">
        <form action={createOrder} className="space-y-4">
          <Field label="Supplier">
            <input type="text" name="supplier" required className={inputClass} />
          </Field>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="grid grid-cols-3 gap-3">
              <select name="productId" className={inputClass} defaultValue="">
                <option value="">— none —</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <input type="number" name="quantity" min={1} placeholder="Qty" className={inputClass} />
              <input type="number" name="unitCost" min={0} step="0.01" placeholder="Expected unit cost" className={inputClass} />
            </div>
          ))}
          <Field label="Note (optional)">
            <input type="text" name="note" className={inputClass} />
          </Field>
          <SubmitButton>Place Order</SubmitButton>
        </form>
      </Card>
    </div>
  );
}
