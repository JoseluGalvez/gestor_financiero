import type { CompanyFundamentalsAnalysis, CompanyFundamentalMetric } from './company-fundamentals';
import type { EdgarCompanyFacts } from './sec-edgar-adapter';
import type { HistoryEntry } from './analysis-history';
import { escapeHtml } from './report-pdf';
import { buildAnnualSeries } from './financial-history';
import { buildAccountingQualityReport } from './financial-quality';
import { calculateDCF, buildSensitivityMatrix } from './financial-dcf';
import { buildComparisonRows, comparisonHighlights, formatComparisonValue } from './comparison';
import { funcionalidadesFaltantes, plataformas } from './comparativa-data';

export type ReportSectionId =
  | 'fund-resumen'
  | 'fund-metricas'
  | 'fund-senales'
  | 'fund-oportunidad'
  | 'fund-advertencias'
  | 'fund-historial'
  | 'fund-comparacion'
  | 'edgar-evolucion'
  | 'edgar-calidad'
  | 'edgar-dcf'
  | 'gmt-cobertura'
  | 'cartera-estado'
  | 'comp-rendimiento'
  | 'comp-funcionalidades';

export type ReportSectionGroup =
  | 'Análisis Fundamental'
  | 'SEC EDGAR'
  | 'Historial y Comparación'
  | 'GMT Terminal'
  | 'Cartera Multi-Plataforma'
  | 'Comparativa de Plataformas';

export type ReportSectionRequirement = 'analysis' | 'edgar' | 'edgarFcf' | 'history' | 'comparison' | 'none';

export interface ReportSectionDef {
  id: ReportSectionId;
  group: ReportSectionGroup;
  title: string;
  description: string;
  requires: ReportSectionRequirement;
  notes?: string;
}

export interface ReportData {
  analysis: CompanyFundamentalsAnalysis | null;
  edgarFacts: EdgarCompanyFacts | null;
  history: HistoryEntry[];
  compareAnalyses: CompanyFundamentalsAnalysis[];
  generatedAt?: Date;
  sectionNotes?: Partial<Record<ReportSectionId, string>>;
}

export const REPORT_SECTIONS: ReportSectionDef[] = [
  {
    id: 'fund-resumen',
    group: 'Análisis Fundamental',
    title: 'Datos generales del análisis',
    description: 'Empresa, fecha de referencia, divisa, fuente y cobertura de métricas del análisis activo.',
    requires: 'analysis',
  },
  {
    id: 'fund-metricas',
    group: 'Análisis Fundamental',
    title: 'Métricas y ratios por categoría',
    description: 'Los 16 ratios de valoración, rentabilidad, márgenes, solvencia y caja con fórmula y estado.',
    requires: 'analysis',
  },
  {
    id: 'fund-senales',
    group: 'Análisis Fundamental',
    title: 'Señales de salud financiera',
    description: 'Lectura orientativa de solvencia y salud a partir de las fórmulas aportadas.',
    requires: 'analysis',
  },
  {
    id: 'fund-oportunidad',
    group: 'Análisis Fundamental',
    title: 'Evaluación de oportunidad de inversión',
    description: 'Veredicto, detalle, criterios con resultado y descargo de responsabilidad.',
    requires: 'analysis',
  },
  {
    id: 'fund-advertencias',
    group: 'Análisis Fundamental',
    title: 'Advertencias del análisis',
    description: 'Avisos sobre datos incompletos o definiciones que afectan a la interpretación.',
    requires: 'analysis',
  },
  {
    id: 'fund-historial',
    group: 'Historial y Comparación',
    title: 'Historial de análisis guardados',
    description: 'Relación de análisis realizados con fecha de guardado, referencia y cobertura.',
    requires: 'history',
  },
  {
    id: 'fund-comparacion',
    group: 'Historial y Comparación',
    title: 'Comparación lado a lado de empresas',
    description: 'Comparativa de métricas entre 2–3 empresas seleccionadas del historial.',
    requires: 'comparison',
  },
  {
    id: 'edgar-evolucion',
    group: 'SEC EDGAR',
    title: 'Evolución financiera multi-año',
    description: 'Serie anual de ingresos, beneficio, EBIT, flujo de caja libre y balance desde SEC EDGAR.',
    requires: 'edgar',
  },
  {
    id: 'edgar-calidad',
    group: 'SEC EDGAR',
    title: 'Calidad contable y Beneish M-Score',
    description: 'Checks de identidad de balance, devengo y modelo Beneish de manipulación contable.',
    requires: 'edgar',
  },
  {
    id: 'edgar-dcf',
    group: 'SEC EDGAR',
    title: 'DCF y matriz de sensibilidad WACC × g',
    description: 'Valoración por flujos descontados y matriz de sensibilidad sobre FCF del último año.',
    requires: 'edgarFcf',
  },
  {
    id: 'gmt-cobertura',
    group: 'GMT Terminal',
    title: 'Cobertura de mercado en tiempo real',
    description: 'Contenido del terminal: tape de cotizaciones, heatmap, top movers, rankings, índices, FX, watchlist y alertas.',
    requires: 'none',
  },
  {
    id: 'cartera-estado',
    group: 'Cartera Multi-Plataforma',
    title: 'Estado del módulo de cartera',
    description: 'Situación del módulo de cartera multi-plataforma y capacidades planificadas.',
    requires: 'none',
  },
  {
    id: 'comp-rendimiento',
    group: 'Comparativa de Plataformas',
    title: 'Rendimiento por plataforma',
    description: 'Nota de rendimiento y funcionalidades (sorting, filtros, paginación, CSV, gráficos) por plataforma.',
    requires: 'none',
  },
  {
    id: 'comp-funcionalidades',
    group: 'Comparativa de Plataformas',
    title: 'Funcionalidades disponibles y faltantes',
    description: 'Catálogo de funcionalidades con estatus e impacto por plataforma.',
    requires: 'none',
  },
];

const REQUIREMENT_MESSAGES: Record<ReportSectionRequirement, string> = {
  analysis: 'Requiere un análisis calculado en Análisis Fundamental › Formulario.',
  edgar: 'Requiere datos SEC EDGAR cargados desde el formulario (Insights EDGAR).',
  edgarFcf: 'Requiere datos SEC EDGAR con flujo de caja libre positivo en el último año fiscal.',
  history: 'Requiere al menos un análisis guardado en el historial.',
  comparison: 'Requiere al menos 2 empresas seleccionadas en la comparación lado a lado.',
  none: '',
};

function edgarSeries(data: ReportData) {
  return data.edgarFacts ? buildAnnualSeries(data.edgarFacts) : [];
}

