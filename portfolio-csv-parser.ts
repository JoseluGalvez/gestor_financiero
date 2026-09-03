import type {
  PlatformAdapter,
  RawPosition,
  RawTransaction,
  ImportResult,
  ImportError,
  PositionColumns,
  TransactionColumns,
  DEFAULT_POSITION_COLUMNS,
  DEFAULT_TRANSACTION_COLUMNS,
  PlatformId,
  AssetClass,
  TransactionType,
} from "./portfolio-types";

export function parseCSV(text: string): Record<string, unknown>[] {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];

  const headers = parseCSVLine(lines[0]);
  const rows: Record<string, unknown>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const values = parseCSVLine(line);
    if (values.length !== headers.length) continue;
    const row: Record<string, unknown> = {};
    headers.forEach((header, idx) => {
      row[header.trim()] = values[idx]?.trim() ?? "";
    });
    rows.push(row);
  }
  return rows;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

export async function parseXLSX(file: File): Promise<Record<string, unknown>[]> {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = await import("xlsx").then((XLSX) => XLSX.read(arrayBuffer, { type: "array" }));
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const json = XLSX.utils.sheet_to_json(worksheet, { defval: "", raw: false });
  return json as Record<string, unknown>[];
}

export function detectPlatform(headers: string[], adapters: PlatformAdapter[]): PlatformAdapter | null {
  for (const adapter of adapters) {
    if (adapter.detectFormat(headers)) return adapter;
  }
  return null;
}

export function findColumn(headers: string[], candidates: string[]): string | null {
  const normalizedHeaders = headers.map((h) => h.toLowerCase().trim());
  for (const candidate of candidates) {
    const idx = normalizedHeaders.indexOf(candidate.toLowerCase().trim());
    if (idx >= 0) return headers[idx];
  }
  return null;
}

export function parseNumber(value: unknown, locale = "es-ES"): number {
  if (value === null || value === undefined || value === "") return NaN;
  if (typeof value === "number") return value;
  const str = String(value).trim();
  if (!str) return NaN;
  const cleaned = str
    .replace(/[€$£¥\s]/g, "")
    .replace(/\.(?=\d{3}(?:[.,]|$))/g, "")
    .replace(/,/g, ".")
    .replace(/%/g, "");
  const num = parseFloat(cleaned);
  return isNaN(num) ? NaN : num;
}

export function parseDate(value: unknown): string | null {
  if (!value) return null;
  const str = String(value).trim();
  if (!str) return null;
  const formats = [
    /^(\d{4})-(\d{2})-(\d{2})$/,
    /^(\d{2})\/(\d{2})\/(\d{4})$/,
    /^(\d{2})\.(\d{2})\.(\d{4})$/,
    /^(\d{2})-(\d{2})-(\d{4})$/,
    /^(\d{4})\/(\d{2})\/(\d{2})$/,
  ];
  for (const fmt of formats) {
    const match = str.match(fmt);
    if (match) {
      if (fmt.source.startsWith("^(\\d{4})")) {
        return `${match[1]}-${match[2]}-${match[3]}`;
      }
      return `${match[3]}-${match[2]}-${match[1]}`;
    }
  }
  const parsed = new Date(str);
  return isNaN(parsed.getTime()) ? null : parsed.toISOString().split("T")[0];
}

export function mapTransactionType(raw: string, mapping: Record<string, TransactionType>): TransactionType {
  const normalized = String(raw).toLowerCase().trim();
  return mapping[normalized] ?? "other";
}

export function buildImportResult(
  platform: PlatformId,
  accountId: string | undefined,
  positions: RawPosition[],
  transactions: RawTransaction[],
  errors: ImportError[],
  warnings: string[]
): ImportResult {
  return {
    success: errors.filter((e) => e.severity === "error").length === 0,
    positions,
    transactions,
    errors,
    warnings,
    platform,
    accountId,
    importDate: Date.now(),
  };
}

export function validateRow(
  row: Record<string, unknown>,
  rowNum: number,
  requiredFields: string[]
): ImportError[] {
  const errors: ImportError[] = [];
  for (const field of requiredFields) {
    const value = row[field];
    if (value === undefined || value === null || String(value).trim() === "") {
      errors.push({
        row: rowNum,
        field,
        message: `Campo requerido '${field}' está vacío`,
        severity: "error",
      });
    }
  }
  return errors;
}

