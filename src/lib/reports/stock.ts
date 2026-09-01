import { prisma } from "@/lib/prisma";

export type StockLevel = {
  productId: string;
  name: string;
  category: string;
  unit: string;
  received: number;
  sold: number;
  onHand: number;
  reorderLevel: number;
  costPrice: number;
  sellingPrice: number;
  lowStock: boolean;
};

/**
 * Stock on hand is always DERIVED from immutable StockReceipt and SaleItem
 * rows — there is no editable "quantity" column anywhere, so it's
 * impossible for stock figures to be quietly overwritten.
 */
export async function getStockLevels(): Promise<StockLevel[]> {
  const products = await prisma.product.findMany({
    include: {
      stockReceipts: { select: { quantity: true } },
      saleItems: { select: { quantity: true } },
    },
    orderBy: { name: "asc" },
  });

  return products.map((p) => {
    const received = p.stockReceipts.reduce((s, r) => s + r.quantity, 0);
    const sold = p.saleItems.reduce((s, i) => s + i.quantity, 0);
    const onHand = received - sold;
    return {
      productId: p.id,
      name: p.name,
      category: p.category,
      unit: p.unit,
      received,
      sold,
      onHand,
      reorderLevel: p.reorderLevel,
      costPrice: Number(p.costPrice),
      sellingPrice: Number(p.sellingPrice),
      lowStock: onHand <= p.reorderLevel,
    };
  });
}
