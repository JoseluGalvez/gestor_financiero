import type { OHLCV } from './financial-technical';

export const STOOQ_BASE_URL = 'https://stooq.com/q/d/l/';

export type StooqInterval = 'd' | 'w' | 'm';

export type StooqFetchOptions = {
  interval?: StooqInterval;
  from?: string;
  to?: string;
  timeoutMs?: number;
};

export const STOOQ_INDEX_SYMBOLS: Record<string, string> = {
  '^GSPC': '^spx',
  '^IXIC': '^ixic',
  '^DJI': '^dji',
  '^NDX': '^ndx',
  '^IBEX': '^ibex',
  '^GDAXI': '^dax',
  '^FTSE': '^ukx',
  '^N225': '^nkx',
  '^STOXX50E': '^stoxx50',
  '^RUT': '^rut',
  '^VIX': '^vix',
};

export function normalizeStooqSymbol(symbol: string): string {
  const trimmed = symbol.trim();
  if (trimmed.startsWith('^')) {
    return STOOQ_INDEX_SYMBOLS[trimmed.toUpperCase()] ?? trimmed.toLowerCase();
  }
  if (trimmed.includes('.')) return trimmed.toLowerCase();
  return `${trimmed.toLowerCase()}.us`;
}

export function buildStooqUrl(symbol: string, opts: StooqFetchOptions = {}): string {
  const params = new URLSearchParams();
  params.set('s', normalizeStooqSymbol(symbol));
  params.set('i', opts.interval ?? 'd');
  const from = opts.from?.replace(/-/g, '');
  const to = opts.to?.replace(/-/g, '');
  if (from && /^\d{8}$/.test(from)) params.set('d1', from);
  if (to && /^\d{8}$/.test(to)) params.set('d2', to);
  return `${STOOQ_BASE_URL}?${params.toString()}`;
}

export type StooqParseResult = {
  rows: OHLCV[];
  skipped: number;
};

function parseNumberOrNull(value: string | undefined): number | null {
  if (value === undefined || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function parseStooqCsv(csv: string): StooqParseResult {
  const trimmed = csv.trim();
  if (!trimmed) return { rows: [], skipped: 0 };
  const lines = trimmed.split(/\r?\n/);
  const header = lines[0].trim().toLowerCase();
  if (!header.startsWith('date')) {
    const lower = csv.toLowerCase();
    if (lower.includes('no data') || lower.includes('exceeded')) {
      return { rows: [], skipped: 0 };
    }
    if (lower.includes('<html') || lower.includes('<!doctype')) {
      throw new Error('Stooq: bot challenge (PoW) — reintentar más tarde o usar alternativa (Alpha Vantage)');
    }
    throw new Error('Stooq CSV: formato no reconocido (cabecera esperada: Date,Open,High,Low,Close,Volume)');
  }
  const rows: OHLCV[] = [];
  let skipped = 0;
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const parts = line.split(',');
    if (parts.length < 5) {
      skipped++;
      continue;
    }
    const date = parts[0];
    const open = parseNumberOrNull(parts[1]);
    const high = parseNumberOrNull(parts[2]);
    const low = parseNumberOrNull(parts[3]);
    const close = parseNumberOrNull(parts[4]);
    if (open === null || high === null || low === null || close === null) {
      skipped++;
      continue;
    }
    const volume = parseNumberOrNull(parts[5]);
    rows.push({ date, open, high, low, close, volume: volume ?? undefined });
  }
  rows.sort((a, b) => a.date.localeCompare(b.date));
  return { rows, skipped };
}

async function fetchWithTimeout(url: string, timeoutMs = 20000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { signal: controller.signal, headers: { Accept: 'text/csv' } });
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchStooqDaily(
  symbol: string,
  opts: StooqFetchOptions = {},
): Promise<OHLCV[]> {
  const url = buildStooqUrl(symbol, opts);
  const res = await fetchWithTimeout(url, opts.timeoutMs ?? 20000);
  if (!res.ok) throw new Error(`Stooq ${symbol}: ${res.status} ${res.statusText}`);
  const text = await res.text();
  const { rows } = parseStooqCsv(text);
  if (rows.length === 0) {
    throw new Error(`Stooq ${symbol}: sin datos para el periodo solicitado`);
  }
  return rows;
}
