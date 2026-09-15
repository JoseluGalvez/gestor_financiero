import type { AnnualDataPoint } from './financial-history';

export type QualitySeverity = 'ok' | 'review' | 'warning' | 'unknown';

export type QualityCheck = {
  id: string;
  title: string;
  severity: QualitySeverity;
  value: number | null;
  threshold: string;
  detail: string;
};

/* ---------- 1. Identidad contable: Activos = Pasivos + Patrimonio ---------- */

export function checkBalanceIdentity(year: AnnualDataPoint): QualityCheck {
  if (year.assets === null || year.liabilities === null || year.equity === null) {
    return {
      id: 'balance-identity',
      title: 'Cuadre del balance (A = P + PN)',
      severity: 'unknown',
      value: null,
      threshold: 'Diferencia < 1 %',
      detail: 'Faltan activos, pasivos o patrimonio para verificar la identidad contable.',
    };
  }
  const left = year.assets;
  const right = year.liabilities + year.equity;
  const diff = Math.abs(left - right);
  const pct = right !== 0 ? (diff / Math.abs(left)) * 100 : 0;
  const severity: QualitySeverity = pct < 1 ? 'ok' : pct < 5 ? 'review' : 'warning';
  return {
    id: 'balance-identity',
    title: 'Cuadre del balance (A = P + PN)',
    severity,
    value: pct,
    threshold: 'Diferencia < 1 %',
    detail: `Activos ${fmt(left)} vs Pasivos+Patrimonio ${fmt(right)}: diferencia ${pct.toFixed(2)} %.`,
  };
}

/* ---------- 2. Accruals (beneficio menos caja) ---------- */

export function checkAccruals(year: AnnualDataPoint): QualityCheck {
  if (year.netIncome === null || year.operatingCashFlow === null || year.assets === null || year.assets === 0) {
    return {
      id: 'accruals',
      title: 'Ratio de accruals',
      severity: 'unknown',
      value: null,
      threshold: '|accruals| < 10 % de activos',
      detail: 'Faltan beneficio, cash flow operativo o activos para medir accruals.',
    };
  }
  const accruals = (year.netIncome - year.operatingCashFlow) / year.assets;
  const pct = accruals * 100;
  const severity: QualitySeverity = Math.abs(pct) < 5 ? 'ok' : Math.abs(pct) < 10 ? 'review' : 'warning';
  return {
    id: 'accruals',
    title: 'Ratio de accruals (Sloan)',
    severity,
    value: pct,
    threshold: '|accruals| < 10 % de activos',
    detail: `Beneficio − FCO = ${fmt(year.netIncome - year.operatingCashFlow)} sobre activos → ${pct.toFixed(2)} %. Accruals altos positivos sugieren beneficios contables no respaldados por caja.`,
  };
}

/* ---------- 3. Beneish M-Score (detección de manipulación contable) ---------- */

export type BeneishComponents = {
  dsri: number | null;
  gmi: number | null;
  aqi: number | null;
  sgi: number | null;
  depi: number | null;
  sgai: number | null;
  lvgi: number | null;
  tata: number | null;
};

export type BeneishResult = {
  score: number | null;
  components: BeneishComponents;
  computableCount: number;
  severity: QualitySeverity;
  detail: string;
};

function ratio(a: number | null, b: number | null): number | null {
  if (a === null || b === null || b === 0) return null;
  return a / b;
}

