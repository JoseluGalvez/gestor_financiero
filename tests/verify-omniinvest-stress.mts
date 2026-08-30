import assert from "node:assert/strict";
import { evaluateOmniInvest, omniInvestDemoInput } from "../src/lib/omniinvest.ts";
import { applyUniformMarketShock, type StressPositionInput } from "../src/lib/omniinvest-stress.ts";

const basePositions: StressPositionInput[] = [
  { id: "equity", label: "Renta variable — ficticia", category: "market_priced", marketValueBase: 50_000 },
  { id: "bonds", label: "Renta fija — ficticia", category: "market_priced", marketValueBase: 25_000 },
  { id: "cash", label: "Efectivo — ficticio", category: "cash", marketValueBase: 15_000 },
];

const drawdown20 = applyUniformMarketShock(basePositions, -0.2);
assert.equal(drawdown20.baselineValueBase, 90_000, "La cartera sintética debe conservar su valor base.");
assert.equal(drawdown20.stressedValueBase, 75_000, "El choque de −20 % solo debe afectar a posiciones de mercado.");
assert.equal(drawdown20.changeBase, -15_000, "La pérdida agregada debe mantener el signo negativo.");
assert.equal(drawdown20.changePct, -1 / 6, "El efectivo debe amortiguar la caída total a −16,666… %.");
assert.equal(drawdown20.positions.find((position) => position.id === "cash")?.stressedValueBase, 15_000, "El efectivo no debe recibir el choque de mercado.");
assert.ok((drawdown20.stressedHhi ?? Infinity) < (drawdown20.baselineHhi ?? -Infinity), "El HHI debe recalcularse sobre los valores post-choque.");

const crash100 = applyUniformMarketShock(basePositions, -1);
assert.equal(crash100.stressedValueBase, 15_000, "Un crash del 100 % debe dejar solo el efectivo bajo este supuesto.");
assert.equal(crash100.changeBase, -75_000, "El crash debe reflejar toda la exposición de mercado.");
assert.equal(crash100.changePct, -5 / 6, "El impacto de cartera debe respetar el peso de efectivo.");
assert.equal(crash100.stressedHhi, 1, "Una única posición de efectivo restante debe producir HHI 1.");
assert.equal(crash100.positions.find((position) => position.id === "equity")?.stressedValueBase, 0, "Una pérdida total no debe generar un valor negativo.");

const highVolatilityPath = [
  -0.35, 0.4, -0.3, 0.25, -0.5,
].reduce((value, returnRate) => value * (1 + returnRate), 100);
assert.equal(highVolatilityPath, 39.8125, "La ruta extrema debe conservar composición multiplicativa y evitar sumar retornos de forma incorrecta.");
assert.ok(highVolatilityPath < 100, "Ganancias y pérdidas de igual escala no se compensan linealmente; se debe conservar el efecto de capitalización.");

const demo = omniInvestDemoInput();
const crashFactors = evaluateOmniInvest({
  ...demo,
  scope: "fictitious_demo",
  assetName: "Cartera ficticia — crash de mercado",
  declaredSource: "Escenario hipotético de prueba; no procede de mercado ni cartera real.",
  factorScores: {
    financialHealth: 76,
    growth: 68,
    valuation: 40,
    competitiveAdvantage: 72,
    technicalMomentum: 0,
    riskManagement: 0,
  },
});
assert.equal(crashFactors.status, "ready", "Los ceros explícitos de un escenario de crisis siguen siendo factores válidos.");
assert.equal(crashFactors.coveragePct, 100, "Un crash hipotético con seis factores declarados debe conservar cobertura de factores completa.");
assert.equal(crashFactors.overallScore, 47.6, "La ponderación visible debe ser reproducible en el escenario de crash.");

assert.throws(
  () => applyUniformMarketShock(basePositions, -1.01),
  /entre −1 y 1/,
  "No se deben aceptar pérdidas superiores al 100 % en un choque uniforme simple.",
);
assert.throws(
  () => applyUniformMarketShock([{ ...basePositions[0], id: "equity", marketValueBase: Number.NaN }], -0.2),
  /número finito/,
  "Un valor no finito debe bloquear el escenario de estrés.",
);
assert.throws(
  () => applyUniformMarketShock([], -0.2),
  /al menos una posición/,
  "Un escenario vacío no debe presentar una métrica de riesgo aparente.",
);

console.log(JSON.stringify({
  status: "ok",
  uniformShock20: true,
  fullMarketCrash: true,
  volatilePathCompounds: true,
  crashFactorsCovered: true,
  invalidInputsBlocked: true,
}));
