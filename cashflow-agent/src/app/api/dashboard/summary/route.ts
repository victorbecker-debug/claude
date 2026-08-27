import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isExpense, expenseValue } from "@/lib/money";

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

// A pie/legend can only safely show ~7 distinct categorical hues before
// colors stop being reliably distinguishable — fold the long tail into an
// "Outros" bucket rather than generating more hues.
const MAX_CHART_CATEGORIES = 7;
const OUTROS_COLOR = "#898781";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const accountId = searchParams.get("accountId") ?? undefined;
  const requestedMonth = searchParams.get("month") ?? undefined;

  const transactions = await prisma.transaction.findMany({
    where: accountId ? { accountId } : undefined,
    include: { account: true, category: true, merchant: true },
    orderBy: { date: "asc" },
  });

  const expenses = transactions.filter((t) => isExpense(t.amount, t.account.type));

  const months = Array.from(new Set(expenses.map((t) => monthKey(t.date)))).sort();
  const selectedMonth =
    requestedMonth && months.includes(requestedMonth) ? requestedMonth : months[months.length - 1];

  const monthExpenses = expenses.filter((t) => monthKey(t.date) === selectedMonth);
  const totalSpend = monthExpenses.reduce((sum, t) => sum + expenseValue(t.amount), 0);

  const byCategoryMap = new Map<string, { categoryId: string; name: string; color: string; total: number }>();
  for (const t of monthExpenses) {
    const key = t.categoryId ?? "uncategorized";
    const name = t.category?.name ?? "Sem categoria";
    const color = t.category?.color ?? OUTROS_COLOR;
    const entry = byCategoryMap.get(key) ?? { categoryId: key, name, color, total: 0 };
    entry.total += expenseValue(t.amount);
    byCategoryMap.set(key, entry);
  }
  let byCategory = Array.from(byCategoryMap.values()).sort((a, b) => b.total - a.total);

  if (byCategory.length > MAX_CHART_CATEGORIES) {
    const head = byCategory.slice(0, MAX_CHART_CATEGORIES - 1);
    const tail = byCategory.slice(MAX_CHART_CATEGORIES - 1);
    const tailTotal = tail.reduce((sum, c) => sum + c.total, 0);
    head.push({ categoryId: "outros-fold", name: "Outros", color: OUTROS_COLOR, total: tailTotal });
    byCategory = head;
  }

  const byEstablishmentMap = new Map<string, { merchantId: string; name: string; total: number; count: number }>();
  for (const t of monthExpenses) {
    const key = t.merchantId ?? t.description;
    const name = t.merchant?.displayName ?? t.description;
    const entry = byEstablishmentMap.get(key) ?? { merchantId: key, name, total: 0, count: 0 };
    entry.total += expenseValue(t.amount);
    entry.count += 1;
    byEstablishmentMap.set(key, entry);
  }
  const byEstablishment = Array.from(byEstablishmentMap.values())
    .sort((a, b) => b.total - a.total)
    .slice(0, 15);

  const monthlyTotals = new Map<string, number>();
  for (const t of expenses) {
    const key = monthKey(t.date);
    monthlyTotals.set(key, (monthlyTotals.get(key) ?? 0) + expenseValue(t.amount));
  }
  const monthlyComparison = Array.from(monthlyTotals.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([month, total]) => ({ month, total }));

  return NextResponse.json({
    months,
    selectedMonth: selectedMonth ?? null,
    totalSpend,
    byCategory,
    byEstablishment,
    monthlyComparison,
  });
}
