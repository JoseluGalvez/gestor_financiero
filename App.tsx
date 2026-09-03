import { useState } from 'react';
import { calculateCompanyFundamentals, type CompanyFundamentalsInput, type CompanyFundamentalsAnalysis, type CompanyFundamentalFieldKey } from './company-fundamentals';
import { buildCompanyFundamentalsCsv, companyFundamentalsFilename } from './company-fundamentals-export';
import GmtTerminal from './GmtTerminal';

type AppView = 'fundamentals' | 'gmt';

const FIELD_GROUPS = [
  { group: 'Mercado y capital', fields: ['pricePerShare', 'sharesOutstanding', 'marketCapitalization'] as CompanyFundamentalFieldKey[] },
  { group: 'Resultados', fields: ['netIncome', 'revenue', 'costOfRevenue', 'ebit', 'ebitda', 'freeCashFlow'] as CompanyFundamentalFieldKey[] },
  { group: 'Capital y deuda', fields: ['equity', 'totalDebt', 'cashAndEquivalents', 'interestExpense'] as CompanyFundamentalFieldKey[] },
  { group: 'Supuestos', fields: ['taxRate', 'wacc'] as CompanyFundamentalFieldKey[] },
];

const FIELD_LABELS: Record<CompanyFundamentalFieldKey, string> = {
  pricePerShare: 'Precio por acción',
  sharesOutstanding: 'Acciones en circulación',
  marketCapitalization: 'Capitalización bursátil',
  netIncome: 'Beneficio neto',
  revenue: 'Ventas',
  costOfRevenue: 'Coste de ventas',
  ebit: 'EBIT',
  ebitda: 'EBITDA',
  freeCashFlow: 'Flujo de caja libre',
  equity: 'Patrimonio neto',
  totalDebt: 'Deuda financiera total',
  cashAndEquivalents: 'Caja y equivalentes',
  interestExpense: 'Gastos financieros por intereses',
  taxRate: 'Tasa fiscal (%)',
  wacc: 'WACC (%)',
};

const FIELD_HELP: Record<CompanyFundamentalFieldKey, string> = {
  pricePerShare: 'Precio actual de la acción en bolsa',
  sharesOutstanding: 'Número total de acciones emitidas y en circulación',
  marketCapitalization: 'Valor de mercado total (alternativa a precio × acciones)',
  netIncome: 'Beneficio neto del ejercicio',
  revenue: 'Ingresos totales / Ventas netas',
  costOfRevenue: 'Coste directo de los bienes vendidos o servicios prestados',
  ebit: 'Beneficio antes de intereses e impuestos (BAII)',
  ebitda: 'Beneficio antes de intereses, impuestos, depreciaciones y amortizaciones',
  freeCashFlow: 'Flujo de caja libre reportado',
  equity: 'Patrimonio neto / Fondos propios',
  totalDebt: 'Deuda financiera total (corto + largo plazo)',
  cashAndEquivalents: 'Efectivo e inversiones de alta liquidez',
  interestExpense: 'Gastos por intereses en la cuenta de resultados',
  taxRate: 'Tipo impositivo efectivo (ej. 0.25 para 25%)',
  wacc: 'Coste medio ponderado de capital (ej. 0.08 para 8%)',
};

const FIELD_STEP: Record<CompanyFundamentalFieldKey, number> = {
  pricePerShare: 0.01,
  sharesOutstanding: 1,
  marketCapitalization: 1000,
  netIncome: 1000,
  revenue: 1000,
  costOfRevenue: 1000,
  ebit: 1000,
  ebitda: 1000,
  freeCashFlow: 1000,
  equity: 1000,
  totalDebt: 1000,
  cashAndEquivalents: 1000,
  interestExpense: 1000,
  taxRate: 0.01,
  wacc: 0.01,
};

function InputField({ key, value, onChange, error }: { key: CompanyFundamentalFieldKey; value: string; onChange: (key: CompanyFundamentalFieldKey, value: string) => void; error?: string }) {
  const isPercent = key === 'taxRate' || key === 'wacc';
  return (
    <div className={`field ${error ? 'has-error' : ''}`}>
      <label htmlFor={key}>
        <span className="field-label">{FIELD_LABELS[key]}</span>
        <span className="field-help">{FIELD_HELP[key]}</span>
      </label>
      <input
        id={key}
        type="number"
        step={FIELD_STEP[key]}
        value={value}
        onChange={(e) => onChange(key, e.target.value)}
        placeholder={isPercent ? 'ej. 0.25' : ''}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? `${key}-error` : `${key}-help`}
      />
      {error && <span id={`${key}-error`} className="field-error" role="alert">{error}</span>}
      <span id={`${key}-help`} className="field-help-text">{FIELD_HELP[key]}</span>
    </div>
  );
}

