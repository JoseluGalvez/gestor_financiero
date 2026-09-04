import type { CompanyFundamentalsInput } from './company-fundamentals';

export const SEC_TICKERS_URL = 'https://www.sec.gov/files/company_tickers.json';
export const SEC_DATA_BASE_URL = 'https://data.sec.gov/api/xbrl';
export const SEC_USER_AGENT_DEFAULT = 'Portafolio-Intel contact@example.com';

export type EdgarTickerEntry = {
  cik: number;
  ticker: string;
  title: string;
};

export type EdgarFactUnit = {
  label?: string;
  description?: string;
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

export async function fetchEdgarTickers(
  userAgent: string = SEC_USER_AGENT_DEFAULT,
  timeoutMs = 30000,
): Promise<EdgarTickerEntry[]> {
  const res = await fetchWithTimeout(SEC_TICKERS_URL, userAgent, timeoutMs);
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
  userAgent: string = SEC_USER_AGENT_DEFAULT,
  timeoutMs = 20000,
): Promise<EdgarCompanyFacts> {
  const url = `${SEC_DATA_BASE_URL}/companyfacts/CIK${String(cik).padStart(10, '0')}.json`;
  const res = await fetchWithTimeout(url, userAgent, timeoutMs);
  if (!res.ok) {
    throw new Error(`SEC companyfacts: ${res.status} ${res.statusText}`);
  }
  const raw = (await res.json()) as EdgarCompanyFacts;
  return raw;
}

function toNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  return null;
}

function latestValues(facts: Record<string, { units?: Record<string, EdgarFactPoint[]> }> | undefined, keys: string[]): { value: number | null; source: string | null } {
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

export function parseEdgarFacts(
  facts: EdgarCompanyFacts,
  _ticker: string,
  asOf: string,
): CompanyFundamentalsInput {
  const usGaap = facts.facts?.['us-gaap'];
  const dei = facts.facts?.['dei'];

  const revenue = latestValues(usGaap, ['Revenues', 'RevenueFromContractWithCustomerExcludingAssessedTax', 'SalesRevenueNet']);
  const netIncome = latestValues(usGaap, ['NetIncomeLoss', 'ProfitLoss']);
  const ebit = latestValues(usGaap, ['OperatingIncomeLoss']);
  const ebitda = latestValues(usGaap, ['EBITDA', 'OperatingIncomeLoss']) ?? ebit;
  const interestExpense = latestValues(usGaap, ['InterestExpense', 'InterestExpenseDebt', 'InterestIncomeExpenseNet']);
  const equity = latestValues(usGaap, ['StockholdersEquity', 'StockholdersEquityIncludingPortionAttributableToNoncontrollingInterest']);
  const totalDebt = latestValues(usGaap, ['LiabilitiesCurrentAndLongtermDebt', 'LiabilitiesCurrentAndNoncurrent', 'Liabilities']);
  const cash = latestValues(usGaap, ['CashAndCashEquivalentsAtCarryingValue', 'CashCashEquivalentsRestrictedCashAndRestrictedCashEquivalents', 'Cash']);
  const freeCashFlow = latestValues(usGaap, ['NetCashProvidedByUsedInOperatingActivities', 'NetCashProvidedByUsedInOperatingActivitiesContinuingOperations']);
  const costOfRevenue = latestValues(usGaap, ['CostOfRevenue', 'CostOfGoodsAndServicesSold', 'CostOfGoodsSold']);
  const taxRate = latestValues(usGaap, ['EffectiveIncomeTaxRateContinuingOperations', 'IncomeTaxRate']);
  const shares = latestValues(dei, ['EntityCommonStockSharesOutstanding']) ?? latestValues(usGaap, ['CommonStockSharesOutstanding']);

  return {
    companyName: facts.entityName,
    asOf,
    currency: 'USD',
    sourceLabel: 'SEC EDGAR XBRL',
    pricePerShare: null,
    sharesOutstanding: shares.value,
    marketCapitalization: null,
    netIncome: netIncome.value,
    equity: equity.value,
    totalDebt: totalDebt.value,
    cashAndEquivalents: cash.value,
    ebitda: ebitda.value,
    ebit: ebit.value,
    interestExpense: interestExpense.value,
    revenue: revenue.value,
    costOfRevenue: costOfRevenue.value,
    freeCashFlow: freeCashFlow.value,
    taxRate: taxRate.value,
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
