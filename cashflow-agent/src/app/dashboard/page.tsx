"use client";

import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
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

const tooltipStyle = {
  background: "#18181b",
  border: "1px solid rgba(255,255,255,0.14)",
  borderRadius: 10,
  fontSize: 12.5,
  color: "#f2f2f0",
};

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
    return <p className="text-sm text-[var(--ink-3)]">Carregando…</p>;
  }

  if (summary.months.length === 0) {
    return (
      <div>
        <h1 className="serif text-[30px] font-medium text-[var(--ink)]">Fluxo de Caixa</h1>
        <p className="mt-4 text-sm text-[var(--ink-2)]">
          Nenhuma transação importada ainda. Vá em{" "}
          <a href="/upload" className="underline">
            Importar
          </a>{" "}
          para começar.
        </p>
      </div>
    );
  }

  const monthIdx = summary.monthlyComparison.findIndex((m) => m.month === summary.selectedMonth);
  const prevMonth = monthIdx > 0 ? summary.monthlyComparison[monthIdx - 1] : null;
  const delta = prevMonth && prevMonth.total > 0 ? ((summary.totalSpend - prevMonth.total) / prevMonth.total) * 100 : null;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="serif text-[30px] font-medium text-[var(--ink)]">Fluxo de Caixa</h1>
        <div className="flex gap-2.5">
          <select
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            className="filter-pill field text-[13px] outline-none"
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
            className="filter-pill field text-[13px] font-semibold outline-none"
          >
            {summary.months.map((m) => (
              <option key={m} value={m}>
                {formatMonth(m)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Hero stat tile */}
      <div className="card mt-6 flex items-center justify-between p-8">
        <div>
          <p className="mb-2.5 text-xs uppercase tracking-wider text-[var(--ink-3)]">Gasto total no mês</p>
          <p className="serif silver-text tab text-[44px] font-medium leading-none sm:text-[56px]">
            {currency.format(summary.totalSpend)}
          </p>
        </div>
        {delta !== null && (
          <div className="text-right">
            <div
              className="flex items-center justify-end gap-1.5 text-sm font-semibold"
              style={{ color: delta >= 0 ? "var(--bad)" : "var(--good)" }}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                style={{ transform: delta >= 0 ? "rotate(180deg)" : "none" }}
              >
                <path d="M6 8l6 8 6-8" />
              </svg>
              {Math.abs(delta).toFixed(1)}%
            </div>
            <div className="mt-1.5 text-xs text-[var(--ink-3)]">
              vs. {formatMonth(prevMonth!.month)} · {currency.format(prevMonth!.total)}
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Spend by category */}
        <div className="card p-7">
          <h2 className="mb-5 text-xs uppercase tracking-wider text-[var(--ink-3)]">Gasto por categoria</h2>
          <div className="flex items-center gap-7">
            <div className="h-44 w-44 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={summary.byCategory}
                    dataKey="total"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={56}
                    outerRadius={86}
                    paddingAngle={2}
                    strokeWidth={0}
                  >
                    {summary.byCategory.map((entry) => (
                      <Cell key={entry.categoryId} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => currency.format(Number(value))} contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="flex flex-1 flex-col gap-2.5">
              {summary.byCategory.map((c) => (
                <div key={c.categoryId} className="row-hover flex items-center justify-between px-1.5 py-0.5 text-[13px]">
                  <div className="flex items-center gap-2 text-[var(--ink-2)]">
                    <span className="inline-block h-2 w-2 rounded-sm" style={{ background: c.color }} />
                    {c.name}
                  </div>
                  <span className="mono tab text-[var(--ink)]">{currency.format(c.total)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Monthly comparison */}
        <div className="card p-7">
          <h2 className="mb-5 text-xs uppercase tracking-wider text-[var(--ink-3)]">Comparativo mensal</h2>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={summary.monthlyComparison}>
                <defs>
                  <linearGradient id="barSilver" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f0f0ef" />
                    <stop offset="100%" stopColor="#8f8f94" />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.08)" />
                <XAxis
                  dataKey="month"
                  tickFormatter={formatMonth}
                  tick={{ fontSize: 11, fill: "#6f6f73" }}
                  axisLine={{ stroke: "rgba(255,255,255,0.14)" }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#6f6f73" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => currency.format(v).replace(",00", "")}
                  width={64}
                />
                <Tooltip
                  formatter={(value) => currency.format(Number(value))}
                  labelFormatter={(label) => formatMonth(String(label))}
                  contentStyle={tooltipStyle}
                  cursor={{ fill: "rgba(255,255,255,0.04)" }}
                />
                <Bar dataKey="total" radius={[4, 4, 0, 0]} maxBarSize={44}>
                  {summary.monthlyComparison.map((entry) => (
                    <Cell
                      key={entry.month}
                      fill={entry.month === summary.selectedMonth ? "url(#barSilver)" : "#232326"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top establishments */}
      <div className="card mt-6 p-7">
        <h2 className="mb-5 text-xs uppercase tracking-wider text-[var(--ink-3)]">Principais estabelecimentos</h2>
        <div style={{ height: Math.max(220, summary.byEstablishment.length * 40) }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={summary.byEstablishment} layout="vertical" margin={{ left: 8 }}>
              <defs>
                <linearGradient id="barSilverH" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#8f8f94" />
                  <stop offset="100%" stopColor="#e6e6e5" />
                </linearGradient>
              </defs>
              <CartesianGrid horizontal={false} stroke="rgba(255,255,255,0.08)" />
              <XAxis
                type="number"
                tick={{ fontSize: 11, fill: "#6f6f73" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => currency.format(v).replace(",00", "")}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 12, fill: "#a8a8ac" }}
                axisLine={false}
                tickLine={false}
                width={150}
              />
              <Tooltip
                formatter={(value, _name, item) => [
                  currency.format(Number(value)),
                  `${(item.payload as { count: number }).count} compra(s)`,
                ]}
                contentStyle={tooltipStyle}
                cursor={{ fill: "rgba(255,255,255,0.04)" }}
              />
              <Bar dataKey="total" fill="url(#barSilverH)" radius={[0, 4, 4, 0]} maxBarSize={16} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
