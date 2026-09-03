import { describe, expect, it } from "vitest";
import {
  ANALYSIS_HISTORY_LIMIT,
  distinctCompanies,
  entriesForCompany,
  formatMetricPointValue,
  loadHistory,
  makeHistoryEntry,
  metricSeriesForCompany,
  persistHistory,
  pushEntry,
} from "./analysis-history";
import { calculateCompanyFundamentals, type CompanyFundamentalsInput } from "./company-fundamentals";

const baseInput: CompanyFundamentalsInput = {
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
};

describe("analysis-history", () => {
  it("crea entradas con id y análisis asociado", () => {
    const analysis = calculateCompanyFundamentals(baseInput);
    const entry = makeHistoryEntry(baseInput, analysis);
    expect(entry.id).toMatch(/^ah-/);
    expect(entry.analysis.companyName).toBe("Tech Corp");
    expect(entry.createdAt).toBeGreaterThan(0);
  });

  it("pushEntry antepone la entrada más reciente y respeta el límite", () => {
    const analysis = calculateCompanyFundamentals(baseInput);
    let history: ReturnType<typeof makeHistoryEntry>[] = [];
    for (let i = 0; i < ANALYSIS_HISTORY_LIMIT + 5; i++) {
      history = pushEntry(history, makeHistoryEntry({ ...baseInput, asOf: `2026-01-${(i % 28) + 1}` }, analysis));
    }
    expect(history.length).toBe(ANALYSIS_HISTORY_LIMIT);
    // i = 104 -> (104 % 28) + 1 = 21
    expect(history[0].input.asOf).toBe("2026-01-21");
  });

  it("identity companies distintas", () => {
    const analysisA = calculateCompanyFundamentals(baseInput);
    const analysisB = calculateCompanyFundamentals({ ...baseInput, companyName: "Retail Co" });
    const history = [
      makeHistoryEntry(baseInput, analysisA),
      makeHistoryEntry({ ...baseInput, companyName: "Retail Co" }, analysisB),
      makeHistoryEntry(baseInput, analysisA),
    ];
    expect(distinctCompanies(history)).toEqual(["Tech Corp", "Retail Co"]);
  });

  it("filtra entradas por empresa", () => {
    const analysisA = calculateCompanyFundamentals(baseInput);
    const analysisB = calculateCompanyFundamentals({ ...baseInput, companyName: "Retail Co" });
    const history = [
      makeHistoryEntry(baseInput, analysisA),
      makeHistoryEntry({ ...baseInput, companyName: "Retail Co" }, analysisB),
    ];
    expect(entriesForCompany(history, "Tech Corp").length).toBe(1);
    expect(entriesForCompany(history, "Retail Co").length).toBe(1);
  });

  it("construye series temporales ordenadas por fecha", () => {
    const analysis2023 = calculateCompanyFundamentals({ ...baseInput, asOf: "2023-12-31", netIncome: 80 });
    const analysis2024 = calculateCompanyFundamentals({ ...baseInput, asOf: "2024-12-31", netIncome: 100 });
    const analysis2025 = calculateCompanyFundamentals({ ...baseInput, asOf: "2025-12-31", netIncome: 120 });
    const history = [
      makeHistoryEntry({ ...baseInput, asOf: "2025-12-31", netIncome: 120 }, analysis2025),
      makeHistoryEntry({ ...baseInput, asOf: "2023-12-31", netIncome: 80 }, analysis2023),
      makeHistoryEntry({ ...baseInput, asOf: "2024-12-31", netIncome: 100 }, analysis2024),
    ];
    const series = metricSeriesForCompany(history, "Tech Corp", "roe");
    expect(series.map((point) => point.asOf)).toEqual(["2023-12-31", "2024-12-31", "2025-12-31"]);
    expect(series.length).toBe(3);
  });

  it("ignora métricas de moneda en la serie", () => {
    const analysis = calculateCompanyFundamentals(baseInput);
    const history = [makeHistoryEntry(baseInput, analysis)];
    expect(metricSeriesForCompany(history, "Tech Corp", "marketCapitalization")).toEqual([]);
  });

  it("formatea valores según unidad", () => {
    expect(formatMetricPointValue(12.34, "percent")).toBe("12.34%");
    expect(formatMetricPointValue(2.5, "ratio")).toBe("2.50x");
    expect(formatMetricPointValue(1.23456, "per_share")).toBe("1.23");
  });

  it("persiste y recupera el historial", () => {
    const store = new Map<string, string>();
    const storage = {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => void store.set(key, value),
    };
    const analysis = calculateCompanyFundamentals(baseInput);
    const entry = makeHistoryEntry(baseInput, analysis);
    persistHistory(storage, [entry]);
    const loaded = loadHistory(storage);
    expect(loaded.length).toBe(1);
    expect(loaded[0].analysis.companyName).toBe("Tech Corp");
  });

  it("loadHistory devuelve vacío ante datos corruptos", () => {
    const storage = { getItem: () => "{corrupto", setItem: () => undefined };
    expect(loadHistory(storage)).toEqual([]);
  });
});