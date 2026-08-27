// Merchant normalization + auto-categorization for imported transactions.
//
// Bank/card descriptions are messy (transaction codes, installment counters,
// city/state suffixes, card processor prefixes like "UBER *TRIP"). This
// module turns a raw description into a clean, dedupable merchant name and
// picks a category via keyword matching against CategoryRule.

function stripAccents(s: string): string {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export function foldForMatching(s: string): string {
  return stripAccents(s).toLowerCase();
}

const NOISE_PATTERNS: RegExp[] = [
  /\bparc(?:ela)?\s*\d{1,2}\/\d{1,2}\b/gi, // "PARC 01/03"
  /\b\d{1,2}\/\d{1,2}\b/g, // bare installment counters "01/03"
  /\bcompra\b/gi,
  /\bdebito\b/gi,
  /\bdébito\b/gi,
  /\bcartao\b/gi,
  /\bcartão\b/gi,
  /\d{4,}/g, // long numeric codes / masked card digits
  /\s{2,}/g,
];

const UF_SUFFIX = /\s+(BR|[A-Z]{2})$/;

// Turns "UBER *TRIP HELP.UBER.CО" or "IFOOD *RESTAURANTE XV SAO PAULO BR"
// into a clean display name like "Uber" / "Ifood *restaurante Xv".
export function normalizeMerchantName(rawDescription: string): { displayName: string; normalizedName: string; city?: string } {
  let s = rawDescription.trim();

  // Card-processor entries often look like "MERCHANT *SUFFIX" — keep the
  // part before the asterisk, it's the actual brand name.
  const starIdx = s.indexOf("*");
  if (starIdx > 2) {
    s = s.slice(0, starIdx).trim();
  }

  let city: string | undefined;
  const ufMatch = s.match(UF_SUFFIX);
  if (ufMatch) {
    s = s.slice(0, ufMatch.index).trim();
    // City names in these descriptions are usually 1-2 words right before
    // the state/country code (e.g. "SAO PAULO", "BELO HORIZONTE", "NITEROI").
    // This is a heuristic, not a gazetteer lookup, so it can occasionally
    // grab part of the merchant name for very short merchant names.
    const words = s.split(/\s+/).filter(Boolean);
    const isWordlike = (w: string) => /^[A-Za-zÀ-ÖØ-öø-ÿ]{2,}$/.test(w);
    if (words.length > 2 && isWordlike(words[words.length - 1]) && isWordlike(words[words.length - 2])) {
      city = words.slice(-2).join(" ");
      s = words.slice(0, -2).join(" ");
    } else if (words.length > 1 && isWordlike(words[words.length - 1])) {
      city = words[words.length - 1];
      s = words.slice(0, -1).join(" ");
    }
  }

  for (const pattern of NOISE_PATTERNS) {
    s = s.replace(pattern, " ");
  }
  s = s.trim().replace(/\s{2,}/g, " ");

  const displayName = s
    .split(" ")
    .map((w) => (w.length > 2 ? w[0].toUpperCase() + w.slice(1).toLowerCase() : w.toLowerCase()))
    .join(" ")
    .trim() || rawDescription.trim();

  const normalizedName = foldForMatching(displayName).replace(/[^a-z0-9]+/g, " ").trim();

  return { displayName, normalizedName: normalizedName || foldForMatching(rawDescription), city };
}

const ONLINE_KEYWORDS = [
  "mercado livre",
  "mercadolivre",
  "amazon",
  "shopee",
  "aliexpress",
  "magazine luiza",
  "magalu",
  "americanas",
  "shein",
  "netflix",
  "spotify",
  "disney",
  "hbo",
  "steam",
  "playstation store",
  "google play",
  "app store",
  "apple.com",
  "openai",
  "claude",
];

export function detectIsOnline(rawDescription: string): boolean {
  const folded = foldForMatching(rawDescription);
  return ONLINE_KEYWORDS.some((kw) => folded.includes(kw));
}

export interface CategoryRuleLike {
  keyword: string;
  categoryId: string;
}

// Returns the id of the category whose keyword appears in the raw
// description, or null if nothing matched (caller should fall back to a
// default "Outros" category). Longer keywords are checked first so a
// specific match (e.g. "mercado livre") wins over a shorter, more generic
// one that's also a substring of it (e.g. "mercado").
export function matchCategory(rawDescription: string, rules: CategoryRuleLike[]): string | null {
  const folded = foldForMatching(rawDescription);
  const sorted = [...rules].sort((a, b) => b.keyword.length - a.keyword.length);
  for (const rule of sorted) {
    if (!rule.keyword) continue;
    if (folded.includes(foldForMatching(rule.keyword))) {
      return rule.categoryId;
    }
  }
  return null;
}
