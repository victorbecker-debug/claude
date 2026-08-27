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
      <h1 className="serif text-[28px] font-medium text-[var(--ink)]">Importar extrato ou fatura</h1>
      <p className="mt-3 text-sm leading-relaxed text-[var(--ink-2)]">
        Exporte o extrato da conta ou a fatura do cartão no site do seu banco (formato CSV ou OFX) e envie aqui.
        As transações são categorizadas automaticamente por palavra-chave do estabelecimento.
      </p>

      <form onSubmit={handleUpload} className="mt-8 space-y-6">
        <div>
          <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-[var(--ink-3)]">
            Conta ou cartão
          </label>
          <div className="flex gap-2.5">
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="field w-full outline-none"
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
              className="btn-secondary shrink-0 px-4 py-2.5 text-sm font-semibold"
            >
              + Nova
            </button>
          </div>
        </div>

        {showNewAccount && (
          <div className="card space-y-4 p-5">
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-[var(--ink-3)]">
                Apelido
              </label>
              <input
                required
                value={newAccount.name}
                onChange={(e) => setNewAccount({ ...newAccount, name: e.target.value })}
                placeholder="Ex: Cartão principal"
                className="field w-full outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-[var(--ink-3)]">
                Banco
              </label>
              <input
                required
                value={newAccount.bankName}
                onChange={(e) => setNewAccount({ ...newAccount, bankName: e.target.value })}
                placeholder="Ex: Nubank"
                className="field w-full outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-[var(--ink-3)]">
                Tipo
              </label>
              <select
                value={newAccount.type}
                onChange={(e) => setNewAccount({ ...newAccount, type: e.target.value as "CHECKING" })}
                className="field w-full outline-none"
              >
                <option value="CHECKING">Conta corrente</option>
                <option value="CREDIT_CARD">Cartão de crédito</option>
              </select>
            </div>
            <button onClick={handleCreateAccount} className="btn-primary px-4 py-2 text-sm font-bold">
              Salvar conta
            </button>
          </div>
        )}

        <div>
          <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-[var(--ink-3)]">
            Arquivo (CSV ou OFX)
          </label>
          <label
            className="dropzone flex cursor-pointer flex-col items-center rounded-[14px] border-[1.5px] border-dashed px-6 py-10 text-center"
            style={{ borderColor: "var(--hairline-strong)", background: "var(--panel-2)" }}
          >
            <svg
              width="30"
              height="30"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#c7c7cb"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mb-3.5"
            >
              <path d="M7 18a4 4 0 0 1-1-7.874A5 5 0 0 1 16.9 9.02 4.5 4.5 0 0 1 16.5 18H7Z" />
              <path d="M12 11v7" />
              <path d="M9.3 13.6 12 11l2.7 2.6" />
            </svg>
            <span className="mb-1 text-[13.5px] text-[var(--ink)]">
              {file ? file.name : "Nenhum arquivo selecionado"}
            </span>
            <span className="text-xs text-[var(--ink-3)]">Arraste um arquivo ou clique para selecionar</span>
            <input
              required
              type="file"
              accept=".csv,.ofx,text/csv"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="hidden"
            />
          </label>
        </div>

        <button
          type="submit"
          disabled={!file || !accountId || status.kind === "loading"}
          className="btn-primary px-7 py-3.5 text-sm font-bold"
        >
          {status.kind === "loading" ? "Importando…" : "Importar"}
        </button>
      </form>

      {status.kind === "success" && (
        <div
          className="mt-6 border-t pt-5"
          style={{ borderColor: "var(--hairline)" }}
        >
          <div className="flex items-center gap-2.5 text-sm" style={{ color: "#7fbf8f" }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6 9 17l-5-5" />
            </svg>
            {status.message}
          </div>
        </div>
      )}
      {status.kind === "error" && (
        <p className="mt-6 rounded-md px-3 py-2.5 text-sm" style={{ background: "rgba(224,102,95,0.1)", color: "#e0665f" }}>
          {status.message}
        </p>
      )}
    </div>
  );
}
