import { describe, it, expect } from 'vitest';
import { calculateWeightedScore, calculateFinancialHealthScore, calculateGrowthScore, calculateValuationScore } from './financial-score';

describe('financial-score', () => {
  describe('calculateWeightedScore', () => {
    it('calculates score with all factors available', () => {
      const result = calculateWeightedScore(80, 70, 75, 85, 70, 80);
      expect(result.isBlocked).toBe(false);
      expect(result.coverage).toBe(100);
      expect(result.totalScore).toBeCloseTo(76.25, 1);
    });

    it('score at exactly 60% coverage is not blocked', () => {
      const result = calculateWeightedScore(null, null, 75, 85, 70, 80);
      expect(result.isBlocked).toBe(false);
      expect(result.coverage).toBe(60);
    });

    it('handles partially available factors', () => {
      const result = calculateWeightedScore(80, 70, null, 85, null, 80);
      expect(result.isBlocked).toBe(false);
      expect(result.coverage).toBeCloseTo(65, 0);
    });

    it('normalizes score values', () => {
      const result = calculateWeightedScore(120, 50, -10, 75, 70, 80);
      expect(result.factors[0].value).toBe(100);
      expect(result.factors[2].value).toBe(0);
    });
  });

  describe('calculateFinancialHealthScore', () => {
    it('calculates score from available metrics', () => {
      const result = calculateFinancialHealthScore(2.5, 0.5, 1.8, 1.5);
      expect(result).not.toBeNull();
      expect(result).toBeGreaterThan(0);
    });

    it('returns null when no metrics available', () => {
      const result = calculateFinancialHealthScore(null, null, null, null);
      expect(result).toBeNull();
    });
  });

  describe('calculateGrowthScore', () => {
    it('calculates score from growth metrics', () => {
      const result = calculateGrowthScore(15, 20, 25);
      expect(result).not.toBeNull();
      expect(result).toBeGreaterThan(0);
    });

    it('normalizes negative growth', () => {
      const result = calculateGrowthScore(-5, -10, null);
      expect(result).toBeLessThan(50);
    });
  });

  describe('calculateValuationScore', () => {
    it('calculates score from valuation multiples', () => {
      const result = calculateValuationScore(15, 12, 3, 14);
      expect(result).not.toBeNull();
    });

    it('returns null when no multiples available', () => {
      const result = calculateValuationScore(null, null, null, null);
      expect(result).toBeNull();
    });

    it('penalizes off-target multiples', () => {
      const result = calculateValuationScore(50, 50, 50, 50);
      expect(result).toBeLessThan(50);
    });
  });
});

import { calculateDCF, buildSensitivityMatrix, type FCFInput } from './financial-dcf';

describe('financial-dcf', () => {
  describe('calculateDCF', () => {
    it('calculates DCF with valid inputs', () => {
      const input: FCFInput = {
        year1: 1000000,
        growthRates: [0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1],
        terminalGrowthRate: 0.03,
        wacc: 0.1,
        sharesOutstanding: 1000000,
        netDebt: 500000,
      };

      const result = calculateDCF(input);
      expect(result.isValid).toBe(true);
      expect(result.fairValuePerShare).not.toBeNull();
    });

    it('flags warning when WACC <= terminal growth', () => {
      const input: FCFInput = {
        year1: 1000000,
        growthRates: [0.1, 0.1, 0.1],
        terminalGrowthRate: 0.15,
        wacc: 0.1,
        sharesOutstanding: 1000000,
        netDebt: 500000,
      };

      const result = calculateDCF(input);
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('buildSensitivityMatrix', () => {
    const base: FCFInput = {
      year1: 1000000,
      growthRates: [0.05, 0.05, 0.05, 0.05, 0.05, 0.04, 0.04, 0.04, 0.04],
      terminalGrowthRate: 0.03,
      wacc: 0.10,
      sharesOutstanding: 1000000,
      netDebt: 500000,
    };

    it('creates 5x5 matrix around base case', () => {
      const matrix = buildSensitivityMatrix(base);
      expect(matrix.cells).toHaveLength(5);
      expect(matrix.cells[0]).toHaveLength(5);
      expect(matrix.baseWacc).toBe(0.10);
      expect(matrix.baseGrowth).toBe(0.03);
      const center = matrix.cells[2][2];
      expect(center.wacc).toBeCloseTo(0.10, 10);
      expect(center.terminalGrowth).toBeCloseTo(0.03, 10);
      expect(center.fairValuePerShare).not.toBeNull();
    });

    it('marks invalid cells when WACC <= g', () => {
      const strict: FCFInput = { ...base, wacc: 0.05, terminalGrowthRate: 0.049 };
      const matrix = buildSensitivityMatrix(strict);
      const corner = matrix.cells[0][0]; // lowest wacc, lowest growth
      expect(corner.wacc - corner.terminalGrowth).toBeLessThan(0.001);
    });
  });
});

import { analyzeTechnical, type OHLCV } from './financial-technical';

describe('financial-technical', () => {
  describe('analyzeTechnical', () => {
    it('calculates all indicators from OHLCV data', () => {
      const ohlcv: OHLCV[] = [];
      for (let i = 0; i < 50; i++) {
        const base = 100 + Math.sin(i * 0.1) * 10;
        ohlcv.push({
          date: `2024-01-${String(i + 1).padStart(2, '0')}`,
          open: base,
          high: base + Math.random() * 5,
          low: base - Math.random() * 5,
          close: base + Math.random() * 2,
          volume: 1000000 + Math.random() * 50000,
        });
      }

      const result = analyzeTechnical(ohlcv);
      expect(result.sma20).not.toBeNull();
      expect(result.sma50).not.toBeNull();
      expect(result.rsi.value).not.toBeNull();
      expect(result.atr).not.toBeNull();
      expect(result.indicators.length).toBeGreaterThan(0);
    });

    it('handles insufficient data', () => {
      const ohlcv: OHLCV[] = [
        { date: '2024-01-01', open: 100, high: 105, low: 95, close: 102 },
      ];

      const result = analyzeTechnical(ohlcv);
      expect(result.sma20).toBeNull();
      expect(result.rsi.value).toBeNull();
    });
  });
});

import { analyzeRisk, type RiskAnalysisParams } from './financial-risk';

describe('financial-risk', () => {
  describe('analyzeRisk', () => {
    it('calculates risk metrics from returns', () => {
      const returns = [0.02, -0.01, 0.03, -0.02, 0.01, 0.04, -0.01, 0.02];
      const params: RiskAnalysisParams = { returns };

      const result = analyzeRisk(params);
      expect(result.volatility).not.toBeNull();
      expect(result.maxDrawdown).not.toBeNull();
    });

    it('identifies high risk from high volatility', () => {
      const returns = [0.1, -0.1, 0.15, -0.15, 0.2, -0.2];
      const params: RiskAnalysisParams = { returns };

      const result = analyzeRisk(params);
      const highRiskMetric = result.riskMetrics.find(m => m.level === 'high');
      expect(highRiskMetric).not.toBeUndefined();
    });
  });

  it('calculates Kelly correctly', () => {
    const winRate = 0.6;
    const payoffRatio = 2;

    const kelly = winRate - (1 - winRate) / payoffRatio;
    expect(kelly).toBeCloseTo(0.4, 2);
  });
});