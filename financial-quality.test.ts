import { describe, it, expect } from 'vitest';
import {
  checkBalanceIdentity,
  checkAccruals,
  beneishMScore,
  buildAccountingQualityReport,
} from './financial-quality';
import type { AnnualDataPoint } from './financial-history';

function mkYear(overrides: Partial<AnnualDataPoint>): AnnualDataPoint {
  return {
    fiscalYearEnd: '2024-12-31',
    fiscalYear: 2024,
    revenue: 100_000_000,
    netIncome: 10_000_000,
    operatingCashFlow: 12_000_000,
    capex: 3_000_000,
    freeCashFlow: 9_000_000,
    equity: 50_000_000,
    assets: 100_000_000,
    liabilities: 50_000_000,
    costOfRevenue: 60_000_000,
    receivables: 10_000_000,
    ppe: 30_000_000,
    currentAssets: 40_000_000,
    depreciation: 3_000_000,
    sgaExpense: 15_000_000,
    interestExpense: null,
    incomeTax: null,
    ebit: null,
    ...overrides,
  };
}

describe('financial-quality', () => {
  describe('checkBalanceIdentity', () => {
    it('passes when A = L + E', () => {
      const result = checkBalanceIdentity(mkYear({}));
      expect(result.severity).toBe('ok');
      expect(result.value).toBe(0);
    });

    it('warns when mismatch exceeds threshold', () => {
      const result = checkBalanceIdentity(mkYear({ assets: 110_000_000, liabilities: 50_000_000, equity: 50_000_000 }));
      expect(result.severity).toBe('warning');
    });

    it('returns unknown with missing data', () => {
      const result = checkBalanceIdentity(mkYear({ assets: null }));
      expect(result.severity).toBe('unknown');
    });
  });

  describe('checkAccruals', () => {
    it('ok when FCF closely tracks earnings', () => {
      const result = checkAccruals(mkYear({}));
      // (10M - 12M) / 100M = -2% -> ok
      expect(result.severity).toBe('ok');
      expect(result.value).toBeCloseTo(-2, 1);
    });

    it('warns when accruals high positive', () => {
      // netIncome 20M, OCF 5M -> (20-5)/100 = 15%
      const result = checkAccruals(mkYear({ netIncome: 20_000_000, operatingCashFlow: 5_000_000 }));
      expect(result.severity).toBe('warning');
    });
  });

  describe('beneishMScore', () => {
    it('computes all 8 components with clean data', () => {
      const prev = mkYear({ fiscalYearEnd: '2023-12-31', revenue: 90_000_000, netIncome: 8_000_000, receivables: 9_000_000, assets: 95_000_000, liabilities: 50_000_000, currentAssets: 38_000_000, ppe: 28_000_000, costOfRevenue: 56_000_000, depreciation: 2_800_000, sgaExpense: 14_000_000 });
      const cur = mkYear({});
      const result = beneishMScore(cur, prev);
      expect(result.computableCount).toBe(8);
      expect(result.score).not.toBeNull();
      expect(result.detail).toMatch(/M-Score/);
    });

    it('returns unknown with insufficient components', () => {
      const cur = mkYear({ receivables: null, costOfRevenue: null, sgaExpense: null, depreciation: null, ppe: null });
      const prev = mkYear({});
      const result = beneishMScore(cur, prev);
      expect(result.computableCount).toBeLessThan(6);
      expect(result.score).toBeNull();
      expect(result.severity).toBe('unknown');
    });

    it('uses correct formula constants', () => {
      // All ratio-type components = 1 for identical periods; TATA = (10M - 12M)/100M = -0.02.
      // score = -4.84 + 0.92 + 0.528 + 0.404 + 0.892 + 0.115 - 0.172 + (-0.02)*4.679 - 0.327
      const same = mkYear({});
      const result = beneishMScore(same, same);
      const expected = -4.84 + 0.92 + 0.528 + 0.404 + 0.892 + 0.115 - 0.172 + (-0.02) * 4.679 - 0.327;
      expect(result.score).toBeCloseTo(expected, 3);
      expect(result.score).toBeCloseTo(-2.5736, 3);
    });
  });

  describe('buildAccountingQualityReport', () => {
    it('aggregates checks with latest year', () => {
      const series = [mkYear({ fiscalYearEnd: '2023-12-31', revenue: 90_000_000 }), mkYear({})];
      const report = buildAccountingQualityReport(series);
      expect(report.fiscalYear).toBe('2024-12-31');
      expect(report.checks.length).toBe(3);
      expect(report.checks.map((c) => c.id)).toEqual(['balance-identity', 'accruals', 'beneish']);
      expect(report.overallSeverity).toBe('ok');
    });

    it('handles empty series', () => {
      const report = buildAccountingQualityReport([]);
      expect(report.checks).toEqual([]);
      expect(report.beneish).toBeNull();
      expect(report.overallSeverity).toBe('unknown');
    });

    it('boolean warning overrides ok', () => {
      const series = [mkYear({ fiscalYearEnd: '2023-12-31' }), mkYear({ assets: 120_000_000 })];
      const report = buildAccountingQualityReport(series);
      const balance = report.checks.find((c) => c.id === 'balance-identity');
      expect(balance?.severity).toBe('warning');
      expect(report.overallSeverity).toBe('warning');
    });
  });
});
