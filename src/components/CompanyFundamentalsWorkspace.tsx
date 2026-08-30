"use client";

import { Calculator, CircleHelp, Download, ExternalLink, FileWarning, FileText, Info, RefreshCw, ShieldCheck, Sparkles } from "lucide-react";
import { pdf } from "@react-pdf/renderer";
import { useMemo, useState } from "react";
import {
  calculateCompanyFundamentals,
  COMPANY_FUNDAMENTAL_FIELDS,
  CompanyFundamentalFieldKey,
  CompanyFundamentalMetric,
} from "@/lib/company-fundamentals";
import { buildCompanyFundamentalsCsv, companyFundamentalsFilename } from "@/lib/company-fundamentals-export";
import { INFLUENTIAL_INVESTORS } from "@/lib/influential-investors";
import { CompanyFundamentalsPdf } from "@/components/CompanyFundamentalsPdf";

type FundamentalDraft = Record<CompanyFundamentalFieldKey, string>;

const EMPTY_DRAFT: FundamentalDraft = {
  pricePerShare: "",
  sharesOutstanding: "",
  marketCapitalization: "",
  netIncome: "",
  revenue: "",
  costOfRevenue: "",
  ebit: "",
  ebitda: "",
  freeCashFlow: "",
  equity: "",
  totalDebt: "",
  cashAndEquivalents: "",
  interestExpense: "",
  taxRate: "",
  wacc: "",
};

const FIELD_GROUPS = ["Mercado y capital", "Resultados", "Caja", "Capital y deuda", "Supuestos"] as const;

function parseLocalNumber(value: string): number | null {
  const trimmed = value.trim().replace(/\s/g, "");
  if (!trimmed) return null;
  const normalized = trimmed.includes(",")
    ? trimmed.replace(/\./g, "").replace(",", ".")
    : /^-?\d{1,3}(?:\.\d{3})+$/.test(trimmed)
      ? trimmed.replace(/\./g, "")
      : trimmed;
  const number = Number(normalized);
  return Number.isFinite(number) ? number : null;
}

function parseRate(value: string): number | null {
  const number = parseLocalNumber(value);
  return number === null ? null : number / 100;
}

function formatMetric(metric: CompanyFundamentalMetric, currency: string): string {
  if (metric.value === null) return "—";
  if (metric.unit === "percent") return `${new Intl.NumberFormat("es-ES", { maximumFractionDigits: 2 }).format(metric.value)} %`;
  if (metric.unit === "ratio") return `${new Intl.NumberFormat("es-ES", { maximumFractionDigits: 2 }).format(metric.value)}×`;
  try {
    const formatted = new Intl.NumberFormat("es-ES", { style: "currency", currency, maximumFractionDigits: metric.unit === "per_share" ? 4 : 0 }).format(metric.value);
    return metric.unit === "per_share" ? `${formatted} / acción` : formatted;
  } catch {
    return `${new Intl.NumberFormat("es-ES", { maximumFractionDigits: 2 }).format(metric.value)} ${currency}`;
  }
}

function statusLabel(status: CompanyFundamentalMetric["status"]) {
  if (status === "available") return "Calculable";
  if (status === "not_meaningful") return "No significativo";
  return "Falta información";
}

