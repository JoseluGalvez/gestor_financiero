import { describe, it, expect } from 'vitest';
import { calculateCompanyFundamentals, type CompanyFundamentalsInput } from './company-fundamentals';

const baseInput: CompanyFundamentalsInput = {
  companyName: 'Test Corp',
  asOf: '2024-12-31',
  currency: 'EUR',
  sourceLabel: 'Annual Report 2024',
  pricePerShare: 50,
  sharesOutstanding: 1000000,
  marketCapitalization: 50000000,
  netIncome: 5000000,
  equity: 25000000,
  totalDebt: 10000000,
  cashAndEquivalents: 2000000,
  ebitda: 8000000,
  ebit: 6000000,
  interestExpense: 500000,
  revenue: 50000000,
  costOfRevenue: 30000000,
  freeCashFlow: 4000000,
  taxRate: 0.25,
  wacc: 0.08,
};

describe('calculateCompanyFundamentals', () => {
  it('calculates all metrics with complete input', () => {
    const result = calculateCompanyFundamentals(baseInput);

    expect(result.companyName).toBe('Test Corp');
    expect(result.coveragePct).toBe(100);
    expect(result.metrics.length).toBe(16);
    expect(result.healthSignals.length).toBeGreaterThan(0);
    expect(result.opportunity).toBeDefined();
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it('calculates EPS correctly', () => {
    const result = calculateCompanyFundamentals(baseInput);
    const eps = result.metrics.find(m => m.key === 'eps');
    expect(eps?.value).toBe(5); // 5,000,000 / 1,000,000
    expect(eps?.unit).toBe('per_share');
    expect(eps?.status).toBe('available');
  });

  it('calculates market cap from price and shares when not provided directly', () => {
    const input = { ...baseInput, marketCapitalization: null };
    const result = calculateCompanyFundamentals(input);
    const mc = result.metrics.find(m => m.key === 'marketCapitalization');
    expect(mc?.value).toBe(50000000); // 50 * 1,000,000
  });

  it('calculates net debt correctly', () => {
    const result = calculateCompanyFundamentals(baseInput);
    const nd = result.metrics.find(m => m.key === 'netDebt');
    expect(nd?.value).toBe(8000000); // 10,000,000 - 2,000,000
    expect(nd?.unit).toBe('currency');
  });

  it('calculates enterprise value correctly', () => {
    const result = calculateCompanyFundamentals(baseInput);
    const ev = result.metrics.find(m => m.key === 'enterpriseValue');
    expect(ev?.value).toBe(58000000); // 50M + 8M
  });

  it('calculates PER correctly', () => {
    const result = calculateCompanyFundamentals(baseInput);
    const per = result.metrics.find(m => m.key === 'per');
    expect(per?.value).toBe(10); // 50 / 5
    expect(per?.unit).toBe('ratio');
  });

  it('returns PER as not_meaningful when EPS is negative', () => {
    const input = { ...baseInput, netIncome: -1000000 };
    const result = calculateCompanyFundamentals(input);
    const per = result.metrics.find(m => m.key === 'per');
    expect(per?.status).toBe('not_meaningful');
    expect(per?.warning).toContain('BPA nulo o negativo');
  });

  it('calculates EV/EBITDA correctly', () => {
    const result = calculateCompanyFundamentals(baseInput);
    const evEbitda = result.metrics.find(m => m.key === 'evToEbitda');
    expect(evEbitda?.value).toBeCloseTo(7.25, 2); // 58M / 8M
    expect(evEbitda?.unit).toBe('ratio');
  });

  it('calculates P/FCF correctly', () => {
    const result = calculateCompanyFundamentals(baseInput);
    const pfcf = result.metrics.find(m => m.key === 'priceToFcf');
    expect(pfcf?.value).toBe(12.5); // 50M / 4M
    expect(pfcf?.unit).toBe('ratio');
  });

  it('calculates ROE correctly', () => {
    const result = calculateCompanyFundamentals(baseInput);
    const roe = result.metrics.find(m => m.key === 'roe');
    expect(roe?.value).toBe(20); // 5M / 25M * 100
    expect(roe?.unit).toBe('percent');
  });

  it('calculates ROIC correctly', () => {
    const result = calculateCompanyFundamentals(baseInput);
    const roic = result.metrics.find(m => m.key === 'roic');
    // NOPAT = 6M * (1 - 0.25) = 4.5M
    // Invested Capital = 25M + 8M = 33M
    // ROIC = 4.5M / 33M * 100 = 13.636...
    expect(roic?.value).toBeCloseTo(13.636, 1);
    expect(roic?.unit).toBe('percent');
  });

  it('calculates ROIC - WACC spread correctly', () => {
    const result = calculateCompanyFundamentals(baseInput);
    const spread = result.metrics.find(m => m.key === 'roicWaccSpread');
    // ROIC ~13.64% - WACC 8% = 5.64%
    expect(spread?.value).toBeCloseTo(5.64, 1);
    expect(spread?.unit).toBe('percent');
  });

  it('calculates gross margin correctly', () => {
    const result = calculateCompanyFundamentals(baseInput);
    const gm = result.metrics.find(m => m.key === 'grossMargin');
    expect(gm?.value).toBe(40); // (50M - 30M) / 50M * 100
    expect(gm?.unit).toBe('percent');
  });

  it('calculates operating margin correctly', () => {
    const result = calculateCompanyFundamentals(baseInput);
    const om = result.metrics.find(m => m.key === 'operatingMargin');
    expect(om?.value).toBe(12); // 6M / 50M * 100
    expect(om?.unit).toBe('percent');
  });

  it('calculates net margin correctly', () => {
    const result = calculateCompanyFundamentals(baseInput);
    const nm = result.metrics.find(m => m.key === 'netMargin');
    expect(nm?.value).toBe(10); // 5M / 50M * 100
    expect(nm?.unit).toBe('percent');
  });

  it('calculates net debt / EBITDA correctly', () => {
    const result = calculateCompanyFundamentals(baseInput);
    const ndEbitda = result.metrics.find(m => m.key === 'netDebtToEbitda');
    expect(ndEbitda?.value).toBe(1); // 8M / 8M
    expect(ndEbitda?.unit).toBe('ratio');
  });

  it('calculates interest coverage correctly', () => {
    const result = calculateCompanyFundamentals(baseInput);
    const ic = result.metrics.find(m => m.key === 'interestCoverage');
    expect(ic?.value).toBe(12); // 6M / 500K
    expect(ic?.unit).toBe('ratio');
  });

  it('calculates FCF conversion correctly', () => {
    const result = calculateCompanyFundamentals(baseInput);
    const fcf = result.metrics.find(m => m.key === 'fcfConversion');
    expect(fcf?.value).toBe(80); // 4M / 5M * 100
    expect(fcf?.unit).toBe('percent');
  });

  it('generates health signals for leverage', () => {
    const result = calculateCompanyFundamentals(baseInput);
    const leverageSignal = result.healthSignals.find(s => s.title.includes('Apalancamiento'));
    expect(leverageSignal).toBeDefined();
    expect(leverageSignal?.severity).toBe('info'); // 1x is below 2x
  });

  it('generates attention signal for high leverage', () => {
    const input = { ...baseInput, totalDebt: 30000000, cashAndEquivalents: 1000000 }; // net debt = 29M, EBITDA = 8M => 3.625x
    const result = calculateCompanyFundamentals(input);
    const leverageSignal = result.healthSignals.find(s => s.title.includes('por encima'));
    expect(leverageSignal?.severity).toBe('attention');
  });

  it('generates attention signal for low interest coverage', () => {
    const input = { ...baseInput, ebit: 1000000, interestExpense: 500000 }; // 2x coverage
    const result = calculateCompanyFundamentals(input);
    const icSignal = result.healthSignals.find(s => s.title.includes('inferior a 3'));
    expect(icSignal?.severity).toBe('attention');
  });

  it('evaluates opportunity as candidate_for_review with strong metrics', () => {
    const result = calculateCompanyFundamentals(baseInput);
    expect(result.opportunity.status).toBe('candidate_for_review');
  });

  it('evaluates opportunity as not_supported with red flags', () => {
    const input = { ...baseInput, totalDebt: 30000000, cashAndEquivalents: 1000000 }; // leverage > 2.5
    const result = calculateCompanyFundamentals(input);
    expect(result.opportunity.status).toBe('not_supported');
  });

  it('evaluates opportunity as insufficient_evidence with low coverage', () => {
    const input: CompanyFundamentalsInput = {
      companyName: 'Minimal Corp',
      asOf: '2024-12-31',
      currency: 'EUR',
      sourceLabel: 'Partial data',
      netIncome: 1000000,
      equity: 5000000,
    };
    const result = calculateCompanyFundamentals(input);
    expect(result.opportunity.status).toBe('insufficient_evidence');
    expect(result.coveragePct).toBeLessThan(60);
  });

  it('handles missing optional fields gracefully', () => {
    const input: CompanyFundamentalsInput = {
      companyName: 'Sparse Corp',
      asOf: '2024-12-31',
      currency: 'USD',
      sourceLabel: 'Partial',
      pricePerShare: 100,
      sharesOutstanding: 500000,
      netIncome: 1000000,
    };
    const result = calculateCompanyFundamentals(input);
    expect(result.coveragePct).toBeLessThan(100);
    const availableMetrics = result.metrics.filter(m => m.status === 'available');
    expect(availableMetrics.length).toBe(3); // market cap, eps, and roe (needs equity - but equity is missing so this might be roic or another)
  });

  it('includes standard warnings', () => {
    const result = calculateCompanyFundamentals(baseInput);
    const warningText = result.warnings.join(' ');
    expect(warningText).toContain('No constituyen una recomendación');
  });

  it('rounds numeric values to 4 decimal places', () => {
    const input = { ...baseInput, netIncome: 1000000, sharesOutstanding: 300000 };
    const result = calculateCompanyFundamentals(input);
    const eps = result.metrics.find(m => m.key === 'eps');
    // 1,000,000 / 300,000 = 3.33333... -> 3.3333
    expect(eps?.value).toBe(3.3333);
  });

  it('handles zero and negative values appropriately', () => {
    const input = { ...baseInput, ebitda: 0 };
    const result = calculateCompanyFundamentals(input);
    const evEbitda = result.metrics.find(m => m.key === 'evToEbitda');
    expect(evEbitda?.status).toBe('not_meaningful');
    expect(evEbitda?.warning).toContain('EBITDA no es positivo');
  });
});

describe('Metric status determination', () => {
  it('marks metric as available when value exists', () => {
    const result = calculateCompanyFundamentals(baseInput);
    const available = result.metrics.filter(m => m.status === 'available');
    expect(available.length).toBe(16);
  });

  it('marks metric as missing when required inputs absent', () => {
    const input: CompanyFundamentalsInput = {
      companyName: 'Test',
      asOf: '2024-12-31',
      currency: 'EUR',
      sourceLabel: 'Test',
    };
    const result = calculateCompanyFundamentals(input);
    const missing = result.metrics.filter(m => m.status === 'missing');
    expect(missing.length).toBeGreaterThan(0);
  });

  it('marks metric as not_meaningful when calculation invalid', () => {
    const input = { ...baseInput, netIncome: -1000 };
    const result = calculateCompanyFundamentals(input);
    const per = result.metrics.find(m => m.key === 'per');
    expect(per?.status).toBe('not_meaningful');
  });
});