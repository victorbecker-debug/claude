import type { AccountType } from "@prisma/client";

// Checking-account exports mark expenses as negative amounts. Credit-card
// invoice exports do the opposite: purchases are positive (money owed) and
// payments/refunds are negative. This normalizes both into "is this an
// expense, and what's its positive value" for aggregation.
export function isExpense(amount: number, accountType: AccountType): boolean {
  return accountType === "CREDIT_CARD" ? amount > 0 : amount < 0;
}

export function expenseValue(amount: number): number {
  return Math.abs(amount);
}
