import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const accounts = await prisma.account.findMany({ orderBy: { createdAt: "asc" } });
  return NextResponse.json(accounts);
}

const createSchema = z.object({
  name: z.string().min(1),
  bankName: z.string().min(1),
  type: z.enum(["CHECKING", "CREDIT_CARD"]),
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const account = await prisma.account.create({ data: parsed.data });
  return NextResponse.json(account, { status: 201 });
}
