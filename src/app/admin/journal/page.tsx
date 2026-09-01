import { prisma } from "@/lib/prisma";
import { Card, Table, money } from "@/components/ui";

export default async function AdminJournalPage() {
  const entries = await prisma.journalEntry.findMany({
    include: { lines: { include: { account: true } }, recordedBy: true },
    orderBy: { date: "desc" },
    take: 150,
  });

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-bold text-zinc-900">Journal — Book of Records</h1>
      <p className="text-sm text-zinc-500">
        Every sale, stock purchase, expense, salary, asset, loan, and capital movement writes a permanent, balanced
        double-entry here automatically. Nothing on this page can be edited or deleted — it is the single source of
        truth every report is built from.
      </p>

      <div className="space-y-3">
        {entries.map((e) => (
          <Card key={e.id} className="!p-4">
            <div className="mb-2 flex items-center justify-between text-xs text-zinc-500">
              <span>
                {e.date.toLocaleString()} — {e.sourceType} — recorded by {e.recordedBy.name}
              </span>
            </div>
            <p className="mb-2 text-sm font-medium text-zinc-800">{e.memo}</p>
            <Table headers={["Account", "Debit", "Credit"]}>
              {e.lines.map((l) => (
                <tr key={l.id}>
                  <td className="px-4 py-1">
                    {l.account.code} — {l.account.name}
                  </td>
                  <td className="px-4 py-1">{Number(l.debit) > 0 ? money(Number(l.debit)) : ""}</td>
                  <td className="px-4 py-1">{Number(l.credit) > 0 ? money(Number(l.credit)) : ""}</td>
                </tr>
              ))}
            </Table>
          </Card>
        ))}
      </div>
    </div>
  );
}
