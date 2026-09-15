export const EXCHANGERATES_API_BASE = 'https://api.exchangeratesapi.io/v1';

export type ExchangeRatesFetchOptions = {
  base?: string;
  symbols?: string[];
  timeoutMs?: number;
};

export type ExchangeRatesLatest = {
  success: boolean;
  base: string;
  date: string;
  rates: Record<string, number>;
};

export type ExchangeRatesFluctuation = {
  success: boolean;
  base: string;
  start_date: string;
  end_date: string;
  rates: Record<string, { start_rate: number; end_rate: number; change: number; change_pct: number }>;
};

export type ExchangeRatesTimeseries = {
  success: boolean;
  base: string;
  start_date: string;
  end_date: string;
  rates: Record<string, Record<string, number>>;
};

const CURRENCY_RE = /^[A-Z]{3}$/;

function parseNumberOrNull(value: unknown): number | null {
  if (value === undefined || value === null) return null;
  const n = typeof value === 'number' ? value : parseFloat(String(value));
  return Number.isFinite(n) ? n : null;
}

function cleanRates(rates: Record<string, unknown> | undefined): Record<string, number> {
  const out: Record<string, number> = {};
  if (!rates) return out;
  for (const [currency, rawRate] of Object.entries(rates)) {
    const code = currency.toUpperCase();
    if (!CURRENCY_RE.test(code)) continue;
    const rate = typeof rawRate === 'number' ? rawRate : parseFloat(String(rawRate));
    if (!Number.isFinite(rate) || rate <= 0) continue;
    out[code] = rate;
  }
  return out;
}

async function fetchWithTimeout(url: string, timeoutMs = 12000): Promise<Response> {
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

export function normalizeLatestResponse(raw: ExchangeRatesLatest): ExchangeRatesLatest {
  return {
    success: raw.success !== false,
    base: (raw.base ?? 'EUR').toUpperCase(),
    date: raw.date ?? '',
    rates: cleanRates(raw.rates as Record<string, unknown>),
  };
}

export function normalizeFluctuationResponse(raw: ExchangeRatesFluctuation): ExchangeRatesFluctuation {
  const cleaned: ExchangeRatesFluctuation['rates'] = {};
  if (raw.rates) {
    for (const [currency, data] of Object.entries(raw.rates)) {
      const code = currency.toUpperCase();
      if (!CURRENCY_RE.test(code)) continue;
      cleaned[code] = {
        start_rate: parseNumberOrNull(data.start_rate) ?? 0,
        end_rate: parseNumberOrNull(data.end_rate) ?? 0,
        change: parseNumberOrNull(data.change) ?? 0,
        change_pct: parseNumberOrNull(data.change_pct) ?? 0,
      };
    }
  }
  return {
    success: raw.success !== false,
    base: (raw.base ?? 'EUR').toUpperCase(),
    start_date: raw.start_date ?? '',
    end_date: raw.end_date ?? '',
    rates: cleaned,
  };
}

export function normalizeTimeseriesResponse(raw: ExchangeRatesTimeseries): ExchangeRatesTimeseries {
  const cleaned: Record<string, Record<string, number>> = {};
  if (raw.rates) {
    for (const [date, rates] of Object.entries(raw.rates)) {
      cleaned[date] = cleanRates(rates as Record<string, unknown>);
    }
  }
  return {
    success: raw.success !== false,
    base: (raw.base ?? 'EUR').toUpperCase(),
    start_date: raw.start_date ?? '',
    end_date: raw.end_date ?? '',
    rates: cleaned,
  };
}

export async function fetchLatestRates(
  apiKey: string,
  opts: ExchangeRatesFetchOptions = {},
): Promise<ExchangeRatesLatest> {
  if (!apiKey) throw new Error('ExchangeRates: API key requerida');
  const base = (opts.base ?? 'EUR').toUpperCase();
  const params = new URLSearchParams({ access_key: apiKey, base });
  if (opts.symbols?.length) {
    params.set('symbols', opts.symbols.map((s) => s.toUpperCase()).join(','));
  }
  const url = `${EXCHANGERATES_API_BASE}/latest?${params.toString()}`;
  const res = await fetchWithTimeout(url, opts.timeoutMs ?? 12000);
  if (!res.ok) throw new Error(`ExchangeRates latest: ${res.status} ${res.statusText}`);
  const raw = (await res.json()) as ExchangeRatesLatest;
  return normalizeLatestResponse(raw);
}

export async function fetchFluctuation(
  apiKey: string,
  startDate: string,
  endDate: string,
  opts: ExchangeRatesFetchOptions = {},
): Promise<ExchangeRatesFluctuation> {
  if (!apiKey) throw new Error('ExchangeRates: API key requerida');
  const base = (opts.base ?? 'EUR').toUpperCase();
  const params = new URLSearchParams({
    access_key: apiKey,
    base,
    start_date: startDate,
    end_date: endDate,
  });
  if (opts.symbols?.length) {
    params.set('symbols', opts.symbols.map((s) => s.toUpperCase()).join(','));
  }
  const url = `${EXCHANGERATES_API_BASE}/fluctuation?${params.toString()}`;
  const res = await fetchWithTimeout(url, opts.timeoutMs ?? 15000);
  if (!res.ok) throw new Error(`ExchangeRates fluctuation: ${res.status} ${res.statusText}`);
  const raw = (await res.json()) as ExchangeRatesFluctuation;
  return normalizeFluctuationResponse(raw);
}

export async function fetchTimeseries(
  apiKey: string,
  startDate: string,
  endDate: string,
  opts: ExchangeRatesFetchOptions = {},
): Promise<ExchangeRatesTimeseries> {
  if (!apiKey) throw new Error('ExchangeRates: API key requerida');
  const base = (opts.base ?? 'EUR').toUpperCase();
  const params = new URLSearchParams({
    access_key: apiKey,
    base,
    start_date: startDate,
    end_date: endDate,
  });
  if (opts.symbols?.length) {
    params.set('symbols', opts.symbols.map((s) => s.toUpperCase()).join(','));
  }
  const url = `${EXCHANGERATES_API_BASE}/timeseries?${params.toString()}`;
  const res = await fetchWithTimeout(url, opts.timeoutMs ?? 20000);
  if (!res.ok) throw new Error(`ExchangeRates timeseries: ${res.status} ${res.statusText}`);
  const raw = (await res.json()) as ExchangeRatesTimeseries;
  return normalizeTimeseriesResponse(raw);
}
