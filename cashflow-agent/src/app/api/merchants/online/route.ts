import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isExpense, expenseValue } from "@/lib/money";

// Online-store merchants (no physical location) with aggregated spend —
// this is the "nome das lojas onde ocorreram compras na internet" view.
export async function GET() {
  const merchants = await prisma.merchant.findMany({
    where: { isOnline: true },
    include: { transactions: { include: { account: true }, orderBy: { date: "desc" } } },
  });

  const rows = merchants
    .map((m) => {
      const expenses = m.transactions.filter((t) => isExpense(t.amount, t.account.type));
      const total = expenses.reduce((sum, t) => sum + expenseValue(t.amount), 0);
      return {
        id: m.id,
        name: m.displayName,
        total,
        count: expenses.length,
        lastPurchase: expenses[0]?.date ?? null,
      };
    })
    .filter((r) => r.count > 0)
    .sort((a, b) => b.total - a.total);

  return NextResponse.json(rows);
}
