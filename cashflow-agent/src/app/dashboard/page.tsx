"use client";

import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

interface Account {
  id: string;
  name: string;
  bankName: string;
}

interface Summary {
  months: string[];
  selectedMonth: string | null;
  totalSpend: number;
  byCategory: { categoryId: string; name: string; color: string; total: number }[];
  byEstablishment: { merchantId: string; name: string; total: number; count: number }[];
  monthlyComparison: { month: string; total: number }[];
}

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function formatMonth(month: string) {
  const [year, m] = month.split("-");
  const date = new Date(Number(year), Number(m) - 1, 1);
  return date.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
}

export default function DashboardPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [accountId, setAccountId] = useState<string>("");
  const [month, setMonth] = useState<string>("");
  const [summary, setSummary] = useState<Summary | null>(null);

  useEffect(() => {
    fetch("/api/accounts")
      .then((r) => r.json())
      .then(setAccounts);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (accountId) params.set("accountId", accountId);
    if (month) params.set("month", month);
    fetch(`/api/dashboard/summary?${params}`)
      .then((r) => r.json())
      .then((data: Summary) => {
        setSummary(data);
        if (!month && data.selectedMonth) setMonth(data.selectedMonth);
      });
  }, [accountId, month]);

  if (!summary) {
    return <p className="text-sm text-foreground/60">Carregando…</p>;
  }

  if (summary && summary.months.length === 0) {
    return (
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Fluxo de Caixa</h1>
        <p className="mt-4 text-sm text-foreground/70">
          Nenhuma transação importada ainda. Vá em{" "}
          <a href="/upload" className="underline">
            Importar
          </a>{" "}
          para começar.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Fluxo de Caixa</h1>
        <div className="flex gap-2">
          <select
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            className="rounded-md border border-black/15 bg-transparent px-3 py-1.5 text-sm dark:border-white/20"
          >
            <option value="">Todas as contas</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
          <select
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="rounded-md border border-black/15 bg-transparent px-3 py-1.5 text-sm dark:border-white/20"
          >
            {summary?.months.map((m) => (
              <option key={m} value={m}>
                {formatMonth(m)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {summary && (
        <>
          {/* Hero stat tile */}
          <div className="mt-6 rounded-lg border border-black/10 p-6 dark:border-white/10">
            <p className="text-sm text-foreground/60">Gasto total no mês</p>
            <p className="mt-1 text-4xl font-semibold tabular-nums">{currency.format(summary.totalSpend)}</p>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            {/* Spend by category */}
            <div className="rounded-lg border border-black/10 p-4 dark:border-white/10">
              <h2 className="text-sm font-medium">Gasto por categoria</h2>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={summary.byCategory}
                      dataKey="total"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                    >
                      {summary.byCategory.map((entry) => (
                        <Cell key={entry.categoryId} fill={entry.color} stroke="var(--background)" strokeWidth={2} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => currency.format(Number(value))} />
                    <Legend
                      layout="vertical"
                      align="right"
                      verticalAlign="middle"
                      formatter={(value: string) => <span className="text-xs">{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Monthly comparison */}
            <div className="rounded-lg border border-black/10 p-4 dark:border-white/10">
              <h2 className="text-sm font-medium">Comparativo mensal</h2>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={summary.monthlyComparison}>
                    <CartesianGrid vertical={false} stroke="#e1e0d9" strokeDasharray="0" />
                    <XAxis
                      dataKey="month"
                      tickFormatter={formatMonth}
                      tick={{ fontSize: 12, fill: "#898781" }}
                      axisLine={{ stroke: "#c3c2b7" }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 12, fill: "#898781" }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => currency.format(v).replace(",00", "")}
                      width={70}
                    />
                    <Tooltip
                      formatter={(value) => currency.format(Number(value))}
                      labelFormatter={(label) => formatMonth(String(label))}
                    />
                    <Bar dataKey="total" fill="#2a78d6" radius={[4, 4, 0, 0]} maxBarSize={48} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Top establishments */}
          <div className="mt-6 rounded-lg border border-black/10 p-4 dark:border-white/10">
            <h2 className="text-sm font-medium">Principais estabelecimentos</h2>
            <div className="mt-2" style={{ height: Math.max(240, summary.byEstablishment.length * 32) }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={summary.byEstablishment} layout="vertical" margin={{ left: 8 }}>
                  <CartesianGrid horizontal={false} stroke="#e1e0d9" />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 12, fill: "#898781" }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => currency.format(v).replace(",00", "")}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 12, fill: "#52514e" }}
                    axisLine={false}
                    tickLine={false}
                    width={140}
                  />
                  <Tooltip
                    formatter={(value, _name, item) => [
                      currency.format(Number(value)),
                      `${(item.payload as { count: number }).count} compra(s)`,
                    ]}
                  />
                  <Bar dataKey="total" fill="#2a78d6" radius={[0, 4, 4, 0]} maxBarSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
