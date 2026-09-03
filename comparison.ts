import type { CompanyFundamentalKey, CompanyFundamentalsAnalysis } from "./company-fundamentals";

export type ComparisonCell = {
  key: CompanyFundamentalKey;
  label: string;
  category: string;
  unit: "percent" | "ratio" | "per_share" | "currency";
  values: Array<number | null>;
  bestIndex: number | null;
};

export function formatComparisonValue(value: number | null, unit: ComparisonCell["unit"]): string {
  if (value === null) return "—";
  if (unit === "percent") return `${value.toFixed(2)}%`;
  if (unit === "ratio") return `${value.toFixed(2)}x`;
  if (unit === "per_share") return `${value.toFixed(2)}`;
  return new Intl.NumberFormat("es-ES", { maximumFractionDigits: 0 }).format(value);
}

export function buildComparisonRows(analyses: CompanyFundamentalsAnalysis[]): ComparisonCell[] {
  const rows: ComparisonCell[] = [];
  const keyOrder: CompanyFundamentalKey[] = [
    "eps",
    "per",
    "evToEbitda",
    "priceToFcf",
    "marketCapitalization",
    "enterpriseValue",
    "netDebt",
    "roe",
    "roic",
    "roicWaccSpread",
    "grossMargin",
    "operatingMargin",
    "netMargin",
    "netDebtToEbitda",
    "interestCoverage",
    "fcfConversion",
  ];

  for (const key of keyOrder) {
    const metrics = analyses.map((analysis) => analysis.metrics.find((metric) => metric.key === key) ?? null);
    const first = metrics.find((metric) => metric !== null);
    if (!first) continue;

    const values = metrics.map((metric) => metric?.value ?? null);
    const numeric = values.filter((value): value is number => value !== null);

    let bestIndex: number | null = null;
    if (numeric.length >= 2) {
      const isLowerBetter = key === "netDebt" || key === "netDebtToEbitda" || key === "per" || key === "evToEbitda" || key === "priceToFcf";
      const target = isLowerBetter ? Math.min(...numeric) : Math.max(...numeric);
      const candidateIndex = values.indexOf(target);
      let duplicate = false;
      if (candidateIndex >= 0) {
        for (let i = 0; i < values.length; i++) {
          if (i !== candidateIndex && values[i] !== null && values[i] === target) {
            duplicate = true;
            break;
          }
        }
      }
      bestIndex = duplicate || candidateIndex < 0 ? null : candidateIndex;
    }

    rows.push({
      key,
      label: first.label,
      category: first.category,
      unit: first.unit as ComparisonCell["unit"],
      values,
      bestIndex,
    });
  }

  return rows;
}

export function comparisonHighlights(analyses: CompanyFundamentalsAnalysis[]): string[] {
  if (analyses.length < 2) return [];
  const summary: string[] = [];
  const ranking: Array<{ name: string; score: number }> = analyses.map((analysis) => ({ name: analysis.companyName, score: 0 }));

  const rows = buildComparisonRows(analyses);
  for (const row of rows) {
    if (row.bestIndex === null) continue;
    ranking[row.bestIndex].score += 1;
  }

  const sorted = [...ranking].sort((a, b) => b.score - a.score);
  if (sorted.length > 0) {
    summary.push(`${sorted[0].name} lidera con ${sorted[0].score} métricas favorables.`);
  }
  return summary;
}