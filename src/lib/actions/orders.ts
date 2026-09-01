"use server";

import { prisma } from "@/lib/prisma";
import { requireStaff, requireAdmin } from "@/lib/guards";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// Orders track what's been requested from suppliers but not yet received.
// They have no direct journal impact — the financial event happens when the
// stock actually arrives and is recorded as a StockReceipt.
export async function createOrder(formData: FormData) {
  const user = await requireStaff();

  const supplier = String(formData.get("supplier") || "").trim();
  const note = String(formData.get("note") || "").trim() || null;
  const productIds = formData.getAll("productId") as string[];
  const quantities = formData.getAll("quantity") as string[];
  const unitCosts = formData.getAll("unitCost") as string[];

  if (!supplier) throw new Error("Supplier is required");

  const items = [];
  for (let i = 0; i < productIds.length; i++) {
    const qty = parseInt(quantities[i], 10);
    const cost = parseFloat(unitCosts[i]);
    if (productIds[i] && qty > 0) {
      items.push({ productId: productIds[i], quantity: qty, unitCost: cost || 0 });
    }
  }
  if (items.length === 0) throw new Error("Add at least one item to the order");

  await prisma.order.create({
    data: { supplier, note, createdById: user.id, items: { create: items } },
  });

  revalidatePath("/admin/orders");
  redirect("/admin/orders?success=1");
}

// Status is operational metadata about the order, not a financial record —
// updating it here does not alter or delete any journal/ledger entry.
export async function updateOrderStatus(formData: FormData) {
  await requireAdmin();
  const orderId = String(formData.get("orderId") || "");
  const status = String(formData.get("status") || "PENDING") as
    | "PENDING"
    | "PARTIALLY_RECEIVED"
    | "RECEIVED"
    | "CANCELLED";

  if (!orderId) throw new Error("Missing order");
  await prisma.order.update({ where: { id: orderId }, data: { status } });

  revalidatePath("/admin/orders");
  redirect("/admin/orders?success=1");
}
