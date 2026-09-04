export const FRANKFURTER_BASE_URL = 'https://api.frankfurter.app';

export type FrankfurterLatest = {
  amount?: number;
  base?: string;
  date?: string;
  rates?: Record<string, number | string>;
};

export type FrankfurterSeries = {
  amount?: number;
  base?: string;
  start_date?: string;
  end_date?: string;
  rates?: Record<string, Record<string, number>>;
};

export type EcbFxSnapshot = {
  base: string;
  date: string;
  rates: Record<string, number>;
};

export type EcbFxSeriesPoint = {
  date: string;
  rates: Record<string, number>;
};

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const CURRENCY_RE = /^[A-Z]{3}$/;

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

function cleanRates(rates: Record<string, number | string> | undefined): Record<string, number> {
  const out: Record<string, number> = {};
  if (!rates) return out;
  for (const [currency, rawRate] of Object.entries(rates)) {
    const code = currency.toUpperCase();
    if (!CURRENCY_RE.test(code)) continue;
    const rate = typeof rawRate === 'number' ? rawRate : parseFloat(rawRate);
    if (!Number.isFinite(rate) || rate <= 0) continue;
    out[code] = rate;
  }
  return out;
}

export function normalizeEcbLatest(raw: FrankfurterLatest): EcbFxSnapshot {
  const base = (raw.base ?? 'EUR').toUpperCase();
  const date = raw.date ?? '';
  if (!DATE_RE.test(date)) {
    throw new Error('FX: fecha de respuesta inválida');
  }
  return { base, date, rates: cleanRates(raw.rates) };
}

export function normalizeEcbSeries(raw: FrankfurterSeries): EcbFxSeriesPoint[] {
  const points: EcbFxSeriesPoint[] = [];
  if (!raw.rates) return points;
  for (const [date, rates] of Object.entries(raw.rates)) {
    if (!DATE_RE.test(date)) continue;
    const cleaned = cleanRates(rates);
    if (Object.keys(cleaned).length === 0) continue;
    points.push({ date, rates: cleaned });
  }
  return points.sort((a, b) => a.date.localeCompare(b.date));
}

export async function fetchLatestEcbRates(
  currencies: readonly string[] = [],
  timeoutMs = 12000,
): Promise<EcbFxSnapshot> {
  const params = new URLSearchParams();
  if (currencies.length > 0) params.set('to', currencies.map((c) => c.toUpperCase()).join(','));
  const url = `${FRANKFURTER_BASE_URL}/latest${params.size > 0 ? `?${params.toString()}` : ''}`;
  const res = await fetchWithTimeout(url, timeoutMs);
  if (!res.ok) throw new Error(`FX latest: ${res.status} ${res.statusText}`);
  return normalizeEcbLatest((await res.json()) as FrankfurterLatest);
}

export async function fetchEcbHistoricalRates(
  startDate: string,
  endDate?: string,
  currencies: readonly string[] = [],
  timeoutMs = 20000,
): Promise<EcbFxSeriesPoint[]> {
  if (!DATE_RE.test(startDate)) throw new Error(`FX histórico: fecha inicio inválida ${startDate}`);
  if (endDate !== undefined && !DATE_RE.test(endDate)) throw new Error(`FX histórico: fecha fin inválida ${endDate}`);
  let path = `/${startDate}`;
  if (endDate) path += `..${endDate}`;
  const params = new URLSearchParams();
  if (currencies.length > 0) params.set('to', currencies.map((c) => c.toUpperCase()).join(','));
  const url = `${FRANKFURTER_BASE_URL}${path}${params.size > 0 ? `?${params.toString()}` : ''}`;
  const res = await fetchWithTimeout(url, timeoutMs);
  if (!res.ok) throw new Error(`FX histórico: ${res.status} ${res.statusText}`);
  return normalizeEcbSeries((await res.json()) as FrankfurterSeries);
}

export function crossRateFromEur(
  eurRates: Record<string, number>,
  from: string,
  to: string,
): number | null {
  const fromCode = from.toUpperCase();
  const toCode = to.toUpperCase();
  if (fromCode === toCode) return 1;
  const fromRate = fromCode === 'EUR' ? 1 : eurRates[fromCode];
  const toRate = toCode === 'EUR' ? 1 : eurRates[toCode];
  if (!Number.isFinite(fromRate) || !Number.isFinite(toRate) || fromRate <= 0 || toRate <= 0) return null;
  return toRate / fromRate;
}

export function convertCurrency(
  amount: number,
  from: string,
  to: string,
  eurRates: Record<string, number>,
): number | null {
  const rate = crossRateFromEur(eurRates, from, to);
  return rate === null ? null : amount * rate;
}
