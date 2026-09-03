export type CompanyFundamentalKey =
  | "eps"
  | "marketCapitalization"
  | "netDebt"
  | "enterpriseValue"
  | "per"
  | "evToEbitda"
  | "priceToFcf"
  | "roe"
  | "roic"
  | "roicWaccSpread"
  | "grossMargin"
  | "operatingMargin"
  | "netMargin"
  | "netDebtToEbitda"
  | "interestCoverage"
  | "fcfConversion";

export type CompanyFundamentalsInput = {
  companyName: string;
  asOf: string;
  currency: string;
  sourceLabel: string;
  pricePerShare?: number | null;
  sharesOutstanding?: number | null;
  marketCapitalization?: number | null;
  netIncome?: number | null;
  equity?: number | null;
  totalDebt?: number | null;
  cashAndEquivalents?: number | null;
  ebitda?: number | null;
  ebit?: number | null;
  interestExpense?: number | null;
  revenue?: number | null;
  costOfRevenue?: number | null;
  freeCashFlow?: number | null;
  taxRate?: number | null;
  wacc?: number | null;
};

export type MetricStatus = "available" | "missing" | "not_meaningful";
export type MetricUnit = "currency" | "ratio" | "percent" | "per_share";

export type CompanyFundamentalMetric = {
  key: CompanyFundamentalKey;
  label: string;
  category: "Valoración" | "Rentabilidad" | "Márgenes" | "Solvencia" | "Caja";
  value: number | null;
  unit: MetricUnit;
  status: MetricStatus;
  formula: string;
  intent: string;
  requiredInputs: string[];
  source: string;
  warning: string | null;
};

export type FinancialHealthSignal = {
  severity: "info" | "review" | "attention";
  title: string;
  detail: string;
};

export type CompanyOpportunityStatus = "candidate_for_review" | "not_supported" | "insufficient_evidence";

export type CompanyOpportunityEvidence = {
  label: string;
  value: number | null;
  condition: string;
  passed: boolean | null;
};

export type CompanyOpportunity = {
  status: CompanyOpportunityStatus;
  title: string;
  detail: string;
  evidence: CompanyOpportunityEvidence[];
  disclaimer: string;
};

export type CompanyFundamentalsAnalysis = {
  companyName: string;
  asOf: string;
  currency: string;
  sourceLabel: string;
  coveragePct: number;
  metrics: CompanyFundamentalMetric[];
  healthSignals: FinancialHealthSignal[];
  opportunity: CompanyOpportunity;
  warnings: string[];
};

const FORMULA_SOURCE = "Archivo aportado por la persona usuaria: pasted_content.txt";

