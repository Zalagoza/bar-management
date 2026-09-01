import { prisma } from "@/lib/prisma";
import { createBill, payBill } from "@/lib/actions/bills";
import { Card, Field, Table, Badge, inputClass, SubmitButton, money } from "@/components/ui";

export default async function AdminBillsPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string }>;
}) {
  const params = await searchParams;
  const bills = await prisma.bill.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-bold text-zinc-900">Bills (Amounts Owed)</h1>
      {params.success && (
        <div className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">Saved successfully.</div>
      )}

      <Card title="All bills">
        <Table headers={["Creditor", "Description", "Amount", "Paid", "Balance", "Status", "Record payment"]}>
          {bills.map((b) => {
            const balance = Number(b.amount) - Number(b.amountPaid);
            return (
              <tr key={b.id}>
                <td className="px-4 py-2 font-medium">{b.creditorName}</td>
                <td className="px-4 py-2">{b.description || "—"}</td>
                <td className="px-4 py-2">{money(Number(b.amount))}</td>
                <td className="px-4 py-2">{money(Number(b.amountPaid))}</td>
                <td className="px-4 py-2 font-medium">{money(balance)}</td>
                <td className="px-4 py-2">
                  <Badge tone={b.status === "PAID" ? "good" : b.status === "PARTIALLY_PAID" ? "warn" : "bad"}>
                    {b.status.replace("_", " ")}
                  </Badge>
                </td>
                <td className="px-4 py-2">
                  {balance > 0 ? (
                    <form action={payBill} className="flex items-center gap-1">
                      <input type="hidden" name="billId" value={b.id} />
                      <input
                        type="number"
                        name="amount"
                        step="0.01"
                        min={0.01}
                        max={balance}
                        placeholder="Amount"
                        required
                        className="w-24 rounded-lg border border-zinc-300 px-2 py-1 text-xs"
                      />
                      <select name="paidVia" className="rounded-lg border border-zinc-300 px-1 py-1 text-xs">
                        <option value="CASH">Cash</option>
                        <option value="MOBILE_MONEY">Mobile</option>
                        <option value="CARD">Card</option>
                      </select>
                      <button className="rounded-lg bg-zinc-900 px-2 py-1 text-xs font-medium text-white">Pay</button>
                    </form>
                  ) : (
                    "—"
                  )}
                </td>
              </tr>
            );
          })}
        </Table>
      </Card>

      <Card title="Record a new bill">
        <form action={createBill} className="grid grid-cols-2 gap-4">
          <Field label="Creditor name">
            <input type="text" name="creditorName" required className={inputClass} />
          </Field>
          <Field label="Amount">
            <input type="number" name="amount" step="0.01" min={0.01} required className={inputClass} />
          </Field>
          <Field label="Description (optional)">
            <input type="text" name="description" className={inputClass} placeholder="e.g. crates of beer, June invoice" />
          </Field>
          <Field label="Due date (optional)">
            <input type="date" name="dueDate" className={inputClass} />
          </Field>
          <div className="col-span-2">
            <SubmitButton>Record Bill</SubmitButton>
          </div>
        </form>
      </Card>
    </div>
  );
}
