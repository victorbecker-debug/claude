"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import type { MapPoint } from "@/components/SpendMap";

const SpendMap = dynamic(() => import("@/components/SpendMap").then((m) => m.SpendMap), {
  ssr: false,
  loading: () => <p className="p-4 text-sm text-[var(--ink-3)]">Carregando mapa…</p>,
});

export default function MapaPage() {
  const [points, setPoints] = useState<MapPoint[] | null>(null);

  useEffect(() => {
    fetch("/api/merchants/map")
      .then((r) => r.json())
      .then(setPoints);
  }, []);

  return (
    <div>
      <h1 className="serif text-[28px] font-medium text-[var(--ink)]">Mapa de gastos</h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--ink-2)]">
        Localização aproximada dos estabelecimentos físicos, geocodificada pelo nome/cidade informado no
        extrato — não é o ponto exato da compra. Compras online não têm local físico e aparecem em{" "}
        <a href="/compras-online" className="underline">
          Compras Online
        </a>
        .
      </p>

      {points && points.length === 0 && (
        <p className="mt-4 text-sm text-[var(--ink-3)]">
          Nenhum estabelecimento geocodificado ainda. A geocodificação roda em segundo plano após cada
          importação (respeitando o limite de 1 requisição/segundo do serviço gratuito) — pode levar alguns
          minutos para extratos grandes.
        </p>
      )}

      <div
        className="card mt-4 h-[70vh] overflow-hidden"
        style={{ borderColor: "var(--hairline-strong)", boxShadow: "0 24px 48px -28px rgba(0,0,0,0.8)" }}
      >
        {points && <SpendMap points={points} />}
      </div>
    </div>
  );
}
