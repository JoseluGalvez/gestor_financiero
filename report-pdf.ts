import type { CompanyFundamentalMetric, CompanyFundamentalsAnalysis } from "./company-fundamentals";

export function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatMetricValue(metric: CompanyFundamentalMetric): string {
  if (metric.value === null) return "—";
  if (metric.unit === "percent") return `${metric.value.toFixed(2)}%`;
  if (metric.unit === "ratio") return `${metric.value.toFixed(2)}x`;
  if (metric.unit === "per_share") return `${metric.value.toFixed(2)} por acción`;
  if (metric.unit === "currency") {
    return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(metric.value);
  }
  return metric.value.toLocaleString("es-ES");
}

function statusLabel(status: CompanyFundamentalMetric["status"]): string {
  if (status === "available") return "Disponible";
  if (status === "missing") return "Falta dato";
  return "No significativo";
}

export function buildAnalysisReportHtml(analysis: CompanyFundamentalsAnalysis): string {
  const metricsByCategory = analysis.metrics.reduce<Record<string, CompanyFundamentalMetric[]>>((acc, metric) => {
    (acc[metric.category] ??= []).push(metric);
    return acc;
  }, {});

  const metricsRows = Object.entries(metricsByCategory)
    .map(([category, metrics]) => {
      const cards = metrics
        .map((metric) => {
          return `<tr>
            <td>${escapeHtml(metric.label)}</td>
            <td class="num">${formatMetricValue(metric)}</td>
            <td>${statusLabel(metric.status)}</td>
            <td>${escapeHtml(metric.formula)}</td>
          </tr>`;
        })
        .join("");
      return `<h3>${escapeHtml(category)}</h3>
      <table>
        <thead><tr><th>Métrica</th><th class="num">Valor</th><th>Estado</th><th>Fórmula</th></tr></thead>
        <tbody>${cards}</tbody>
      </table>`;
    })
    .join("");

  const signals = analysis.healthSignals
    .map((signal) => `<li class="signal severity-${signal.severity}"><strong>${escapeHtml(signal.title)}</strong> — ${escapeHtml(signal.detail)}</li>`)
    .join("");

  const evidenceRows = analysis.opportunity.evidence
    .map((evidence) => {
      const result = evidence.passed === null ? "No calculable" : evidence.passed ? "Cumple" : "No cumple";
      const value = evidence.value === null ? "—" : evidence.label === "Cobertura" ? `${evidence.value.toFixed(1)}%` : evidence.value.toFixed(2);
      return `<tr><td>${escapeHtml(evidence.label)}</td><td class="num">${value}</td><td>${escapeHtml(evidence.condition)}</td><td>${result}</td></tr>`;
    })
    .join("");

  const warnings = analysis.warnings.map((warning) => `<li>${escapeHtml(warning)}</li>`).join("");

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Informe de salud financiera — ${escapeHtml(analysis.companyName)}</title>
<style>
  @page { size: A4; margin: 2cm; }
  * { box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; color: #1a1a2e; line-height: 1.55; font-size: 11pt; margin: 0; padding: 1.5rem; }
  h1 { font-size: 1.6rem; border-bottom: 2px solid #2563eb; padding-bottom: 0.5rem; }
  h2 { font-size: 1.25rem; margin-top: 1.75rem; }
  h3 { font-size: 1rem; margin-top: 1.25rem; color: #2d3748; }
  .meta { display: flex; flex-wrap: wrap; gap: 0.5rem 1.5rem; color: #6c757d; font-size: 0.9rem; margin-bottom: 1rem; }
  .coverage { background: #dbeafe; color: #2563eb; padding: 0.15rem 0.6rem; border-radius: 999px; font-weight: 600; }
  table { width: 100%; border-collapse: collapse; margin: 0.75rem 0 1.5rem; font-size: 0.85rem; }
  th, td { text-align: left; padding: 0.45rem 0.6rem; border-bottom: 1px solid #e5e7eb; vertical-align: top; }
  thead th { background: #f8f9fa; font-weight: 700; }
  tbody tr:nth-child(odd) { background: #fafbfc; }
  .num { text-align: right; white-space: nowrap; }
  .signals { list-style: none; padding-left: 0; }
  .signal { padding: 0.5rem 0.75rem; border-left: 3px solid #64748b; margin-bottom: 0.5rem; background: #f8f9fa; }
  .severity-info { border-color: #2563eb; }
  .severity-review { border-color: #d97706; }
  .severity-attention { border-color: #dc2626; }
  .opp-status { display: inline-block; padding: 0.2rem 0.7rem; border-radius: 999px; font-size: 0.8rem; font-weight: 600; }
  .status-candidate { background: #d1fae5; color: #059669; }
  .status-not-supported { background: #fee2e2; color: #dc2626; }
  .status-insufficient { background: #fef3c7; color: #b45309; }
  .warnings { color: #92400e; background: #fffbeb; border: 1px solid #fcd34d; border-radius: 6px; padding: 0.75rem 1rem; }
  .risk { margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid #e5e7eb; color: #6c757d; font-size: 0.85rem; font-style: italic; }
  @media print { body { padding: 0; } h2 { page-break-after: avoid; } table { page-break-inside: avoid; } }
</style>
</head>
<body>
<h1>Informe de salud financiera — ${escapeHtml(analysis.companyName)}</h1>
<div class="meta">
  <span>Fecha de referencia: ${escapeHtml(analysis.asOf || "No indicada")}</span>
  <span>Divisa: ${escapeHtml(analysis.currency)}</span>
  <span>Fuente: ${escapeHtml(analysis.sourceLabel)}</span>
  <span class="coverage">Cobertura: ${analysis.coveragePct.toFixed(1)}%</span>
</div>

<h2>Métricas por categoría</h2>
${metricsRows}

<h2>Señales de salud financiera</h2>
${signals ? `<ul class="signals">${signals}</ul>` : "<p>No hay señales generadas (faltan datos de solvencia).</p>"}

<h2>Oportunidad a revisar</h2>
<p><span class="opp-status status-${escapeHtml(analysis.opportunity.status)}">${escapeHtml(analysis.opportunity.title)}</span></p>
<p>${escapeHtml(analysis.opportunity.detail)}</p>
<table>
  <thead><tr><th>Criterio</th><th class="num">Valor</th><th>Condición</th><th>Resultado</th></tr></thead>
  <tbody>${evidenceRows}</tbody>
</table>
<p class="risk">${escapeHtml(analysis.opportunity.disclaimer)}</p>

${warnings ? `<h2>Advertencias</h2><div class="warnings"><ul>${warnings}</ul></div>` : ""}

<p class="risk">Este informe es informativo y no constituye una recomendación de compra, venta o inversión. Generado el ${new Date().toLocaleDateString("es-ES")}.</p>
</body>
</html>`;
}