export function beneishMScore(current: AnnualDataPoint, previous: AnnualDataPoint): BeneishResult {
  // DSRI: Days Sales Receivable Index
  const dsri = (() => {
    const rCY = ratio(current.receivables, current.revenue);
    const rPY = ratio(previous.receivables, previous.revenue);
    return rCY !== null && rPY !== null && rPY !== 0 ? rCY / rPY : null;
  })();

  // GMI: Gross Margin Index
  const gmCY = current.revenue !== null && current.costOfRevenue !== null && current.revenue !== 0
    ? (current.revenue - current.costOfRevenue) / current.revenue : null;
  const gmPY = previous.revenue !== null && previous.costOfRevenue !== null && previous.revenue !== 0
    ? (previous.revenue - previous.costOfRevenue) / previous.revenue : null;
  const gmi = gmCY !== null && gmPY !== null && gmCY !== 0 ? gmPY / gmCY : null;

  // AQI: Asset Quality Index (activos no corrientes distintos de PP&E)
  const aqCY = ratio(
    current.assets !== null && current.currentAssets !== null && current.ppe !== null
      ? current.assets - current.currentAssets - current.ppe : null,
    current.assets,
  );
  const aqPY = ratio(
    previous.assets !== null && previous.currentAssets !== null && previous.ppe !== null
      ? previous.assets - previous.currentAssets - previous.ppe : null,
    previous.assets,
  );
  const aqi = aqCY !== null && aqPY !== null && aqPY !== 0 ? aqCY / aqPY : null;

  // SGI: Sales Growth Index
  const sgi = ratio(current.revenue, previous.revenue);

  // DEPI: Depreciation Index
  const depCY = ratio(current.depreciation, current.depreciation !== null && current.ppe !== null ? current.depreciation + current.ppe : null);
  const depPY = ratio(previous.depreciation, previous.depreciation !== null && previous.ppe !== null ? previous.depreciation + previous.ppe : null);
  const depi = depCY !== null && depPY !== null && depCY !== 0 ? depPY / depCY : null;

  // SGAI: SG&A Index
  const sgai = (() => {
    const sgCY = ratio(current.sgaExpense, current.revenue);
    const sgPY = ratio(previous.sgaExpense, previous.revenue);
    return sgCY !== null && sgPY !== null && sgPY !== 0 ? sgCY / sgPY : null;
  })();

  // LVGI: Leverage Index
  const lvCY = ratio(
    current.liabilities !== null ? current.liabilities : null,
    current.assets,
  );
  const lvPY = ratio(
    previous.liabilities !== null ? previous.liabilities : null,
    previous.assets,
  );
  const lvgi = lvCY !== null && lvPY !== null && lvPY !== 0 ? lvCY / lvPY : null;

  // TATA: Total Accruals to Total Assets
  const tata = (() => {
    if (current.netIncome === null || current.operatingCashFlow === null || current.assets === null) return null;
    return (current.netIncome - current.operatingCashFlow) / current.assets;
  })();

  const components: BeneishComponents = { dsri, gmi, aqi, sgi, depi, sgai, lvgi, tata };

  const computables = [dsri, gmi, aqi, sgi, depi, sgai, lvgi, tata].filter((v) => v !== null) as number[];
  const computableCount = computables.length;

  let score: number | null = null;
  let severity: QualitySeverity = 'unknown';
  let detail: string;

  if (computableCount >= 6) {
    const coefs = { dsri: 0.92, gmi: 0.528, aqi: 0.404, sgi: 0.892, depi: 0.115, sgai: -0.172, tata: 4.679, lvgi: -0.327 };
    score = -4.84
      + (dsri ?? 0) * coefs.dsri + (gmi ?? 0) * coefs.gmi + (aqi ?? 0) * coefs.aqi + (sgi ?? 0) * coefs.sgi
      + (depi ?? 0) * coefs.depi + (sgai ?? 0) * coefs.sgai + (tata ?? 0) * coefs.tata + (lvgi ?? 0) * coefs.lvgi;
    severity = score > -1.78 ? 'warning' : score > -2.22 ? 'review' : 'ok';
    detail = score > -1.78
      ? `M-Score ${score.toFixed(2)} > −1.78: indicios de posible manipulación contable (${computableCount}/8 componentes).`
      : `M-Score ${score.toFixed(2)} ≤ −1.78: sin señales de manipulación (${computableCount}/8 componentes).`;
  } else {
    detail = `Solo ${computableCount}/8 componentes calculables; M-Score requiere al menos 6 para ser orientativo.`;
  }

  return { score, components, computableCount, severity, detail };
}

/* ---------- Informe agregado ---------- */

export type AccountingQualityReport = {
  checks: QualityCheck[];
  beneish: BeneishResult | null;
  fiscalYear: string | null;
  overallSeverity: QualitySeverity;
};

export function buildAccountingQualityReport(series: AnnualDataPoint[]): AccountingQualityReport {
  if (series.length === 0) {
    return { checks: [], beneish: null, fiscalYear: null, overallSeverity: 'unknown' };
  }
  const latest = series[series.length - 1];
  const previous = series.length >= 2 ? series[series.length - 2] : null;

  const checks: QualityCheck[] = [
    checkBalanceIdentity(latest),
    checkAccruals(latest),
  ];

  const beneish = previous ? beneishMScore(latest, previous) : null;
  if (beneish) {
    checks.push({
      id: 'beneish',
      title: 'Beneish M-Score (riesgo de manipulación)',
      severity: beneish.severity,
      value: beneish.score,
      threshold: 'Score ≤ −1.78',
      detail: beneish.detail,
    });
  }

  const severityRank: Record<QualitySeverity, number> = { warning: 3, review: 2, unknown: 1, ok: 0 };
  const overallSeverity = checks.reduce<QualitySeverity>(
    (worst, c) => (severityRank[c.severity] > severityRank[worst] ? c.severity : worst),
    'ok',
  );

  return { checks, beneish, fiscalYear: latest.fiscalYearEnd, overallSeverity };
}

function fmt(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
  if (abs >= 1e3) return `${(value / 1e3).toFixed(1)}K`;
  return value.toFixed(0);
}
