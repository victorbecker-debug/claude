"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import type { MapPoint } from "@/components/SpendMap";

const SpendMap = dynamic(() => import("@/components/SpendMap").then((m) => m.SpendMap), {
  ssr: false,
  loading: () => <p className="p-4 text-sm text-foreground/60">Carregando mapa…</p>,
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
      <h1 className="text-2xl font-semibold tracking-tight">Mapa de gastos</h1>
      <p className="mt-2 text-sm text-foreground/70">
        Localização aproximada dos estabelecimentos físicos, geocodificada pelo nome/cidade informado no
        extrato — não é o ponto exato da compra. Compras online não têm local físico e aparecem em{" "}
        <a href="/compras-online" className="underline">
          Compras Online
        </a>
        .
      </p>

      {points && points.length === 0 && (
        <p className="mt-4 text-sm text-foreground/60">
          Nenhum estabelecimento geocodificado ainda. A geocodificação roda em segundo plano após cada
          importação (respeitando o limite de 1 requisição/segundo do serviço gratuito) — pode levar alguns
          minutos para extratos grandes.
        </p>
      )}

      <div className="mt-4 h-[70vh] overflow-hidden rounded-lg border border-black/10 dark:border-white/10">
        {points && <SpendMap points={points} />}
      </div>
    </div>
  );
}
