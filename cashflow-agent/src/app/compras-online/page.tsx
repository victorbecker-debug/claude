"use client";

import { useEffect, useState } from "react";

interface OnlineMerchant {
  id: string;
  name: string;
  total: number;
  count: number;
  lastPurchase: string | null;
}

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const dateFmt = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });

export default function ComprasOnlinePage() {
  const [rows, setRows] = useState<OnlineMerchant[] | null>(null);

  useEffect(() => {
    fetch("/api/merchants/online")
      .then((r) => r.json())
      .then(setRows);
  }, []);

  const total = rows?.reduce((sum, r) => sum + r.total, 0) ?? 0;

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Compras online</h1>
      <p className="mt-2 text-sm text-foreground/70">
        Lojas de internet identificadas nas transações (sem localização física — por isso ficam separadas do
        mapa).
      </p>

      {rows && rows.length > 0 && (
        <p className="mt-4 text-sm text-foreground/60">
          Total: <span className="font-medium text-foreground">{currency.format(total)}</span> em {rows.length}{" "}
          loja(s)
        </p>
      )}

      <div className="mt-4 overflow-x-auto rounded-lg border border-black/10 dark:border-white/10">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-black/10 text-left text-foreground/60 dark:border-white/10">
              <th className="px-4 py-2 font-medium">Loja</th>
              <th className="px-4 py-2 font-medium">Compras</th>
              <th className="px-4 py-2 font-medium">Última compra</th>
              <th className="px-4 py-2 text-right font-medium">Total gasto</th>
            </tr>
          </thead>
          <tbody>
            {rows?.map((r) => (
              <tr key={r.id} className="border-b border-black/5 last:border-0 dark:border-white/5">
                <td className="px-4 py-2">{r.name}</td>
                <td className="px-4 py-2 tabular-nums">{r.count}</td>
                <td className="px-4 py-2 tabular-nums">
                  {r.lastPurchase ? dateFmt.format(new Date(r.lastPurchase)) : "—"}
                </td>
                <td className="px-4 py-2 text-right tabular-nums">{currency.format(r.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows && rows.length === 0 && (
          <p className="p-4 text-sm text-foreground/60">Nenhuma compra online identificada ainda.</p>
        )}
      </div>
    </div>
  );
}
