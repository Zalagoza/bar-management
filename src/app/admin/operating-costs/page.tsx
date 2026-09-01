import { prisma } from "@/lib/prisma";
import { createOperatingCost } from "@/lib/actions/operating-costs";
import { Card, Field, Table, inputClass, SubmitButton, money } from "@/components/ui";

export default async function AdminOperatingCostsPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string }>;
}) {
  const params = await searchParams;
  const costs = await prisma.operatingCost.findMany({ orderBy: { createdAt: "desc" }, take: 100 });
  const total = costs.reduce((s, c) => s + Number(c.amount), 0);

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-bold text-zinc-900">Other Operating Costs</h1>
      {params.success && (
        <div className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">Expense recorded successfully.</div>
      )}

      <Card title={`Recent expenses — total ${money(total)}`}>
        <Table headers={["Date", "Category", "Description", "Paid via", "Amount"]}>
          {costs.map((c) => (
            <tr key={c.id}>
              <td className="px-4 py-2 whitespace-nowrap">{c.createdAt.toLocaleDateString()}</td>
              <td className="px-4 py-2">{c.category}</td>
              <td className="px-4 py-2">{c.description || "—"}</td>
              <td className="px-4 py-2">{c.paidVia.replace("_", " ")}</td>
              <td className="px-4 py-2 font-medium">{money(Number(c.amount))}</td>
            </tr>
          ))}
        </Table>
      </Card>

      <Card title="Record a new expense">
        <form action={createOperatingCost} className="grid grid-cols-2 gap-4">
          <Field label="Category">
            <input type="text" name="category" required className={inputClass} placeholder="Rent, Electricity, Transport..." />
          </Field>
          <Field label="Amount">
            <input type="number" name="amount" step="0.01" min={0.01} required className={inputClass} />
          </Field>
          <Field label="Description (optional)">
            <input type="text" name="description" className={inputClass} />
          </Field>
          <Field label="Paid via">
            <select name="paidVia" className={inputClass} defaultValue="CASH">
              <option value="CASH">Cash</option>
              <option value="MOBILE_MONEY">Mobile Money</option>
              <option value="CARD">Card</option>
              <option value="CREDIT">Credit (owed to supplier)</option>
            </select>
          </Field>
          <div className="col-span-2">
            <SubmitButton>Record Expense</SubmitButton>
          </div>
        </form>
      </Card>
    </div>
  );
}
