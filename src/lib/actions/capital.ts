"use server";

import { prisma } from "@/lib/prisma";
import { postJournal } from "@/lib/journal";
import { accountForPaymentMethod } from "@/lib/accounts";
import { requireAdmin } from "@/lib/guards";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createCapitalEntry(formData: FormData) {
  const user = await requireAdmin();

  const type = String(formData.get("type") || "CONTRIBUTION") as "CONTRIBUTION" | "DRAWING";
  const amount = parseFloat(String(formData.get("amount") || "0"));
  const paidVia = String(formData.get("paidVia") || "CASH") as "CASH" | "MOBILE_MONEY" | "CARD";
  const note = String(formData.get("note") || "").trim() || null;

  if (!amount || amount <= 0) throw new Error("Amount must be greater than zero");

  await prisma.$transaction(async (tx) => {
    const entry = await tx.capitalEntry.create({ data: { type, amount, paidVia, note, recordedById: user.id } });

    const lines =
      type === "CONTRIBUTION"
        ? // Owner puts money in: Dr Cash/etc., Cr Owner's Capital
          [
            { account: accountForPaymentMethod(paidVia), debit: amount },
            { account: "CAPITAL" as const, credit: amount },
          ]
        : // Owner draws money out: Dr Owner's Drawings, Cr Cash/etc.
          [
            { account: "DRAWINGS" as const, debit: amount },
            { account: accountForPaymentMethod(paidVia), credit: amount },
          ];

    await postJournal(tx, {
      memo: type === "CONTRIBUTION" ? "Owner capital contribution" : "Owner drawing",
      sourceType: "CAPITAL",
      sourceId: entry.id,
      recordedById: user.id,
      lines,
    });
  });

  revalidatePath("/admin/capital");
  redirect("/admin/capital?success=1");
}
