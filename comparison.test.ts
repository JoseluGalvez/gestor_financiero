import { describe, expect, it } from "vitest";
import { buildComparisonRows, comparisonHighlights, formatComparisonValue } from "./comparison";
import { calculateCompanyFundamentals } from "./company-fundamentals";

const analysisA = calculateCompanyFundamentals({
  companyName: "Tech Corp",
  asOf: "2026-01-01",
  currency: "EUR",
  sourceLabel: "Informe anual",
  pricePerShare: 100,
  sharesOutstanding: 10,
  netIncome: 120,
  equity: 500,
  totalDebt: 100,
  cashAndEquivalents: 40,
  ebitda: 80,
  ebit: 70,
  interestExpense: 10,
  revenue: 400,
  costOfRevenue: 250,
  freeCashFlow: 60,
  taxRate: 0.25,
  wacc: 0.08,
});

const analysisB = calculateCompanyFundamentals({
  companyName: "Retail Co",
  asOf: "2026-01-01",
  currency: "EUR",
  sourceLabel: "Informe anual",
  pricePerShare: 40,
  sharesOutstanding: 50,
  netIncome: 200,
  equity: 900,
  totalDebt: 300,
  cashAndEquivalents: 120,
  ebitda: 150,
  ebit: 130,
  interestExpense: 25,
  revenue: 1200,
  costOfRevenue: 800,
  freeCashFlow: 140,
  taxRate: 0.25,
  wacc: 0.07,
});

describe("comparison", () => {
  it("formatea valores de comparación", () => {
    expect(formatComparisonValue(12.3, "percent")).toBe("12.30%");
    expect(formatComparisonValue(2.5, "ratio")).toBe("2.50x");
    expect(formatComparisonValue(null, "ratio")).toBe("—");
    expect(formatComparisonValue(1000, "currency")).toBe("1000");
  });

  it("construye filas con valores por empresa", () => {
    const rows = buildComparisonRows([analysisA, analysisB]);
    expect(rows.length).toBeGreaterThan(0);
    const roeRow = rows.find((row) => row.key === "roe");
    expect(roeRow).toBeDefined();
    expect(roeRow!.values.length).toBe(2);
  });

  it("identifica la mejor métrica según dirección", () => {
    const rows = buildComparisonRows([analysisA, analysisB]);
    const roeRow = rows.find((row) => row.key === "roe");
    expect(roeRow!.bestIndex).not.toBeNull();
  });

  it("genera un resumen de liderazgo", () => {
    const highlights = comparisonHighlights([analysisA, analysisB]);
    expect(highlights.length).toBeGreaterThan(0);
    expect(highlights[0]).toMatch(/lidera con/);
  });

  it("devuelve vacío con menos de dos análisis", () => {
    expect(comparisonHighlights([analysisA])).toEqual([]);
    expect(buildComparisonRows([])).toEqual([]);
  });
});