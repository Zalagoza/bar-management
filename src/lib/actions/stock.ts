"use server";

import { prisma } from "@/lib/prisma";
import { postJournal } from "@/lib/journal";
import { accountForPaymentMethod } from "@/lib/accounts";
import { requireStaff, requireAdmin } from "@/lib/guards";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createStockReceipt(formData: FormData) {
  const user = await requireStaff();

  const productId = String(formData.get("productId") || "");
  const quantity = parseInt(String(formData.get("quantity") || "0"), 10);
  const unitCost = parseFloat(String(formData.get("unitCost") || "0"));
  const supplier = String(formData.get("supplier") || "").trim() || null;
  const note = String(formData.get("note") || "").trim() || null;
  const paidVia = String(formData.get("paidVia") || "CASH") as "CASH" | "MOBILE_MONEY" | "CARD" | "CREDIT";

  if (!productId) throw new Error("Select a product");
  if (!quantity || quantity <= 0) throw new Error("Quantity must be greater than zero");
  if (!unitCost || unitCost <= 0) throw new Error("Unit cost must be greater than zero");

  const totalCost = quantity * unitCost;

  await prisma.$transaction(async (tx) => {
    const receipt = await tx.stockReceipt.create({
      data: { productId, quantity, unitCost, totalCost, supplier, note, recordedById: user.id },
    });

    // Keep the product's most recent cost price current for future sales' COGS.
    await tx.product.update({ where: { id: productId }, data: { costPrice: unitCost } });

    const creditAccount = paidVia === "CREDIT" ? "ACCOUNTS_PAYABLE" : accountForPaymentMethod(paidVia);

    // Stock purchase: Dr Inventory, Cr Cash/MobileMoney/Bank/Accounts Payable
    await postJournal(tx, {
      memo: `Stock received${supplier ? ` from ${supplier}` : ""} (${quantity} units)`,
      sourceType: "STOCK_RECEIPT",
      sourceId: receipt.id,
      recordedById: user.id,
      lines: [
        { account: "INVENTORY", debit: totalCost },
        { account: creditAccount, credit: totalCost },
      ],
    });
  });

  revalidatePath("/bartender");
  revalidatePath("/admin");
  redirect("/bartender/stock/new?success=1");
}

export async function createProduct(formData: FormData) {
  await requireAdmin();

  const name = String(formData.get("name") || "").trim();
  const category = String(formData.get("category") || "Beer").trim();
  const unit = String(formData.get("unit") || "bottle").trim();
  const costPrice = parseFloat(String(formData.get("costPrice") || "0"));
  const sellingPrice = parseFloat(String(formData.get("sellingPrice") || "0"));
  const reorderLevel = parseInt(String(formData.get("reorderLevel") || "12"), 10);

  if (!name) throw new Error("Product name is required");

  await prisma.product.create({
    data: { name, category, unit, costPrice, sellingPrice, reorderLevel },
  });

  revalidatePath("/admin/stock");
  redirect("/admin/stock?success=1");
}