function MetricCard({ metric }: { metric: CompanyFundamentalsAnalysis['metrics'][0] }) {
  const statusClass = metric.status === 'available' ? 'status-available' : metric.status === 'missing' ? 'status-missing' : 'status-not-meaningful';
  const formatValue = (v: number | null, unit: string) => {
    if (v === null) return '—';
    if (unit === 'percent') return `${v.toFixed(2)}%`;
    if (unit === 'ratio') return `${v.toFixed(2)}x`;
    if (unit === 'per_share') return `${v.toFixed(2)} por acción`;
    if (unit === 'currency') return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v);
    return v.toLocaleString('es-ES');
  };

  return (
    <div className={`metric-card ${statusClass}`}>
      <div className="metric-header">
        <span className="metric-label">{metric.label}</span>
        <span className={`metric-status ${statusClass}`}>{metric.status === 'available' ? 'Disponible' : metric.status === 'missing' ? 'Falta dato' : 'No significativo'}</span>
      </div>
      <div className="metric-value">{formatValue(metric.value, metric.unit)}</div>
      <details className="metric-details">
        <summary>Detalles</summary>
        <div className="detail-row"><strong>Fórmula:</strong> {metric.formula}</div>
        <div className="detail-row"><strong>Objetivo:</strong> {metric.intent}</div>
        <div className="detail-row"><strong>Entradas requeridas:</strong> {metric.requiredInputs.join(', ')}</div>
        {metric.warning && <div className="detail-row warning"><strong>Advertencia:</strong> {metric.warning}</div>}
      </details>
    </div>
  );
}

function HealthSignal({ signal }: { signal: CompanyFundamentalsAnalysis['healthSignals'][0] }) {
  return (
    <div className={`health-signal severity-${signal.severity}`}>
      <span className="signal-title">{signal.title}</span>
      <span className="signal-detail">{signal.detail}</span>
    </div>
  );
}

