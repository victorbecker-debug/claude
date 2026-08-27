import Papa from "papaparse";
import type { RawTransaction } from "@/lib/datasources/types";

const DATE_HEADERS = ["data", "date", "dt", "data lancamento", "data do lançamento", "data lançamento"];
const DESCRIPTION_HEADERS = ["descricao", "descrição", "description", "historico", "histórico", "estabelecimento", "lançamento", "lancamento", "memo"];
const AMOUNT_HEADERS = ["valor", "amount", "value", "vlr"];

function normalizeHeader(h: string) {
  return h.trim().toLowerCase();
}

function findColumn(headers: string[], candidates: string[]): string | undefined {
  const normalized = headers.map(normalizeHeader);
  for (const candidate of candidates) {
    const idx = normalized.indexOf(candidate);
    if (idx !== -1) return headers[idx];
  }
  return undefined;
}

// Parses "1.234,56" or "1234,56" or "1234.56" or "-45,90" into a number.
function parseBrazilianNumber(raw: string): number {
  let s = raw.trim().replace(/[^\d,.\-]/g, "");
  const hasComma = s.includes(",");
  const hasDot = s.includes(".");
  if (hasComma && hasDot) {
    // Assume dot is thousands separator, comma is decimal.
    s = s.replace(/\./g, "").replace(",", ".");
  } else if (hasComma) {
    s = s.replace(",", ".");
  }
  return parseFloat(s);
}

function parseDate(raw: string): Date {
  const s = raw.trim();
  // dd/mm/yyyy or dd-mm-yyyy
  const br = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
  if (br) {
    const [, d, m, y] = br;
    return new Date(Number(y), Number(m) - 1, Number(d));
  }
  // yyyy-mm-dd (ISO)
  const iso = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (iso) {
    const [, y, m, d] = iso;
    return new Date(Number(y), Number(m) - 1, Number(d));
  }
  return new Date(s);
}

export interface CsvParseResult {
  transactions: RawTransaction[];
  warnings: string[];
}

// Parses a bank/card CSV export with flexible header detection. Supports
// common Brazilian bank export headers (Data/Descrição/Valor and English
// equivalents), Brazilian number formatting, and dd/mm/yyyy dates.
export function parseCsv(fileContent: string): CsvParseResult {
  const result = Papa.parse<Record<string, string>>(fileContent, {
    header: true,
    skipEmptyLines: true,
  });

  const warnings: string[] = [];
  const headers = result.meta.fields ?? [];

  const dateCol = findColumn(headers, DATE_HEADERS);
  const descCol = findColumn(headers, DESCRIPTION_HEADERS);
  const amountCol = findColumn(headers, AMOUNT_HEADERS);

  if (!dateCol || !descCol || !amountCol) {
    throw new Error(
      `Não foi possível identificar as colunas do CSV. Esperado colunas de data, descrição e valor. Colunas encontradas: ${headers.join(", ")}`
    );
  }

  const transactions: RawTransaction[] = [];
  for (const row of result.data) {
    const rawDate = row[dateCol];
    const rawDesc = row[descCol];
    const rawAmount = row[amountCol];
    if (!rawDate || !rawDesc || rawAmount === undefined || rawAmount === "") continue;

    const date = parseDate(rawDate);
    const amount = parseBrazilianNumber(rawAmount);
    if (isNaN(date.getTime()) || isNaN(amount)) {
      warnings.push(`Linha ignorada (data ou valor inválido): ${JSON.stringify(row)}`);
      continue;
    }

    transactions.push({ date, description: rawDesc.trim(), amount });
  }

  return { transactions, warnings };
}
