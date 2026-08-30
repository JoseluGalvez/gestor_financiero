import assert from "node:assert/strict";
import { calculateCompanyFundamentals } from "../src/lib/company-fundamentals.ts";
import { buildCompanyFundamentalsCsv, companyFundamentalsFilename } from "../src/lib/company-fundamentals-export.ts";

const analysis = calculateCompanyFundamentals({
  companyName: "=Empresa de prueba",
  asOf: "2026-06-30",
  currency: "EUR",
  sourceLabel: "Fuente de prueba",
  pricePerShare: 10,
  sharesOutstanding: 100,
  netIncome: 20,
  revenue: 100,
  costOfRevenue: 40,
  ebit: 25,
  ebitda: 30,
  freeCashFlow: 18,
  equity: 100,
  totalDebt: 20,
  cashAndEquivalents: 5,
  interestExpense: 2,
  taxRate: 0.25,
  wacc: 0.08,
});

const csv = buildCompanyFundamentalsCsv(analysis);
assert.ok(csv.startsWith("\uFEFF"), "El CSV debe incluir BOM para conservar caracteres en aplicaciones de hoja de cálculo.");
assert.ok(csv.includes("\"\t=Empresa de prueba\""), "Los valores que empiezan por '=' deben escaparse para impedir fórmulas CSV inyectadas.");
assert.ok(csv.includes("\"Categoría\",\"Métrica\",\"Valor\""), "El CSV debe incluir cabeceras de métricas reproducibles.");
assert.ok(csv.includes("\"OPORTUNIDAD A REVISAR\""), "El CSV debe incluir el estado de oportunidad y su evidencia.");
assert.ok(csv.includes("\"Cobertura\""), "El CSV debe incluir cobertura como condición de interpretación.");
assert.equal(companyFundamentalsFilename("Empresa Ágil / Prueba", "csv").endsWith(".csv"), true, "El nombre de descarga CSV debe conservar su extensión.");
assert.equal(companyFundamentalsFilename("Empresa Ágil / Prueba", "pdf").endsWith(".pdf"), true, "El nombre de descarga PDF debe conservar su extensión.");

console.log("verify-company-fundamentals-export: OK");
