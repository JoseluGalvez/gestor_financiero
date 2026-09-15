import type { EdgarCompanyFacts, EdgarFactPoint } from './sec-edgar-adapter';
import type { MetricPoint } from './analysis-history';

export type AnnualDataPoint = {
  fiscalYearEnd: string;
  fiscalYear: number | null;
  revenue: number | null;
  netIncome: number | null;
  operatingCashFlow: number | null;
  capex: number | null;
  freeCashFlow: number | null;
  equity: number | null;
  assets: number | null;
  liabilities: number | null;
  costOfRevenue: number | null;
  receivables: number | null;
  ppe: number | null;
  currentAssets: number | null;
  depreciation: number | null;
  sgaExpense: number | null;
  interestExpense: number | null;
  incomeTax: number | null;
  ebit: number | null;
};

type SeriesKey = Exclude<keyof AnnualDataPoint, 'fiscalYearEnd' | 'fiscalYear'>;

const TAG_CANDIDATES: Record<SeriesKey, string[]> = {
  revenue: ['Revenues', 'RevenueFromContractWithCustomerExcludingAssessedTax', 'RevenueFromContractWithCustomerIncludingAssessedTax', 'SalesRevenueNet'],
  netIncome: ['NetIncomeLoss', 'ProfitLoss'],
  operatingCashFlow: ['NetCashProvidedByUsedInOperatingActivities', 'NetCashProvidedByUsedInOperatingActivitiesContinuingOperations'],
  capex: ['PaymentsToAcquirePropertyPlantAndEquipment', 'PaymentsToAcquireProductiveAssets'],
  freeCashFlow: ['FreeCashFlow'],
  equity: ['StockholdersEquityIncludingPortionAttributableToNoncontrollingInterest', 'StockholdersEquity'],
  assets: ['Assets'],
  liabilities: ['Liabilities'],
  costOfRevenue: ['CostOfRevenue', 'CostOfGoodsAndServicesSold', 'CostOfGoodsSold'],
  receivables: ['AccountsReceivableNetCurrent', 'ReceivablesNetCurrent', 'AccountsReceivableNet'],
  ppe: ['PropertyPlantAndEquipmentNet'],
  currentAssets: ['AssetsCurrent'],
  depreciation: ['DepreciationDepletionAndAmortization', 'DepreciationAmortizationAndAccretionNet', 'Depreciation'],
  sgaExpense: ['SellingGeneralAndAdministrativeExpense'],
  interestExpense: ['InterestExpense', 'InterestExpenseDebt', 'InterestExpenseNonoperating'],
  incomeTax: ['IncomeTaxExpenseBenefit'],
  ebit: ['OperatingIncomeLoss'],
};

const FLOW_KEYS: ReadonlySet<SeriesKey> = new Set([
  'revenue', 'netIncome', 'operatingCashFlow', 'capex', 'freeCashFlow',
  'costOfRevenue', 'depreciation', 'sgaExpense', 'interestExpense', 'incomeTax', 'ebit',
]);

function daysBetween(start: string | undefined, end: string): number {
  if (!start) return NaN;
  return (new Date(end).getTime() - new Date(start).getTime()) / 86_400_000;
}

function isAnnualPoint(point: EdgarFactPoint, isFlow: boolean): boolean {
  if (!Number.isFinite(point.val)) return false;
  const form = (point.form ?? '').toUpperCase();
  const isAnnualForm = form === '10-K' || form === '10-K/A' || form === '20-F' || form === '40-F';
  if (point.fp === 'FY') return isAnnualForm || form === '';
  if (!isAnnualForm) return false;
  if (isFlow) {
    const days = daysBetween(point.start, point.end);
    if (!Number.isFinite(days) || days < 300 || days > 380) return false;
  }
  return true;
}

function collectSeries(
  facts: Record<string, { units?: Record<string, EdgarFactPoint[]> }> | undefined,
  tags: string[],
  isFlow: boolean,
): Map<string, { value: number; filed: string; start?: string; fy?: number }> {
  const byEnd = new Map<string, { value: number; filed: string; start?: string; fy?: number }>();
  for (const tag of tags) {
    const entry = facts?.[tag];
    if (!entry?.units) continue;
    for (const unitPoints of Object.values(entry.units)) {
      for (const point of unitPoints) {
        if (!isAnnualPoint(point, isFlow)) continue;
        if (!point.end) continue;
        const existing = byEnd.get(point.end);
        const filed = point.filed ?? '';
        if (!existing || filed > existing.filed) {
          byEnd.set(point.end, { value: point.val, filed, start: point.start, fy: point.fy });
        }
      }
    }
  }
  return byEnd;
}

