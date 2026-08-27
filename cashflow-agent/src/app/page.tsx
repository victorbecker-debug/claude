import Link from "next/link";

const STEPS = [
  {
    href: "/upload",
    title: "1. Importar",
    description: "Envie o extrato da conta ou fatura do cartão (CSV/OFX exportado do site do banco).",
  },
  {
    href: "/dashboard",
    title: "2. Fluxo de Caixa",
    description: "Veja o gasto por categoria e por estabelecimento, com comparativo mês a mês.",
  },
  {
    href: "/mapa",
    title: "3. Mapa",
    description: "Onde você gastou — localização aproximada dos estabelecimentos físicos.",
  },
  {
    href: "/compras-online",
    title: "4. Compras Online",
    description: "Lojas de internet identificadas, sem localização física.",
  },
];

export default function Home() {
  return (
    <div>
      <h1 className="text-3xl font-semibold tracking-tight">Fluxo de Caixa</h1>
      <p className="mt-2 max-w-xl text-foreground/70">
        Seu fluxo de caixa pessoal por estabelecimento e categoria, com histórico comparativo e mapa de gastos —
        a partir dos extratos que você importa.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {STEPS.map((step) => (
          <Link
            key={step.href}
            href={step.href}
            className="rounded-lg border border-black/10 p-5 transition-colors hover:border-black/25 dark:border-white/10 dark:hover:border-white/30"
          >
            <h2 className="font-medium">{step.title}</h2>
            <p className="mt-1 text-sm text-foreground/60">{step.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
