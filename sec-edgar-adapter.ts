import type { CompanyFundamentalsInput } from './company-fundamentals';

export const SEC_TICKERS_URL = 'https://www.sec.gov/files/company_tickers.json';
export const SEC_DATA_BASE_URL = 'https://data.sec.gov/api/xbrl';
export const SEC_USER_AGENT_DEFAULT = 'Portafolio-Intel contact@example.com';

export type EdgarAdapterConfig = {
  /** URL del directorio de tickers (por defecto SEC_TICKERS_URL; en dev puede ser el proxy /api/sec-www/...). */
  tickersUrl?: string;
  /** Base para companyfacts (por defecto SEC_DATA_BASE_URL; en dev puede ser /api/sec-data/api/xbrl). */
  factsBaseUrl?: string;
  userAgent?: string;
  timeoutMs?: number;
};

export type EdgarTickerEntry = {
  cik: number;
  ticker: string;
  title: string;
};

export type EdgarFactPoint = {
  start?: string;
  end: string;
  val: number;
  form?: string;
  fy?: number;
  fp?: string;
  frame?: string;
  accn?: string;
  filed?: string;
};

export type EdgarCompanyFacts = {
  cik: number;
  entityName: string;
  facts?: {
    'us-gaap'?: Record<string, { label?: string; description?: string; units?: Record<string, EdgarFactPoint[]> }>;
    'dei'?: Record<string, { label?: string; description?: string; units?: Record<string, EdgarFactPoint[]> }>;
  };
};

async function fetchWithTimeout(
  url: string,
  userAgent: string,
  timeoutMs: number,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': userAgent,
        'Accept': 'application/json',
      },
      signal: controller.signal,
    });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchEdgarTickers(config: EdgarAdapterConfig = {}): Promise<EdgarTickerEntry[]> {
  const url = config.tickersUrl ?? SEC_TICKERS_URL;
  const ua = config.userAgent ?? SEC_USER_AGENT_DEFAULT;
  const res = await fetchWithTimeout(url, ua, config.timeoutMs ?? 30000);
  if (!res.ok) {
    throw new Error(`SEC tickers: ${res.status} ${res.statusText}`);
  }
  const raw = (await res.json()) as Record<string, { cik_str?: number; ticker?: string; title?: string }>;
  const list: EdgarTickerEntry[] = [];
  for (const key of Object.keys(raw)) {
    const entry = raw[key];
    if (!entry || entry.cik_str === undefined || entry.ticker === undefined) continue;
    list.push({ cik: entry.cik_str, ticker: entry.ticker, title: entry.title ?? '' });
  }
  return list;
}

export async function fetchEdgarCompanyFacts(
  cik: number,
  config: EdgarAdapterConfig = {},
): Promise<EdgarCompanyFacts> {
  const base = config.factsBaseUrl ?? SEC_DATA_BASE_URL;
  const ua = config.userAgent ?? SEC_USER_AGENT_DEFAULT;
  const url = `${base}/companyfacts/CIK${String(cik).padStart(10, '0')}.json`;
  const res = await fetchWithTimeout(url, ua, config.timeoutMs ?? 20000);
  if (!res.ok) {
    throw new Error(`SEC companyfacts: ${res.status} ${res.statusText}`);
  }
  const raw = (await res.json()) as EdgarCompanyFacts;
  return raw;
}

/* ---------- Caché del directorio de tickers (localStorage) ---------- */

export const EDGAR_TICKERS_CACHE_KEY = 'portafolio-intel-edgar-tickers-v1';
export const EDGAR_TICKERS_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

export function loadCachedEdgarTickers(
  storage: Pick<Storage, 'getItem'>,
  now: number = Date.now(),
): EdgarTickerEntry[] | null {
  try {
    const raw = storage.getItem(EDGAR_TICKERS_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { at?: number; entries?: EdgarTickerEntry[] };
    if (typeof parsed.at !== 'number' || !Array.isArray(parsed.entries)) return null;
    if (now - parsed.at > EDGAR_TICKERS_CACHE_TTL_MS) return null;
    return parsed.entries.filter(
      (e): e is EdgarTickerEntry =>
        typeof e?.cik === 'number' && typeof e?.ticker === 'string' && typeof e?.title === 'string',
    );
  } catch {
    return null;
  }
}

export function saveCachedEdgarTickers(
  storage: Pick<Storage, 'setItem'>,
  entries: EdgarTickerEntry[],
  now: number = Date.now(),
): void {
  try {
    storage.setItem(EDGAR_TICKERS_CACHE_KEY, JSON.stringify({ at: now, entries }));
  } catch {
    /* almacenamiento lleno o no disponible */
  }
}

export function searchEdgarTickers(
  entries: EdgarTickerEntry[],
  query: string,
  limit = 25,
): EdgarTickerEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const results: EdgarTickerEntry[] = [];
  for (const entry of entries) {
    if (entry.ticker.toLowerCase().startsWith(q) || entry.title.toLowerCase().includes(q)) {
      results.push(entry);
      if (results.length >= limit) break;
    }
  }
  return results;
}

/* ---------- Extracción de fundamentales ---------- */

function toNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  return null;
}

