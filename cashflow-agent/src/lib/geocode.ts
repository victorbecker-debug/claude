import { prisma } from "@/lib/prisma";

// Bank/card statements don't carry GPS coordinates — only a merchant name
// and sometimes a city. This geocodes that best-effort via Nominatim
// (OpenStreetMap's free geocoder), which is why the map shows the
// establishment's approximate location, not the exact place of purchase.
const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
const USER_AGENT = "cashflow-agent/0.1 (personal cash-flow dashboard)";
// Nominatim's usage policy caps free usage at 1 request/second.
const RATE_LIMIT_MS = 1100;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function geocodeQuery(query: string): Promise<{ lat: number; lon: number } | null> {
  const url = `${NOMINATIM_URL}?format=json&limit=1&q=${encodeURIComponent(query)}`;
  const res = await fetch(url, {
    headers: { "User-Agent": USER_AGENT, "Accept-Language": "pt-BR" },
  });
  if (!res.ok) return null;
  const data = (await res.json()) as Array<{ lat: string; lon: string }>;
  if (!data.length) return null;
  return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
}

// Geocodes up to `limit` merchants that haven't been attempted yet. Online
// merchants are skipped since they have no physical location. Safe to call
// repeatedly (e.g. after every import) — already-attempted merchants
// (successful or not) are not retried.
export async function geocodePendingMerchants(limit = 20): Promise<{ geocoded: number; failed: number }> {
  const merchants = await prisma.merchant.findMany({
    where: { isOnline: false, geocodedAt: null },
    take: limit,
  });

  let geocoded = 0;
  let failed = 0;

  for (const merchant of merchants) {
    const query = [merchant.displayName, merchant.city, "Brasil"].filter(Boolean).join(", ");
    try {
      const result = await geocodeQuery(query);
      if (result) {
        await prisma.merchant.update({
          where: { id: merchant.id },
          data: { latitude: result.lat, longitude: result.lon, geocodedAt: new Date() },
        });
        geocoded++;
      } else {
        await prisma.merchant.update({ where: { id: merchant.id }, data: { geocodedAt: new Date() } });
        failed++;
      }
    } catch (err) {
      console.error(`Falha ao geocodificar "${merchant.displayName}":`, err);
      failed++;
    }
    await sleep(RATE_LIMIT_MS);
  }

  return { geocoded, failed };
}
