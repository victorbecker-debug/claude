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
      <h1 className="serif text-4xl font-medium tracking-tight text-[var(--ink)]">Fluxo de Caixa</h1>
      <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-[var(--ink-2)]">
        Seu fluxo de caixa pessoal por estabelecimento e categoria, com histórico comparativo e mapa de gastos —
        a partir dos extratos que você importa.
      </p>

      <div className="mt-10 grid gap-5 sm:grid-cols-2">
        {STEPS.map((step) => (
          <Link key={step.href} href={step.href} className="row-hover card block p-6">
            <h2 className="font-semibold text-[var(--ink)]">{step.title}</h2>
            <p className="mt-1.5 text-sm text-[var(--ink-2)]">{step.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
