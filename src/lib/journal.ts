import type { Prisma, PrismaClient } from "@prisma/client";
import { ACCOUNTS, type AccountKey } from "./accounts";

type Tx = Prisma.TransactionClient | PrismaClient;

export type JournalLineInput = {
  account: AccountKey;
  debit?: number;
  credit?: number;
};

export type PostJournalInput = {
  date?: Date;
  memo: string;
  sourceType:
    | "SALE"
    | "STOCK_RECEIPT"
    | "BILL"
    | "BILL_PAYMENT"
    | "OPERATING_COST"
    | "SALARY"
    | "ASSET"
    | "LOAN"
    | "LOAN_REPAYMENT"
    | "CAPITAL";
  sourceId: string;
  recordedById: string;
  lines: JournalLineInput[];
};

const CENTS_EPSILON = 0.005;

/**
 * Writes a balanced double-entry journal entry. Throws if debits != credits,
 * which would indicate a bug in the calling code rather than bad user input —
 * this function is the last line of defense that keeps the books honest.
 *
 * Accounts are looked up by code (seeded once via prisma/seed.ts) rather than
 * created on the fly, so the chart of accounts stays fixed and reports stay
 * consistent.
 */
export async function postJournal(tx: Tx, input: PostJournalInput) {
  const totalDebit = input.lines.reduce((s, l) => s + (l.debit ?? 0), 0);
  const totalCredit = input.lines.reduce((s, l) => s + (l.credit ?? 0), 0);

  if (Math.abs(totalDebit - totalCredit) > CENTS_EPSILON) {
    throw new Error(
      `Journal entry is not balanced (debit ${totalDebit} vs credit ${totalCredit}) for ${input.sourceType} ${input.sourceId}`
    );
  }
  if (input.lines.length < 2) {
    throw new Error("A journal entry needs at least two lines");
  }

  const codes = input.lines.map((l) => ACCOUNTS[l.account].code);
  const accounts = await tx.account.findMany({ where: { code: { in: codes } } });
  const byCode = new Map(accounts.map((a) => [a.code, a]));

  return tx.journalEntry.create({
    data: {
      date: input.date ?? new Date(),
      memo: input.memo,
      sourceType: input.sourceType,
      sourceId: input.sourceId,
      recordedById: input.recordedById,
      lines: {
        create: input.lines.map((l) => {
          const account = byCode.get(ACCOUNTS[l.account].code);
          if (!account) {
            throw new Error(
              `Account ${l.account} (${ACCOUNTS[l.account].code}) not found — did you run the seed script?`
            );
          }
          return {
            accountId: account.id,
            debit: l.debit ?? 0,
            credit: l.credit ?? 0,
          };
        }),
      },
    },
    include: { lines: { include: { account: true } } },
  });
}
