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
      <h1 className="text-2xl font-semibold tracking-tight">Transações</h1>
      <p className="mt-2 text-sm text-foreground/70">
        Categorização automática por palavra-chave — ajuste manualmente quando necessário.
      </p>

      <div className="mt-4 overflow-x-auto rounded-lg border border-black/10 dark:border-white/10">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-black/10 text-left text-foreground/60 dark:border-white/10">
              <th className="px-4 py-2 font-medium">Data</th>
              <th className="px-4 py-2 font-medium">Descrição</th>
              <th className="px-4 py-2 font-medium">Conta</th>
              <th className="px-4 py-2 font-medium">Categoria</th>
              <th className="px-4 py-2 text-right font-medium">Valor</th>
            </tr>
          </thead>
          <tbody>
            {transactions?.map((t) => (
              <tr key={t.id} className="border-b border-black/5 last:border-0 dark:border-white/5">
                <td className="whitespace-nowrap px-4 py-2 tabular-nums">{dateFmt.format(new Date(t.date))}</td>
                <td className="px-4 py-2">
                  {t.merchant?.displayName ?? t.description}
                  {t.merchant?.isOnline && (
                    <span className="ml-2 rounded bg-black/5 px-1.5 py-0.5 text-xs text-foreground/60 dark:bg-white/10">
                      online
                    </span>
                  )}
                </td>
                <td className="whitespace-nowrap px-4 py-2 text-foreground/60">{t.account.name}</td>
                <td className="px-4 py-2">
                  <select
                    value={t.category?.id ?? ""}
                    onChange={(e) => handleCategoryChange(t.id, e.target.value)}
                    className="rounded-md border border-black/15 bg-transparent px-2 py-1 text-xs dark:border-white/20"
                    style={{ color: t.category?.color }}
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  {t.categorySource === "MANUAL" && (
                    <span className="ml-1 text-xs text-foreground/40" title="Ajustado manualmente">
                      *
                    </span>
                  )}
                </td>
                <td className="whitespace-nowrap px-4 py-2 text-right tabular-nums">{currency.format(t.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {transactions && transactions.length === 0 && (
          <p className="p-4 text-sm text-foreground/60">Nenhuma transação importada ainda.</p>
        )}
      </div>
    </div>
  );
}
