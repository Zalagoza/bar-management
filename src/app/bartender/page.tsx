import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/guards";
import { Card, StatCard, Table, money } from "@/components/ui";
import Link from "next/link";

export default async function BartenderDashboard() {
  const user = await requireUser();

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const sales = await prisma.sale.findMany({
    where: { soldById: user.id, createdAt: { gte: startOfDay } },
    include: { items: { include: { product: true } } },
    orderBy: { createdAt: "desc" },
  });

  const totalToday = sales.reduce((s, sale) => s + Number(sale.totalAmount), 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <StatCard label="Your sales today" value={money(totalToday)} sub={`${sales.length} transaction(s)`} />
        <StatCard label="Quick actions" value="—" sub="Use the links below" />
      </div>

      <div className="flex gap-3">
        <Link href="/bartender/sales/new" className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white">
          + Record a Sale
        </Link>
        <Link
          href="/bartender/stock/new"
          className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-800"
        >
          + Record New Stock
        </Link>
      </div>

      <Card title="Your sales today">
        {sales.length === 0 ? (
          <p className="text-sm text-zinc-500">No sales recorded yet today.</p>
        ) : (
          <Table headers={["Time", "Items", "Payment", "Amount"]}>
            {sales.map((s) => (
              <tr key={s.id}>
                <td className="px-4 py-2">{s.createdAt.toLocaleTimeString()}</td>
                <td className="px-4 py-2">
                  {s.items.map((i) => `${i.quantity}x ${i.product.name}`).join(", ")}
                </td>
                <td className="px-4 py-2">{s.paymentMethod}{s.customerName ? ` (${s.customerName})` : ""}</td>
                <td className="px-4 py-2 font-medium">{money(Number(s.totalAmount))}</td>
              </tr>
            ))}
          </Table>
        )}
      </Card>

      <p className="text-xs text-zinc-400">
        Records you submit cannot be edited or deleted here — if a mistake was made, tell your admin so it can be
        corrected properly in the books.
      </p>
    </div>
  );
}