export function sectionAvailability(
  def: ReportSectionDef,
  data: ReportData,
): { available: boolean; reason?: string } {
  switch (def.requires) {
    case 'none':
      return { available: true };
    case 'analysis':
      return data.analysis
        ? { available: true }
        : { available: false, reason: REQUIREMENT_MESSAGES.analysis };
    case 'history':
      return data.history.length > 0
        ? { available: true }
        : { available: false, reason: REQUIREMENT_MESSAGES.history };
    case 'comparison':
      return data.compareAnalyses.length >= 2
        ? { available: true }
        : { available: false, reason: REQUIREMENT_MESSAGES.comparison };
    case 'edgar': {
      const series = edgarSeries(data);
      return series.length > 0
        ? { available: true }
        : { available: false, reason: REQUIREMENT_MESSAGES.edgar };
    }
    case 'edgarFcf': {
      const series = edgarSeries(data);
      const latest = series[series.length - 1];
      const hasFcf = latest?.freeCashFlow !== null && latest!.freeCashFlow! > 0;
      return series.length > 0 && hasFcf
        ? { available: true }
        : { available: false, reason: REQUIREMENT_MESSAGES.edgarFcf };
    }
  }
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value);
}

function formatCompactCurrency(value: number | null): string {
  if (value === null) return '—';
  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  if (abs >= 1e9) return `${sign}$${(abs / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `${sign}$${(abs / 1e6).toFixed(1)}M`;
  if (abs >= 1e3) return `${sign}$${(abs / 1e3).toFixed(0)}K`;
  return `${sign}$${abs.toFixed(0)}`;
}

function formatMetricValue(metric: CompanyFundamentalMetric): string {
  if (metric.value === null) return '—';
  if (metric.unit === 'percent') return `${metric.value.toFixed(2)}%`;
  if (metric.unit === 'ratio') return `${metric.value.toFixed(2)}x`;
  if (metric.unit === 'per_share') return `${metric.value.toFixed(2)} por acción`;
  if (metric.unit === 'currency') return formatCurrency(metric.value);
  return metric.value.toLocaleString('es-ES');
}

function statusLabel(status: CompanyFundamentalMetric['status']): string {
  if (status === 'available') return 'Disponible';
  if (status === 'missing') return 'Falta dato';
  return 'No significativo';
}

function opportunityStatusLabel(status: string): string {
  if (status === 'candidate_for_review') return 'Candidata para revisión';
  if (status === 'not_supported') return 'No respaldada';
  return 'Evidencia insuficiente';
}

const GROUP_ACCENTS: Record<ReportSectionGroup, string> = {
  'Análisis Fundamental': '#2563eb',
  'SEC EDGAR': '#4f46e5',
  'Historial y Comparación': '#06b6d4',
  'GMT Terminal': '#059669',
  'Cartera Multi-Plataforma': '#7c3aed',
  'Comparativa de Plataformas': '#d97706',
};

function groupAccent(group: ReportSectionGroup): string {
  return GROUP_ACCENTS[group];
}

const SECTION_BUILDERS: Record<ReportSectionId, (data: ReportData) => string> = {
  'fund-resumen': (data) => {
    const analysis = data.analysis!;
    return `
      <table>
        <tbody>
          <tr><th>Empresa</th><td>${escapeHtml(analysis.companyName)}</td></tr>
          <tr><th>Fecha de referencia</th><td>${escapeHtml(analysis.asOf || 'No indicada')}</td></tr>
          <tr><th>Divisa</th><td>${escapeHtml(analysis.currency)}</td></tr>
          <tr><th>Fuente</th><td>${escapeHtml(analysis.sourceLabel)}</td></tr>
          <tr><th>Cobertura de métricas</th><td>${analysis.coveragePct.toFixed(1)}%</td></tr>
        </tbody>
      </table>`;
  },
  'fund-metricas': (data) => {
    const analysis = data.analysis!;
    const byCategory = analysis.metrics.reduce<Record<string, CompanyFundamentalMetric[]>>((acc, metric) => {
      (acc[metric.category] ??= []).push(metric);
      return acc;
    }, {});
    return Object.entries(byCategory)
      .map(
        ([category, metrics]) => `
      <h3>${escapeHtml(category)}</h3>
      <table>
        <thead><tr><th>Métrica</th><th class="num">Valor</th><th>Estado</th><th>Fórmula</th></tr></thead>
        <tbody>
          ${metrics
            .map(
              (metric) => `<tr>
                <td>${escapeHtml(metric.label)}</td>
                <td class="num">${formatMetricValue(metric)}</td>
                <td>${statusLabel(metric.status)}</td>
                <td>${escapeHtml(metric.formula)}</td>
              </tr>`,
            )
            .join('')}
        </tbody>
      </table>`,
      )
      .join('');
  },
  'fund-senales': (data) => {
    const analysis = data.analysis!;
    if (analysis.healthSignals.length === 0) return '<p>No hay señales generadas (faltan datos de solvencia).</p>';
    return `<ul class="signals">${analysis.healthSignals
      .map(
        (signal) =>
          `<li class="signal severity-${signal.severity}"><strong>${escapeHtml(signal.title)}</strong> — ${escapeHtml(signal.detail)}</li>`,
      )
      .join('')}</ul>`;
  },
  'fund-oportunidad': (data) => {
    const opportunity = data.analysis!.opportunity;
    const evidenceRows = opportunity.evidence
      .map((evidence) => {
        const result = evidence.passed === null ? 'No calculable' : evidence.passed ? 'Cumple' : 'No cumple';
        const value =
          evidence.value === null
            ? '—'
            : evidence.label === 'Cobertura'
              ? `${evidence.value.toFixed(1)}%`
              : evidence.value.toFixed(2);
        return `<tr><td>${escapeHtml(evidence.label)}</td><td class="num">${value}</td><td>${escapeHtml(evidence.condition)}</td><td>${result}</td></tr>`;
      })
      .join('');
    return `
      <p><span class="opp-status status-${escapeHtml(opportunity.status)}">${opportunityStatusLabel(opportunity.status)}</span></p>
      <p><strong>${escapeHtml(opportunity.title)}</strong></p>
      <p>${escapeHtml(opportunity.detail)}</p>
      <table>
        <thead><tr><th>Criterio</th><th class="num">Valor</th><th>Condición</th><th>Resultado</th></tr></thead>
        <tbody>${evidenceRows}</tbody>
      </table>
      <p class="risk">${escapeHtml(opportunity.disclaimer)}</p>`;
  },
  'fund-advertencias': (data) => {
    const warnings = data.analysis!.warnings;
    if (warnings.length === 0) return '<p>No hay advertencias registradas.</p>';
    return `<div class="warnings"><ul>${warnings.map((w) => `<li>${escapeHtml(w)}</li>`).join('')}</ul></div>`;
  },
  'fund-historial': (data) => {
    if (data.history.length === 0) return '<p>No hay análisis guardados en el historial.</p>';
    return `
      <table>
        <thead><tr><th>Empresa</th><th>Guardado</th><th>Fecha ref.</th><th class="num">Cobertura</th></tr></thead>
        <tbody>
          ${data.history
            .map((entry) => {
              const date = new Date(entry.createdAt).toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });
              return `<tr>
                <td>${escapeHtml(entry.analysis.companyName)}</td>
                <td>${escapeHtml(date)}</td>
                <td>${escapeHtml(entry.analysis.asOf || '—')}</td>
                <td class="num">${entry.analysis.coveragePct.toFixed(1)}%</td>
              </tr>`;
            })
            .join('')}
        </tbody>
      </table>`;
  },
  'fund-comparacion': (data) => {
    const analyses = data.compareAnalyses;
    if (analyses.length < 2) return '<p>Selecciona al menos 2 empresas para comparar.</p>';
    const highlights = comparisonHighlights(analyses);
    const rows = buildComparisonRows(analyses);
    return `
      ${highlights.length ? `<div class="warnings">${highlights.map((h) => `<p>${escapeHtml(h)}</p>`).join('')}</div>` : ''}
      <table>
        <thead>
          <tr>
            <th>Métrica</th>
            <th>Categoría</th>
            ${analyses.map((a) => `<th class="num">${escapeHtml(a.companyName)}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${rows
            .map(
              (row) => `<tr>
                <td>${escapeHtml(row.label)}</td>
                <td>${escapeHtml(row.category)}</td>
                ${row.values
                  .map(
                    (value, idx) =>
                      `<td class="num ${row.bestIndex === idx ? 'best' : ''}">${formatComparisonValue(value, row.unit)}</td>`,
                  )
                  .join('')}
              </tr>`,
            )
            .join('')}
        </tbody>
      </table>`;
  },
  'edgar-evolucion': (data) => {
    const series = edgarSeries(data);
    if (series.length === 0) return '<p>Sin datos históricos de EDGAR.</p>';
    return `
      <p>${series.length} años fiscales procedentes de SEC EDGAR.</p>
      <table>
        <thead>
          <tr>
            <th>Ejercicio</th>
            <th class="num">Ingresos</th>
            <th class="num">Beneficio neto</th>
            <th class="num">EBIT</th>
            <th class="num">Flujo de caja libre</th>
            <th class="num">Patrimonio neto</th>
            <th class="num">Activos</th>
            <th class="num">Pasivos</th>
          </tr>
        </thead>
        <tbody>
          ${series
            .map(
              (year) => `<tr>
                <td>${escapeHtml(year.fiscalYearEnd || (year.fiscalYear ? String(year.fiscalYear) : '—'))}</td>
                <td class="num">${formatCompactCurrency(year.revenue)}</td>
                <td class="num">${formatCompactCurrency(year.netIncome)}</td>
                <td class="num">${formatCompactCurrency(year.ebit)}</td>
                <td class="num">${formatCompactCurrency(year.freeCashFlow)}</td>
                <td class="num">${formatCompactCurrency(year.equity)}</td>
                <td class="num">${formatCompactCurrency(year.assets)}</td>
                <td class="num">${formatCompactCurrency(year.liabilities)}</td>
              </tr>`,
            )
            .join('')}
        </tbody>
      </table>`;
  },
  'edgar-calidad': (data) => {
    const series = edgarSeries(data);
    const report = buildAccountingQualityReport(series);
    if (report.checks.length === 0 && !report.beneish) return '<p>Sin datos de calidad contable.</p>';
    const severityLabel = { ok: 'OK', review: 'Revisar', warning: 'Advertencia', unknown: 'No calculable' };
    return `
      <h3>Controles de calidad</h3>
      <table>
        <thead><tr><th>Control</th><th class="num">Valor</th><th>Umbral</th><th>Estado</th><th>Detalle</th></tr></thead>
        <tbody>
          ${report.checks
            .map(
              (check) => `<tr>
                <td>${escapeHtml(check.title)}</td>
                <td class="num">${check.value === null ? '—' : check.value.toFixed(2)}</td>
                <td>${escapeHtml(check.threshold)}</td>
                <td>${severityLabel[check.severity]}</td>
                <td>${escapeHtml(check.detail)}</td>
              </tr>`,
            )
            .join('')}
        </tbody>
      </table>
      ${report.beneish ? `
        <h3>Beneish M-Score</h3>
        <p>M = ${report.beneish.score === null ? 'no calculable' : report.beneish.score.toFixed(3)} (umbral típico: −1.78) · ${escapeHtml(report.beneish.detail)}</p>
        <table>
          <thead><tr><th>Componente</th><th class="num">Valor</th></tr></thead>
          <tbody>
            ${Object.entries(report.beneish.components)
              .map(([key, val]) => `<tr><td>${escapeHtml(key.toUpperCase())}</td><td class="num">${val === null ? 'n/d' : val.toFixed(3)}</td></tr>`)
              .join('')}
          </tbody>
        </table>` : ''}`;
  },
  'edgar-dcf': (data) => {
    const series = edgarSeries(data);
    const latest = series[series.length - 1];
    if (!latest || latest.freeCashFlow === null || latest.freeCashFlow <= 0) {
      return '<p>DCF no disponible: requiere flujo de caja libre positivo en el último año fiscal.</p>';
    }
    const baseWacc = 0.1;
    const baseGrowth = 0.025;
    const netDebt =
      latest.liabilities !== null && latest.equity !== null
        ? Math.max(0, latest.liabilities - latest.equity * 0.3)
        : null;
    const growthRates = [0.1, 0.1, 0.1, 0.07, 0.07, 0.07, 0.05, 0.05, 0.05];
    const matrix = buildSensitivityMatrix(
      {
        year1: latest.freeCashFlow,
        growthRates,
        terminalGrowthRate: baseGrowth,
        wacc: baseWacc,
        sharesOutstanding: null,
        netDebt,
      },
      2,
      2,
      0.01,
      0.005,
    );
    const baseDcf = calculateDCF({
      year1: latest.freeCashFlow,
      growthRates,
      terminalGrowthRate: baseGrowth,
      wacc: baseWacc,
      sharesOutstanding: null,
      netDebt,
    });
    return `
      <p>FCF del último año: <strong>${formatCompactCurrency(latest.freeCashFlow)}</strong> · Valor por acción (base): <strong>${baseDcf.fairValuePerShare !== null ? `$${baseDcf.fairValuePerShare.toFixed(2)}` : '—'}</strong></p>
      <h3>Matriz de sensibilidad (WACC × g)</h3>
      <table>
        <thead>
          <tr>
            <th>WACC \\ g</th>
            ${matrix.growthValues.map((g) => `<th class="num">${(g * 100).toFixed(1)}%</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${matrix.cells
            .map(
              (row, wi) => `<tr>
                <td class="row-head">${(matrix.waccValues[wi] * 100).toFixed(1)}%</td>
                ${row
                  .map((cell, _gi) => {
                    const isBase =
                      Math.abs(cell.wacc - matrix.baseWacc) < 1e-9 &&
                      Math.abs(cell.terminalGrowth - matrix.baseGrowth) < 1e-9;
                    return `<td class="num ${isBase ? 'best' : ''}">${cell.fairValuePerShare !== null ? `$${cell.fairValuePerShare.toFixed(2)}` : '—'}</td>`;
                  })
                  .join('')}
              </tr>`,
            )
            .join('')}
        </tbody>
      </table>`;
  },
  'gmt-cobertura': () => `
    <p>El <strong>GMT Terminal</strong> muestra en tiempo real (pantalla, no persistido en el informe):</p>
    <ul>
      <li>Tape de cotizaciones con variaciones en tiempo real.</li>
      <li>Heatmap de capitalización por sectores.</li>
      <li>Top movers del día.</li>
      <li>Rankings de criptoactivos, índices y divisas (FX).</li>
      <li>Watchlist con seguimiento fijado.</li>
      <li>Sistema de alertas de precio configurables.</li>
    </ul>
    <p class="risk">Estos datos son de carácter dinámico y se consultan directamente en la vista GMT Terminal; no se almacenan para su exportación.</p>`,
  'cartera-estado': () => `
    <p>El módulo de <strong>Cartera Multi-Plataforma</strong> está en desarrollo e incluirá:</p>
    <ul>
      <li>Importación CSV/XLSX de DEGIRO, Interactive Brokers, Trade Republic, MyInvestor y genérico.</li>
      <li>Agregación multi-plataforma con posiciones consolidadas.</li>
      <li>Cálculos: P&amp;L, TWR, XIRR, volatilidad, Sharpe, máximo drawdown y Kelly.</li>
      <li>Cifrado local AES-256-GCM + PBKDF2 (100k iteraciones).</li>
      <li>Persistencia encriptada en localStorage.</li>
    </ul>
    <p class="risk">Módulo pendiente de activación (archivos <code>portfolio-*.ts</code> fuera del compilado principal).</p>`,
  'comp-rendimiento': () => {
    const promedio =
      plataformas.reduce((sum, p) => sum + p.rendimiento, 0) / plataformas.length;
    const mejor = plataformas.reduce((prev, actual) =>
      actual.rendimiento > prev.rendimiento ? actual : prev,
    );
    const peor = plataformas.reduce((prev, actual) =>
      actual.rendimiento < prev.rendimiento ? actual : prev,
    );
    const siNo = (value: boolean) => (value ? 'Sí' : 'No');
    return `
      <p><strong>Rendimiento promedio:</strong> ${promedio.toFixed(2)} / 100 · <strong>Mejor:</strong> ${escapeHtml(mejor.nombre)} (${mejor.rendimiento}) · <strong>Mayor margen de mejora:</strong> ${escapeHtml(peor.nombre)} (${peor.rendimiento})</p>
      <table>
        <thead>
          <tr><th>Plataforma</th><th class="num">Rendimiento</th><th>Sorting</th><th>Filtros</th><th>Paginación</th><th>CSV</th><th>Gráficos</th></tr>
        </thead>
        <tbody>
          ${plataformas
            .map(
              (p) => `<tr>
                <td>${escapeHtml(p.simbolo)} ${escapeHtml(p.nombre)}</td>
                <td class="num">${p.rendimiento} / 100</td>
                <td>${siNo(p.sorting)}</td>
                <td>${siNo(p.filtering)}</td>
                <td>${siNo(p.pagination)}</td>
                <td>${siNo(p.exportCSV)}</td>
                <td>${siNo(p.graficos)}</td>
              </tr>`,
            )
            .join('')}
        </tbody>
      </table>`;
  },
  'comp-funcionalidades': () => {
    const estatusLabel: Record<string, string> = {
      disponible: 'Disponible',
      faltante: 'Faltante',
      pending: 'Pendiente',
    };
    const impactoLabel: Record<string, string> = { alto: 'Alto', medio: 'Medio', bajo: 'Bajo' };
    return `
      <p>${funcionalidadesFaltantes.length} funcionalidades catalogadas.</p>
      <table>
        <thead><tr><th>Funcionalidad</th><th>Plataforma</th><th>Estatus</th><th>Impacto</th></tr></thead>
        <tbody>
          ${funcionalidadesFaltantes
            .map(
              (func) => `<tr>
                <td>${escapeHtml(func.nombre)}</td>
                <td>${escapeHtml(func.plataforma)}</td>
                <td>${estatusLabel[func.estatus] ?? escapeHtml(func.estatus)}</td>
                <td>${impactoLabel[func.impacto] ?? escapeHtml(func.impacto)}</td>
              </tr>`,
            )
            .join('')}
        </tbody>
      </table>`;
  },
};

export function buildIntegratedReportHtml(selectedIds: ReportSectionId[], data: ReportData): string {
  const generatedAtDate = data.generatedAt ?? new Date();
  const generatedAt = generatedAtDate.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  const generatedAtShort = generatedAtDate.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const reportVersion = '1.0.0';

  const included = REPORT_SECTIONS.filter((def) => selectedIds.includes(def.id));
  const availability = new Map(included.map((def) => [def.id, sectionAvailability(def, data)]));
  const availableCount = included.filter((def) => availability.get(def.id)!.available).length;
  const missingCount = included.length - availableCount;
  const notesMap = data.sectionNotes ?? {};

  const coverHtml = `
<section class="cover">
  <div class="cover-bg"></div>
  <div class="cover-content">
    <div class="cover-brand">Portafolio Intel</div>
    <div class="cover-badge">Informe Consolidado · v${escapeHtml(reportVersion)}</div>
    <h1 class="cover-title">Análisis Financiero Integral</h1>
    <p class="cover-subtitle">Documento generado el ${escapeHtml(generatedAt)} con la información disponible en la aplicación</p>
    <div class="cover-meta">
      <div class="cover-meta-item">
        <span class="cover-meta-label">Generado</span>
        <span class="cover-meta-value">${escapeHtml(generatedAtShort)}</span>
     </div>
      <div class="cover-meta-item">
        <span class="cover-meta-label">Apartados</span>
        <span class="cover-meta-value">${included.length} / ${REPORT_SECTIONS.length}</span>
      </div>
      <div class="cover-meta-item">
        <span class="cover-meta-label">Con datos</span>
        <span class="cover-meta-value">${availableCount} / ${included.length}</span>
      </div>
<div class="cover-meta-item">
        <span class="cover-meta-label">Sin datos</span>
        <span class="cover-meta-value">${missingCount}</span>
      </div>
    </div>
    <div class="cover-footer-hint">Documento informativo · No constituye recomendación de inversión</div>
  </div>
</section>`;

  const tocCardsHtml = included
    .map((def, index) => {
      const status = availability.get(def.id)!;
      const accent = groupAccent(def.group);
      const statusClass = status.available ? 'ok' : 'missing';
      const statusLabel = status.available ? 'Con datos' : 'Sin datos';
      const note = notesMap[def.id];
      const noteBadge = note
        ? `<span class="toc-card-note" title="Tiene notas personales">📝</span>`
        : '';
return `<article class="toc-card" style="--accent: ${accent};">
        <div class="toc-card-number">${String(index + 1).padStart(2, '0')}</div>
        <div class="toc-card-body">
          <span class="toc-card-group">${escapeHtml(def.group)}</span>
          <h3>${escapeHtml(def.title)}</h3>
          <p>${escapeHtml(def.description)}</p>
          <div class="toc-card-footer">
            <span class="toc-card-status ${statusClass}">${statusLabel}</span>
            ${noteBadge}
         </div>
        </div>
      </article>`;
    })
    .join('');

const tocHtml = `
<section class="toc-page">
  <div class="page-header">
    <span class="page-step">ÍNDICE</span>
    <h2>Apartados del informe</h2>
    <p>Estos son los apartados incluidos. Cada tarjeta muestra el grupo, una breve descripción y si hay datos disponibles. Pasa el ratón para resaltarla</p>
  </div>
  <div class="toc-grid">${tocCardsHtml}</div>
</section>`;

  const bodyHtml = included
    .map((def, index) => {
      const status = availability.get(def.id)!;
      const accent = groupAccent(def.group);
      const stepNumber = String(index + 1).padStart(2, '0');
      const statusClass = status.available ? 'ok' : 'missing';
      const statusLabel = status.available ? 'Con datos' : 'Sin datos';
      const content = status.available
        ? SECTION_BUILDERS[def.id](data)
        : `<p class="missing">No disponible — ${escapeHtml(status.reason ?? '')}</p>`;
      const note = notesMap[def.id];
      const notesHtml = note
        ? `<div class="notes-section">
            <h3>📝 Notas personales</h3>
            <p>${escapeHtml(note)}</p>
         </div>`
        : '';
      return `<section class="report-section" style="--accent: ${accent};">
        <header class="section-header">
          <div class="section-step">${stepNumber}</div>
          <div class="section-header-text">
            <span class="section-group">${escapeHtml(def.group)}</span>
            <h2>${escapeHtml(def.title)}</h2>
            <p class="section-desc">${escapeHtml(def.description)}</p>
         </div>
          <span class="section-status ${statusClass}">${statusLabel}</span>
       </header>
        <div class="section-body">${content}${notesHtml}</div>
     </section>`;
    })
    .join('');

  const riskRows: string[] = [];
  if (missingCount > 0) {
    riskRows.push(
      `<tr><td><strong>Cobertura</strong></td><td><span class="risk-severity medium">Media</span></td><td>${missingCount} apartado(s) sin datos suficientes para incluirse con contenido</td><td>Cargar análisis, EDGAR o seleccionar más empresas antes de imprimir</td></tr>`,
    );
  }
  if (data.analysis && data.analysis.warnings.length > 0) {
    riskRows.push(
      `<tr><td><strong>Análisis Fundamental</strong></td><td><span class="risk-severity medium">Media</span></td><td>${data.analysis.warnings.length} advertencia(s) reportada(s) por el cálculo</td><td>Revisar definiciones, periodos o completitud de datos del análisis</td></tr>`,
    );
  }
  const series = edgarSeries(data);
  const latest = series[series.length - 1];
  if (data.edgarFacts && latest && latest.freeCashFlow !== null && latest.freeCashFlow <= 0) {
    riskRows.push(
      `<tr><td><strong>SEC EDGAR · DCF</strong></td><td><span class="risk-severity high">Alta</span></td><td>Flujo de caja libre del último año ≤ 0</td><td>La valoración DCF no se calcula con FCF negativo o nulo</td></tr>`,
    );
  }
  if (data.edgarFacts && series.length > 0) {
    const last = series[series.length - 1];
    const prev = series[series.length - 2];
    if (
      last &&
      prev &&
      last.revenue !== null &&
      prev.revenue !== null &&
      last.assets !== null &&
      prev.assets !== null &&
      prev.assets > 0 &&
      Math.abs(last.assets - prev.assets) / prev.assets > 0.5
    ) {
      riskRows.push(
        `<tr><td><strong>SEC EDGAR · Balance</strong></td><td><span class="risk-severity medium">Media</span></td><td>Cambio significativo en el tamaño del balance entre ejercicios</td><td>Revisar si hay reestructuraciones, escisiones o cambios de perímetro</td></tr>`,
      );
    }
  }
  if (data.compareAnalyses.length === 1) {
    riskRows.push(
      `<tr><td><strong>Comparación</strong></td><td><span class="risk-severity low">Baja</span></td><td>Solo 1 empresa seleccionada para la comparación lado a lado</td><td>Añadir al menos una segunda empresa para obtener un análisis comparativo válido</td></tr>`,
    );
  }
  if (riskRows.length === 0) {
    riskRows.push(
      `<tr><td colspan="4" class="risk-empty">✅ No se han detectado riesgos adicionales con los datos disponibles</td></tr>`,
    );
  }

  const riskHtml = `
<section class="page-block risk-block">
  <div class="page-header">
    <span class="page-step" style="--accent: #d97706;">RIESGOS</span>
    <h2>Resumen de riesgos y advertencias</h2>
    <p>Tabla resumen con los riesgos identificados a partir de los datos del informe. Útil para priorizar validaciones antes de tomar decisiones</p>
 </div>
  <table class="risk-table">
    <thead>
      <tr><th>Área</th><th>Severidad</th><th>Hallazgo</th><th>Acción recomendada</th</tr>
   </thead>
    <tbody>${riskRows.join('')}</tbody>
 </table>
</section>`;

  const currentYear = generatedAtDate.getFullYear();
  const refRows: Array<[string, string, string, string]> = [
    [
      'SEC EDGAR',
      '10-K / 10-Q',
      `${currentYear - 5} – ${currentYear}`,
      'Estados financieros anuales y trimestrales de la empresa (ingresos, beneficio, EBIT, FCF, balance).',
    ],
    [
      'Análisis Fundamental',
      'Fórmulas internas',
      `${currentYear}`,
      '16 ratios calculados sobre valoración, rentabilidad, márgenes, solvencia y caja.',
    ],
    [
      'Historial',
      'Análisis guardados',
      '—',
      'Snapshots manuales de análisis previos conservados en el navegador.',
    ],
    [
      'Comparación',
      'Selección lado a lado',
      '—',
      'Métricas comparadas entre 2 y 3 empresas del historial.',
    ],
    [
      'Comparativa de Plataformas',
      'Catálogo interno',
      `${currentYear}`,
      'Funcionalidades declaradas por cada plataforma del comparador.',
    ],
    [
      'GMT Terminal',
      'Datos en tiempo real',
      '—',
      'Cotizaciones, índices, FX y cripto en vivo (no persistido en este documento).',
    ],
  ];
  if (data.edgarFacts) {
    refRows.push([
      String(data.edgarFacts.cik),
      'EDGAR Company Facts',
      String(currentYear),
      'Snapshot puntual de hechos corporativos cargados para esta empresa.',
    ]);
  }

const refHtml = `
<section class="page-block ref-block">
  <div class="page-header">
    <span class="page-step" style="--accent: #4f46e5;">REFERENCIAS</span>
    <h2>Documentos y fuentes de referencia</h2>
    <p>Origen de los datos utilizados en este informe. Cada fila indica la fuente, el tipo de documento y el periodo cubierto</p>
  </div>
  <table class="ref-table">
    <thead>
      <tr><th>Fuente</th><th>Tipo</th><th>Periodo</th><th>Descripción</th></tr>
   </thead>
    <tbody>
      ${refRows
        .map(
          ([src, type, period, desc]) =>
            `<tr><td><strong>${escapeHtml(src)}</strong></td><td>${escapeHtml(type)}</td><td>${escapeHtml(period)}</td><td>${escapeHtml(desc)}</td></tr>`,
        )
        .join('')}
   </tbody>
  </table>
</section>`;

  const suggestions: Array<{ icon: string; title: string; detail: string }> = [];
  if (missingCount > 0) {
    suggestions.push({
      icon: '📥',
      title: 'Cargar datos faltantes',
      detail: `Hay ${missingCount} apartado(s) sin datos. Completa el análisis fundamental, carga EDGAR o añade más empresas al historial para enriquecer el informe.`,
    });
  }
  if (data.edgarFacts) {
    suggestions.push({
      icon: '📊',
      title: 'Revisar la matriz DCF',
      detail:
        'La sensibilidad WACC × g muestra cómo cambia el valor por acción ante distintos escenarios. Úsala para definir bandas de entrada y salida.',
    });
  }
  if (data.analysis) {
    suggestions.push({
      icon: '🧮',
      title: 'Validar señales de salud',
      detail:
        'Compara las señales de solvencia (severity review / attention) con la tendencia multi-año de EDGAR antes de descartar la tesis.',
    });
  }
  if (data.compareAnalyses.length >= 2) {
    suggestions.push({
      icon: '⚖️',
      title: 'Comparar con competidores',
      detail:
        'Resalta los valores "best" en la tabla comparativa para identificar ventaja competitiva relativa (margen, ROE, FCF yield).',
    });
  }
  suggestions.push({
    icon: '🔁',
    title: 'Repetir el análisis periódicamente',
    detail:
      'Los ratios cambian con cada cierre trimestral. Vuelve a generar el informe tras cada 10-Q para detectar deterioros temprano.',
  });
  suggestions.push({
    icon: '🛡️',
    title: 'Aplicar gestión de riesgo',
    detail:
      'Combina este informe con position sizing (Kelly / volatilidad) y stops definidos antes de ejecutar cualquier operación.',
  });
  if (suggestions.length < 4) {
    suggestions.push({
      icon: '📚',
      title: 'Consultar comparativa de plataformas',
      detail:
        'Revisa la sección "Comparativa de Plataformas" para identificar herramientas que automaticen el seguimiento de estas métricas.',
    });
  }

  const suggestionsHtml = `
<section class="page-block suggestions-block">
  <div class="page-header">
    <span class="page-step" style="--accent: #059669;">PRÓXIMOS PASOS</span>
    <h2>Sugerencias para continuar el análisis</h2>
    <p>Lista priorizada de acciones recomendadas a partir de los datos cargados y de la cobertura del informe</p>
 </div>
<div class="suggestions-grid">
    ${suggestions
      .map(
        (s) => `<article class="suggestion-card">
          <div class="suggestion-icon">${s.icon}</div>
          <h3>${escapeHtml(s.title)}</h3>
          <p>${escapeHtml(s.detail)}</p>
       </article>`,
      )
      .join('')}
  </div>
</section>`;

  const footerHtml = `
<footer class="report-footer">
  <div class="footer-row">
    <span><strong>Portafolio Intel</strong> · Informe Consolidado v${escapeHtml(reportVersion)}</span>
    <span>${escapeHtml(generatedAt)}</span>
 </div>
  <p class="footer-disclaimer">
    Este documento es informativo y no constituye una recomendación de compra, venta o inversión.
    Los ratios, señales y valores mostrados dependen de definiciones contables, sector, periodo y calidad de los datos proporcionados.
    Verifica siempre la información con fuentes oficiales (SEC EDGAR, empresa, regulador) antes de tomar decisiones financieras.
 </p>
</footer>`;

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Informe consolidado — Portafolio Intel</title>
<style>
  :root {
    --c-bg: #f5f7fb;
    --c-surface: #ffffff;
    --c-text: #0f172a;
    --c-text-muted: #64748b;
    --c-text-light: #94a3b8;
    --c-primary: #2563eb;
    --c-primary-dark: #1e3a8a;
    --c-accent: #06b6d4;
    --c-success: #059669;
    --c-warning: #d97706;
    --c-danger: #dc2626;
    --c-border: #e5e7eb;
    --c-border-light: #f1f5f9;
    --c-code-bg: #0f172a;
    --c-code-text: #e2e8f0;
    --c-cover-start: #0f172a;
    --c-cover-end: #1e3a8a;
    --shadow-sm: 0 1px 2px rgba(15,23,42,0.05);
    --shadow-md: 0 4px 6px -1px rgba(15,23,42,0.1), 0 2px 4px -2px rgba(15,23,42,0.05);
    --radius-sm: 6px;
    --radius-md: 10px;
    --radius-lg: 16px;
  }
  @page { size: A4; margin: 1.5cm; }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
    color: var(--c-text);
    background: var(--c-bg);
    line-height: 1.55;
    font-size: 11pt;
  }
  h1, h2, h3 { margin: 0; }
  p { margin: 0 0 0.75rem; }
  p:last-child { margin-bottom: 0; }

  /* Cover */
  .cover {
    position: relative;
    min-height: 100vh;
    background: linear-gradient(135deg, var(--c-cover-start) 0%, var(--c-cover-end) 100%);
    color: #ffffff;
    padding: 4rem 3rem;
    display: flex;
    align-items: center;
    justify-content: center;
    page-break-after: always;
    overflow: hidden;
  }
  .cover-bg {
    position: absolute; inset: 0;
    background: radial-gradient(circle at 20% 30%, rgba(6,182,212,0.18) 0%, transparent 50%),
                radial-gradient(circle at 80% 70%, rgba(124,58,237,0.18) 0%, transparent 50%);
    animation: float 8s ease-in-out infinite;
  }
  .cover-content {
    position: relative;
    max-width: 820px;
    text-align: center;
    z-index: 1;
  }
  .cover-brand {
    font-size: 0.85rem;
    letter-spacing: 0.3em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.55);
    margin-bottom: 1.25rem;
    font-weight: 600;
  }
  .cover-badge {
    display: inline-block;
    padding: 0.45rem 1.15rem;
    border-radius: 999px;
    background: rgba(6,182,212,0.15);
    border: 1px solid rgba(6,182,212,0.4);
    color: var(--c-accent);
    font-size: 0.78rem;
    font-weight: 600;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    margin-bottom: 2rem;
    animation: pulse 2.5s ease-in-out infinite;
  }
  .cover-title {
    font-size: 3.4rem;
    margin: 0 0 1rem;
    font-weight: 800;
    letter-spacing: -0.02em;
    line-height: 1.1;
  }
  .cover-subtitle {
    font-size: 1.1rem;
    color: rgba(255,255,255,0.7);
    margin: 0 auto 2.75rem;
    max-width: 620px;
  }
  .cover-meta {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 1rem;
    margin-top: 2rem;
  }
  .cover-meta-item {
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.12);
    border-radius: var(--radius-md);
    padding: 1.1rem 1rem;
    backdrop-filter: blur(4px);
  }
  .cover-meta-label {
    display: block;
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: rgba(255,255,255,0.55);
    margin-bottom: 0.4rem;
    font-weight: 600;
  }
  .cover-meta-value {
    display: block;
    font-size: 1.1rem;
    font-weight: 700;
  }
  .cover-footer-hint {
    margin-top: 3rem;
    font-size: 0.75rem;
    color: rgba(255,255,255,0.5);
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }

  /* Page block (TOC / Risks / Refs / Suggestions) */
  .page-block, .toc-page {
    padding: 2.5rem 3rem;
    page-break-after: always;
  }
  .toc-page { background: var(--c-bg); }
  .page-header {
    margin-bottom: 1.75rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid var(--c-border);
  }
  .page-step {
    --accent: var(--c-accent);
    display: inline-block;
    font-size: 0.72rem;
    font-weight: 700;
    color: var(--accent);
    background: color-mix(in srgb, var(--accent) 12%, transparent);
    padding: 0.3rem 0.85rem;
    border-radius: 999px;
    letter-spacing: 0.12em;
  }
  .page-header h2 {
    font-size: 1.85rem;
    margin: 0.75rem 0 0.5rem;
    color: var(--c-text);
    font-weight: 700;
  }
  .page-header p {
    color: var(--c-text-muted);
    margin: 0;
    max-width: 720px;
  }

  /* TOC card grid */
  .toc-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 1rem;
  }
  .toc-card {
    --accent: var(--c-primary);
    background: var(--c-surface);
    border: 1px solid var(--c-border);
    border-top: 3px solid var(--accent);
    border-radius: var(--radius-md);
    padding: 1.15rem 1.25rem;
    display: flex;
    gap: 0.85rem;
    transition: transform 0.18s ease, box-shadow 0.18s ease;
    box-shadow: var(--shadow-sm);
  }
  .toc-card:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
  }
  .toc-card-number {
    font-size: 1.4rem;
    font-weight: 800;
    color: var(--accent);
    min-width: 2.25rem;
    line-height: 1;
  }
  .toc-card-body { flex: 1; min-width: 0; }
  .toc-card-group {
    font-size: 0.68rem;
    text-transform: uppercase;
    color: var(--c-text-muted);
    letter-spacing: 0.06em;
    font-weight: 600;
  }
  .toc-card-body h3 {
    font-size: 0.98rem;
    margin: 0.3rem 0 0.4rem;
    color: var(--c-text);
    line-height: 1.3;
  }
  .toc-card-body p {
    font-size: 0.82rem;
    color: var(--c-text-muted);
    margin: 0 0 0.7rem;
    line-height: 1.45;
  }
  .toc-card-footer {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .toc-card-status {
    display: inline-block;
    font-size: 0.7rem;
    padding: 0.2rem 0.6rem;
    border-radius: 999px;
    font-weight: 600;
  }
  .toc-card-status.ok {
    background: color-mix(in srgb, var(--c-success) 12%, transparent);
    color: var(--c-success);
  }
  .toc-card-status.missing {
    background: color-mix(in srgb, var(--c-warning) 12%, transparent);
    color: var(--c-warning);
  }
  .toc-card-note { font-size: 0.85rem; }

  /* Report sections */
  .report-section {
    --accent: var(--c-primary);
    background: var(--c-surface);
    border: 1px solid var(--c-border);
    border-top: 3px solid var(--accent);
    border-radius: var(--radius-md);
    padding: 1.75rem 2rem;
    margin: 0 3rem 1.25rem;
    box-shadow: var(--shadow-sm);
    page-break-inside: avoid;
  }
  .section-header {
    display: flex;
    align-items: flex-start;
    gap: 1.1rem;
    margin-bottom: 1.25rem;
    padding-bottom: 0.9rem;
    border-bottom: 1px solid var(--c-border-light);
  }
  .section-step {
    font-size: 1.4rem;
    font-weight: 800;
    color: var(--accent);
    min-width: 2.6rem;
    padding: 0.4rem 0.5rem;
    background: color-mix(in srgb, var(--accent) 10%, transparent);
    border-radius: var(--radius-sm);
    text-align: center;
    line-height: 1;
  }
  .section-header-text { flex: 1; min-width: 0; }
  .section-group {
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--c-text-muted);
    font-weight: 600;
  }
  .section-header h2 {
    font-size: 1.2rem;
    margin: 0.3rem 0 0.35rem;
    color: var(--c-text);
  }
  .section-desc {
    font-size: 0.88rem;
    color: var(--c-text-muted);
    margin: 0;
    line-height: 1.45;
  }
  .section-status {
    font-size: 0.7rem;
    padding: 0.3rem 0.7rem;
    border-radius: 999px;
    font-weight: 600;
    white-space: nowrap;
    align-self: flex-start;
  }
  .section-status.ok {
    background: color-mix(in srgb, var(--c-success) 12%, transparent);
    color: var(--c-success);
  }
  .section-status.missing {
    background: color-mix(in srgb, var(--c-warning) 12%, transparent);
    color: var(--c-warning);
  }

  /* Tables */
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 0.75rem 0 1.25rem;
    font-size: 0.85rem;
  }
  th, td {
    text-align: left;
    padding: 0.55rem 0.7rem;
    border-bottom: 1px solid var(--c-border);
    vertical-align: top;
  }
  thead th {
    background: var(--c-primary);
    color: #ffffff;
    font-weight: 700;
    letter-spacing: 0.02em;
    border-bottom: none;
  }
  tbody tr:nth-child(odd) { background: var(--c-border-light); }
  tbody tr:hover { background: color-mix(in srgb, var(--c-primary) 4%, transparent); }
  .risk-table thead th { background: var(--c-warning); }
  .ref-table thead th { background: var(--c-primary-dark); }
  .num { text-align: right; white-space: nowrap; font-variant-numeric: tabular-nums; }
  .row-head { font-weight: 600; background: var(--c-border-light); }
  .best { font-weight: 700; color: var(--c-success); }

  /* Code */
  code, pre {
    font-family: 'JetBrains Mono', 'SF Mono', Menlo, Consolas, 'Courier New', monospace;
    background: var(--c-code-bg);
    color: var(--c-code-text);
    padding: 0.15rem 0.4rem;
    border-radius: var(--radius-sm);
    font-size: 0.85em;
  }
  pre {
    padding: 1rem;
    overflow-x: auto;
    line-height: 1.5;
    margin: 0.75rem 0;
  }
  pre code { padding: 0; background: transparent; }

  /* Notes */
  .notes-section {
    margin-top: 1.25rem;
    padding: 1rem 1.25rem;
    background: color-mix(in srgb, var(--c-accent) 6%, transparent);
    border-left: 3px solid var(--c-accent);
    border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
  }
  .notes-section h3 {
    font-size: 0.78rem;
    text-transform: uppercase;
    letter-spacing: 0.07em;
    color: var(--c-accent);
    margin: 0 0 0.5rem;
    font-weight: 700;
  }
  .notes-section p {
    margin: 0;
    white-space: pre-wrap;
    color: var(--c-text);
    font-size: 0.9rem;
  }

  /* Signals */
  .signals { list-style: none; padding: 0; margin: 0.5rem 0; }
  .signal {
    padding: 0.65rem 0.9rem;
    border-left: 3px solid var(--c-text-muted);
    margin-bottom: 0.5rem;
    background: var(--c-border-light);
    border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
  }
  .severity-info { border-color: var(--c-primary); }
  .severity-review { border-color: var(--c-warning); }
  .severity-attention { border-color: var(--c-danger); }

  /* Opportunity status */
  .opp-status {
    display: inline-block;
    padding: 0.3rem 0.85rem;
    border-radius: 999px;
    font-size: 0.82rem;
    font-weight: 600;
  }
  .status-candidate_for_review { background: color-mix(in srgb, var(--c-success) 12%, transparent); color: var(--c-success); }
  .status-not_supported { background: color-mix(in srgb, var(--c-danger) 12%, transparent); color: var(--c-danger); }
  .status-insufficient_evidence { background: color-mix(in srgb, var(--c-warning) 12%, transparent); color: var(--c-warning); }

  /* Warnings + missing */
  .warnings {
    color: #92400e;
    background: color-mix(in srgb, var(--c-warning) 6%, transparent);
    border: 1px solid color-mix(in srgb, var(--c-warning) 30%, transparent);
    border-radius: var(--radius-md);
    padding: 0.85rem 1.1rem;
  }
  .missing {
    color: var(--c-warning);
    background: color-mix(in srgb, var(--c-warning) 6%, transparent);
    border-left: 3px solid var(--c-warning);
    padding: 0.7rem 0.9rem;
    border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
  }

  /* Risk table extras */
  .risk-severity {
    display: inline-block;
    font-size: 0.72rem;
    padding: 0.18rem 0.55rem;
    border-radius: 999px;
    font-weight: 700;
    letter-spacing: 0.04em;
  }
  .risk-severity.high { background: color-mix(in srgb, var(--c-danger) 14%, transparent); color: var(--c-danger); }
  .risk-severity.medium { background: color-mix(in srgb, var(--c-warning) 14%, transparent); color: var(--c-warning); }
  .risk-severity.low { background: color-mix(in srgb, var(--c-text-muted) 14%, transparent); color: var(--c-text-muted); }
  .risk-empty { text-align: center; color: var(--c-success); font-weight: 600; padding: 1.25rem !important; }

  /* Suggestions grid */
  .suggestions-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 1rem;
  }
  .suggestion-card {
    background: var(--c-surface);
    border: 1px solid var(--c-border);
    border-radius: var(--radius-md);
    padding: 1.25rem 1.4rem;
    box-shadow: var(--shadow-sm);
    transition: transform 0.18s ease, box-shadow 0.18s ease;
  }
  .suggestion-card:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
  }
  .suggestion-icon {
    font-size: 1.5rem;
    width: 2.75rem;
    height: 2.75rem;
    display: flex;
    align-items: center;
    justify-content: center;
    background: color-mix(in srgb, var(--c-primary) 10%, transparent);
    border-radius: var(--radius-sm);
    margin-bottom: 0.85rem;
  }
  .suggestion-card h3 {
    font-size: 0.98rem;
    margin: 0 0 0.45rem;
    color: var(--c-text);
  }
  .suggestion-card p {
    font-size: 0.83rem;
    color: var(--c-text-muted);
    margin: 0;
    line-height: 1.5;
  }

  /* Footer */
  .report-footer {
    margin: 0 3rem 2rem;
    padding: 1.5rem 2rem;
    background: var(--c-surface);
    border: 1px solid var(--c-border);
    border-top: 3px solid var(--c-primary);
    border-radius: var(--radius-md);
    text-align: center;
  }
  .footer-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.85rem;
    color: var(--c-text-muted);
    margin-bottom: 0.85rem;
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  .footer-row strong { color: var(--c-text); }
  .footer-disclaimer {
    font-size: 0.78rem;
    color: var(--c-text-light);
    font-style: italic;
    margin: 0 auto;
    max-width: 680px;
    line-height: 1.5;
  }

  /* Lists */
  ul { margin: 0.5rem 0 1rem; padding-left: 1.25rem; }
  li { margin-bottom: 0.3rem; }

  /* Animations */
  @keyframes pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.78; transform: scale(0.98); }
  }
  @keyframes float {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-6px); }
  }

  /* Responsive */
  @media (max-width: 768px) {
    .cover { padding: 2.5rem 1.25rem; min-height: auto; }
    .cover-title { font-size: 2.1rem; }
    .cover-subtitle { font-size: 0.95rem; }
    .cover-meta { grid-template-columns: repeat(2, 1fr); gap: 0.75rem; }
    .page-block, .toc-page { padding: 1.5rem 1.25rem; }
    .toc-grid, .suggestions-grid { grid-template-columns: 1fr; }
    .report-section { margin: 0 1.25rem 1rem; padding: 1.25rem; }
    .section-header { flex-direction: column; }
    .report-footer { margin: 0 1.25rem 1.5rem; }
    .footer-row { flex-direction: column; }
  }

  /* Print */
  @media print {
    body { background: #ffffff; }
    .cover { min-height: auto; padding: 3rem 2rem; page-break-after: always; }
    .toc-page, .page-block { page-break-after: always; }
    .report-section { page-break-inside: avoid; box-shadow: none; border-top-width: 3px; }
    table { page-break-inside: avoid; }
    .toc-card:hover, .suggestion-card:hover { transform: none; box-shadow: none; }
    @page { size: A4; margin: 1.5cm; }
  }
</style>
</head>
<body>
${coverHtml}
${tocHtml}
${bodyHtml}
${riskHtml}
${refHtml}
${suggestionsHtml}
${footerHtml}
</body>
</html>`;
}