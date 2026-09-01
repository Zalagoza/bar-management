import { getProfitAndLoss } from "@/lib/reports/pnl";
import { Card, inputClass, money } from "@/components/ui";

function fmtDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default async function PnlPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const params = await searchParams;
  const now = new Date();
  const defaultFrom = new Date(now.getFullYear(), now.getMonth(), 1);

  const from = params.from ? new Date(params.from) : defaultFrom;
  const to = params.to ? new Date(new Date(params.to).setHours(23, 59, 59, 999)) : now;

  const pnl = await getProfitAndLoss(from, to);

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-bold text-zinc-900">Profit & Loss Statement</h1>

      <form className="flex flex-wrap items-end gap-3" method="get">
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-600">From</label>
          <input type="date" name="from" defaultValue={fmtDate(from)} className={inputClass} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-600">To</label>
          <input type="date" name="to" defaultValue={fmtDate(to)} className={inputClass} />
        </div>
        <button className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white">Update</button>
      </form>

      <Card className="max-w-xl">
        <div className="mb-4 text-sm text-zinc-500">
          For the period {from.toLocaleDateString()} — {to.toLocaleDateString()}
        </div>

        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">Revenue</div>
        {pnl.revenue.map((l) => (
          <div key={l.code} className="flex justify-between border-b border-zinc-100 py-1.5 text-sm">
            <span>{l.name}</span>
            <span>{money(l.amount)}</span>
          </div>
        ))}
        <div className="flex justify-between py-2 text-sm font-semibold">
          <span>Total Revenue</span>
          <span>{money(pnl.totalRevenue)}</span>
        </div>

        <div className="mb-2 mt-4 text-xs font-semibold uppercase tracking-wide text-zinc-500">Expenses</div>
        {pnl.expenses.map((l) => (
          <div key={l.code} className="flex justify-between border-b border-zinc-100 py-1.5 text-sm">
            <span>{l.name}</span>
            <span>{money(l.amount)}</span>
          </div>
        ))}
        <div className="flex justify-between py-2 text-sm font-semibold">
          <span>Total Expenses</span>
          <span>{money(pnl.totalExpenses)}</span>
        </div>

        <div className="mt-4 flex justify-between border-t border-zinc-200 py-2 text-sm font-semibold">
          <span>Gross Profit (Revenue − COGS)</span>
          <span>{money(pnl.grossProfit)}</span>
        </div>
        <div
          className={`flex justify-between rounded-lg px-3 py-3 text-base font-bold ${
            pnl.netProfit >= 0 ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
          }`}
        >
          <span>Net Profit / (Loss)</span>
          <span>{money(pnl.netProfit)}</span>
        </div>
      </Card>
    </div>
  );
}
