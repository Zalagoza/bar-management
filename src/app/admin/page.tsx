import { prisma } from "@/lib/prisma";
import { getProfitAndLoss } from "@/lib/reports/pnl";
import { getStockLevels } from "@/lib/reports/stock";
import { Card, StatCard, Table, Badge, money } from "@/components/ui";

export default async function AdminDashboard() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [pnlMonth, stock, unpaidBills, todaySales] = await Promise.all([
    getProfitAndLoss(startOfMonth, now),
    getStockLevels(),
    prisma.bill.findMany({ where: { status: { in: ["UNPAID", "PARTIALLY_PAID"] } }, orderBy: { createdAt: "desc" } }),
    prisma.sale.findMany({ where: { createdAt: { gte: startOfDay } } }),
  ]);

  const totalUnpaid = unpaidBills.reduce((s, b) => s + (Number(b.amount) - Number(b.amountPaid)), 0);
  const stockValue = stock.reduce((s, p) => s + p.onHand * p.costPrice, 0);
  const lowStock = stock.filter((p) => p.lowStock);
  const totalSalesToday = todaySales.reduce((s, sale) => s + Number(sale.totalAmount), 0);

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-bold text-zinc-900">Dashboard</h1>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Sales today" value={money(totalSalesToday)} sub={`${todaySales.length} transaction(s)`} />
        <StatCard
          label="Net profit (this month)"
          value={money(pnlMonth.netProfit)}
          tone={pnlMonth.netProfit >= 0 ? "good" : "bad"}
        />
        <StatCard label="Unpaid bills" value={money(totalUnpaid)} sub={`${unpaidBills.length} bill(s)`} tone={totalUnpaid > 0 ? "bad" : "neutral"} />
        <StatCard label="Stock value (at cost)" value={money(stockValue)} sub={`${stock.length} product(s)`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Unpaid bills (by name & amount)">
          {unpaidBills.length === 0 ? (
            <p className="text-sm text-zinc-500">No unpaid bills. 🎉</p>
          ) : (
            <Table headers={["Creditor", "Amount owed", "Status"]}>
              {unpaidBills.map((b) => (
                <tr key={b.id}>
                  <td className="px-4 py-2">{b.creditorName}</td>
                  <td className="px-4 py-2 font-medium">{money(Number(b.amount) - Number(b.amountPaid))}</td>
                  <td className="px-4 py-2">
                    <Badge tone={b.status === "PARTIALLY_PAID" ? "warn" : "bad"}>{b.status.replace("_", " ")}</Badge>
                  </td>
                </tr>
              ))}
            </Table>
          )}
        </Card>

        <Card title="Low stock alerts">
          {lowStock.length === 0 ? (
            <p className="text-sm text-zinc-500">All stock levels healthy.</p>
          ) : (
            <Table headers={["Product", "On hand", "Reorder level"]}>
              {lowStock.map((p) => (
                <tr key={p.productId}>
                  <td className="px-4 py-2">{p.name}</td>
                  <td className="px-4 py-2 font-medium text-red-600">
                    {p.onHand} {p.unit}(s)
                  </td>
                  <td className="px-4 py-2">{p.reorderLevel}</td>
                </tr>
              ))}
            </Table>
          )}
        </Card>
      </div>
    </div>
  );
}
