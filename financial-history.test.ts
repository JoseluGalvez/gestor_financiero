import { describe, it, expect } from 'vitest';
import {
  buildAnnualSeries,
  deriveAnnualMetrics,
  annualSeriesToMetricPoints,
  type AnnualDataPoint,
} from './financial-history';
import type { EdgarCompanyFacts } from './sec-edgar-adapter';

function mkFacts(data: Record<string, { [year: string]: { start?: string; end: string; val: number } }>): EdgarCompanyFacts {
  const usGaap: Record<string, { units: Record<string, { start?: string; end: string; val: number; form: string; fp: string; filed: string }[]> }> = {};
  for (const [tag, series] of Object.entries(data)) {
    usGaap[tag] = {
      units: {
        USD: Object.values(series).map((p) => ({ ...p, form: '10-K', fp: 'FY', filed: p.end })),
      },
    };
  }
  return { cik: 1, entityName: 'Test', facts: { 'us-gaap': usGaap } };
}

describe('financial-history', () => {
  describe('buildAnnualSeries', () => {
    it('builds multi-year series from XBRL facts', () => {
      const facts = mkFacts({
        Revenues: {
          y2022: { start: '2022-01-01', end: '2022-12-31', val: 100_000_000 },
          y2023: { start: '2023-01-01', end: '2023-12-31', val: 115_000_000 },
          y2024: { start: '2024-01-01', end: '2024-12-31', val: 130_000_000 },
        },
        NetIncomeLoss: {
          y2022: { start: '2022-01-01', end: '2022-12-31', val: 10_000_000 },
          y2023: { start: '2023-01-01', end: '2023-12-31', val: 14_000_000 },
          y2024: { start: '2024-01-01', end: '2024-12-31', val: 16_000_000 },
        },
        StockholdersEquity: {
          y2022: { end: '2022-12-31', val: 80_000_000 },
          y2024: { end: '2024-12-31', val: 100_000_000 },
        },
      });

      const series = buildAnnualSeries(facts);
      expect(series).toHaveLength(3);
      expect(series[0].fiscalYearEnd).toBe('2022-12-31');
      expect(series[2].revenue).toBe(130_000_000);
      expect(series[1].netIncome).toBe(14_000_000);
      expect(series[0].equity).toBe(80_000_000);
      // 2023 has no equity data
      expect(series[1].equity).toBeNull();
    });

    it('computes FCF from OCF and CapEx', () => {
      const facts = mkFacts({
        NetCashProvidedByUsedInOperatingActivities: {
          y2024: { start: '2024-01-01', end: '2024-12-31', val: 50_000_000 },
        },
        PaymentsToAcquirePropertyPlantAndEquipment: {
          y2024: { start: '2024-01-01', end: '2024-12-31', val: 12_000_000 },
        },
      });
      const series = buildAnnualSeries(facts);
      expect(series[0].freeCashFlow).toBe(38_000_000);
    });

    it('returns empty array when no facts', () => {
      expect(buildAnnualSeries({ cik: 1, entityName: 'X' })).toHaveLength(0);
    });
  });

  describe('deriveAnnualMetrics', () => {
    it('computes growth, margins and returns', () => {
      const series: AnnualDataPoint[] = [
        { fiscalYearEnd: '2022-12-31', fiscalYear: 2022, revenue: 100_000_000, netIncome: 10_000_000, operatingCashFlow: 12_000_000, capex: 3_000_000, freeCashFlow: 9_000_000, equity: 80_000_000, assets: 150_000_000, liabilities: 70_000_000, costOfRevenue: 65_000_000, receivables: 10_000_000, ppe: 30_000_000, currentAssets: 40_000_000, depreciation: 3_000_000, sgaExpense: 15_000_000, interestExpense: null, incomeTax: null, ebit: null },
        { fiscalYearEnd: '2023-12-31', fiscalYear: 2023, revenue: 120_000_000, netIncome: 14_000_000, operatingCashFlow: 16_000_000, capex: 4_000_000, freeCashFlow: 12_000_000, equity: 90_000_000, assets: 160_000_000, liabilities: 70_000_000, costOfRevenue: 75_000_000, receivables: 11_000_000, ppe: 32_000_000, currentAssets: 45_000_000, depreciation: 3_500_000, sgaExpense: 17_000_000, interestExpense: null, incomeTax: null, ebit: null },
      ];
      const derived = deriveAnnualMetrics(series);
      expect(derived[0].revenueGrowth).toBeNull();
      expect(derived[1].revenueGrowth).toBeCloseTo(20, 1);
      expect(derived[1].netMargin).toBeCloseTo(11.67, 1);
      expect(derived[1].grossMargin).toBeCloseTo(37.5, 1);
      expect(derived[1].roe).toBeCloseTo(15.56, 1);
    });
  });

  describe('annualSeriesToMetricPoints', () => {
    it('converts to chart-compatible points', () => {
      const series: AnnualDataPoint[] = [
        { fiscalYearEnd: '2022-12-31', fiscalYear: 2022, revenue: 100_000_000, netIncome: 10_000_000, operatingCashFlow: null, capex: null, freeCashFlow: null, equity: 80_000_000, assets: null, liabilities: null, costOfRevenue: null, receivables: null, ppe: null, currentAssets: null, depreciation: null, sgaExpense: null, interestExpense: null, incomeTax: null, ebit: null },
        { fiscalYearEnd: '2023-12-31', fiscalYear: 2023, revenue: 120_000_000, netIncome: 14_000_000, operatingCashFlow: null, capex: null, freeCashFlow: null, equity: 90_000_000, assets: null, liabilities: null, costOfRevenue: null, receivables: null, ppe: null, currentAssets: null, depreciation: null, sgaExpense: null, interestExpense: null, incomeTax: null, ebit: null },
      ];
      const points = annualSeriesToMetricPoints(series, 'revenue');
      expect(points).toHaveLength(2);
      expect(points[0].unit).toBe('currency');
      expect(points[0].value).toBe(100_000_000);

      const growthPoints = annualSeriesToMetricPoints(series, 'revenueGrowth');
      expect(growthPoints).toHaveLength(1);
      expect(growthPoints[0].unit).toBe('percent');
    });
  });
});
