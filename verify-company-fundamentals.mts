import assert from "node:assert/strict";
import { calculateCompanyFundamentals } from "../src/lib/company-fundamentals.ts";

function metricValue(result: ReturnType<typeof calculateCompanyFundamentals>, key: string) {
  return result.metrics.find((metric) => metric.key === key)?.value ?? null;
}

const result = calculateCompanyFundamentals({
  companyName: "Compañía Horizonte (ficticia)",
  asOf: "2026-06-30",
  currency: "EUR",
  sourceLabel: "Prueba determinista",
  pricePerShare: 42.5,
  sharesOutstanding: 100_000_000,
  netIncome: 315_000_000,
  revenue: 2_400_000_000,
  costOfRevenue: 1_080_000_000,
  ebit: 470_000_000,
  ebitda: 620_000_000,
  freeCashFlow: 285_000_000,
  equity: 1_750_000_000,
  totalDebt: 980_000_000,
  cashAndEquivalents: 260_000_000,
  interestExpense: 58_000_000,
  taxRate: 0.25,
  wacc: 0.08,
});

assert.equal(metricValue(result, "marketCapitalization"), 4_250_000_000, "La capitalización debe derivarse de precio × acciones.");
assert.equal(metricValue(result, "netDebt"), 720_000_000, "La deuda neta debe descontar la caja.");
assert.equal(metricValue(result, "enterpriseValue"), 4_970_000_000, "El EV debe sumar capitalización y deuda neta.");
assert.equal(metricValue(result, "eps"), 3.15, "El BPA debe dividir beneficio neto entre acciones.");
assert.equal(metricValue(result, "per"), 13.4921, "El PER debe dividir precio por BPA positivo.");
assert.equal(metricValue(result, "evToEbitda"), 8.0161, "EV/EBITDA debe usar el EV derivado.");
assert.equal(metricValue(result, "priceToFcf"), 14.9123, "P/FCF debe usar capitalización sobre FCF.");
assert.equal(metricValue(result, "roe"), 18, "ROE debe expresarse como porcentaje.");
assert.equal(metricValue(result, "roic"), 14.2713, "ROIC debe usar NOPAT y capital invertido.");
assert.equal(metricValue(result, "roicWaccSpread"), 6.2713, "El diferencial ROIC-WACC debe expresarse en puntos porcentuales.");
assert.equal(metricValue(result, "grossMargin"), 55, "El margen bruto debe usar ventas y coste de ventas.");
assert.equal(metricValue(result, "operatingMargin"), 19.5833, "El margen operativo debe usar EBIT sobre ventas.");
assert.equal(metricValue(result, "netMargin"), 13.125, "El margen neto debe usar beneficio neto sobre ventas.");
assert.equal(metricValue(result, "netDebtToEbitda"), 1.1613, "La deuda neta/EBITDA debe usar EBITDA positivo.");
assert.equal(metricValue(result, "interestCoverage"), 8.1034, "La cobertura de intereses debe usar EBIT sobre intereses.");
assert.equal(metricValue(result, "fcfConversion"), 90.4762, "La conversión FCF debe usar FCF sobre beneficio neto.");
assert.equal(result.coveragePct, 100, "El ejemplo completo debe cubrir todas las métricas.");
assert.equal(result.opportunity.status, "candidate_for_review", "Con cobertura completa, ROIC-WACC positivo y solvencia favorable debe quedar como candidata a investigación, no como recomendación.");

const nonMeaningful = calculateCompanyFundamentals({
  companyName: "Empresa con pérdida (ficticia)",
  asOf: "2026-06-30",
  currency: "EUR",
  sourceLabel: "Prueba determinista",
  pricePerShare: 10,
  sharesOutstanding: 10,
  netIncome: -10,
  freeCashFlow: -5,
  equity: 10,
  totalDebt: 1,
  cashAndEquivalents: 0,
  ebitda: -1,
  ebit: -2,
  interestExpense: 1,
  revenue: 10,
  costOfRevenue: 5,
  taxRate: 0.25,
});
assert.equal(metricValue(nonMeaningful, "per"), null, "No debe publicarse PER cuando BPA es negativo.");
assert.equal(metricValue(nonMeaningful, "priceToFcf"), null, "No debe publicarse P/FCF cuando FCF es negativo.");
assert.equal(metricValue(nonMeaningful, "netDebtToEbitda"), null, "No debe publicarse deuda neta/EBITDA cuando EBITDA es negativo.");
assert.equal(nonMeaningful.metrics.find((metric) => metric.key === "per")?.status, "not_meaningful", "El estado debe explicar que la ratio no es significativa.");
assert.notEqual(nonMeaningful.opportunity.status, "candidate_for_review", "Pérdidas, EBITDA negativo y ratios no significativas no pueden producir una candidata a investigación.");

const redFlag = calculateCompanyFundamentals({
  companyName: "Empresa apalancada (ficticia)",
  asOf: "2026-06-30",
  currency: "EUR",
  sourceLabel: "Prueba determinista",
  pricePerShare: 20,
  sharesOutstanding: 100,
  netIncome: 20,
  revenue: 100,
  costOfRevenue: 40,
  ebit: 20,
  ebitda: 20,
  freeCashFlow: 25,
  equity: 50,
  totalDebt: 100,
  cashAndEquivalents: 0,
  interestExpense: 10,
  taxRate: 0.25,
  wacc: 0.08,
});
assert.equal(redFlag.opportunity.status, "not_supported", "Una deuda neta/EBITDA superior a 2,5× debe impedir clasificar la empresa como candidata.");

console.log("verify-company-fundamentals: OK");
