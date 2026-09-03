import { describe, expect, it } from "vitest";
import { buildAnalysisReportHtml, escapeHtml } from "./report-pdf";
import { calculateCompanyFundamentals } from "./company-fundamentals";

describe("report-pdf", () => {
  const analysis = calculateCompanyFundamentals({
    companyName: "Tech & Co",
    asOf: "2026-01-01",
    currency: "EUR",
    sourceLabel: "<Informe>",
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

  it("escapa caracteres HTML", () => {
    expect(escapeHtml("<script>alert('x')</script>")).not.toContain("<script>");
    expect(escapeHtml("A&B")).toBe("A&amp;B");
  });

  it("genera un informe HTML con las secciones principales", () => {
    const html = buildAnalysisReportHtml(analysis);
    expect(html).toContain("Informe de salud financiera");
    expect(html).toContain("Métricas por categoría");
    expect(html).toContain("Señales de salud financiera");
    expect(html).toContain("Oportunidad a revisar");
    expect(html).toContain("<table");
  });

  it("escapa el nombre de empresa y la fuente", () => {
    const html = buildAnalysisReportHtml(analysis);
    expect(html).toContain("Tech &amp; Co");
    expect(html).toContain("&lt;Informe&gt;");
  });

  it("incluye advertencias cuando existen", () => {
    const html = buildAnalysisReportHtml(analysis);
    expect(html).toContain("Advertencias");
  });
});