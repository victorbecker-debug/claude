"use client";

import { useEffect, useState } from "react";

interface Account {
  id: string;
  name: string;
  bankName: string;
  type: "CHECKING" | "CREDIT_CARD";
}

export default function UploadPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [accountId, setAccountId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<{ kind: "idle" | "loading" | "success" | "error"; message?: string }>({
    kind: "idle",
  });

  const [showNewAccount, setShowNewAccount] = useState(false);
  const [newAccount, setNewAccount] = useState({ name: "", bankName: "", type: "CHECKING" as const });

  useEffect(() => {
    fetch("/api/accounts")
      .then((res) => res.json())
      .then((data: Account[]) => {
        setAccounts(data);
        if (data.length > 0) setAccountId((prev) => prev || data[0].id);
      });
  }, []);

  async function handleCreateAccount(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newAccount),
    });
    if (res.ok) {
      const created: Account = await res.json();
      setAccounts((prev) => [...prev, created]);
      setAccountId(created.id);
      setShowNewAccount(false);
      setNewAccount({ name: "", bankName: "", type: "CHECKING" });
    }
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !accountId) return;

    setStatus({ kind: "loading" });
    const formData = new FormData();
    formData.append("accountId", accountId);
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        setStatus({ kind: "error", message: data.error ?? "Erro ao importar arquivo." });
        return;
      }
      setStatus({
        kind: "success",
        message: `${data.imported} transações importadas. A geolocalização dos estabelecimentos está sendo processada em segundo plano.`,
      });
      setFile(null);
    } catch {
      setStatus({ kind: "error", message: "Erro de rede ao importar arquivo." });
    }
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-semibold tracking-tight">Importar extrato ou fatura</h1>
      <p className="mt-2 text-sm text-foreground/70">
        Exporte o extrato da conta ou a fatura do cartão no site do seu banco (formato CSV ou OFX) e envie aqui.
        As transações são categorizadas automaticamente por palavra-chave do estabelecimento.
      </p>

      <form onSubmit={handleUpload} className="mt-6 space-y-4">
        <div>
          <label className="block text-sm font-medium">Conta ou cartão</label>
          <div className="mt-1 flex gap-2">
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="w-full rounded-md border border-black/15 bg-transparent px-3 py-2 text-sm dark:border-white/20"
            >
              {accounts.length === 0 && <option value="">Nenhuma conta cadastrada</option>}
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} · {a.bankName} ({a.type === "CHECKING" ? "conta" : "cartão"})
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setShowNewAccount((v) => !v)}
              className="shrink-0 rounded-md border border-black/15 px-3 py-2 text-sm dark:border-white/20"
            >
              + Nova
            </button>
          </div>
        </div>

        {showNewAccount && (
          <div className="space-y-3 rounded-md border border-black/10 p-4 dark:border-white/10">
            <div>
              <label className="block text-sm font-medium">Apelido</label>
              <input
                required
                value={newAccount.name}
                onChange={(e) => setNewAccount({ ...newAccount, name: e.target.value })}
                placeholder="Ex: Cartão principal"
                className="mt-1 w-full rounded-md border border-black/15 bg-transparent px-3 py-2 text-sm dark:border-white/20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Banco</label>
              <input
                required
                value={newAccount.bankName}
                onChange={(e) => setNewAccount({ ...newAccount, bankName: e.target.value })}
                placeholder="Ex: Nubank"
                className="mt-1 w-full rounded-md border border-black/15 bg-transparent px-3 py-2 text-sm dark:border-white/20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Tipo</label>
              <select
                value={newAccount.type}
                onChange={(e) => setNewAccount({ ...newAccount, type: e.target.value as "CHECKING" })}
                className="mt-1 w-full rounded-md border border-black/15 bg-transparent px-3 py-2 text-sm dark:border-white/20"
              >
                <option value="CHECKING">Conta corrente</option>
                <option value="CREDIT_CARD">Cartão de crédito</option>
              </select>
            </div>
            <button
              onClick={handleCreateAccount}
              className="rounded-md bg-foreground px-3 py-1.5 text-sm text-background"
            >
              Salvar conta
            </button>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium">Arquivo (CSV ou OFX)</label>
          <input
            required
            type="file"
            accept=".csv,.ofx,text/csv"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="mt-1 w-full text-sm"
          />
        </div>

        <button
          type="submit"
          disabled={!file || !accountId || status.kind === "loading"}
          className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-50"
        >
          {status.kind === "loading" ? "Importando…" : "Importar"}
        </button>
      </form>

      {status.kind === "success" && (
        <p className="mt-4 rounded-md bg-green-500/10 px-3 py-2 text-sm text-green-700 dark:text-green-400">
          {status.message}
        </p>
      )}
      {status.kind === "error" && (
        <p className="mt-4 rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-400">
          {status.message}
        </p>
      )}
    </div>
  );
}
