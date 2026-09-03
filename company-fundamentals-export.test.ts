import { describe, expect, it } from 'vitest';
import { buildCompanyFundamentalsCsv, companyFundamentalsFilename } from './company-fundamentals-export';
import { calculateCompanyFundamentals } from './company-fundamentals';

function minimalAnalysis(companyName = 'ACME Corp') {
  return calculateCompanyFundamentals({
    companyName,
    asOf: '2026-01-31',
    currency: 'USD',
    sourceLabel: 'Informe anual 2025',
    revenue: 100000,
    netIncome: 12000,
  });
}

describe('buildCompanyFundamentalsCsv', () => {
  it('prefija BOM UTF-8 y separa filas con CRLF', () => {
    const csv = buildCompanyFundamentalsCsv(minimalAnalysis());
    expect(csv.startsWith('\uFEFF')).toBe(true);
    expect(csv).toContain('\r\n');
  });

  it('incluye cabecera, nombre de empresa y fuente', () => {
    const csv = buildCompanyFundamentalsCsv(minimalAnalysis());
    expect(csv).toContain('Informe de salud financiera');
    expect(csv).toContain('ACME Corp');
    expect(csv).toContain('Informe anual 2025');
    expect(csv).toContain('Categoría');
    expect(csv).toContain('OPORTUNIDAD A REVISAR');
  });

  it('neutraliza valores que empiezan por fórmula para apertura en hoja de cálculo', () => {
    const csv = buildCompanyFundamentalsCsv(minimalAnalysis('=1+1'));
    expect(csv).toContain(`"Informe de salud financiera","'=1+1"`);
  });

  it('genera una fila por cada métrica', () => {
    const analysis = minimalAnalysis();
    const csv = buildCompanyFundamentalsCsv(analysis);
    const bodyRows = csv.split('\r\n');
    const metricRows = bodyRows.filter((line) => analysis.metrics.some((m) => line.startsWith(`"${m.category}"`)));
    expect(metricRows.length).toBe(analysis.metrics.length);
  });
});

describe('companyFundamentalsFilename', () => {
  it('normaliza nombre a slug con prefijo y extensión', () => {
    const name = companyFundamentalsFilename('ACME Corp, S.A.', 'csv');
    expect(name).toMatch(/^salud-financiera-acme-corp-s-a-\d{4}-\d{2}-\d{2}\.csv$/);
  });

  it('elimina diacríticos', () => {
    const name = companyFundamentalsFilename('Acción Ñu', 'pdf');
    expect(name.startsWith('salud-financiera-accion-nu-')).toBe(true);
    expect(name.endsWith('.pdf')).toBe(true);
  });

  it('usa «empresa» como fallback para nombre vacío', () => {
    const name = companyFundamentalsFilename('   ', 'csv');
    expect(name.startsWith('salud-financiera-empresa-')).toBe(true);
  });
});