export function normalizeCurrencyInput(value: string): string {
  return value.toUpperCase().trim().replace(/[^A-Z0-9]/g, "");
}

export function normalizeSymbolInput(value: string): string {
  return value.toUpperCase().trim().replace(/[^A-Z0-9\.\-]/g, "");
}

export function inferAssetClass(symbol: string, name?: string, isin?: string): AssetClass {
  const sym = symbol.toUpperCase();
  const nm = (name ?? "").toUpperCase();
  const is = (isin ?? "").toUpperCase();

  if (is.startsWith("IE00") || is.startsWith("US") || is.startsWith("LU") || is.startsWith("FR") || is.startsWith("DE")) {
    if (nm.includes("ETF") || nm.includes("FUND") || nm.includes("ISHARES") || nm.includes("VANGUARD") || nm.includes("AMUNDI")) return "etf";
    if (nm.includes("BOND") || nm.includes("TREASURY") || nm.includes("GOVT")) return "bond";
    return "fund";
  }

  if (["BTC", "ETH", "USDT", "USDC", "BNB", "SOL", "ADA", "XRP", "DOT", "AVAX", "MATIC"].includes(sym)) return "crypto";
  if (sym.endsWith("-USD") || sym.endsWith("-EUR") || sym.endsWith("USDT") || sym.endsWith("USDC")) return "crypto";

  if (nm.includes("OPTION") || nm.includes("FUTURE") || nm.includes("WARRANT") || nm.includes("CERTIFICATE")) return "derivative";

  return "equity";
}

export function createPositionId(platform: PlatformId, accountId: string | undefined, symbol: string): string {
  return `${platform}:${accountId ?? "default"}:${symbol}`.toLowerCase();
}

export function createTransactionId(platform: PlatformId, accountId: string | undefined, date: string, symbol: string, type: TransactionType, seq: number): string {
  return `${platform}:${accountId ?? "default"}:${date}:${symbol}:${type}:${seq}`.toLowerCase();
}

export function groupPositionsBySymbol(positions: RawPosition[]): Map<string, RawPosition[]> {
  const groups = new Map<string, RawPosition[]>();
  for (const pos of positions) {
    const key = `${pos.platform}:${pos.symbol}:${pos.currency}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(pos);
  }
  return groups;
}

export function groupTransactionsBySymbol(transactions: RawTransaction[]): Map<string, RawTransaction[]> {
  const groups = new Map<string, RawTransaction[]>();
  for (const tx of transactions) {
    const key = `${tx.platform}:${tx.symbol}:${tx.currency}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(tx);
  }
  return groups;
}

export function aggregatePositionGroup(group: RawPosition[]): RawPosition {
  if (group.length === 1) return group[0];
  let totalQty = 0;
  let totalCost = 0;
  const first = group[0];
  for (const pos of group) {
    totalQty += pos.quantity;
    totalCost += pos.quantity * pos.averagePrice;
  }
  return {
    ...first,
    quantity: totalQty,
    averagePrice: totalQty > 0 ? totalCost / totalQty : 0,
    currentValue: group.reduce((sum, p) => sum + (p.currentValue ?? 0), 0),
    unrealizedPnl: group.reduce((sum, p) => sum + (p.unrealizedPnl ?? 0), 0),
  };
}

export function detectDelimiter(text: string): string {
  const firstLine = text.split(/\r?\n/)[0];
  const delimiters = [",", ";", "\t", "|"];
  const counts = delimiters.map((d) => ({ d, count: (firstLine.match(new RegExp("\\" + d, "g")) || []).length }));
  counts.sort((a, b) => b.count - a.count);
  return counts[0].count > 0 ? counts[0].d : ",";
}

export function parseCSVWithDelimiter(text: string, delimiter = ","): Record<string, unknown>[] {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const headers = lines[0].split(delimiter).map((h) => h.trim());
  const rows: Record<string, unknown>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const values = line.split(delimiter).map((v) => v.trim());
    if (values.length !== headers.length) continue;
    const row: Record<string, unknown> = {};
    headers.forEach((header, idx) => {
      row[header] = values[idx] ?? "";
    });
    rows.push(row);
  }
  return rows;
}