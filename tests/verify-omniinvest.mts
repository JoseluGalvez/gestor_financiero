import assert from "node:assert/strict";
import { evaluateOmniInvest, omniInvestDemoInput } from "../src/lib/omniinvest.ts";

const demo = omniInvestDemoInput();
const complete = evaluateOmniInvest(demo);
assert.equal(complete.status, "ready", "El escenario ficticio completo debe declararse con cobertura completa.");
assert.equal(complete.coveragePct, 100, "Las seis dimensiones del escenario ficticio deben cubrir el 100 % de los pesos.");
assert.notEqual(complete.overallScore, null, "Un escenario ficticio completo debe producir un indicador ponderado.");
assert.equal(complete.scope, "fictitious_demo", "El escenario integrado debe conservar su etiqueta ficticia.");

const partial = evaluateOmniInvest({
  ...demo,
  scope: "manual_local",
  factorScores: { ...demo.factorScores, technicalMomentum: null },
});
assert.equal(partial.status, "partial", "Una dimensión omitida debe marcar la cobertura como parcial.");
assert.equal(partial.coveragePct, 85, "La omisión de momentum técnico debe retirar exactamente el 15 % de cobertura.");
assert.notEqual(partial.overallScore, null, "Con cobertura superior al 60 %, el resumen parcial debe conservar un indicador con advertencia.");

const insufficientCoverage = evaluateOmniInvest({
  ...demo,
  scope: "manual_local",
  factorScores: {
    financialHealth: 50,
    growth: 50,
    valuation: null,
    competitiveAdvantage: null,
    technicalMomentum: null,
    riskManagement: null,
  },
});
assert.equal(insufficientCoverage.status, "partial", "La falta de cuatro dimensiones debe quedar visible como cobertura parcial.");
assert.equal(insufficientCoverage.coveragePct, 40, "Dos factores de 20 % deben representar el 40 % de cobertura.");
assert.equal(insufficientCoverage.overallScore, null, "Con cobertura inferior al 60 %, OmniInvest no debe publicar una puntuación agregada.");
assert.ok(insufficientCoverage.warnings.some((warning) => warning.includes("inferior al 60 %")), "La cobertura insuficiente debe tener una advertencia explícita.");

const completeZero = evaluateOmniInvest({
  ...demo,
  scope: "manual_local",
  factorScores: {
    financialHealth: 0,
    growth: 0,
    valuation: 0,
    competitiveAdvantage: 0,
    technicalMomentum: 0,
    riskManagement: 0,
  },
});
assert.equal(completeZero.status, "ready", "Cero es un valor de factor válido y no debe confundirse con ausencia de datos.");
assert.equal(completeZero.coveragePct, 100, "Seis valores cero válidos deben mantener la cobertura completa.");
assert.equal(completeZero.overallScore, 0, "Un escenario completo de ceros debe conservar una puntuación cero explícita.");

const invalidDate = evaluateOmniInvest({ ...demo, asOf: "2026-02-30", scope: "manual_local" });
assert.equal(invalidDate.status, "blocked", "Una fecha imposible debe bloquear la publicación del resumen.");
assert.equal(invalidDate.overallScore, null, "Una fecha imposible no debe producir un indicador aparentemente válido.");
assert.ok(invalidDate.warnings.some((warning) => warning.includes("día real del calendario")), "La fecha imposible debe ofrecer una advertencia concreta.");

const invalidFactor = evaluateOmniInvest({
  ...demo,
  scope: "manual_local",
  factorScores: { ...demo.factorScores, riskManagement: Number.POSITIVE_INFINITY },
});
assert.equal(invalidFactor.status, "blocked", "Un factor no finito debe bloquear el resumen.");
assert.equal(invalidFactor.overallScore, null, "Un factor no finito no debe producir una puntuación publicada.");
assert.ok(invalidFactor.warnings.some((warning) => warning.includes("valor finito entre 0 y 100")), "El factor no finito debe producir una advertencia específica.");

console.log(JSON.stringify({
  status: "ok",
  completeCoverage: true,
  partialCoverage: true,
  insufficientCoverageBlockedFromScore: true,
  zeroScoreCoverageComplete: true,
  invalidDateBlocked: true,
  invalidFactorBlocked: true,
}));
