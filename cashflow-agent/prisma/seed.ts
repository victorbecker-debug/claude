import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Default category taxonomy with keyword rules used to auto-categorize
// transactions by matching against the (normalized) merchant description.
// Keywords are matched case-insensitively as substrings.
// Colors follow the validated categorical order (fixed, never cycled) from
// the data-viz skill's reference palette: blue, orange, aqua, yellow,
// magenta, green, violet, red. Categories beyond the safe 7-slot count fold
// into "Outros" (muted) when charted — see the dashboard aggregation.
const CATEGORIES: { name: string; color: string; keywords: string[] }[] = [
  {
    name: "Supermercado",
    color: "#2a78d6",
    keywords: ["supermercado", "mercado", "atacadao", "atacadão", "carrefour", "extra", "pao de acucar", "assai", "hortifruti"],
  },
  {
    name: "Alimentação",
    color: "#eb6834",
    keywords: ["restaurante", "lanchonete", "padaria", "ifood", "rappi", "cafe", "café", "burguer", "burger", "pizza", "bar ", "churrascaria"],
  },
  {
    name: "Transporte",
    color: "#1baf7a",
    keywords: ["uber", "99app", "99 ", "posto", "combustivel", "combustível", "estacionamento", "pedagio", "pedágio", "metro", "metrô", "onibus", "ônibus"],
  },
  {
    name: "Compras Online",
    color: "#eda100",
    keywords: ["mercado livre", "mercadolivre", "amazon", "shopee", "aliexpress", "magazine luiza", "magalu", "americanas", "shein"],
  },
  {
    name: "Saúde",
    color: "#e87ba4",
    keywords: ["farmacia", "farmácia", "drogaria", "drogasil", "hospital", "clinica", "clínica", "laboratorio", "laboratório", "unimed", "amil"],
  },
  {
    name: "Assinaturas",
    color: "#008300",
    keywords: ["netflix", "spotify", "amazon prime", "disney", "hbo", "youtube premium", "icloud", "google one", "openai", "claude"],
  },
  {
    name: "Moradia",
    color: "#4a3aa7",
    keywords: ["aluguel", "condominio", "condomínio", "energia", "luz", "cemig", "enel", "sabesp", "copasa", "internet", "vivo fibra", "claro net"],
  },
  {
    name: "Lazer",
    color: "#e34948",
    keywords: ["cinema", "ingresso", "show", "teatro", "steam", "playstation", "xbox"],
  },
  {
    name: "Educação",
    color: "#78716c",
    keywords: ["escola", "faculdade", "curso", "udemy", "alura", "livraria"],
  },
  {
    name: "Outros",
    color: "#898781",
    keywords: [],
  },
];

async function main() {
  for (const cat of CATEGORIES) {
    const category = await prisma.category.upsert({
      where: { name: cat.name },
      update: { color: cat.color },
      create: { name: cat.name, color: cat.color },
    });

    for (const keyword of cat.keywords) {
      const existing = await prisma.categoryRule.findFirst({
        where: { keyword, categoryId: category.id },
      });
      if (!existing) {
        await prisma.categoryRule.create({
          data: { keyword, categoryId: category.id },
        });
      }
    }
  }

  console.log(`Seeded ${CATEGORIES.length} categories.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
