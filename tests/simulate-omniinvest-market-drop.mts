import assert from "node:assert/strict";
import { evaluateOmniInvest, omniInvestDemoInput } from "../src/lib/omniinvest.ts";

type FictionalPosition = {
  label: string;
  category: "market_priced" | "cash";
  marketValueEur: number;
};

const SHOCK_RATE = -0.2;
const positions: FictionalPosition[] = [
  { label: "Renta variable global — posición ficticia", category: "market_priced", marketValueEur: 50_000 },
  { label: "Renta fija diversificada — posición ficticia", category: "market_priced", marketValueEur: 25_000 },
  { label: "Efectivo en EUR — posición ficticia", category: "cash", marketValueEur: 15_000 },
];

const baselineValue = positions.reduce((sum, position) => sum + position.marketValueEur, 0);
const stressedPositions = positions.map((position) => ({
  ...position,
  shockRate: position.category === "market_priced" ? SHOCK_RATE : 0,
  changeEur: position.category === "market_priced" ? position.marketValueEur * SHOCK_RATE : 0,
  stressedValueEur: position.category === "market_priced" ? position.marketValueEur * (1 + SHOCK_RATE) : position.marketValueEur,
}));
const stressedValue = stressedPositions.reduce((sum, position) => sum + position.stressedValueEur, 0);
const portfolioChangeEur = stressedValue - baselineValue;
const portfolioChangePct = portfolioChangeEur / baselineValue;

function hhi(values: number[], total: number): number {
  return values.reduce((sum, value) => sum + (value / total) ** 2, 0);
}

const baselineHhi = hhi(positions.map((position) => position.marketValueEur), baselineValue);
const stressedHhi = hhi(stressedPositions.map((position) => position.stressedValueEur), stressedValue);

const baselineOmniInput = omniInvestDemoInput();
const stressedOmniInput = {
  ...baselineOmniInput,
  scope: "fictitious_demo" as const,
  assetName: "Cartera ficticia — sensibilidad uniforme −20 %",
  declaredSource: "Escenario hipotético integrado; no procede de precios, proveedores ni cartera real.",
  factorScores: {
    financialHealth: 76,
    growth: 68,
    valuation: 55,
    competitiveAdvantage: 72,
    technicalMomentum: 30,
    riskManagement: 45,
  },
};

const baselineOmni = evaluateOmniInvest(baselineOmniInput);
const stressedOmni = evaluateOmniInvest(stressedOmniInput);

assert.equal(baselineValue, 90_000, "El valor inicial ficticio debe cuadrar.");
assert.equal(stressedValue, 75_000, "El escenario debe aplicar −20 % solo a posiciones valoradas a mercado.");
assert.equal(portfolioChangeEur, -15_000, "La pérdida ficticia agregada debe conservar el signo.");
assert.equal(portfolioChangePct, -1 / 6, "El efectivo no afectado debe amortiguar el impacto total a −16,666… %.");
assert.equal(baselineOmni.overallScore, 65.6, "La referencia OmniInvest ficticia debe ser reproducible.");
assert.equal(stressedOmni.overallScore, 59.6, "El escenario de factores hipotético debe conservar el cálculo ponderado visible.");
assert.equal(stressedOmni.coveragePct, 100, "Todos los factores hipotéticos están declarados; la cobertura de factores es completa.");
assert.ok(stressedHhi < baselineHhi, "El efectivo no afectado debe reducir el HHI de posiciones en este escenario uniforme.");

console.log(JSON.stringify({
  status: "ok",
  scenario: "fictitious_uniform_market_drop_20pct",
  baselineValueEur: baselineValue,
  stressedValueEur: stressedValue,
  portfolioChangeEur,
  portfolioChangePct,
  baselineHhi,
  stressedHhi,
  positions: stressedPositions,
  baselineOmniScore: baselineOmni.overallScore,
  stressedOmniScore: stressedOmni.overallScore,
  factorCoveragePct: stressedOmni.coveragePct,
}, null, 2));
