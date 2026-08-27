"use client";

import { MapContainer, TileLayer, CircleMarker, Tooltip as LeafletTooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";

export interface MapPoint {
  id: string;
  name: string;
  city: string | null;
  lat: number;
  lng: number;
  total: number;
  count: number;
}

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const BRAZIL_CENTER: [number, number] = [-14.235, -51.9253];

export function SpendMap({ points }: { points: MapPoint[] }) {
  const center: [number, number] = points.length
    ? [points.reduce((s, p) => s + p.lat, 0) / points.length, points.reduce((s, p) => s + p.lng, 0) / points.length]
    : BRAZIL_CENTER;

  const maxTotal = Math.max(...points.map((p) => p.total), 1);

  return (
    <MapContainer center={center} zoom={points.length ? 11 : 4} style={{ height: "100%", width: "100%", background: "#141416" }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />
      {points.map((p) => (
        <CircleMarker
          key={p.id}
          center={[p.lat, p.lng]}
          radius={8 + (p.total / maxTotal) * 20}
          pathOptions={{ color: "#c7c7cb", fillColor: "#c7c7cb", fillOpacity: 0.45, weight: 2 }}
        >
          <LeafletTooltip>
            <strong>{p.name}</strong>
            <br />
            {p.city}
            <br />
            {currency.format(p.total)} · {p.count} compra(s)
          </LeafletTooltip>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
