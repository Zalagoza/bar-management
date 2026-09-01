// Chart of accounts. Codes are stable identifiers used throughout the app —
// don't change these once you have real data, add new ones instead.
export const ACCOUNTS = {
  CASH: { code: "1000", name: "Cash", type: "ASSET" as const },
  MOBILE_MONEY: { code: "1010", name: "Mobile Money", type: "ASSET" as const },
  BANK: { code: "1020", name: "Bank / Card Settlement", type: "ASSET" as const },
  ACCOUNTS_RECEIVABLE: { code: "1100", name: "Accounts Receivable (Customer Credit)", type: "ASSET" as const },
  INVENTORY: { code: "1200", name: "Stock Inventory", type: "ASSET" as const },
  EQUIPMENT: { code: "1500", name: "Equipment & Assets", type: "ASSET" as const },
  LOANS_RECEIVABLE: { code: "1600", name: "Loans Receivable", type: "ASSET" as const },

  ACCOUNTS_PAYABLE: { code: "2000", name: "Accounts Payable (Unpaid Bills)", type: "LIABILITY" as const },
  LOANS_PAYABLE: { code: "2100", name: "Loans Payable", type: "LIABILITY" as const },

  CAPITAL: { code: "3000", name: "Owner's Capital", type: "EQUITY" as const },
  DRAWINGS: { code: "3100", name: "Owner's Drawings", type: "EQUITY" as const },

  SALES_REVENUE: { code: "4000", name: "Sales Revenue", type: "REVENUE" as const },

  COGS: { code: "5000", name: "Cost of Goods Sold", type: "EXPENSE" as const },
  OPERATING_EXPENSE: { code: "5100", name: "Operating Expenses", type: "EXPENSE" as const },
  SALARIES_EXPENSE: { code: "5200", name: "Salaries & Wages Expense", type: "EXPENSE" as const },
  INTEREST_EXPENSE: { code: "5300", name: "Loan Interest Expense", type: "EXPENSE" as const },
} as const;

export type AccountKey = keyof typeof ACCOUNTS;

export function accountForPaymentMethod(
  method: "CASH" | "MOBILE_MONEY" | "CARD" | "CREDIT"
): AccountKey {
  switch (method) {
    case "CASH":
      return "CASH";
    case "MOBILE_MONEY":
      return "MOBILE_MONEY";
    case "CARD":
      return "BANK";
    case "CREDIT":
      // Caller decides: ACCOUNTS_RECEIVABLE (money owed TO the bar) or
      // ACCOUNTS_PAYABLE (money owed BY the bar) depending on direction.
      throw new Error("CREDIT has no single account — resolve direction explicitly");
  }
}
