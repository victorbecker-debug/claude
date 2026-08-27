import type { DataSource, RawTransaction } from "@/lib/datasources/types";
import { parseCsv } from "@/lib/parsers/csv";
import { parseOfx } from "@/lib/parsers/ofx";

export interface ManualImportInput {
  filename: string;
  content: string;
}

// The only DataSource implementation today: the user exports a statement or
// invoice from their bank/card website and uploads it here. A future
// Open Finance aggregator (Pluggy/Belvo) integration would implement the
// same DataSource interface and could replace or complement this one
// without changes to categorization, geocoding, or the dashboards.
export const manualImportSource: DataSource = {
  name: "manual-import",
  async fetchTransactions(input: unknown): Promise<RawTransaction[]> {
    const { filename, content } = input as ManualImportInput;
    const format = detectFormat(filename, content);
    if (format === "OFX") return parseOfx(content);
    return parseCsv(content).transactions;
  },
};

export function detectFormat(filename: string, content: string): "CSV" | "OFX" {
  if (filename.toLowerCase().endsWith(".ofx") || content.includes("<OFX>")) return "OFX";
  return "CSV";
}
