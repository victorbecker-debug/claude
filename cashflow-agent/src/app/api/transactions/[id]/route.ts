import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const updateSchema = z.object({
  categoryId: z.string().min(1),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const transaction = await prisma.transaction.update({
    where: { id },
    data: { categoryId: parsed.data.categoryId, categorySource: "MANUAL" },
    include: { account: true, category: true, merchant: true },
  });

  return NextResponse.json(transaction);
}
