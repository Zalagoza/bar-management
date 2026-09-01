"use server";

import { prisma } from "@/lib/prisma";
import { postJournal } from "@/lib/journal";
import { accountForPaymentMethod } from "@/lib/accounts";
import { requireAdmin } from "@/lib/guards";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createEmployee(formData: FormData) {
  await requireAdmin();

  const name = String(formData.get("name") || "").trim();
  const role = String(formData.get("role") || "").trim();
  const monthlyRate = parseFloat(String(formData.get("monthlyRate") || "0"));

  if (!name || !role) throw new Error("Name and role are required");

  await prisma.employee.create({ data: { name, role, monthlyRate: monthlyRate || 0 } });

  revalidatePath("/admin/salaries");
  redirect("/admin/salaries?success=1");
}

export async function paySalary(formData: FormData) {
  const user = await requireAdmin();

  const employeeId = String(formData.get("employeeId") || "");
  const amount = parseFloat(String(formData.get("amount") || "0"));
  const periodLabel = String(formData.get("periodLabel") || "").trim();
  const paidVia = String(formData.get("paidVia") || "CASH") as "CASH" | "MOBILE_MONEY" | "CARD";

  if (!employeeId) throw new Error("Select an employee");
  if (!amount || amount <= 0) throw new Error("Amount must be greater than zero");
  if (!periodLabel) throw new Error("Period (e.g. 'August 2026') is required");

  await prisma.$transaction(async (tx) => {
    const payment = await tx.salaryPayment.create({
      data: { employeeId, amount, periodLabel, paidVia, recordedById: user.id },
    });

    await postJournal(tx, {
      memo: `Salary/wages — ${periodLabel}`,
      sourceType: "SALARY",
      sourceId: payment.id,
      recordedById: user.id,
      lines: [
        { account: "SALARIES_EXPENSE", debit: amount },
        { account: accountForPaymentMethod(paidVia), credit: amount },
      ],
    });
  });

  revalidatePath("/admin/salaries");
  redirect("/admin/salaries?success=1");
}
