import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isExpense, expenseValue } from "@/lib/money";

// Geocoded (physical) merchants with their all-time total spend, for the map
// view. Online merchants have no location and are listed separately.
export async function GET() {
  const merchants = await prisma.merchant.findMany({
    where: { isOnline: false, latitude: { not: null }, longitude: { not: null } },
    include: { transactions: { include: { account: true } } },
  });

  const points = merchants
    .map((m) => {
      const expenses = m.transactions.filter((t) => isExpense(t.amount, t.account.type));
      const total = expenses.reduce((sum, t) => sum + expenseValue(t.amount), 0);
      return {
        id: m.id,
        name: m.displayName,
        city: m.city,
        lat: m.latitude as number,
        lng: m.longitude as number,
        total,
        count: expenses.length,
      };
    })
    .filter((p) => p.total > 0);

  return NextResponse.json(points);
}
