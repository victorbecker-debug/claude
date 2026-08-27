"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Início" },
  { href: "/upload", label: "Importar" },
  { href: "/dashboard", label: "Fluxo de Caixa" },
  { href: "/mapa", label: "Mapa" },
  { href: "/compras-online", label: "Compras Online" },
  { href: "/transacoes", label: "Transações" },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <nav className="border-b border-black/10 dark:border-white/10">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-1 px-4 py-3">
        <span className="mr-4 font-semibold tracking-tight">Fluxo de Caixa</span>
        {LINKS.map((link) => {
          const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
                active
                  ? "bg-foreground text-background"
                  : "text-foreground/70 hover:bg-black/5 dark:hover:bg-white/10"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
