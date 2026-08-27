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
      <h1 className="serif text-[28px] font-medium text-[var(--ink)]">Compras online</h1>
      <p className="mt-3 max-w-xl text-sm leading-relaxed text-[var(--ink-2)]">
        Lojas de internet identificadas nas transações (sem localização física — por isso ficam separadas do
        mapa).
      </p>

      {rows && rows.length > 0 && (
        <p className="mt-5 text-[13px] text-[var(--ink-2)]">
          Total: <span className="mono font-semibold text-[var(--ink)]">{currency.format(total)}</span> em{" "}
          {rows.length} loja(s)
        </p>
      )}

      <div className="card mt-4 px-7 pb-1 pt-2">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              <th className="border-b py-3.5 pl-2 text-left text-[11.5px] font-semibold uppercase tracking-wider text-[var(--ink-3)]" style={{ borderColor: "var(--hairline)" }}>
                Loja
              </th>
              <th className="border-b py-3.5 text-left text-[11.5px] font-semibold uppercase tracking-wider text-[var(--ink-3)]" style={{ borderColor: "var(--hairline)" }}>
                Compras
              </th>
              <th className="border-b py-3.5 text-left text-[11.5px] font-semibold uppercase tracking-wider text-[var(--ink-3)]" style={{ borderColor: "var(--hairline)" }}>
                Última compra
              </th>
              <th className="border-b py-3.5 pr-2 text-right text-[11.5px] font-semibold uppercase tracking-wider text-[var(--ink-3)]" style={{ borderColor: "var(--hairline)" }}>
                Total gasto
              </th>
            </tr>
          </thead>
          <tbody>
            {rows?.map((r) => (
              <tr key={r.id} className="row-hover">
                <td className="border-b py-4 pl-2 font-medium text-[var(--ink)]" style={{ borderColor: "var(--hairline)" }}>
                  {r.name}
                </td>
                <td className="tab border-b py-4 text-[var(--ink-2)]" style={{ borderColor: "var(--hairline)" }}>
                  {r.count}
                </td>
                <td className="tab border-b py-4 text-[var(--ink-2)]" style={{ borderColor: "var(--hairline)" }}>
                  {r.lastPurchase ? dateFmt.format(new Date(r.lastPurchase)) : "—"}
                </td>
                <td className="mono tab border-b py-4 pr-2 text-right text-[var(--ink)]" style={{ borderColor: "var(--hairline)" }}>
                  {currency.format(r.total)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows && rows.length === 0 && (
          <p className="p-5 text-sm text-[var(--ink-3)]">Nenhuma compra online identificada ainda.</p>
        )}
      </div>
    </div>
  );
}
