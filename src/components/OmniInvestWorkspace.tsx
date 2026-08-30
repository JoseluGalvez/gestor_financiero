"use client";

import { AlertCircle, CheckCircle2, FileSearch, ShieldCheck, Sparkles } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { type FactorKey, type FactorScores } from "@/lib/financial-analysis";
import { evaluateOmniInvest, OMNIINVEST_FACTORS, omniInvestDemoInput, type OmniInvestInput, type OmniInvestLocalSummary } from "@/lib/omniinvest";

const EMPTY_SCORES: FactorScores = {
  financialHealth: null,
  growth: null,
  valuation: null,
  competitiveAdvantage: null,
  technicalMomentum: null,
  riskManagement: null,
};

function emptyInput(): OmniInvestInput {
  return {
    assetName: "",
    reference: "",
    asOf: "",
    declaredSource: "",
    factorScores: EMPTY_SCORES,
    scope: "manual_local",
  };
}

function readableStatus(status: OmniInvestLocalSummary["status"]): string {
  if (status === "ready") return "Cobertura declarada completa";
  if (status === "partial") return "Cobertura declarada parcial";
  return "Revisión requerida";
}

function scoreLabel(score: number | null): string {
  return score === null ? "—" : `${score.toLocaleString("es-ES", { maximumFractionDigits: 1 })} / 100`;
}

