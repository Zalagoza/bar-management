"use server";

import { prisma } from "@/lib/prisma";
import { postJournal } from "@/lib/journal";
import { accountForPaymentMethod } from "@/lib/accounts";
import { requireAdmin } from "@/lib/guards";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createLoan(formData: FormData) {
  const user = await requireAdmin();

  const counterparty = String(formData.get("counterparty") || "").trim();
  const direction = String(formData.get("direction") || "BORROWED") as "BORROWED" | "LENT";
  const principal = parseFloat(String(formData.get("principal") || "0"));
  const interestRateRaw = String(formData.get("interestRate") || "");
  const paidVia = String(formData.get("paidVia") || "CASH") as "CASH" | "MOBILE_MONEY" | "CARD";
  const note = String(formData.get("note") || "").trim() || null;

  if (!counterparty) throw new Error("Counterparty name is required");
  if (!principal || principal <= 0) throw new Error("Principal must be greater than zero");

  await prisma.$transaction(async (tx) => {
    const loan = await tx.loan.create({
      data: {
        counterparty,
        direction,
        principal,
        interestRate: interestRateRaw ? parseFloat(interestRateRaw) : null,
        paidVia,
        note,
        recordedById: user.id,
      },
    });

    const lines =
      direction === "BORROWED"
        ? // Money borrowed IN: Dr Cash/MobileMoney/Bank, Cr Loans Payable
          [
            { account: accountForPaymentMethod(paidVia), debit: principal },
            { account: "LOANS_PAYABLE" as const, credit: principal },
          ]
        : // Money lent OUT: Dr Loans Receivable, Cr Cash/MobileMoney/Bank
          [
            { account: "LOANS_RECEIVABLE" as const, debit: principal },
            { account: accountForPaymentMethod(paidVia), credit: principal },
          ];

    await postJournal(tx, {
      memo: `${direction === "BORROWED" ? "Loan received from" : "Loan given to"} ${counterparty}`,
      sourceType: "LOAN",
      sourceId: loan.id,
      recordedById: user.id,
      lines,
    });
  });

  revalidatePath("/admin/loans");
  redirect("/admin/loans?success=1");
}

export async function repayLoan(formData: FormData) {
  const user = await requireAdmin();

  const loanId = String(formData.get("loanId") || "");
  const amount = parseFloat(String(formData.get("amount") || "0"));
  const paidVia = String(formData.get("paidVia") || "CASH") as "CASH" | "MOBILE_MONEY" | "CARD";
  const note = String(formData.get("note") || "").trim() || null;

  if (!loanId) throw new Error("Missing loan");
  if (!amount || amount <= 0) throw new Error("Amount must be greater than zero");

  await prisma.$transaction(async (tx) => {
    const loan = await tx.loan.findUniqueOrThrow({ where: { id: loanId } });
    const repayment = await tx.loanRepayment.create({ data: { loanId, amount, paidVia, note } });

    const lines =
      loan.direction === "BORROWED"
        ? // Repaying a loan we owe: Dr Loans Payable, Cr Cash/etc.
          [
            { account: "LOANS_PAYABLE" as const, debit: amount },
            { account: accountForPaymentMethod(paidVia), credit: amount },
          ]
        : // Receiving repayment on a loan we gave: Dr Cash/etc., Cr Loans Receivable
          [
            { account: accountForPaymentMethod(paidVia), debit: amount },
            { account: "LOANS_RECEIVABLE" as const, credit: amount },
          ];

    await postJournal(tx, {
      memo: `Loan repayment — ${loan.counterparty}`,
      sourceType: "LOAN_REPAYMENT",
      sourceId: repayment.id,
      recordedById: user.id,
      lines,
    });
  });

  revalidatePath("/admin/loans");
  redirect("/admin/loans?success=1");
}
