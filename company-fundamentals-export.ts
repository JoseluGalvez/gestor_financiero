import type { CompanyFundamentalMetric, CompanyFundamentalsAnalysis } from "./company-fundamentals";

function safeSpreadsheetCell(value: string | number | null | undefined): string {
  const raw = value === null || value === undefined ? "" : String(value);
  const safe = /^[=+\-@]/.test(raw) ? `'${raw}` : raw;
  return `"${safe.replaceAll('"', '""')}"`;
}

function rawMetricValue(metric: CompanyFundamentalMetric): string {
  if (metric.value === null) return "";
  if (metric.unit === "percent") return `${metric.value}%`;
  if (metric.unit === "ratio") return `${metric.value}x`;
  if (metric.unit === "per_share") return `${metric.value} ${"por acción"}`;
  return String(metric.value);
}

export function buildCompanyFundamentalsCsv(analysis: CompanyFundamentalsAnalysis): string {
  const lines: string[] = [
    ["Informe de salud financiera", analysis.companyName].map(safeSpreadsheetCell).join(","),
    ["Fecha de referencia", analysis.asOf || "No indicada"].map(safeSpreadsheetCell).join(","),
    ["Divisa", analysis.currency].map(safeSpreadsheetCell).join(","),
    ["Fuente declarada", analysis.sourceLabel].map(safeSpreadsheetCell).join(","),
    ["Cobertura de métricas", `${analysis.coveragePct}%`].map(safeSpreadsheetCell).join(","),
    "",
    ["Categoría", "Métrica", "Valor", "Unidad", "Estado", "Fórmula", "Objetivo", "Entradas", "Origen", "Advertencia"].map(safeSpreadsheetCell).join(","),
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
    ].map(safeSpreadsheetCell).join(",")),
    "",
    ["OPORTUNIDAD A REVISAR", analysis.opportunity.title].map(safeSpreadsheetCell).join(","),
    ["Estado", analysis.opportunity.status].map(safeSpreadsheetCell).join(","),
    ["Interpretación", analysis.opportunity.detail].map(safeSpreadsheetCell).join(","),
    ["Criterio", "Valor", "Condición", "Resultado"].map(safeSpreadsheetCell).join(","),
    ...analysis.opportunity.evidence.map((evidence) => [
      evidence.label,
      evidence.value ?? "",
      evidence.condition,
      evidence.passed === null ? "No calculable" : evidence.passed ? "Cumple" : "No cumple",
    ].map(safeSpreadsheetCell).join(",")),
    "",
    ["Aviso", analysis.opportunity.disclaimer].map(safeSpreadsheetCell).join(","),
    ...analysis.warnings.map((warning) => ["Advertencia", warning].map(safeSpreadsheetCell).join(",")),
  ];
  return `\uFEFF${lines.join("\r\n")}`;
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
