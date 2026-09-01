"use server";

import { prisma } from "@/lib/prisma";
import { postJournal } from "@/lib/journal";
import { accountForPaymentMethod } from "@/lib/accounts";
import { requireAdmin } from "@/lib/guards";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// Bills = money the bar owes (unpaid supplier/creditor invoices), recorded by
// creditor name + amount as required. Admin-only: this affects the books.
export async function createBill(formData: FormData) {
  const user = await requireAdmin();

  const creditorName = String(formData.get("creditorName") || "").trim();
  const description = String(formData.get("description") || "").trim() || null;
  const amount = parseFloat(String(formData.get("amount") || "0"));
  const dueDateRaw = String(formData.get("dueDate") || "");

  if (!creditorName) throw new Error("Creditor name is required");
  if (!amount || amount <= 0) throw new Error("Amount must be greater than zero");

  await prisma.$transaction(async (tx) => {
    const bill = await tx.bill.create({
      data: {
        creditorName,
        description,
        amount,
        createdById: user.id,
        dueDate: dueDateRaw ? new Date(dueDateRaw) : null,
      },
    });

    // Recording an unpaid bill: Dr Operating Expense, Cr Accounts Payable.
    await postJournal(tx, {
      memo: `Bill owed to ${creditorName}${description ? ` — ${description}` : ""}`,
      sourceType: "BILL",
      sourceId: bill.id,
      recordedById: user.id,
      lines: [
        { account: "OPERATING_EXPENSE", debit: amount },
        { account: "ACCOUNTS_PAYABLE", credit: amount },
      ],
    });
  });

  revalidatePath("/admin/bills");
  redirect("/admin/bills?success=1");
}

export async function payBill(formData: FormData) {
  const user = await requireAdmin();

  const billId = String(formData.get("billId") || "");
  const amount = parseFloat(String(formData.get("amount") || "0"));
  const paidVia = String(formData.get("paidVia") || "CASH") as "CASH" | "MOBILE_MONEY" | "CARD";
  const note = String(formData.get("note") || "").trim() || null;

  if (!billId) throw new Error("Missing bill");
  if (!amount || amount <= 0) throw new Error("Amount must be greater than zero");

  await prisma.$transaction(async (tx) => {
    const bill = await tx.bill.findUniqueOrThrow({ where: { id: billId } });
    const newPaid = Number(bill.amountPaid) + amount;
    const status = newPaid >= Number(bill.amount) ? "PAID" : "PARTIALLY_PAID";

    // amountPaid/status are a running total maintained by the system as
    // payments accrue — the original bill amount itself is never altered.
    await tx.bill.update({ where: { id: billId }, data: { amountPaid: newPaid, status } });

    const payment = await tx.billPayment.create({
      data: { billId, amount, paidVia, note },
    });

    // Paying a bill: Dr Accounts Payable, Cr Cash/MobileMoney/Bank.
    await postJournal(tx, {
      memo: `Payment to ${bill.creditorName}`,
      sourceType: "BILL_PAYMENT",
      sourceId: payment.id,
      recordedById: user.id,
      lines: [
        { account: "ACCOUNTS_PAYABLE", debit: amount },
        { account: accountForPaymentMethod(paidVia), credit: amount },
      ],
    });
  });

  revalidatePath("/admin/bills");
  redirect("/admin/bills?success=1");
}
