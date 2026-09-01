import { prisma } from "@/lib/prisma";
import { createCapitalEntry } from "@/lib/actions/capital";
import { Card, Field, Table, Badge, inputClass, SubmitButton, money } from "@/components/ui";

export default async function AdminCapitalPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string }>;
}) {
  const params = await searchParams;
  const entries = await prisma.capitalEntry.findMany({ orderBy: { createdAt: "desc" } });

  const contributions = entries.filter((e) => e.type === "CONTRIBUTION").reduce((s, e) => s + Number(e.amount), 0);
  const drawings = entries.filter((e) => e.type === "DRAWING").reduce((s, e) => s + Number(e.amount), 0);

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-bold text-zinc-900">Capital</h1>
      {params.success && (
        <div className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">Saved successfully.</div>
      )}

      <div className="grid grid-cols-2 gap-4 lg:w-1/2">
        <Card title="Total contributions">
          <p className="text-2xl font-bold text-emerald-600">{money(contributions)}</p>
        </Card>
        <Card title="Total drawings">
          <p className="text-2xl font-bold text-red-600">{money(drawings)}</p>
        </Card>
      </div>

      <Card title="History">
        <Table headers={["Date", "Type", "Amount", "Paid via", "Note"]}>
          {entries.map((e) => (
            <tr key={e.id}>
              <td className="px-4 py-2 whitespace-nowrap">{e.createdAt.toLocaleDateString()}</td>
              <td className="px-4 py-2">
                <Badge tone={e.type === "CONTRIBUTION" ? "good" : "warn"}>{e.type}</Badge>
              </td>
              <td className="px-4 py-2 font-medium">{money(Number(e.amount))}</td>
              <td className="px-4 py-2">{e.paidVia.replace("_", " ")}</td>
              <td className="px-4 py-2">{e.note || "—"}</td>
            </tr>
          ))}
        </Table>
      </Card>

      <Card title="Record a contribution or drawing">
        <form action={createCapitalEntry} className="grid grid-cols-2 gap-4">
          <Field label="Type">
            <select name="type" className={inputClass} defaultValue="CONTRIBUTION">
              <option value="CONTRIBUTION">Contribution (owner puts money in)</option>
              <option value="DRAWING">Drawing (owner takes money out)</option>
            </select>
          </Field>
          <Field label="Amount">
            <input type="number" name="amount" step="0.01" min={0.01} required className={inputClass} />
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
            <SubmitButton>Record Entry</SubmitButton>
          </div>
        </form>
      </Card>
    </div>
  );
}