export function OmniInvestWorkspace() {
  const [input, setInput] = useState<OmniInvestInput>(emptyInput);
  const [summary, setSummary] = useState<OmniInvestLocalSummary | null>(null);
  const preview = useMemo(() => evaluateOmniInvest(input), [input]);

  function updateText(field: "assetName" | "reference" | "asOf" | "declaredSource", value: string) {
    setInput((current) => ({ ...current, [field]: value, scope: "manual_local" }));
    setSummary(null);
  }

  function updateScore(key: FactorKey, value: string) {
    const normalized = value.trim().replace(",", ".");
    const nextValue = normalized === "" ? null : Number(normalized);
    setInput((current) => ({
      ...current,
      factorScores: { ...current.factorScores, [key]: nextValue },
      scope: "manual_local",
    }));
    setSummary(null);
  }

  function calculate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSummary(preview);
  }

  function loadDemo() {
    const demo = omniInvestDemoInput();
    setInput(demo);
    setSummary(evaluateOmniInvest(demo));
  }

  const visibleSummary = summary;

  return <section className="omniinvest-workspace">
    <section className="page-heading omniinvest-heading">
      <div>
        <p className="eyebrow">OmniInvest · resumen explicable</p>
        <h1>Une señales declaradas sin ocultar la calidad de los datos.</h1>
        <p className="subtitle">Combina seis dimensiones de análisis en un indicador reproducible. No consulta mercados, no ejecuta órdenes y no genera una recomendación de inversión.</p>
      </div>
      <button className="button secondary" onClick={loadDemo} type="button"><Sparkles size={16} />Cargar escenario ficticio</button>
    </section>

    <section className="omniinvest-safety" aria-label="Límites de OmniInvest">
      <ShieldCheck size={19} />
      <div><strong>Control local y verificable</strong><span>Las entradas se calculan en memoria. Indica fuente y fecha de corte; el modo actual no busca datos externos, no lee tu cartera y no usa IA.</span></div>
    </section>

    <div className="omniinvest-layout">
      <form className="panel omniinvest-form" onSubmit={calculate}>
        <div className="panel-heading"><div><p className="eyebrow">1 · Evidencia declarada</p><h2>Describe el alcance</h2></div><FileSearch size={20} /></div>
        <div className="omniinvest-basics">
          <label><span>Activo o empresa</span><input onChange={(event) => updateText("assetName", event.target.value)} placeholder="Ej. Empresa Horizonte — ejemplo ficticio" required value={input.assetName} /></label>
          <label><span>Referencia opcional</span><input onChange={(event) => updateText("reference", event.target.value)} placeholder="Ticker o ISIN, si está confirmado" value={input.reference} /></label>
          <label><span>Fecha de corte</span><input onChange={(event) => updateText("asOf", event.target.value)} required type="date" value={input.asOf} /></label>
          <label><span>Fuente declarada</span><input onChange={(event) => updateText("declaredSource", event.target.value)} placeholder="Ej. Informe anual, datos introducidos manualmente" required value={input.declaredSource} /></label>
        </div>

        <fieldset className="omniinvest-factor-fieldset">
          <legend>2 · Dimensiones de análisis (0–100)</legend>
          <p>Deja vacía una dimensión si no cuentas con evidencia suficiente. La cobertura se mostrará como parcial en lugar de inventar un dato.</p>
          <div className="omniinvest-factor-grid">
            {OMNIINVEST_FACTORS.map((factor) => <label key={factor.key}>
              <span>{factor.label}</span>
              <input aria-describedby={`${factor.key}-help`} inputMode="decimal" max="100" min="0" onChange={(event) => updateScore(factor.key, event.target.value)} placeholder="Sin dato" step="any" type="number" value={input.factorScores[factor.key] ?? ""} />
              <small id={`${factor.key}-help`}>{factor.helper}</small>
            </label>)}
          </div>
        </fieldset>

        <div className="omniinvest-form-actions"><button className="button primary" type="submit"><CheckCircle2 size={16} />Actualizar resumen local</button><span>Pesos visibles y cálculo determinista.</span></div>
      </form>

      <aside className="panel omniinvest-summary" aria-live="polite">
        <div className="panel-heading"><div><p className="eyebrow">3 · Resultado revisable</p><h2>Indicador de consistencia</h2></div>{visibleSummary && <span className={`omniinvest-status ${visibleSummary.status}`}>{readableStatus(visibleSummary.status)}</span>}</div>
        {!visibleSummary ? <div className="omniinvest-empty"><Sparkles size={27} /><strong>Aún no hay resumen calculado.</strong><span>Completa las entradas o carga el escenario ficticio. Nada se enviará al servidor.</span></div> : <>
          <div className="omniinvest-score-row"><div><span>Indicador ponderado</span><strong>{scoreLabel(visibleSummary.overallScore)}</strong><small>{visibleSummary.assetName}{visibleSummary.reference ? ` · ${visibleSummary.reference}` : ""}</small></div><div className="omniinvest-score-ring" aria-label={`Cobertura ${visibleSummary.coveragePct.toFixed(0)} por ciento`}><b>{visibleSummary.coveragePct.toFixed(0)}%</b><span>cobertura</span></div></div>
          <div className="omniinvest-progress" aria-label="Cobertura de dimensiones"><i style={{ width: `${Math.max(0, Math.min(100, visibleSummary.coveragePct))}%` }} /></div>
          <div className="omniinvest-summary-meta"><span><b>Fecha de corte</b>{visibleSummary.asOf ?? "No válida"}</span><span><b>Fuente</b>{visibleSummary.declaredSource ?? "No indicada"}</span><span><b>Alcance</b>{visibleSummary.scope === "fictitious_demo" ? "Escenario ficticio" : "Entrada manual local"}</span></div>
          <div className="omniinvest-factor-result"><h3>Desglose disponible</h3>{OMNIINVEST_FACTORS.map((factor) => <div key={factor.key}><span>{factor.label}</span><b>{scoreLabel(visibleSummary.factorScores[factor.key] ?? null)}</b></div>)}</div>
          {visibleSummary.warnings.length > 0 && <div className="omniinvest-warnings"><AlertCircle size={17} /><div><strong>Condiciones de interpretación</strong>{visibleSummary.warnings.map((warning) => <p key={warning}>{warning}</p>)}</div></div>}
          <p className="omniinvest-disclaimer">Este resumen no evalúa la suficiencia económica de los supuestos, no estima beneficios y no es una instrucción de compra, venta o asignación de capital.</p>
        </>}
      </aside>
    </div>

    <section className="panel omniinvest-method">
      <div><p className="eyebrow">Cómo se interpreta</p><h2>La interfaz muestra evidencia y límites antes que una conclusión.</h2></div>
      <div className="omniinvest-method-grid"><article><b>1. Reportado</b><span>La persona identifica fuente, fecha de corte y alcance de cada valor.</span></article><article><b>2. Calculado</b><span>El promedio usa pesos visibles y publica la cobertura disponible.</span></article><article><b>3. Bloqueado</b><span>Si falta evidencia esencial o la fecha/escala no es válida, el total no se publica.</span></article></div>
    </section>
  </section>;
}
