export type ScoreFactor = {
  name: string;
  weight: number;
  value: number | null;
  description: string;
  source: string;
};

export type ScoreResult = {
  totalScore: number;
  coverage: number;
  factors: ScoreFactor[];
  isBlocked: boolean;
};

const SCORE_FACTORS = {
  FINANCIAL_HEALTH: { name: "Salud financiera", weight: 20, description: "Liquidez, solvencia, endeudamiento y periodo contable" },
  GROWTH: { name: "Crecimiento", weight: 20, description: "Ingresos, beneficio y EBITDA comparables por periodos" },
  VALUATION: { name: "Valoración", weight: 20, description: "Ratios, sector/mercado de contraste y fecha de cálculo" },
  COMPETITIVE_ADVANTAGE: { name: "Ventaja competitiva", weight: 15, description: "Evidencia estructurada, fuente y fecha de revisión" },
  TECHNICAL_MOMENTUM: { name: "Técnico / momentum", weight: 15, description: "Serie OHLC con licencia y fecha de mercado" },
  RISK_MANAGEMENT: { name: "Gestión de riesgos", weight: 10, description: "Retornos, horizonte de observación y tipo sin riesgo declarado" },
} as const;

const MIN_COVERAGE_PCT = 60;

function normalizeScore(value: number | null): number | null {
  if (value === null || !Number.isFinite(value)) return null;
  return Math.min(100, Math.max(0, value));
}

export function calculateWeightedScore(
  financialHealthScore: number | null,
  growthScore: number | null,
  valuationScore: number | null,
  competitiveAdvantageScore: number | null,
  technicalScore: number | null,
  riskScore: number | null,
): ScoreResult {
  const factors: ScoreFactor[] = [
    { ...SCORE_FACTORS.FINANCIAL_HEALTH, value: normalizeScore(financialHealthScore) },
    { ...SCORE_FACTORS.GROWTH, value: normalizeScore(growthScore) },
    { ...SCORE_FACTORS.VALUATION, value: normalizeScore(valuationScore) },
    { ...SCORE_FACTORS.COMPETITIVE_ADVANTAGE, value: normalizeScore(competitiveAdvantageScore) },
    { ...SCORE_FACTORS.TECHNICAL_MOMENTUM, value: normalizeScore(technicalScore) },
    { ...SCORE_FACTORS.RISK_MANAGEMENT, value: normalizeScore(riskScore) },
  ];

  const availableFactors = factors.filter(f => f.value !== null);
  const totalWeight = factors.reduce((sum, f) => sum + f.weight, 0);
  const availableWeight = availableFactors.reduce((sum, f) => sum + f.weight, 0);

  const coverage = availableFactors.length > 0
    ? (availableWeight / totalWeight) * 100
    : 0;

  if (coverage < MIN_COVERAGE_PCT) {
    return {
      totalScore: 0,
      coverage,
      factors,
      isBlocked: true,
    };
  }

  const weightedSum = factors.reduce((sum, factor) => {
    return sum + (factor.value !== null ? factor.value * factor.weight : 0);
  }, 0);

  const totalScore = weightedSum / availableWeight;

  return {
    totalScore,
    coverage,
    factors,
    isBlocked: false,
  };
}

export function calculateFinancialHealthScore(
  liquidityRatio: number | null,
  debtToEquity: number | null,
  currentRatio: number | null,
  quickRatio: number | null,
): number | null {
  const scores: number[] = [];

  if (liquidityRatio !== null && Number.isFinite(liquidityRatio)) {
    scores.push(Math.min(100, liquidityRatio * 10));
  }

  if (debtToEquity !== null && Number.isFinite(debtToEquity)) {
    scores.push(Math.max(0, Math.min(100, (1 - debtToEquity) * 50)));
  }

  if (currentRatio !== null && Number.isFinite(currentRatio)) {
    scores.push(Math.min(100, currentRatio * 20));
  }

  if (quickRatio !== null && Number.isFinite(quickRatio)) {
    scores.push(Math.min(100, quickRatio * 20));
  }

  return scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : null;
}

export function calculateGrowthScore(
  revenueGrowth: number | null,
  earningsGrowth: number | null,
  ebitdaGrowth: number | null,
): number | null {
  const scores: number[] = [];

  if (revenueGrowth !== null && Number.isFinite(revenueGrowth)) {
    scores.push(Math.min(100, Math.max(0, revenueGrowth * 20)));
  }

  if (earningsGrowth !== null && Number.isFinite(earningsGrowth)) {
    scores.push(Math.min(100, Math.max(0, earningsGrowth * 20)));
  }

  if (ebitdaGrowth !== null && Number.isFinite(ebitdaGrowth)) {
    scores.push(Math.min(100, Math.max(0, ebitdaGrowth * 20)));
  }

  return scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : null;
}

export function calculateValuationScore(
  peRatio: number | null,
  evToEbitda: number | null,
  pbRatio: number | null,
  priceToFcf: number | null,
): number | null {
  const scores: number[] = [];

  if (peRatio !== null && Number.isFinite(peRatio) && peRatio > 0) {
    const score = Math.max(0, Math.min(100, 20 - Math.abs(peRatio - 20)));
    scores.push(score);
  }

  if (evToEbitda !== null && Number.isFinite(evToEbitda) && evToEbitda > 0) {
    const score = Math.max(0, Math.min(100, 15 - Math.abs(evToEbitda - 15)));
    scores.push(score);
  }

  if (pbRatio !== null && Number.isFinite(pbRatio) && pbRatio > 0) {
    const score = Math.max(0, Math.min(100, 10 - Math.abs(pbRatio - 3)));
    scores.push(score);
  }

  if (priceToFcf !== null && Number.isFinite(priceToFcf) && priceToFcf > 0) {
    const score = Math.max(0, Math.min(100, 12 - Math.abs(priceToFcf - 15)));
    scores.push(score);
  }

  return scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : null;
}