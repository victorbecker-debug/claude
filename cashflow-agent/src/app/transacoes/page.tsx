"use client";

import { useEffect, useState } from "react";

interface Category {
  id: string;
  name: string;
  color: string;
}

interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  categorySource: "AUTO" | "MANUAL";
  account: { id: string; name: string; type: "CHECKING" | "CREDIT_CARD" };
  category: Category | null;
  merchant: { id: string; displayName: string; isOnline: boolean } | null;
}

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const dateFmt = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });

export default function TransacoesPage() {
  const [transactions, setTransactions] = useState<Transaction[] | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then(setCategories);
    fetch("/api/transactions")
      .then((r) => r.json())
      .then(setTransactions);
  }, []);

  async function handleCategoryChange(id: string, categoryId: string) {
    setTransactions((prev) =>
      prev
        ? prev.map((t) =>
            t.id === id
              ? { ...t, category: categories.find((c) => c.id === categoryId) ?? null, categorySource: "MANUAL" }
              : t
          )
        : prev
    );
    await fetch(`/api/transactions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ categoryId }),
    });
  }

  return (
    <div>
      <h1 className="serif text-[28px] font-medium text-[var(--ink)]">Transações</h1>
      <p className="mt-3 text-sm text-[var(--ink-2)]">
        Categorização automática por palavra-chave — ajuste manualmente quando necessário.
      </p>

      <div className="card mt-4 overflow-x-auto px-7 pb-1 pt-2">
        <table className="w-full min-w-[720px] border-collapse text-sm">
          <thead>
            <tr>
              {["Data", "Descrição", "Conta", "Categoria"].map((h) => (
                <th
                  key={h}
                  className="border-b py-3.5 pl-2 text-left text-[11.5px] font-semibold uppercase tracking-wider text-[var(--ink-3)] first:pl-2"
                  style={{ borderColor: "var(--hairline)" }}
                >
                  {h}
                </th>
              ))}
              <th
                className="border-b py-3.5 pr-2 text-right text-[11.5px] font-semibold uppercase tracking-wider text-[var(--ink-3)]"
                style={{ borderColor: "var(--hairline)" }}
              >
                Valor
              </th>
            </tr>
          </thead>
          <tbody>
            {transactions?.map((t) => (
              <tr key={t.id} className="row-hover">
                <td className="tab whitespace-nowrap border-b py-3.5 pl-2 text-[var(--ink-2)]" style={{ borderColor: "var(--hairline)" }}>
                  {dateFmt.format(new Date(t.date))}
                </td>
                <td className="border-b py-3.5 text-[var(--ink)]" style={{ borderColor: "var(--hairline)" }}>
                  {t.merchant?.displayName ?? t.description}
                  {t.merchant?.isOnline && (
                    <span
                      className="ml-2 rounded px-1.5 py-0.5 text-xs text-[var(--ink-3)]"
                      style={{ background: "rgba(255,255,255,0.06)" }}
                    >
                      online
                    </span>
                  )}
                </td>
                <td className="whitespace-nowrap border-b py-3.5 text-[var(--ink-3)]" style={{ borderColor: "var(--hairline)" }}>
                  {t.account.name}
                </td>
                <td className="border-b py-3.5" style={{ borderColor: "var(--hairline)" }}>
                  <select
                    value={t.category?.id ?? ""}
                    onChange={(e) => handleCategoryChange(t.id, e.target.value)}
                    className="field rounded-md px-2 py-1 text-xs outline-none"
                    style={{ color: t.category?.color }}
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  {t.categorySource === "MANUAL" && (
                    <span className="ml-1 text-xs text-[var(--ink-3)]" title="Ajustado manualmente">
                      *
                    </span>
                  )}
                </td>
                <td className="mono tab whitespace-nowrap border-b py-3.5 pr-2 text-right text-[var(--ink)]" style={{ borderColor: "var(--hairline)" }}>
                  {currency.format(t.amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {transactions && transactions.length === 0 && (
          <p className="p-5 text-sm text-[var(--ink-3)]">Nenhuma transação importada ainda.</p>
        )}
      </div>
    </div>
  );
}
