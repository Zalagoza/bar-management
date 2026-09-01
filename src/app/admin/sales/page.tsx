import { prisma } from "@/lib/prisma";
import { Card, Table, money } from "@/components/ui";

export default async function AdminSalesPage() {
  const sales = await prisma.sale.findMany({
    include: { items: { include: { product: true } }, soldBy: true },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const totalAmount = sales.reduce((s, sale) => s + Number(sale.totalAmount), 0);
  const totalProfit = sales.reduce((s, sale) => s + (Number(sale.totalAmount) - Number(sale.totalCost)), 0);

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-bold text-zinc-900">Sales</h1>
      <div className="grid grid-cols-2 gap-4 lg:w-1/2">
        <Card title="Total revenue (last 200)">
          <p className="text-2xl font-bold">{money(totalAmount)}</p>
        </Card>
        <Card title="Gross profit (last 200)">
          <p className="text-2xl font-bold text-emerald-600">{money(totalProfit)}</p>
        </Card>
      </div>
      <Card>
        <Table headers={["Date", "Bartender", "Items", "Payment", "Amount", "Profit"]}>
          {sales.map((s) => (
            <tr key={s.id}>
              <td className="px-4 py-2 whitespace-nowrap">{s.createdAt.toLocaleString()}</td>
              <td className="px-4 py-2">{s.soldBy.name}</td>
              <td className="px-4 py-2">{s.items.map((i) => `${i.quantity}x ${i.product.name}`).join(", ")}</td>
              <td className="px-4 py-2">
                {s.paymentMethod}
                {s.customerName ? ` (${s.customerName})` : ""}
              </td>
              <td className="px-4 py-2 font-medium">{money(Number(s.totalAmount))}</td>
              <td className="px-4 py-2 text-emerald-600">{money(Number(s.totalAmount) - Number(s.totalCost))}</td>
            </tr>
          ))}
        </Table>
      </Card>
    </div>
  );
}
