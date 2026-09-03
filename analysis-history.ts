import type {
  CompanyFundamentalKey,
  CompanyFundamentalsAnalysis,
  CompanyFundamentalsInput,
} from "./company-fundamentals";

export const ANALYSIS_HISTORY_STORAGE_KEY = "portafolio-intel-analysis-history-v1";
export const ANALYSIS_HISTORY_LIMIT = 100;

export type HistoryEntry = {
  id: string;
  createdAt: number;
  input: CompanyFundamentalsInput;
  analysis: CompanyFundamentalsAnalysis;
};

export function createHistoryEntryId(): string {
  return `ah-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function makeHistoryEntry(input: CompanyFundamentalsInput, analysis: CompanyFundamentalsAnalysis): HistoryEntry {
  return { id: createHistoryEntryId(), createdAt: Date.now(), input, analysis };
}

export function pushEntry(history: HistoryEntry[], entry: HistoryEntry): HistoryEntry[] {
  return [entry, ...history].slice(0, ANALYSIS_HISTORY_LIMIT);
}

export function distinctCompanies(history: HistoryEntry[]): string[] {
  const names: string[] = [];
  for (const entry of history) {
    const name = entry.analysis.companyName;
    if (name && !names.includes(name)) names.push(name);
  }
  return names;
}

export function entriesForCompany(history: HistoryEntry[], companyName: string): HistoryEntry[] {
  return history.filter((entry) => entry.analysis.companyName === companyName);
}

export function metricLabelFor(analysis: CompanyFundamentalsAnalysis, key: CompanyFundamentalKey): string {
  return analysis.metrics.find((metric) => metric.key === key)?.label ?? key;
}

export type MetricPoint = {
  asOf: string;
  value: number;
  unit: "percent" | "ratio" | "per_share";
};

export function metricSeriesForCompany(
  history: HistoryEntry[],
  companyName: string,
  metricKey: CompanyFundamentalKey,
): MetricPoint[] {
  const points: MetricPoint[] = [];
  for (const entry of entriesForCompany(history, companyName)) {
    const metric = entry.analysis.metrics.find((item) => item.key === metricKey);
    if (!metric || metric.value === null) continue;
    if (metric.unit === "currency") continue;
    if (!entry.analysis.asOf) continue;
    points.push({ asOf: entry.analysis.asOf, value: metric.value, unit: metric.unit as MetricPoint["unit"] });
  }
  points.sort((a, b) => a.asOf.localeCompare(b.asOf));
  return points;
}

export function formatMetricPointValue(value: number, unit: MetricPoint["unit"]): string {
  if (unit === "percent") return `${value.toFixed(2)}%`;
  if (unit === "ratio") return `${value.toFixed(2)}x`;
  return `${value.toFixed(2)}`;
}

export function loadHistory(storage: Pick<Storage, "getItem">): HistoryEntry[] {
  try {
    const raw = storage.getItem(ANALYSIS_HISTORY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((entry): entry is HistoryEntry => Boolean(entry?.analysis && entry?.id));
  } catch {
    return [];
  }
}

export function persistHistory(storage: Pick<Storage, "setItem">, history: HistoryEntry[]): void {
  try {
    storage.setItem(ANALYSIS_HISTORY_STORAGE_KEY, JSON.stringify(history.slice(0, ANALYSIS_HISTORY_LIMIT)));
  } catch {
    /* almacenamiento no disponible */
  }
}