export function buildAnnualSeries(facts: EdgarCompanyFacts): AnnualDataPoint[] {
  const usGaap = facts.facts?.['us-gaap'];
  if (!usGaap) return [];

  const series = new Map<SeriesKey, Map<string, { value: number; filed: string; start?: string; fy?: number }>>();
  const allEnds = new Set<string>();

  for (const key of Object.keys(TAG_CANDIDATES) as SeriesKey[]) {
    const collected = collectSeries(usGaap, TAG_CANDIDATES[key], FLOW_KEYS.has(key));
    series.set(key, collected);
    for (const end of collected.keys()) allEnds.add(end);
  }

  const ends = [...allEnds].sort();
  return ends.map((end) => {
    const get = (key: SeriesKey): number | null => series.get(key)?.get(end)?.value ?? null;
    const fy = series.get('revenue')?.get(end)?.fy ?? null;
    const ocf = get('operatingCashFlow');
    const capex = get('capex');
    const explicitFcf = get('freeCashFlow');
    const freeCashFlow = explicitFcf ?? (ocf !== null && capex !== null ? ocf - capex : null);
    return {
      fiscalYearEnd: end,
      fiscalYear: fy,
      revenue: get('revenue'),
      netIncome: get('netIncome'),
      operatingCashFlow: ocf,
      capex,
      freeCashFlow,
      equity: get('equity'),
      assets: get('assets'),
      liabilities: get('liabilities'),
      costOfRevenue: get('costOfRevenue'),
      receivables: get('receivables'),
      ppe: get('ppe'),
      currentAssets: get('currentAssets'),
      depreciation: get('depreciation'),
      sgaExpense: get('sgaExpense'),
      interestExpense: get('interestExpense'),
      incomeTax: get('incomeTax'),
      ebit: get('ebit'),
    };
  });
}

/* ---------- Métricas derivadas por año ---------- */

function safeRatio(numerator: number | null, denominator: number | null): number | null {
  if (numerator === null || denominator === null || denominator === 0) return null;
  return numerator / denominator;
}

export type DerivedAnnual = {
  fiscalYearEnd: string;
  revenueGrowth: number | null;
  netMargin: number | null;
  grossMargin: number | null;
  roe: number | null;
  fcfConversion: number | null;
  netDebt: number | null;
};

export function deriveAnnualMetrics(series: AnnualDataPoint[]): DerivedAnnual[] {
  return series.map((year, index) => {
    const prev = index > 0 ? series[index - 1] : null;
    const revenueGrowth =
      prev?.revenue !== null && prev?.revenue !== undefined && prev.revenue !== 0 && year.revenue !== null
        ? (year.revenue / prev.revenue - 1) * 100
        : null;
    const grossProfit = year.revenue !== null && year.costOfRevenue !== null ? year.revenue - year.costOfRevenue : null;
    return {
      fiscalYearEnd: year.fiscalYearEnd,
      revenueGrowth,
      netMargin: safeRatio(year.netIncome, year.revenue) !== null ? (safeRatio(year.netIncome, year.revenue)! * 100) : null,
      grossMargin: safeRatio(grossProfit, year.revenue) !== null ? (safeRatio(grossProfit, year.revenue)! * 100) : null,
      roe: safeRatio(year.netIncome, year.equity) !== null ? (safeRatio(year.netIncome, year.equity)! * 100) : null,
      fcfConversion: safeRatio(year.freeCashFlow, year.netIncome) !== null ? (safeRatio(year.freeCashFlow, year.netIncome)! * 100) : null,
      netDebt: null,
    };
  });
}

/* ---------- Adaptación a puntos de gráfica ---------- */

export type HistoryMetricKey = 'revenue' | 'netIncome' | 'freeCashFlow' | 'operatingCashFlow' | 'equity' | 'assets' | 'revenueGrowth' | 'netMargin' | 'grossMargin' | 'roe' | 'fcfConversion';

export const HISTORY_METRIC_LABELS: Record<HistoryMetricKey, string> = {
  revenue: 'Ingresos',
  netIncome: 'Beneficio neto',
  freeCashFlow: 'Flujo de caja libre',
  operatingCashFlow: 'Flujo de caja operativo',
  equity: 'Patrimonio neto',
  assets: 'Activos totales',
  revenueGrowth: 'Crecimiento ingresos (YoY)',
  netMargin: 'Margen neto',
  grossMargin: 'Margen bruto',
  roe: 'ROE',
  fcfConversion: 'Conversión FCF',
};

export function annualSeriesToMetricPoints(series: AnnualDataPoint[], metric: HistoryMetricKey): MetricPoint[] {
  const derived = deriveAnnualMetrics(series);
  const unit: MetricPoint['unit'] =
    metric === 'revenueGrowth' || metric === 'netMargin' || metric === 'grossMargin' || metric === 'roe' || metric === 'fcfConversion'
      ? 'percent'
      : 'currency';

  const points: MetricPoint[] = [];
  for (let i = 0; i < series.length; i++) {
    const year = series[i];
    const d = derived[i];
    let value: number | null = null;
    switch (metric) {
      case 'revenue': value = year.revenue; break;
      case 'netIncome': value = year.netIncome; break;
      case 'freeCashFlow': value = year.freeCashFlow; break;
      case 'operatingCashFlow': value = year.operatingCashFlow; break;
      case 'equity': value = year.equity; break;
      case 'assets': value = year.assets; break;
      case 'revenueGrowth': value = d.revenueGrowth; break;
      case 'netMargin': value = d.netMargin; break;
      case 'grossMargin': value = d.grossMargin; break;
      case 'roe': value = d.roe; break;
      case 'fcfConversion': value = d.fcfConversion; break;
    }
    if (value !== null && Number.isFinite(value)) {
      points.push({ asOf: year.fiscalYearEnd, value, unit });
    }
  }
  return points;
}
