"use server";

import { prisma } from "@/lib/prisma";
import { postJournal } from "@/lib/journal";
import { accountForPaymentMethod } from "@/lib/accounts";
import { requireAdmin } from "@/lib/guards";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createOperatingCost(formData: FormData) {
  const user = await requireAdmin();

  const category = String(formData.get("category") || "").trim();
  const description = String(formData.get("description") || "").trim() || null;
  const amount = parseFloat(String(formData.get("amount") || "0"));
  const paidVia = String(formData.get("paidVia") || "CASH") as "CASH" | "MOBILE_MONEY" | "CARD" | "CREDIT";

  if (!category) throw new Error("Category is required");
  if (!amount || amount <= 0) throw new Error("Amount must be greater than zero");

  await prisma.$transaction(async (tx) => {
    const cost = await tx.operatingCost.create({
      data: { category, description, amount, paidVia, recordedById: user.id },
    });

    const creditAccount = paidVia === "CREDIT" ? "ACCOUNTS_PAYABLE" : accountForPaymentMethod(paidVia);

    await postJournal(tx, {
      memo: `${category}${description ? ` — ${description}` : ""}`,
      sourceType: "OPERATING_COST",
      sourceId: cost.id,
      recordedById: user.id,
      lines: [
        { account: "OPERATING_EXPENSE", debit: amount },
        { account: creditAccount, credit: amount },
      ],
    });
  });

  revalidatePath("/admin/operating-costs");
  redirect("/admin/operating-costs?success=1");
}
