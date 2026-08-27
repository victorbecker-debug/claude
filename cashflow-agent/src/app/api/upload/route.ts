import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { manualImportSource, detectFormat } from "@/lib/datasources/manual-import";
import { normalizeMerchantName, detectIsOnline, matchCategory } from "@/lib/categorize";
import { geocodePendingMerchants } from "@/lib/geocode";

export async function POST(request: Request) {
  const formData = await request.formData();
  const accountId = formData.get("accountId");
  const file = formData.get("file");

  if (typeof accountId !== "string" || !accountId) {
    return NextResponse.json({ error: "Conta é obrigatória." }, { status: 400 });
  }
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Arquivo é obrigatório." }, { status: 400 });
  }

  const account = await prisma.account.findUnique({ where: { id: accountId } });
  if (!account) {
    return NextResponse.json({ error: "Conta não encontrada." }, { status: 404 });
  }

  const content = await file.text();
  const format = detectFormat(file.name, content);

  let rawTransactions;
  try {
    rawTransactions = await manualImportSource.fetchTransactions({ filename: file.name, content });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro ao processar arquivo." },
      { status: 400 }
    );
  }

  if (rawTransactions.length === 0) {
    return NextResponse.json({ error: "Nenhuma transação encontrada no arquivo." }, { status: 400 });
  }

  const importBatch = await prisma.importBatch.create({
    data: { accountId, filename: file.name, format },
  });

  const rules = await prisma.categoryRule.findMany();
  const outrosCategory = await prisma.category.findUnique({ where: { name: "Outros" } });

  let created = 0;
  for (const tx of rawTransactions) {
    const { displayName, normalizedName, city } = normalizeMerchantName(tx.description);
    const isOnline = detectIsOnline(tx.description);

    const merchant = await prisma.merchant.upsert({
      where: { normalizedName },
      update: {},
      create: { normalizedName, displayName, city, isOnline },
    });

    const categoryId = matchCategory(tx.description, rules) ?? outrosCategory?.id ?? null;

    await prisma.transaction.create({
      data: {
        accountId,
        importBatchId: importBatch.id,
        date: tx.date,
        description: tx.description,
        amount: tx.amount,
        merchantId: merchant.id,
        categoryId,
        categorySource: "AUTO",
      },
    });
    created++;
  }

  // Fire-and-forget: geocoding is rate-limited to 1 req/s by Nominatim's
  // usage policy, so it shouldn't block the upload response.
  geocodePendingMerchants(50).catch((err) => console.error("Geocoding failed:", err));

  return NextResponse.json({ imported: created, importBatchId: importBatch.id });
}
