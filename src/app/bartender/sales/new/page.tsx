import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui";
import SaleForm from "./SaleForm";

export default async function NewSalePage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string }>;
}) {
  const params = await searchParams;
  const products = await prisma.product.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-bold text-zinc-900">Record a Sale</h1>
      {params.success && (
        <div className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">Sale recorded successfully.</div>
      )}
      <Card>
        <SaleForm products={products.map((p) => ({ id: p.id, name: p.name, sellingPrice: Number(p.sellingPrice) }))} />
      </Card>
    </div>
  );
}