function OpportunityCard({ opportunity }: { opportunity: CompanyFundamentalsAnalysis['opportunity'] }) {
  const statusClass = opportunity.status === 'candidate_for_review' ? 'status-candidate' : opportunity.status === 'not_supported' ? 'status-not-supported' : 'status-insufficient';

  return (
    <div className={`opportunity-card ${statusClass}`}>
      <div className="opportunity-header">
        <h3>{opportunity.title}</h3>
        <span className={`opportunity-status ${statusClass}`}>
          {opportunity.status === 'candidate_for_review' ? 'Candidata para revisión' : opportunity.status === 'not_supported' ? 'No respaldada' : 'Evidencia insuficiente'}
        </span>
      </div>
      <p className="opportunity-detail">{opportunity.detail}</p>
      <table className="evidence-table">
        <thead>
          <tr>
            <th>Criterio</th>
            <th>Valor</th>
            <th>Condición</th>
            <th>Resultado</th>
          </tr>
        </thead>
        <tbody>
          {opportunity.evidence.map((ev, i) => (
            <tr key={i}>
              <td>{ev.label}</td>
              <td>{ev.value !== null ? (ev.label === 'Cobertura' ? `${ev.value.toFixed(1)}%` : ev.value.toFixed(2)) : '—'}</td>
              <td>{ev.condition}</td>
              <td className={ev.passed === null ? 'result-na' : ev.passed ? 'result-pass' : 'result-fail'}>
                {ev.passed === null ? 'No calculable' : ev.passed ? '✓ Cumple' : '✗ No cumple'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="disclaimer">{opportunity.disclaimer}</p>
    </div>
  );
}

function Results({ analysis, onExportCsv }: { analysis: CompanyFundamentalsAnalysis; onExportCsv: () => void }) {
  const metricsByCategory = analysis.metrics.reduce((acc, metric) => {
    if (!acc[metric.category]) acc[metric.category] = [];
    acc[metric.category].push(metric);
    return acc;
  }, {} as Record<string, typeof analysis.metrics>);

  return (
    <div className="results">
      <div className="results-header">
        <h2>Informe de Salud Financiera: {analysis.companyName}</h2>
        <div className="results-meta">
          <span>Fecha: {analysis.asOf || 'No indicada'}</span>
          <span>Divisa: {analysis.currency}</span>
          <span>Fuente: {analysis.sourceLabel}</span>
          <span className="coverage">Cobertura: {analysis.coveragePct.toFixed(1)}%</span>
        </div>
        <button className="btn btn-primary" onClick={onExportCsv}>Exportar CSV</button>
      </div>

      <section className="section">
        <h3>Métricas por Categoría</h3>
        <div className="metrics-grid">
          {Object.entries(metricsByCategory).map(([category, metrics]) => (
            <div key={category} className="category-block">
              <h4>{category}</h4>
              {metrics.map((metric) => (
                <MetricCard key={metric.key} metric={metric} />
              ))}
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <h3>Señales de Salud Financiera</h3>
        <div className="signals-list">
          {analysis.healthSignals.length > 0 ? (
            analysis.healthSignals.map((signal, i) => <HealthSignal key={i} signal={signal} />)
          ) : (
            <p className="empty-state">No hay señales generadas (faltan datos de solvencia).</p>
          )}
        </div>
      </section>

      <section className="section">
        <h3>Oportunidad a Revisar</h3>
        <OpportunityCard opportunity={analysis.opportunity} />
      </section>

      {analysis.warnings.length > 0 && (
        <section className="section warnings-section">
          <h3>Advertencias</h3>
          <ul className="warnings-list">
            {analysis.warnings.map((w, i) => <li key={i}>{w}</li>)}
          </ul>
        </section>
      )}
    </div>
  );
}

function Form({ onAnalyze }: { onAnalyze: (input: CompanyFundamentalsInput) => void }) {
  const [formData, setFormData] = useState<Partial<Record<CompanyFundamentalFieldKey, string>>>({});
  const [general, setGeneral] = useState({ companyName: '', asOf: '', currency: 'EUR', sourceLabel: '' });
  const [errors, setErrors] = useState<Partial<Record<CompanyFundamentalFieldKey, string>>>({});

  const validateField = (key: CompanyFundamentalFieldKey, value: string): string | undefined => {
    if (!value) return undefined;
    const num = parseFloat(value);
    if (isNaN(num)) return 'Debe ser un número válido';
    if ((key === 'taxRate' || key === 'wacc') && (num < 0 || num > 1)) return 'Debe estar entre 0 y 1 (ej. 0.25 para 25%)';
    if (['sharesOutstanding', 'pricePerShare', 'marketCapitalization', 'revenue', 'equity', 'totalDebt', 'cashAndEquivalents', 'ebitda', 'interestExpense'].includes(key) && num <= 0) return 'Debe ser mayor que cero';
    return undefined;
  };

  const handleFieldChange = (key: CompanyFundamentalFieldKey, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    const error = validateField(key, value);
    setErrors(prev => ({ ...prev, [key]: error }));
  };

  const handleGeneralChange = (field: keyof typeof general, value: string) => {
    setGeneral(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Partial<Record<CompanyFundamentalFieldKey, string>> = {};
    (Object.keys(formData) as CompanyFundamentalFieldKey[]).forEach(key => {
      const error = validateField(key, formData[key] || '');
      if (error) newErrors[key] = error;
    });
    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) return;

    const input: CompanyFundamentalsInput = {
      companyName: general.companyName,
      asOf: general.asOf,
      currency: general.currency,
      sourceLabel: general.sourceLabel,
      pricePerShare: formData.pricePerShare ? parseFloat(formData.pricePerShare) : undefined,
      sharesOutstanding: formData.sharesOutstanding ? parseFloat(formData.sharesOutstanding) : undefined,
      marketCapitalization: formData.marketCapitalization ? parseFloat(formData.marketCapitalization) : undefined,
      netIncome: formData.netIncome ? parseFloat(formData.netIncome) : undefined,
      equity: formData.equity ? parseFloat(formData.equity) : undefined,
      totalDebt: formData.totalDebt ? parseFloat(formData.totalDebt) : undefined,
      cashAndEquivalents: formData.cashAndEquivalents ? parseFloat(formData.cashAndEquivalents) : undefined,
      ebitda: formData.ebitda ? parseFloat(formData.ebitda) : undefined,
      ebit: formData.ebit ? parseFloat(formData.ebit) : undefined,
      interestExpense: formData.interestExpense ? parseFloat(formData.interestExpense) : undefined,
      revenue: formData.revenue ? parseFloat(formData.revenue) : undefined,
      costOfRevenue: formData.costOfRevenue ? parseFloat(formData.costOfRevenue) : undefined,
      freeCashFlow: formData.freeCashFlow ? parseFloat(formData.freeCashFlow) : undefined,
      taxRate: formData.taxRate ? parseFloat(formData.taxRate) : undefined,
      wacc: formData.wacc ? parseFloat(formData.wacc) : undefined,
    };
    onAnalyze(input);
  };

  return (
    <form className="analysis-form" onSubmit={handleSubmit}>
      <section className="form-section">
        <h3>Datos Generales</h3>
        <div className="general-fields">
          <div className="field">
            <label htmlFor="companyName">Nombre de la empresa *</label>
            <input id="companyName" type="text" value={general.companyName} onChange={(e) => handleGeneralChange('companyName', e.target.value)} required placeholder="Ej. Test Corp" />
          </div>
          <div className="field">
            <label htmlFor="asOf">Fecha de referencia *</label>
            <input id="asOf" type="date" value={general.asOf} onChange={(e) => handleGeneralChange('asOf', e.target.value)} required />
          </div>
          <div className="field">
            <label htmlFor="currency">Divisa</label>
            <select id="currency" value={general.currency} onChange={(e) => handleGeneralChange('currency', e.target.value)}>
              <option value="EUR">EUR</option>
              <option value="USD">USD</option>
              <option value="GBP">GBP</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="sourceLabel">Fuente de los datos *</label>
            <input id="sourceLabel" type="text" value={general.sourceLabel} onChange={(e) => handleGeneralChange('sourceLabel', e.target.value)} required placeholder="Ej. Informe Anual 2024" />
          </div>
        </div>
      </section>

      {FIELD_GROUPS.map(({ group, fields }) => (
        <section key={group} className="form-section">
          <h3>{group}</h3>
          <div className="fields-grid">
            {fields.map((key) => (
              <InputField
                key={key}
                value={formData[key] || ''}
                onChange={handleFieldChange}
                error={errors[key]}
              />
            ))}
          </div>
        </section>
      ))}

      <div className="form-actions">
        <button type="submit" className="btn btn-primary btn-large">Analizar</button>
        <button type="button" className="btn btn-secondary" onClick={() => { setFormData({}); setGeneral({ companyName: '', asOf: '', currency: 'EUR', sourceLabel: '' }); setErrors({}); }}>Limpiar</button>
      </div>
    </form>
  );
}

export default function App() {
  const [view, setView] = useState<AppView>('fundamentals');
  const [analysis, setAnalysis] = useState<CompanyFundamentalsAnalysis | null>(null);

  const handleAnalyze = (input: CompanyFundamentalsInput) => {
    const result = calculateCompanyFundamentals(input);
    setAnalysis(result);
  };

  const handleExportCsv = () => {
    if (!analysis) return;
    const csv = buildCompanyFundamentalsCsv(analysis);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = companyFundamentalsFilename(analysis.companyName, 'csv');
    link.click();
    URL.revokeObjectURL(url);
  };

  const moduleNav = (
    <nav className="module-nav" aria-label="Módulos de Portafolio Intel">
      <button className={view === 'fundamentals' ? 'module-nav-item active' : 'module-nav-item'} onClick={() => setView('fundamentals')}>Análisis Fundamental</button>
      <button className={view === 'gmt' ? 'module-nav-item active' : 'module-nav-item'} onClick={() => setView('gmt')}>GMT Terminal</button>
    </nav>
  );

  if (view === 'gmt') {
    return (
      <div className="app app--terminal">
        {moduleNav}
        <GmtTerminal />
      </div>
    );
  }

  return (
    <div className="app">
      {moduleNav}
      <header className="app-header">
        <h1>Análisis Fundamental de Empresas</h1>
        <p className="subtitle">Introduce los datos financieros para obtener ratios, señales de salud y evaluación de oportunidad</p>
      </header>
      <main className="app-main">
        <div className="layout">
          <aside className="sidebar">
            <Form onAnalyze={handleAnalyze} />
          </aside>
          <div className="content">
            {analysis ? <Results analysis={analysis} onExportCsv={handleExportCsv} /> : (
              <div className="empty-state-large">
                <h3>Bienvenido</h3>
                <p>Completa el formulario con los datos financieros de la empresa y pulsa <strong>Analizar</strong>.</p>
                <p>El motor calcula 16 ratios (valoración, rentabilidad, márgenes, solvencia, caja), genera señales de salud y evalúa si la empresa es candidata para investigación adicional.</p>
              </div>
            )}
          </div>
        </div>
      </main>
      <footer className="app-footer">
        <p>Los ratios son informativos y dependen de definiciones contables, sector, periodo y calidad de los datos. No constituyen una recomendación de compra, venta o inversión.</p>
      </footer>
    </div>
  );
}