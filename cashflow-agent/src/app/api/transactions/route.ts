import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const accountId = searchParams.get("accountId") ?? undefined;
  const categoryId = searchParams.get("categoryId") ?? undefined;

  const transactions = await prisma.transaction.findMany({
    where: {
      ...(accountId ? { accountId } : {}),
      ...(categoryId ? { categoryId } : {}),
    },
    include: { account: true, category: true, merchant: true },
    orderBy: { date: "desc" },
    take: 500,
  });

  return NextResponse.json(transactions);
}