function opportunityLabel(status: "candidate_for_review" | "not_supported" | "insufficient_evidence") {
  if (status === "candidate_for_review") return "Candidata a investigación adicional";
  if (status === "not_supported") return "No respaldada por las reglas actuales";
  return "Evidencia insuficiente";
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

function Tooltip({ metric }: { metric: CompanyFundamentalMetric }) {
  return <span className="formula-tooltip">
    <button aria-label={`Ver fórmula y límites de ${metric.label}`} className="formula-tooltip-trigger" type="button"><CircleHelp size={16} /></button>
    <span className="formula-tooltip-content" role="tooltip">
      <strong>{metric.label}</strong>
      <b>Fórmula</b><span>{metric.formula}</span>
      <b>Qué calcula</b><span>{metric.intent}</span>
      <b>Entradas</b><span>{metric.requiredInputs.join(" · ")}</span>
      <b>Origen</b><span>{metric.source}</span>
    </span>
  </span>;
}

export function CompanyFundamentalsWorkspace() {
  const [companyName, setCompanyName] = useState("");
  const [asOf, setAsOf] = useState("");
  const [currency, setCurrency] = useState("EUR");
  const [sourceLabel, setSourceLabel] = useState("");
  const [draft, setDraft] = useState<FundamentalDraft>(EMPTY_DRAFT);

  const analysis = useMemo(() => calculateCompanyFundamentals({
    companyName,
    asOf,
    currency,
    sourceLabel,
    pricePerShare: parseLocalNumber(draft.pricePerShare),
    sharesOutstanding: parseLocalNumber(draft.sharesOutstanding),
    marketCapitalization: parseLocalNumber(draft.marketCapitalization),
    netIncome: parseLocalNumber(draft.netIncome),
    revenue: parseLocalNumber(draft.revenue),
    costOfRevenue: parseLocalNumber(draft.costOfRevenue),
    ebit: parseLocalNumber(draft.ebit),
    ebitda: parseLocalNumber(draft.ebitda),
    freeCashFlow: parseLocalNumber(draft.freeCashFlow),
    equity: parseLocalNumber(draft.equity),
    totalDebt: parseLocalNumber(draft.totalDebt),
    cashAndEquivalents: parseLocalNumber(draft.cashAndEquivalents),
    interestExpense: parseLocalNumber(draft.interestExpense),
    taxRate: parseRate(draft.taxRate),
    wacc: parseRate(draft.wacc),
  }), [asOf, companyName, currency, draft, sourceLabel]);

  function updateField(key: CompanyFundamentalFieldKey, value: string) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function loadFictionalExample() {
    setCompanyName("Compañía Horizonte (ejemplo ficticio)");
    setAsOf("2026-06-30");
    setCurrency("EUR");
    setSourceLabel("Ejemplo ficticio interno · datos de prueba");
    setDraft({
      pricePerShare: "42,50",
      sharesOutstanding: "100000000",
      marketCapitalization: "",
      netIncome: "315000000",
      revenue: "2400000000",
      costOfRevenue: "1080000000",
      ebit: "470000000",
      ebitda: "620000000",
      freeCashFlow: "285000000",
      equity: "1750000000",
      totalDebt: "980000000",
      cashAndEquivalents: "260000000",
      interestExpense: "58000000",
      taxRate: "25",
      wacc: "8",
    });
  }

  function reset() {
    setCompanyName("");
    setAsOf("");
    setCurrency("EUR");
    setSourceLabel("");
    setDraft(EMPTY_DRAFT);
  }

  function exportCsv() {
    const csv = buildCompanyFundamentalsCsv(analysis);
    downloadBlob(new Blob([csv], { type: "text/csv;charset=utf-8" }), companyFundamentalsFilename(analysis.companyName, "csv"));
  }

  async function exportPdf() {
    const blob = await pdf(<CompanyFundamentalsPdf analysis={analysis} />).toBlob();
    downloadBlob(blob, companyFundamentalsFilename(analysis.companyName, "pdf"));
  }

  const canExport = analysis.coveragePct > 0;

  return <section className="company-fundamentals-workspace" aria-labelledby="fundamentals-title">
    <div className="company-fundamentals-heading">
      <div>
        <p className="eyebrow">Análisis fundamental explicable</p>
        <h2 id="fundamentals-title">Salud financiera y rentabilidad de una empresa</h2>
        <p>Introduce datos de un mismo período y fuente para obtener ratios automáticamente en memoria. El nombre de la empresa no desencadena búsquedas ni envía datos a proveedores externos.</p>
      </div>
      <div className="company-fundamentals-actions">
        <button className="button secondary" onClick={loadFictionalExample} type="button"><Sparkles size={16} />Cargar ejemplo ficticio</button>
        <button className="button secondary" disabled={!canExport} onClick={exportCsv} type="button"><Download size={16} />Exportar CSV</button>
        <button className="button primary" disabled={!canExport} onClick={() => void exportPdf()} type="button"><FileText size={16} />Exportar PDF</button>
        <button className="text-button" onClick={reset} type="button"><RefreshCw size={15} />Limpiar</button>
      </div>
    </div>

    <div className="company-fundamentals-privacy"><ShieldCheck size={18} /><span><strong>Privacidad y alcance.</strong> Los valores introducidos se calculan en el navegador y no se guardan ni sincronizan automáticamente. Esta herramienta es informativa: no genera recomendaciones de compra o venta.</span></div>

    <section className="company-identity-grid" aria-label="Contexto del análisis">
      <label><span>Empresa indicada por la persona usuaria</span><input maxLength={160} onChange={(event) => setCompanyName(event.target.value)} placeholder="Ej. Empresa analizada" value={companyName} /></label>
      <label><span>Fecha de referencia</span><input onChange={(event) => setAsOf(event.target.value)} type="date" value={asOf} /></label>
      <label><span>Divisa de los importes</span><input aria-label="Divisa de los importes" maxLength={3} onChange={(event) => setCurrency(event.target.value.toUpperCase())} placeholder="EUR" value={currency} /></label>
      <label><span>Fuente y período contable</span><input maxLength={240} onChange={(event) => setSourceLabel(event.target.value)} placeholder="Ej. Informe anual 2025, estados consolidados" value={sourceLabel} /></label>
    </section>

    <section className="fundamental-inputs" aria-label="Datos financieros de entrada">
      {FIELD_GROUPS.map((group) => {
        const fields = COMPANY_FUNDAMENTAL_FIELDS.filter((field) => field.group === group);
        return <fieldset key={group} className="fundamental-input-group"><legend>{group}</legend><div className="fundamental-input-grid">{fields.map((field) => <label key={field.key}><span>{field.label}<small>Usado en: {field.requiredFor}</small></span><input aria-label={field.label} inputMode="decimal" onChange={(event) => updateField(field.key, event.target.value)} placeholder={field.key === "taxRate" || field.key === "wacc" ? "Ej. 25" : "0"} value={draft[field.key]} /></label>)}</div></fieldset>;
      })}
    </section>

    <section className="fundamental-results" aria-live="polite">
      <div className="fundamental-results-heading"><div><p className="eyebrow">Cálculo automático local</p><h3>{analysis.companyName}</h3><span>{analysis.asOf ? `Datos a ${analysis.asOf}` : "Añade una fecha de referencia"} · {analysis.sourceLabel}</span></div><div className={`fundamental-coverage ${analysis.coveragePct < 60 ? "partial" : "ready"}`}><strong>{analysis.coveragePct.toLocaleString("es-ES", { maximumFractionDigits: 1 })} %</strong><span>cobertura de métricas</span></div></div>
      <div className="fundamental-category-grid">
        {(["Valoración", "Rentabilidad", "Márgenes", "Solvencia", "Caja"] as const).map((category) => {
          const metrics = analysis.metrics.filter((item) => item.category === category);
          return <article className="fundamental-category" key={category}><h4>{category}</h4><div>{metrics.map((item) => <div className="fundamental-metric" key={item.key}><div><span>{item.label}</span><Tooltip metric={item} /></div><strong className={item.status === "available" ? "" : "muted"}>{formatMetric(item, analysis.currency)}</strong><small className={`metric-status ${item.status}`}>{statusLabel(item.status)}</small>{item.warning && <small className="metric-warning"><FileWarning size={13} />{item.warning}</small>}</div>)}</div></article>;
        })}
      </div>

      <div className="health-signals-panel"><div className="panel-heading"><div><p className="eyebrow">Lectura orientativa</p><h3>Señales de salud financiera</h3></div><span className="data-stamp">Basadas en las fórmulas aportadas</span></div>{analysis.healthSignals.length ? <div className="health-signals-list">{analysis.healthSignals.map((signal) => <article className={signal.severity} key={`${signal.title}-${signal.detail}`}><Info size={17} /><div><strong>{signal.title}</strong><p>{signal.detail}</p></div></article>)}</div> : <div className="fundamental-empty"><Calculator size={22} /><span>Completa deuda, EBITDA, EBIT, intereses, tasa fiscal, patrimonio y WACC para activar las señales calculables.</span></div>}</div>

      <section className={`opportunity-review ${analysis.opportunity.status}`} aria-labelledby="opportunity-title">
        <div className="panel-heading"><div><p className="eyebrow">OPORTUNIDAD</p><h3 id="opportunity-title">{analysis.opportunity.title}</h3></div><span className="data-stamp">{opportunityLabel(analysis.opportunity.status)}</span></div>
        <p className="opportunity-detail">{analysis.opportunity.detail}</p>
        <div className="opportunity-evidence">{analysis.opportunity.evidence.map((evidence) => <article key={evidence.label}><strong>{evidence.label}</strong><span>{evidence.value === null ? "—" : evidence.label === "Cobertura" || evidence.label === "ROIC − WACC" || evidence.label === "Conversión FCF" || evidence.label === "ROE" ? `${evidence.value.toLocaleString("es-ES", { maximumFractionDigits: 2 })} %` : `${evidence.value.toLocaleString("es-ES", { maximumFractionDigits: 2 })}×`}</span><small>{evidence.condition}</small><b className={evidence.passed === null ? "unknown" : evidence.passed ? "passed" : "failed"}>{evidence.passed === null ? "No calculable" : evidence.passed ? "Cumple" : "Revisar"}</b></article>)}</div>
        <div className="opportunity-disclaimer"><ShieldCheck size={17} /><span>{analysis.opportunity.disclaimer}</span></div>
      </section>

      <section className="investor-profiles" aria-labelledby="investor-profiles-title">
        <div className="panel-heading"><div><p className="eyebrow">Referencias de estudio</p><h3 id="investor-profiles-title">Inversores influyentes: fuentes y gráficos públicos</h3></div><span className="data-stamp">No son cartera modelo ni señal operativa</span></div>
        <p className="investor-profiles-intro">Estos perfiles sirven para investigar metodologías y consultar divulgaciones públicas. Las posiciones históricas tienen retrasos, alcance limitado y no permiten reproducir una estrategia ni inferir una recomendación.</p>
        <div className="investor-profile-grid">{INFLUENTIAL_INVESTORS.map((investor) => <article key={investor.name}><div><p>{investor.firm}</p><h4>{investor.name}</h4></div><dl><div><dt>Estilo</dt><dd>{investor.philosophy}</dd></div><div><dt>Hito o contexto</dt><dd>{investor.milestone}</dd></div><div><dt>Por qué estudiarlos</dt><dd>{investor.whyFollow}</dd></div></dl><div className="investor-profile-links"><a href={investor.disclosureUrl} rel="noreferrer" target="_blank"><ExternalLink size={14} />{investor.disclosureLabel}</a><a href={investor.portfolioVisualizationUrl} rel="noreferrer" target="_blank"><ExternalLink size={14} />{investor.portfolioVisualizationLabel}</a></div><small>{investor.disclosureCaveat}</small></article>)}</div>
      </section>

      <div className="fundamental-warnings"><ShieldCheck size={18} /><div><strong>Contexto y límites</strong>{analysis.warnings.map((warning) => <p key={warning}>{warning}</p>)}</div></div>
    </section>
  </section>;
}