function finite(value: number | null | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function rounded(value: number | null, digits = 4): number | null {
  return value === null || !Number.isFinite(value) ? null : Number(value.toFixed(digits));
}

function metric(
  key: CompanyFundamentalKey,
  label: string,
  category: CompanyFundamentalMetric["category"],
  unit: MetricUnit,
  formula: string,
  intent: string,
  requiredInputs: string[],
  value: number | null,
  warning: string | null = null,
): CompanyFundamentalMetric {
  return {
    key,
    label,
    category,
    value: rounded(value),
    unit,
    status: value === null ? (warning ? "not_meaningful" : "missing") : "available",
    formula,
    intent,
    requiredInputs,
    source: FORMULA_SOURCE,
    warning,
  };
}

function positive(value: number | null | undefined): value is number {
  return finite(value) && value > 0;
}

function safeDivide(numerator: number | null | undefined, denominator: number | null | undefined): number | null {
  return finite(numerator) && finite(denominator) && denominator !== 0 ? numerator / denominator : null;
}

function unavailableBecause(inputs: Array<number | null | undefined>, reason: string): string | null {
  return inputs.every(finite) ? reason : null;
}

function buildOpportunity(metrics: CompanyFundamentalMetric[], coveragePct: number): CompanyOpportunity {
  const valueFor = (key: CompanyFundamentalKey) => metrics.find((item) => item.key === key)?.value ?? null;
  const leverage = valueFor("netDebtToEbitda");
  const interestCoverage = valueFor("interestCoverage");
  const roicSpread = valueFor("roicWaccSpread");
  const fcfConversion = valueFor("fcfConversion");
  const roe = valueFor("roe");
  const evidence: CompanyOpportunityEvidence[] = [
    { label: "Cobertura", value: coveragePct, condition: "Cobertura de métricas ≥ 80 %", passed: coveragePct >= 80 },
    { label: "ROIC − WACC", value: roicSpread, condition: "Diferencial positivo", passed: roicSpread === null ? null : roicSpread > 0 },
    { label: "Deuda neta / EBITDA", value: leverage, condition: "Inferior a 2,0× como referencia orientativa", passed: leverage === null ? null : leverage < 2 },
    { label: "Cobertura de intereses", value: interestCoverage, condition: "Igual o superior a 3,0×", passed: interestCoverage === null ? null : interestCoverage >= 3 },
    { label: "Conversión FCF", value: fcfConversion, condition: "Igual o superior a 80 %", passed: fcfConversion === null ? null : fcfConversion >= 80 },
    { label: "ROE", value: roe, condition: "Igual o superior a 12 % como referencia sectorial orientativa", passed: roe === null ? null : roe >= 12 },
  ];
  const measurableSignals = evidence.slice(1).filter((item) => item.passed !== null);
  const passedSignals = measurableSignals.filter((item) => item.passed).length;
  const redFlag = leverage !== null && leverage > 2.5 || interestCoverage !== null && interestCoverage < 3 || roicSpread !== null && roicSpread < 0;
  const disclaimer = "Esta sección no estima la probabilidad de beneficios ni emite una recomendación. Una señal favorable solo indica que los datos introducidos justifican revisar valoración, riesgos, competencia, gobierno corporativo y horizonte temporal con fuentes actualizadas.";

  if (coveragePct < 80 || measurableSignals.length < 4) {
    return { status: "insufficient_evidence", title: "Evidencia insuficiente para clasificar una oportunidad", detail: "Faltan métricas críticas o cobertura suficiente. Completa datos de rentabilidad, deuda, intereses, flujo de caja y coste de capital antes de usar esta ficha como punto de partida de investigación.", evidence, disclaimer };
  }
  if (redFlag) {
    return { status: "not_supported", title: "Los datos actuales no respaldan una oportunidad a revisar", detail: "Hay al menos una señal de solvencia o creación de valor que requiere análisis previo. La herramienta no compensa esta alerta con otros ratios favorables.", evidence, disclaimer };
  }
  if (passedSignals >= 4) {
    return { status: "candidate_for_review", title: "Candidata para investigación adicional", detail: "La cobertura y las señales contables introducidas son coherentes con una revisión más profunda. Antes de cualquier decisión, contrasta valoración, riesgos, calidad de beneficios, comparables, ciclo y fuentes actualizadas.", evidence, disclaimer };
  }
  return { status: "not_supported", title: "Las señales no alcanzan el umbral de revisión", detail: "La información disponible no reúne suficientes señales favorables bajo las reglas configuradas. Revisa el período, comparables y calidad de los datos antes de extraer conclusiones.", evidence, disclaimer };
}

export function calculateCompanyFundamentals(input: CompanyFundamentalsInput): CompanyFundamentalsAnalysis {
  const warnings: string[] = [];
  const marketCapitalization = positive(input.marketCapitalization)
    ? input.marketCapitalization
    : positive(input.pricePerShare) && positive(input.sharesOutstanding)
      ? input.pricePerShare * input.sharesOutstanding
      : null;
  const netDebt = finite(input.totalDebt) && finite(input.cashAndEquivalents)
    ? input.totalDebt - input.cashAndEquivalents
    : null;
  const enterpriseValue = marketCapitalization !== null && netDebt !== null ? marketCapitalization + netDebt : null;
  const eps = safeDivide(input.netIncome, input.sharesOutstanding);
  const nopat = finite(input.ebit) && finite(input.taxRate) && input.taxRate >= 0 && input.taxRate <= 1
    ? input.ebit * (1 - input.taxRate)
    : null;
  const investedCapital = finite(input.equity) && netDebt !== null ? input.equity + netDebt : null;

  const metrics: CompanyFundamentalMetric[] = [
    metric(
      "eps",
      "Beneficio por acción (BPA)",
      "Valoración",
      "per_share",
      "BPA = Beneficio neto / Acciones en circulación",
      "Es la base por acción utilizada por el PER; muestra el beneficio atribuible por acción.",
      ["Beneficio neto", "Acciones en circulación"],
      eps,
      unavailableBecause([input.netIncome, input.sharesOutstanding], "Se requieren beneficio neto y acciones en circulación; las acciones deben ser mayores que cero."),
    ),
    metric(
      "marketCapitalization",
      "Capitalización bursátil",
      "Valoración",
      "currency",
      "Capitalización = Precio por acción × Acciones en circulación",
      "Aproxima el valor de mercado del patrimonio de la empresa. Puede introducirse directamente o calcularse con precio y acciones.",
      ["Precio por acción y acciones, o capitalización directa"],
      marketCapitalization,
      marketCapitalization === null ? "Se requiere capitalización directa o precio por acción junto con acciones en circulación." : null,
    ),
    metric(
      "netDebt",
      "Deuda financiera neta",
      "Solvencia",
      "currency",
      "Deuda neta = Deuda financiera total − Caja y equivalentes",
      "Mide deuda después de descontar la caja disponible. Un valor negativo representa caja neta.",
      ["Deuda financiera total", "Caja y equivalentes"],
      netDebt,
      unavailableBecause([input.totalDebt, input.cashAndEquivalents], "Se requieren deuda financiera total y caja/equivalentes."),
    ),
    metric(
      "enterpriseValue",
      "Valor empresa (EV)",
      "Valoración",
      "currency",
      "EV = Capitalización bursátil + Deuda neta",
      "Aproxima el valor de las operaciones antes de considerar cómo se financian entre deuda y patrimonio.",
      ["Capitalización bursátil", "Deuda neta"],
      enterpriseValue,
      enterpriseValue === null ? "Se requieren capitalización bursátil y deuda neta." : null,
    ),
    metric(
      "per",
      "PER",
      "Valoración",
      "ratio",
      "PER = Precio por acción / BPA",
      "Relaciona el precio de la acción con el beneficio por acción. No determina por sí solo si una acción está cara o barata.",
      ["Precio por acción", "Beneficio por acción positivo"],
      positive(input.pricePerShare) && positive(eps) ? input.pricePerShare / eps : null,
      positive(eps) ? (positive(input.pricePerShare) ? null : "Se requiere precio por acción positivo.") : "El PER no es significativo con BPA nulo o negativo.",
    ),
    metric(
      "evToEbitda",
      "EV / EBITDA",
      "Valoración",
      "ratio",
      "EV / EBITDA = (Capitalización bursátil + Deuda neta) / EBITDA",
      "Compara el valor de empresa con el beneficio operativo antes de intereses, impuestos, depreciaciones y amortizaciones.",
      ["Valor empresa", "EBITDA positivo"],
      enterpriseValue !== null && positive(input.ebitda) ? enterpriseValue / input.ebitda : null,
      enterpriseValue === null ? "Se requiere valor empresa." : "EV/EBITDA no es significativo si el EBITDA no es positivo.",
    ),
    metric(
      "priceToFcf",
      "P / FCF",
      "Valoración",
      "ratio",
      "P/FCF = Capitalización bursátil / Flujo de caja libre",
      "Relaciona el valor de mercado del patrimonio con el flujo de caja libre reportado.",
      ["Capitalización bursátil", "Flujo de caja libre positivo"],
      marketCapitalization !== null && positive(input.freeCashFlow) ? marketCapitalization / input.freeCashFlow : null,
      marketCapitalization === null ? "Se requiere capitalización bursátil." : "P/FCF no es significativo si el flujo de caja libre no es positivo.",
    ),
    metric(
      "roe",
      "ROE",
      "Rentabilidad",
      "percent",
      "ROE = (Beneficio neto / Patrimonio neto) × 100",
      "Mide la rentabilidad contable obtenida sobre los fondos propios. Debe compararse con el histórico y con empresas comparables.",
      ["Beneficio neto", "Patrimonio neto positivo"],
      finite(input.netIncome) && positive(input.equity) ? (input.netIncome / input.equity) * 100 : null,
      positive(input.equity) ? (finite(input.netIncome) ? null : "Se requiere beneficio neto.") : "El ROE no es significativo con patrimonio neto nulo o negativo.",
    ),
    metric(
      "roic",
      "ROIC",
      "Rentabilidad",
      "percent",
      "ROIC = [EBIT × (1 − Tasa fiscal)] / (Patrimonio neto + Deuda financiera neta) × 100",
      "Mide el retorno operativo después de impuestos sobre el capital invertido. Requiere una definición consistente de deuda y capital.",
      ["EBIT", "Tasa fiscal", "Patrimonio neto", "Deuda financiera neta", "Capital invertido positivo"],
      nopat !== null && positive(investedCapital) ? (nopat / investedCapital) * 100 : null,
      nopat === null ? "Se requieren EBIT y tasa fiscal entre 0 % y 100 %." : "El ROIC no es significativo si el capital invertido no es positivo.",
    ),
    metric(
      "roicWaccSpread",
      "Diferencial ROIC − WACC",
      "Rentabilidad",
      "percent",
      "Diferencial = ROIC − WACC",
      "Compara el retorno sobre capital invertido con el coste de capital introducido. Es un indicador de creación o destrucción de valor bajo esos supuestos.",
      ["ROIC", "WACC"],
      nopat !== null && positive(investedCapital) && finite(input.wacc) && input.wacc >= 0 && input.wacc <= 1 ? ((nopat / investedCapital) - input.wacc) * 100 : null,
      finite(input.wacc) && (input.wacc < 0 || input.wacc > 1) ? "El WACC debe introducirse entre 0 % y 100 %." : "Se requieren ROIC calculable y WACC opcional para calcular el diferencial.",
    ),
    metric(
      "grossMargin",
      "Margen bruto",
      "Márgenes",
      "percent",
      "Margen bruto = [(Ventas − Coste de ventas) / Ventas] × 100",
      "Resume el margen después del coste directo de ventas; ayuda a observar capacidad de precios y estructura de costes directos.",
      ["Ventas positivas", "Coste de ventas"],
      positive(input.revenue) && finite(input.costOfRevenue) ? ((input.revenue - input.costOfRevenue) / input.revenue) * 100 : null,
      positive(input.revenue) ? (finite(input.costOfRevenue) ? null : "Se requiere coste de ventas.") : "Se requieren ventas positivas.",
    ),
    metric(
      "operatingMargin",
      "Margen operativo (EBIT)",
      "Márgenes",
      "percent",
      "Margen operativo = (EBIT / Ventas) × 100",
      "Mide el margen de la actividad operativa antes de costes financieros e impuestos.",
      ["EBIT", "Ventas positivas"],
      finite(input.ebit) && positive(input.revenue) ? (input.ebit / input.revenue) * 100 : null,
      positive(input.revenue) ? (finite(input.ebit) ? null : "Se requiere EBIT.") : "Se requieren ventas positivas.",
    ),
    metric(
      "netMargin",
      "Margen neto",
      "Márgenes",
      "percent",
      "Margen neto = (Beneficio neto / Ventas) × 100",
      "Mide la parte de las ventas que queda como beneficio neto en el periodo informado.",
      ["Beneficio neto", "Ventas positivas"],
      finite(input.netIncome) && positive(input.revenue) ? (input.netIncome / input.revenue) * 100 : null,
      positive(input.revenue) ? (finite(input.netIncome) ? null : "Se requiere beneficio neto.") : "Se requieren ventas positivas.",
    ),
    metric(
      "netDebtToEbitda",
      "Deuda neta / EBITDA",
      "Solvencia",
      "ratio",
      "Deuda neta / EBITDA = (Deuda financiera total − Caja y equivalentes) / EBITDA",
      "Aproxima la carga de deuda frente a la capacidad operativa de generar EBITDA. Los rangos dependen del sector y del ciclo.",
      ["Deuda neta", "EBITDA positivo"],
      netDebt !== null && positive(input.ebitda) ? netDebt / input.ebitda : null,
      netDebt === null ? "Se requiere deuda neta." : "La ratio no es significativa si el EBITDA no es positivo.",
    ),
    metric(
      "interestCoverage",
      "Cobertura de intereses",
      "Solvencia",
      "ratio",
      "Cobertura de intereses = EBIT / Gastos financieros por intereses",
      "Mide cuántas veces el EBIT cubre los intereses reportados. No sustituye la revisión de vencimientos ni liquidez.",
      ["EBIT", "Gastos financieros por intereses positivos"],
      finite(input.ebit) && positive(input.interestExpense) ? input.ebit / input.interestExpense : null,
      positive(input.interestExpense) ? (finite(input.ebit) ? null : "Se requiere EBIT.") : "Se requieren gastos financieros por intereses mayores que cero.",
    ),
    metric(
      "fcfConversion",
      "Conversión de FCF",
      "Caja",
      "percent",
      "Conversión FCF = (Flujo de caja libre / Beneficio neto) × 100",
      "Indica el grado en que el beneficio neto se convierte en flujo de caja libre reportado en el mismo periodo.",
      ["Flujo de caja libre", "Beneficio neto positivo"],
      finite(input.freeCashFlow) && positive(input.netIncome) ? (input.freeCashFlow / input.netIncome) * 100 : null,
      positive(input.netIncome) ? (finite(input.freeCashFlow) ? null : "Se requiere flujo de caja libre.") : "La conversión no es significativa con beneficio neto nulo o negativo.",
    ),
  ];

  const availableMetrics = metrics.filter((item) => item.status === "available");
  const coveragePct = metrics.length ? (availableMetrics.length / metrics.length) * 100 : 0;
  const valueFor = (key: CompanyFundamentalKey) => metrics.find((item) => item.key === key)?.value ?? null;
  const healthSignals: FinancialHealthSignal[] = [];
  const leverage = valueFor("netDebtToEbitda");
  if (leverage !== null) {
    if (leverage > 2.5) healthSignals.push({ severity: "attention", title: "Apalancamiento por encima de la referencia orientativa", detail: `Deuda neta/EBITDA: ${rounded(leverage, 2)}×. El material aportado menciona 2,0–2,5× como rango orientativo; debe ajustarse al sector, ciclo y vencimientos.` });
    else if (leverage >= 2) healthSignals.push({ severity: "review", title: "Apalancamiento dentro de una franja a revisar", detail: `Deuda neta/EBITDA: ${rounded(leverage, 2)}×. El rango orientativo no sustituye la revisión del negocio y la estructura de deuda.` });
    else healthSignals.push({ severity: "info", title: "Apalancamiento por debajo de la referencia orientativa", detail: `Deuda neta/EBITDA: ${rounded(leverage, 2)}×. Es una señal descriptiva, no una calificación de riesgo completa.` });
  }
  const interestCoverage = valueFor("interestCoverage");
  if (interestCoverage !== null) {
    if (interestCoverage < 3) healthSignals.push({ severity: "attention", title: "Cobertura de intereses inferior a 3×", detail: `Cobertura: ${rounded(interestCoverage, 2)}×. El archivo aportado identifica este nivel como señal de riesgo financiero; requiere revisar vencimientos y liquidez.` });
    else healthSignals.push({ severity: "info", title: "Cobertura de intereses calculable", detail: `Cobertura: ${rounded(interestCoverage, 2)}×. Debe analizarse con volatilidad de EBIT, vencimientos y caja.` });
  }
  const roicSpread = valueFor("roicWaccSpread");
  if (roicSpread !== null) healthSignals.push({ severity: roicSpread < 0 ? "attention" : "info", title: roicSpread < 0 ? "ROIC inferior al WACC introducido" : "ROIC superior al WACC introducido", detail: `Diferencial: ${rounded(roicSpread, 2)} puntos porcentuales. La lectura depende de que EBIT, tasa fiscal, capital invertido y WACC se hayan definido de forma consistente.` });
  const opportunity = buildOpportunity(metrics, coveragePct);
  if (coveragePct < 60) warnings.push("La cobertura de métricas es inferior al 60 %. El resultado debe interpretarse como una plantilla parcial, no como un diagnóstico completo.");
  if (!input.companyName.trim()) warnings.push("Indica el nombre de la empresa para identificar el análisis; el nombre no valida ni recupera datos externos.");
  if (!input.asOf) warnings.push("Indica la fecha de referencia de los estados financieros o cotización introducidos.");
  if (!input.sourceLabel.trim()) warnings.push("Documenta la fuente y el periodo de los datos antes de comparar resultados.");
  warnings.push("Los ratios son informativos y dependen de definiciones contables, sector, periodo y calidad de los datos. No constituyen una recomendación de compra, venta o inversión.");

  return {
    companyName: input.companyName.trim() || "Empresa sin identificar",
    asOf: input.asOf,
    currency: input.currency || "EUR",
    sourceLabel: input.sourceLabel.trim() || "Fuente no documentada",
    coveragePct: rounded(coveragePct, 1) ?? 0,
    metrics,
    healthSignals,
    opportunity,
    warnings,
  };
}

export const COMPANY_FUNDAMENTAL_FIELDS = [
  { key: "pricePerShare", label: "Precio por acción", group: "Mercado y capital", requiredFor: "PER y capitalización" },
  { key: "sharesOutstanding", label: "Acciones en circulación", group: "Mercado y capital", requiredFor: "BPA y capitalización" },
  { key: "marketCapitalization", label: "Capitalización bursátil", group: "Mercado y capital", requiredFor: "EV, EV/EBITDA y P/FCF" },
  { key: "netIncome", label: "Beneficio neto", group: "Resultados", requiredFor: "BPA, ROE, margen neto y conversión FCF" },
  { key: "revenue", label: "Ventas", group: "Resultados", requiredFor: "Márgenes" },
  { key: "costOfRevenue", label: "Coste de ventas", group: "Resultados", requiredFor: "Margen bruto" },
  { key: "ebit", label: "EBIT", group: "Resultados", requiredFor: "ROIC, margen operativo y cobertura de intereses" },
  { key: "ebitda", label: "EBITDA", group: "Resultados", requiredFor: "EV/EBITDA y deuda neta/EBITDA" },
  { key: "freeCashFlow", label: "Flujo de caja libre", group: "Caja", requiredFor: "P/FCF y conversión FCF" },
  { key: "equity", label: "Patrimonio neto", group: "Capital y deuda", requiredFor: "ROE y ROIC" },
  { key: "totalDebt", label: "Deuda financiera total", group: "Capital y deuda", requiredFor: "Deuda neta, EV y ROIC" },
  { key: "cashAndEquivalents", label: "Caja y equivalentes", group: "Capital y deuda", requiredFor: "Deuda neta, EV y ROIC" },
  { key: "interestExpense", label: "Gastos financieros por intereses", group: "Capital y deuda", requiredFor: "Cobertura de intereses" },
  { key: "taxRate", label: "Tasa fiscal (%)", group: "Supuestos", requiredFor: "ROIC" },
  { key: "wacc", label: "WACC (%)", group: "Supuestos", requiredFor: "Diferencial ROIC − WACC" },
] as const;

export type CompanyFundamentalFieldKey = (typeof COMPANY_FUNDAMENTAL_FIELDS)[number]["key"];
