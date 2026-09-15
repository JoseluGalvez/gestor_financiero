import type { OHLCV } from './financial-technical';

export const MARKETSTACK_BASE_URL = 'http://api.marketstack.com/v1';

export type MarketstackInterval = 'intraday' | 'eod' | 'daily' | 'monthly';

export type MarketstackFetchOptions = {
  interval?: MarketstackInterval;
  from?: string;
  to?: string;
  limit?: number;
  timeoutMs?: number;
};

export type MarketstackQuote = {
  symbol: string;
  name: string;
  price: number;
  change: number | null;
  changePct: number | null;
  volume: number | null;
  exchange: string | null;
  lastTradeTime: string | null;
};

type MarketstackEodResponse = {
  data?: {
    eod?: Array<{
      date?: string;
      open?: number;
      high?: number;
      low?: number;
      close?: number;
      volume?: number;
      symbol?: string;
    }>;
    symbol?: string;
  };
  error?: { code?: string; message?: string };
};

type MarketstackIntradayResponse = {
  data?: {
    intraday?: Array<{
      date?: string;
      open?: number;
      high?: number;
      low?: number;
      close?: number;
      volume?: number;
      symbol?: string;
    }>;
    symbol?: string;
  };
  error?: { code?: string; message?: string };
};

type MarketstackTickerResponse = {
  data?: {
    name?: string;
    symbol?: string;
    exchange?: string;
    last?: number;
    change?: number;
    change_pct?: number;
    volume?: number;
  };
  error?: { code?: string; message?: string };
};

function parseNumberOrNull(value: unknown): number | null {
  if (value === undefined || value === null) return null;
  const n = typeof value === 'number' ? value : parseFloat(String(value));
  return Number.isFinite(n) ? n : null;
}

function parseDate(value: unknown): string {
  if (!value) return '';
  const s = String(value);
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const d = new Date(s);
  return isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10);
}

function buildAuthUrl(endpoint: string, params: Record<string, string>): string {
  const url = new URL(`${MARKETSTACK_BASE_URL}${endpoint}`);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }
  return url.toString();
}

export function normalizeEodCandles(
  data: MarketstackEodResponse['data'],
  symbol: string,
): OHLCV[] {
  const eod = data?.eod;
  if (!Array.isArray(eod)) return [];
  const rows: OHLCV[] = [];
  for (const bar of eod) {
    const date = parseDate(bar.date);
    const open = parseNumberOrNull(bar.open);
    const high = parseNumberOrNull(bar.high);
    const low = parseNumberOrNull(bar.low);
    const close = parseNumberOrNull(bar.close);
    if (!date || open === null || high === null || low === null || close === null) continue;
    rows.push({
      date,
      open,
      high,
      low,
      close,
      volume: parseNumberOrNull(bar.volume) ?? undefined,
    });
  }
  rows.sort((a, b) => a.date.localeCompare(b.date));
  return rows;
}

export function normalizeIntradayCandles(
  data: MarketstackIntradayResponse['data'],
  symbol: string,
): OHLCV[] {
  const intraday = data?.intraday;
  if (!Array.isArray(intraday)) return [];
  const rows: OHLCV[] = [];
  for (const bar of intraday) {
    const rawDate = bar.date;
    if (!rawDate) continue;
    const dateStr = String(rawDate);
    const datePart = dateStr.slice(0, 10);
    const open = parseNumberOrNull(bar.open);
    const high = parseNumberOrNull(bar.high);
    const low = parseNumberOrNull(bar.low);
    const close = parseNumberOrNull(bar.close);
    if (open === null || high === null || low === null || close === null) continue;
    rows.push({
      date: datePart,
      open,
      high,
      low,
      close,
      volume: parseNumberOrNull(bar.volume) ?? undefined,
    });
  }
  rows.sort((a, b) => a.date.localeCompare(b.date));
  return rows;
}

export function normalizeTickerQuote(
  data: MarketstackTickerResponse['data'],
): MarketstackQuote | null {
  if (!data) return null;
  return {
    symbol: data.symbol ?? '',
    name: data.name ?? data.symbol ?? '',
    price: parseNumberOrNull(data.last) ?? 0,
    change: parseNumberOrNull(data.change),
    changePct: parseNumberOrNull(data.change_pct),
    volume: parseNumberOrNull(data.volume),
    exchange: data.exchange ?? null,
    lastTradeTime: null,
  };
}

async function fetchWithTimeout(url: string, timeoutMs = 15000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchMarketstackEod(
  symbol: string,
  apiKey: string,
  opts: MarketstackFetchOptions = {},
): Promise<OHLCV[]> {
  if (!apiKey) throw new Error('Marketstack: API key requerida');
  const params: Record<string, string> = {
    access_key: apiKey,
    symbols: symbol,
  };
  if (opts.from) params.date_from = opts.from;
  if (opts.to) params.date_to = opts.to;
  if (opts.limit !== undefined) params.limit = String(opts.limit);

  const url = buildAuthUrl('/eod', params);
  const res = await fetchWithTimeout(url, opts.timeoutMs ?? 15000);
  if (!res.ok) throw new Error(`Marketstack EOD ${symbol}: ${res.status} ${res.statusText}`);
  const raw = (await res.json()) as MarketstackEodResponse;
  if (raw.error) throw new Error(`Marketstack EOD ${symbol}: ${raw.error.message ?? raw.error.code ?? 'error'}`);
  return normalizeEodCandles(raw.data, symbol);
}

export async function fetchMarketstackIntraday(
  symbol: string,
  apiKey: string,
  opts: MarketstackFetchOptions = {},
): Promise<OHLCV[]> {
  if (!apiKey) throw new Error('Marketstack: API key requerida');
  const params: Record<string, string> = {
    access_key: apiKey,
    symbols: symbol,
  };
  if (opts.from) params.date_from = opts.from;
  if (opts.to) params.date_to = opts.to;
  if (opts.limit !== undefined) params.limit = String(opts.limit);

  const url = buildAuthUrl('/intraday', params);
  const res = await fetchWithTimeout(url, opts.timeoutMs ?? 15000);
  if (!res.ok) throw new Error(`Marketstack intraday ${symbol}: ${res.status} ${res.statusText}`);
  const raw = (await res.json()) as MarketstackIntradayResponse;
  if (raw.error) throw new Error(`Marketstack intraday ${symbol}: ${raw.error.message ?? raw.error.code ?? 'error'}`);
  return normalizeIntradayCandles(raw.data, symbol);
}

export async function fetchMarketstackTicker(
  symbol: string,
  apiKey: string,
  timeoutMs = 15000,
): Promise<MarketstackQuote | null> {
  if (!apiKey) throw new Error('Marketstack: API key requerida');
  const params: Record<string, string> = {
    access_key: apiKey,
  };
  const url = buildAuthUrl(`/tickers/${encodeURIComponent(symbol)}`, params);
  const res = await fetchWithTimeout(url, timeoutMs);
  if (!res.ok) throw new Error(`Marketstack ticker ${symbol}: ${res.status} ${res.statusText}`);
  const raw = (await res.json()) as MarketstackTickerResponse;
  if (raw.error) throw new Error(`Marketstack ticker ${symbol}: ${raw.error.message ?? raw.error.code ?? 'error'}`);
  return normalizeTickerQuote(raw.data);
}