function latestValues(
  facts: Record<string, { units?: Record<string, EdgarFactPoint[]> }> | undefined,
  keys: string[],
): { value: number | null; source: string | null } {
  let best: { value: number; source: string; end: string } | null = null;
  for (const key of keys) {
    const entry = facts?.[key];
    if (!entry?.units) continue;
    for (const unit of Object.values(entry.units)) {
      const sorted = [...unit].sort((a, b) => (b.end > a.end ? 1 : b.end < a.end ? -1 : 0));
      const latest = sorted.find((item) => toNumber(item.val) !== null);
      if (latest && (best === null || latest.end > best.end)) {
        best = { value: latest.val as number, source: key, end: latest.end };
      }
    }
  }
  return best ? { value: best.value, source: best.source } : { value: null, source: null };
}

function sumLatestValues(
  facts: Record<string, { units?: Record<string, EdgarFactPoint[]> }> | undefined,
  keys: string[],
): number | null {
  let total = 0;
  let found = false;
  for (const key of keys) {
    const { value } = latestValues(facts, [key]);
    if (value !== null) {
      total += value;
      found = true;
    }
  }
  return found ? total : null;
}

export function parseEdgarFacts(
  facts: EdgarCompanyFacts,
  _ticker: string,
  asOf: string,
): CompanyFundamentalsInput {
  const usGaap = facts.facts?.['us-gaap'];
  const dei = facts.facts?.['dei'];

  const revenue = latestValues(usGaap, [
    'Revenues',
    'RevenueFromContractWithCustomerExcludingAssessedTax',
    'RevenueFromContractWithCustomerIncludingAssessedTax',
    'SalesRevenueNet',
  ]);
  const netIncome = latestValues(usGaap, ['NetIncomeLoss', 'ProfitLoss']);
  const ebit = latestValues(usGaap, ['OperatingIncomeLoss']);
  const da = latestValues(usGaap, [
    'DepreciationDepletionAndAmortization',
    'DepreciationAmortizationAndAccretionNet',
    'Depreciation',
  ]);
  const ebitda =
    latestValues(usGaap, ['EBITDA']).value ??
    (ebit.value !== null && da.value !== null ? ebit.value + da.value : ebit.value);
  const interestExpense = latestValues(usGaap, ['InterestExpense', 'InterestExpenseDebt', 'InterestExpenseNonoperating']);
  const equity = latestValues(usGaap, [
    'StockholdersEquityIncludingPortionAttributableToNoncontrollingInterest',
    'StockholdersEquity',
  ]);
  const totalDebt =
    latestValues(usGaap, ['LongTermDebt']).value ??
    sumLatestValues(usGaap, ['LongTermDebtNoncurrent', 'LongTermDebtCurrent', 'ShortTermBorrowings', 'DebtCurrent']);
  const cash = latestValues(usGaap, [
    'CashAndCashEquivalentsAtCarryingValue',
    'CashCashEquivalentsRestrictedCashAndRestrictedCashEquivalents',
    'Cash',
  ]);
  const freeCashFlow = latestValues(usGaap, [
    'NetCashProvidedByUsedInOperatingActivities',
    'NetCashProvidedByUsedInOperatingActivitiesContinuingOperations',
  ]);
  const costOfRevenue = latestValues(usGaap, ['CostOfRevenue', 'CostOfGoodsAndServicesSold', 'CostOfGoodsSold']);
  const taxReported = latestValues(usGaap, ['EffectiveIncomeTaxRateContinuingOperations']);
  const incomeTax = latestValues(usGaap, ['IncomeTaxExpenseBenefit']);
  const pretaxIncome = latestValues(usGaap, [
    'IncomeLossFromContinuingOperationsBeforeIncomeTaxesExtraordinaryItemsNoncontrollingInterest',
    'IncomeLossFromContinuingOperationsBeforeIncomeTaxesMinorityInterestAndIncomeLossFromEquityMethodInvestments',
  ]);
  let taxRate: number | null = taxReported.value;
  if (taxRate !== null && taxRate > 1) taxRate = taxRate / 100;
  if ((taxRate === null || taxRate < 0 || taxRate > 1) && incomeTax.value !== null && pretaxIncome.value !== null && pretaxIncome.value > 0) {
    taxRate = incomeTax.value / pretaxIncome.value;
  }
  if (taxRate !== null && (taxRate < 0 || taxRate > 1)) taxRate = null;

  const shares =
    latestValues(dei, ['EntityCommonStockSharesOutstanding']).value ??
    latestValues(usGaap, ['CommonStockSharesOutstanding', 'WeightedAverageNumberOfSharesOutstandingBasic']).value;

  return {
    companyName: facts.entityName,
    asOf,
    currency: 'USD',
    sourceLabel: 'SEC EDGAR XBRL',
    pricePerShare: null,
    sharesOutstanding: shares,
    marketCapitalization: null,
    netIncome: netIncome.value,
    equity: equity.value,
    totalDebt,
    cashAndEquivalents: cash.value,
    ebitda,
    ebit: ebit.value,
    interestExpense: interestExpense.value,
    revenue: revenue.value,
    costOfRevenue: costOfRevenue.value,
    freeCashFlow: freeCashFlow.value,
    taxRate,
    wacc: null,
  };
}

export function extractLatestAsOf(entry: EdgarCompanyFacts | null | undefined): string {
  if (!entry?.facts) return new Date().toISOString().slice(0, 10);
  const dates: string[] = [];
  for (const ns of ['us-gaap', 'dei'] as const) {
    const facts = entry.facts[ns];
    if (!facts) continue;
    for (const item of Object.values(facts)) {
      if (!item.units) continue;
      for (const unit of Object.values(item.units)) {
        for (const point of unit) {
          if (point.end) dates.push(point.end);
        }
      }
    }
  }
  dates.sort();
  return dates[dates.length - 1] ?? new Date().toISOString().slice(0, 10);
}
