"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  {
    href: "/",
    label: "Início",
    icon: (
      <>
        <path d="M4 11.5 12 4l8 7.5" />
        <path d="M6 10v9h5v-5h2v5h5v-9" />
      </>
    ),
  },
  {
    href: "/upload",
    label: "Importar",
    icon: (
      <>
        <path d="M7 18a4 4 0 0 1-1-7.874A5 5 0 0 1 16.9 9.02 4.5 4.5 0 0 1 16.5 18H7Z" />
        <path d="M12 11v7" />
        <path d="M9.3 13.6 12 11l2.7 2.6" />
      </>
    ),
  },
  {
    href: "/dashboard",
    label: "Fluxo de Caixa",
    icon: null,
  },
  {
    href: "/mapa",
    label: "Mapa",
    icon: (
      <>
        <path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21Z" />
        <circle cx="12" cy="9.5" r="2.3" />
      </>
    ),
  },
  {
    href: "/compras-online",
    label: "Compras Online",
    icon: (
      <>
        <path d="M6 9V7a6 6 0 0 1 12 0v2" />
        <path d="M4.5 9h15l-1 11.5a1.5 1.5 0 0 1-1.5 1.4H7a1.5 1.5 0 0 1-1.5-1.4L4.5 9Z" />
      </>
    ),
  },
  {
    href: "/transacoes",
    label: "Transações",
    icon: (
      <>
        <path d="M4 6h16" />
        <path d="M4 12h16" />
        <path d="M4 18h10" />
      </>
    ),
  },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <nav
      className="sticky top-0 z-10 flex items-center justify-between border-b px-6 py-0 sm:px-12"
      style={{
        height: 72,
        borderColor: "var(--hairline)",
        background: "rgba(10,10,11,0.55)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
      }}
    >
      <Link href="/" className="flex items-center gap-3">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="9.5" stroke="#c7c7cb" strokeWidth="1.3" />
          <path
            d="M7.5 13.2 10 10.6l2.4 2.2 4.1-4.6"
            stroke="#f2f2f0"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span className="serif text-[19px] tracking-tight text-[var(--ink)]">Fluxo de Caixa</span>
      </Link>

      <div className="hidden items-center gap-1 md:flex">
        {LINKS.map((link) => {
          const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`relative flex items-center gap-2 rounded-[9px] px-3.5 py-2.5 text-sm ${
                active ? "nav-item-active font-semibold" : "nav-item font-medium"
              }`}
            >
              {link.icon && (
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  {link.icon}
                </svg>
              )}
              {link.href === "/dashboard" && (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="4" y="12" width="3" height="8" rx="0.5" />
                  <rect x="10.5" y="7" width="3" height="13" rx="0.5" />
                  <rect x="17" y="3" width="3" height="17" rx="0.5" />
                </svg>
              )}
              {link.label}
              {active && (
                <span
                  className="absolute -bottom-px left-3.5 right-3.5 h-[2px]"
                  style={{ background: "linear-gradient(90deg,transparent,#c7c7cb,transparent)" }}
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
