import type { RawTransaction } from "@/lib/datasources/types";

function extractTag(block: string, tag: string): string | undefined {
  const match = block.match(new RegExp(`<${tag}>\\s*([^\\r\\n<]+)`, "i"));
  return match?.[1]?.trim();
}

// OFX dates look like YYYYMMDDHHMMSS[-3:BRT] or just YYYYMMDD.
function parseOfxDate(raw: string): Date {
  const digits = raw.slice(0, 8);
  const year = Number(digits.slice(0, 4));
  const month = Number(digits.slice(4, 6));
  const day = Number(digits.slice(6, 8));
  return new Date(year, month - 1, day);
}

// Parses the <STMTTRN> (statement transaction) blocks out of a standard OFX
// export, the format most Brazilian banks offer for statements/invoices.
// OFX is SGML-like, often without closing tags for leaf elements, so this
// parses block-by-block with regexes rather than a strict XML parser.
export function parseOfx(fileContent: string): RawTransaction[] {
  const transactions: RawTransaction[] = [];
  const blocks = fileContent.match(/<STMTTRN>[\s\S]*?<\/STMTTRN>/gi) ?? [];

  for (const block of blocks) {
    const dtposted = extractTag(block, "DTPOSTED");
    const trnamt = extractTag(block, "TRNAMT");
    const memo = extractTag(block, "MEMO") ?? extractTag(block, "NAME");

    if (!dtposted || !trnamt || !memo) continue;

    const date = parseOfxDate(dtposted);
    const amount = parseFloat(trnamt);
    if (isNaN(date.getTime()) || isNaN(amount)) continue;

    transactions.push({ date, description: memo, amount });
  }

  return transactions;
}
