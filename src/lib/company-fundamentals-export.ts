import type { CompanyFundamentalMetric, CompanyFundamentalsAnalysis } from "./company-fundamentals";
import { csvFromRows } from "./csv-security.ts";

function rawMetricValue(metric: CompanyFundamentalMetric): string {
  if (metric.value === null) return "";
  if (metric.unit === "percent") return `${metric.value}%`;
  if (metric.unit === "ratio") return `${metric.value}x`;
  if (metric.unit === "per_share") return `${metric.value} ${"por acción"}`;
  return String(metric.value);
}

/**
 * Exportación pensada para abrir y revisar manualmente en una hoja de cálculo.
 * La utilidad compartida neutraliza texto que podría ser interpretado como fórmula.
 * No es un formato de reimportación automática.
 */
export function buildCompanyFundamentalsCsv(analysis: CompanyFundamentalsAnalysis): string {
  const rows: Array<Array<string | number | null | undefined>> = [
    ["Informe de salud financiera", analysis.companyName],
    ["Fecha de referencia", analysis.asOf || "No indicada"],
    ["Divisa", analysis.currency],
    ["Fuente declarada", analysis.sourceLabel],
    ["Cobertura de métricas", `${analysis.coveragePct}%`],
    [],
    ["Categoría", "Métrica", "Valor", "Unidad", "Estado", "Fórmula", "Objetivo", "Entradas", "Origen", "Advertencia"],
    ...analysis.metrics.map((metric) => [
      metric.category,
      metric.label,
      rawMetricValue(metric),
      metric.unit,
      metric.status,
      metric.formula,
      metric.intent,
      metric.requiredInputs.join(" · "),
      metric.source,
      metric.warning ?? "",
    ]),
    [],
    ["OPORTUNIDAD A REVISAR", analysis.opportunity.title],
    ["Estado", analysis.opportunity.status],
    ["Interpretación", analysis.opportunity.detail],
    ["Criterio", "Valor", "Condición", "Resultado"],
    ...analysis.opportunity.evidence.map((evidence) => [
      evidence.label,
      evidence.value ?? "",
      evidence.condition,
      evidence.passed === null ? "No calculable" : evidence.passed ? "Cumple" : "No cumple",
    ]),
    [],
    ["Aviso", analysis.opportunity.disclaimer],
    ...analysis.warnings.map((warning) => ["Advertencia", warning]),
  ];

  return `\uFEFF${csvFromRows(rows)}`;
}

export function companyFundamentalsFilename(companyName: string, extension: "csv" | "pdf"): string {
  const safeName = companyName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase() || "empresa";
  return `salud-financiera-${safeName}-${new Date().toISOString().slice(0, 10)}.${extension}`;
}
