"use server";

import { prisma } from "@/lib/prisma";
import { postJournal } from "@/lib/journal";
import { accountForPaymentMethod } from "@/lib/accounts";
import { requireStaff } from "@/lib/guards";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type SaleLineInput = { productId: string; quantity: number };

export async function createSale(formData: FormData) {
  const user = await requireStaff();

  const paymentMethod = String(formData.get("paymentMethod") || "CASH") as
    | "CASH"
    | "MOBILE_MONEY"
    | "CARD"
    | "CREDIT";
  const customerName = String(formData.get("customerName") || "").trim();
  const note = String(formData.get("note") || "").trim();

  const productIds = formData.getAll("productId") as string[];
  const quantities = formData.getAll("quantity") as string[];

  const lines: SaleLineInput[] = [];
  for (let i = 0; i < productIds.length; i++) {
    const qty = parseInt(quantities[i], 10);
    if (productIds[i] && qty > 0) lines.push({ productId: productIds[i], quantity: qty });
  }

  if (lines.length === 0) throw new Error("Add at least one item to the sale");
  if (paymentMethod === "CREDIT" && !customerName) {
    throw new Error("Customer name is required for credit sales");
  }

  const products = await prisma.product.findMany({
    where: { id: { in: lines.map((l) => l.productId) } },
  });
  const byId = new Map(products.map((p) => [p.id, p]));

  let totalAmount = 0;
  let totalCost = 0;
  const itemsData = lines.map((l) => {
    const p = byId.get(l.productId);
    if (!p) throw new Error("Unknown product in sale");
    const unitPrice = Number(p.sellingPrice);
    const unitCost = Number(p.costPrice);
    totalAmount += unitPrice * l.quantity;
    totalCost += unitCost * l.quantity;
    return {
      productId: l.productId,
      quantity: l.quantity,
      unitPrice,
      unitCost,
    };
  });

  await prisma.$transaction(async (tx) => {
    const sale = await tx.sale.create({
      data: {
        soldById: user.id,
        paymentMethod,
        customerName: paymentMethod === "CREDIT" ? customerName : null,
        totalAmount,
        totalCost,
        note: note || null,
        items: { create: itemsData },
      },
    });

    const debitAccount = paymentMethod === "CREDIT" ? "ACCOUNTS_RECEIVABLE" : accountForPaymentMethod(paymentMethod);

    // Revenue: Dr Cash/MobileMoney/Bank/Receivable, Cr Sales Revenue
    await postJournal(tx, {
      memo: `Sale ${sale.id.slice(-8)}${customerName ? ` — ${customerName}` : ""}`,
      sourceType: "SALE",
      sourceId: sale.id,
      recordedById: user.id,
      lines: [
        { account: debitAccount, debit: totalAmount },
        { account: "SALES_REVENUE", credit: totalAmount },
      ],
    });

    // COGS: Dr Cost of Goods Sold, Cr Inventory
    if (totalCost > 0) {
      await postJournal(tx, {
        memo: `COGS for sale ${sale.id.slice(-8)}`,
        sourceType: "SALE",
        sourceId: sale.id,
        recordedById: user.id,
        lines: [
          { account: "COGS", debit: totalCost },
          { account: "INVENTORY", credit: totalCost },
        ],
      });
    }

    return sale;
  });

  revalidatePath("/bartender");
  revalidatePath("/admin");
  redirect("/bartender/sales/new?success=1");
}
