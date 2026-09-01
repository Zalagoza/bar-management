import { prisma } from "@/lib/prisma";
import { createAsset } from "@/lib/actions/assets";
import { Card, Field, Table, inputClass, SubmitButton, money } from "@/components/ui";

export default async function AdminAssetsPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string }>;
}) {
  const params = await searchParams;
  const assets = await prisma.asset.findMany({ orderBy: { createdAt: "desc" } });
  const totalValue = assets.reduce((s, a) => s + Number(a.value), 0);

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-bold text-zinc-900">Assets</h1>
      {params.success && (
        <div className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">Asset recorded successfully.</div>
      )}

      <Card title={`All assets — total value ${money(totalValue)}`}>
        <Table headers={["Name", "Category", "Value", "Acquired", "Paid via", "Note"]}>
          {assets.map((a) => (
            <tr key={a.id}>
              <td className="px-4 py-2 font-medium">{a.name}</td>
              <td className="px-4 py-2">{a.category}</td>
              <td className="px-4 py-2">{money(Number(a.value))}</td>
              <td className="px-4 py-2">{a.acquiredDate.toLocaleDateString()}</td>
              <td className="px-4 py-2">{a.paidVia.replace("_", " ")}</td>
              <td className="px-4 py-2">{a.note || "—"}</td>
            </tr>
          ))}
        </Table>
      </Card>

      <Card title="Record a new asset">
        <form action={createAsset} className="grid grid-cols-2 gap-4">
          <Field label="Name">
            <input type="text" name="name" required className={inputClass} placeholder="e.g. Chest Freezer" />
          </Field>
          <Field label="Category">
            <input type="text" name="category" defaultValue="Equipment" className={inputClass} />
          </Field>
          <Field label="Value">
            <input type="number" name="value" step="0.01" min={0.01} required className={inputClass} />
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
            <SubmitButton>Record Asset</SubmitButton>
          </div>
        </form>
      </Card>
    </div>
  );
}
