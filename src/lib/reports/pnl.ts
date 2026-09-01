import { prisma } from "@/lib/prisma";
import { ACCOUNTS } from "@/lib/accounts";

export type PnlLine = { code: string; name: string; amount: number };
export type PnlStatement = {
  from: Date;
  to: Date;
  revenue: PnlLine[];
  totalRevenue: number;
  expenses: PnlLine[];
  totalExpenses: number;
  grossProfit: number; // revenue - COGS
  netProfit: number; // revenue - all expenses (incl. COGS)
};

/**
 * Builds a Profit & Loss statement strictly from posted JournalLines for
 * REVENUE and EXPENSE accounts within [from, to]. Because every sale, cost,
 * salary payment etc. always posts a balanced journal entry, this report can
 * never drift from the underlying records — there is nothing else to keep
 * in sync.
 */
export async function getProfitAndLoss(from: Date, to: Date): Promise<PnlStatement> {
  const lines = await prisma.journalLine.findMany({
    where: { entry: { date: { gte: from, lte: to } } },
    include: { account: true },
  });

  const totals = new Map<string, number>(); // account code -> net amount

  for (const line of lines) {
    const code = line.account.code;
    const debit = Number(line.debit);
    const credit = Number(line.credit);
    const current = totals.get(code) ?? 0;

    if (line.account.type === "REVENUE") {
      totals.set(code, current + (credit - debit)); // revenue grows on credit
    } else if (line.account.type === "EXPENSE") {
      totals.set(code, current + (debit - credit)); // expense grows on debit
    }
  }

  const revenueAccounts = [ACCOUNTS.SALES_REVENUE];
  const expenseAccounts = [
    ACCOUNTS.COGS,
    ACCOUNTS.OPERATING_EXPENSE,
    ACCOUNTS.SALARIES_EXPENSE,
    ACCOUNTS.INTEREST_EXPENSE,
  ];

  const revenue: PnlLine[] = revenueAccounts.map((a) => ({
    code: a.code,
    name: a.name,
    amount: totals.get(a.code) ?? 0,
  }));
  const expenses: PnlLine[] = expenseAccounts.map((a) => ({
    code: a.code,
    name: a.name,
    amount: totals.get(a.code) ?? 0,
  }));

  const totalRevenue = revenue.reduce((s, l) => s + l.amount, 0);
  const totalExpenses = expenses.reduce((s, l) => s + l.amount, 0);
  const cogs = totals.get(ACCOUNTS.COGS.code) ?? 0;

  return {
    from,
    to,
    revenue,
    totalRevenue,
    expenses,
    totalExpenses,
    grossProfit: totalRevenue - cogs,
    netProfit: totalRevenue - totalExpenses,
  };
}
