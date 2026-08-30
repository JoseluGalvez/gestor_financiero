import { calculateWeightedScore, type FactorKey, type FactorScores } from "./financial-analysis.ts";

export type OmniInvestScope = "manual_local" | "fictitious_demo";
export type OmniInvestStatus = "ready" | "partial" | "blocked";

export type OmniInvestInput = {
  assetName: string;
  reference: string;
  asOf: string;
  declaredSource: string;
  factorScores: FactorScores;
  scope: OmniInvestScope;
};

export type OmniInvestLocalSummary = {
  status: OmniInvestStatus;
  overallScore: number | null;
  coveragePct: number;
  factorScores: FactorScores;
  asOf: string | null;
  declaredSource: string | null;
  assetName: string | null;
  reference: string | null;
  warnings: string[];
  scope: OmniInvestScope;
};

export const OMNIINVEST_FACTORS: ReadonlyArray<{ key: FactorKey; label: string; helper: string }> = [
  { key: "financialHealth", label: "Salud financiera", helper: "Liquidez, deuda, rentabilidad y calidad de resultados documentados." },
  { key: "growth", label: "Crecimiento", helper: "Evolución declarada de ingresos, beneficios o flujo de caja; indica período y fuente." },
  { key: "valuation", label: "Valoración", helper: "Coherencia de múltiplos o escenario DCF documentado; no es un precio objetivo." },
  { key: "competitiveAdvantage", label: "Ventaja competitiva", helper: "Evidencia cualitativa citada sobre diferenciación, clientes o ejecución." },
  { key: "technicalMomentum", label: "Momentum técnico", helper: "Indicadores derivados de una serie homogénea, con fecha de corte y método de ajuste." },
  { key: "riskManagement", label: "Riesgo", helper: "Concentración, volatilidad, drawdown, calidad de datos y escenarios adversos disponibles." },
];

function isIsoCalendarDay(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() + 1 === month && date.getUTCDate() === day;
}

function validScore(value: number | null | undefined): boolean {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 100;
}

export function evaluateOmniInvest(input: OmniInvestInput): OmniInvestLocalSummary {
  const warnings: string[] = [];
  const assetName = input.assetName.trim();
  const declaredSource = input.declaredSource.trim();
  const reference = input.reference.trim();
  const asOf = input.asOf.trim();

  if (!assetName) warnings.push("Indica el nombre del activo o empresa antes de calcular el resumen.");
  if (!declaredSource) warnings.push("Indica la fuente declarada de las métricas. OmniInvest no busca datos externos por su cuenta.");
  if (!isIsoCalendarDay(asOf)) warnings.push("La fecha de corte debe usar AAAA-MM-DD y representar un día real del calendario.");

  for (const factor of OMNIINVEST_FACTORS) {
    const value = input.factorScores[factor.key];
    if (value !== null && value !== undefined && !validScore(value)) warnings.push(`${factor.label}: introduce un valor finito entre 0 y 100 o deja el campo vacío.`);
  }

  const weighted = calculateWeightedScore(input.factorScores);
  warnings.push(...weighted.warnings);

  const hasBlockingInput = warnings.some((warning) =>
    warning.startsWith("Indica") || warning.startsWith("La fecha") || warning.includes("introduce un valor finito"),
  );
  const allFactorsPresent = OMNIINVEST_FACTORS.every((factor) => validScore(input.factorScores[factor.key]));
  const status: OmniInvestStatus = hasBlockingInput ? "blocked" : allFactorsPresent ? "ready" : "partial";

  return {
    status,
    overallScore: status === "blocked" ? null : weighted.score,
    coveragePct: weighted.coveragePct,
    factorScores: input.factorScores,
    asOf: isIsoCalendarDay(asOf) ? asOf : null,
    declaredSource: declaredSource || null,
    assetName: assetName || null,
    reference: reference || null,
    warnings,
    scope: input.scope,
  };
}

export function omniInvestDemoInput(): OmniInvestInput {
  return {
    assetName: "Empresa Horizonte — ejemplo ficticio",
    reference: "HORIZ-DEMO",
    asOf: "2026-08-28",
    declaredSource: "Escenario ficticio integrado; no procede de un proveedor de mercado.",
    factorScores: {
      financialHealth: 76,
      growth: 68,
      valuation: 59,
      competitiveAdvantage: 72,
      technicalMomentum: 54,
      riskManagement: 61,
    },
    scope: "fictitious_demo",
  };
}
