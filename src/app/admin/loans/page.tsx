import { prisma } from "@/lib/prisma";
import { createLoan, repayLoan } from "@/lib/actions/loans";
import { Card, Field, Table, Badge, inputClass, SubmitButton, money } from "@/components/ui";

export default async function AdminLoansPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string }>;
}) {
  const params = await searchParams;
  const loans = await prisma.loan.findMany({ include: { repayments: true }, orderBy: { createdAt: "desc" } });

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-bold text-zinc-900">Loans</h1>
      {params.success && (
        <div className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">Saved successfully.</div>
      )}

      <Card title="All loans">
        <Table headers={["Counterparty", "Direction", "Principal", "Repaid", "Balance", "Repay"]}>
          {loans.map((l) => {
            const repaid = l.repayments.reduce((s, r) => s + Number(r.amount), 0);
            const balance = Number(l.principal) - repaid;
            return (
              <tr key={l.id}>
                <td className="px-4 py-2 font-medium">{l.counterparty}</td>
                <td className="px-4 py-2">
                  <Badge tone={l.direction === "BORROWED" ? "bad" : "good"}>{l.direction}</Badge>
                </td>
                <td className="px-4 py-2">{money(Number(l.principal))}</td>
                <td className="px-4 py-2">{money(repaid)}</td>
                <td className="px-4 py-2 font-medium">{money(balance)}</td>
                <td className="px-4 py-2">
                  {balance > 0 ? (
                    <form action={repayLoan} className="flex items-center gap-1">
                      <input type="hidden" name="loanId" value={l.id} />
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
                      <button className="rounded-lg bg-zinc-900 px-2 py-1 text-xs font-medium text-white">
                        {l.direction === "BORROWED" ? "Pay" : "Collect"}
                      </button>
                    </form>
                  ) : (
                    "Settled"
                  )}
                </td>
              </tr>
            );
          })}
        </Table>
      </Card>

      <Card title="Record a new loan">
        <form action={createLoan} className="grid grid-cols-2 gap-4">
          <Field label="Counterparty">
            <input type="text" name="counterparty" required className={inputClass} placeholder="Lender / borrower name" />
          </Field>
          <Field label="Direction">
            <select name="direction" className={inputClass} defaultValue="BORROWED">
              <option value="BORROWED">Borrowed (we owe)</option>
              <option value="LENT">Lent out (owed to us)</option>
            </select>
          </Field>
          <Field label="Principal amount">
            <input type="number" name="principal" step="0.01" min={0.01} required className={inputClass} />
          </Field>
          <Field label="Interest rate % per annum (optional)">
            <input type="number" name="interestRate" step="0.01" min={0} className={inputClass} />
          </Field>
          <Field label="Paid via">
            <select name="paidVia" className={inputClass} defaultValue="CASH">
              <option value="CASH">Cash</option>
              <option value="MOBILE_MONEY">Mobile Money</option>
              <option value="CARD">Card</option>
            </select>
          </Field>
          <Field label="Note (optional)">
            <input type="text" name="note" className={inputClass} />
          </Field>
          <div className="col-span-2">
            <SubmitButton>Record Loan</SubmitButton>
          </div>
        </form>
      </Card>
    </div>
  );
}
