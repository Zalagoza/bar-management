"use server";

import { prisma } from "@/lib/prisma";
import { postJournal } from "@/lib/journal";
import { accountForPaymentMethod } from "@/lib/accounts";
import { requireAdmin } from "@/lib/guards";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createAsset(formData: FormData) {
  const user = await requireAdmin();

  const name = String(formData.get("name") || "").trim();
  const category = String(formData.get("category") || "Equipment").trim();
  const value = parseFloat(String(formData.get("value") || "0"));
  const paidVia = String(formData.get("paidVia") || "CASH") as "CASH" | "MOBILE_MONEY" | "CARD";
  const note = String(formData.get("note") || "").trim() || null;

  if (!name) throw new Error("Asset name is required");
  if (!value || value <= 0) throw new Error("Value must be greater than zero");

  await prisma.$transaction(async (tx) => {
    const asset = await tx.asset.create({
      data: { name, category, value, paidVia, note, recordedById: user.id },
    });

    // Buying an asset: Dr Equipment & Assets, Cr Cash/MobileMoney/Bank.
    await postJournal(tx, {
      memo: `Asset acquired: ${name}`,
      sourceType: "ASSET",
      sourceId: asset.id,
      recordedById: user.id,
      lines: [
        { account: "EQUIPMENT", debit: value },
        { account: accountForPaymentMethod(paidVia), credit: value },
      ],
    });
  });

  revalidatePath("/admin/assets");
  redirect("/admin/assets?success=1");
}
