import { describe, expect, it } from 'vitest';
import {
  evaluateDailyProtocol,
  evaluateFundamentalGate,
  evaluateVolumeGate,
  evaluateRiskGate,
} from './daily-protocol';
import type { OHLCV } from './financial-technical';

function barsWithVolumeRatio(ratio: number): OHLCV[] {
  const bars: OHLCV[] = [];
  const base = 1_000_000;
  for (let i = 0; i < 25; i++) {
    const isLast = i === 24;
    bars.push({
      date: `2024-05-${String((i % 28) + 1).padStart(2, '0')}`,
      open: 100,
      high: 101,
      low: 99,
      close: 100 + i * 0.1,
      volume: isLast ? base * ratio : base,
    });
  }
  return bars;
}

describe('daily-protocol', () => {
  describe('evaluateFundamentalGate (paso 1)', () => {
    it('passes when ROIC > WACC', () => {
      const step = evaluateFundamentalGate(18, 10);
      expect(step.status).toBe('pass');
      expect(step.metricValue).toContain('+8.00');
    });

    it('fails when ROIC <= WACC', () => {
      const step = evaluateFundamentalGate(7, 10);
      expect(step.status).toBe('fail');
    });

    it('pending when inputs missing', () => {
      expect(evaluateFundamentalGate(null, 10).status).toBe('pending');
      expect(evaluateFundamentalGate(15, undefined).status).toBe('pending');
    });
  });

  describe('evaluateVolumeGate (paso 2)', () => {
    it('passes with explicit ratio >= 1.5', () => {
      const step = evaluateVolumeGate({ volumeRatio: 1.8 });
      expect(step.status).toBe('pass');
    });

    it('fails with ratio below 1.5 (ruptura trampa)', () => {
      const step = evaluateVolumeGate({ volumeRatio: 0.9 });
      expect(step.status).toBe('fail');
      expect(step.detail).toContain('trampa');
    });

    it('computes ratio from OHLCV when not provided', () => {
      const step = evaluateVolumeGate({ ohlcv: barsWithVolumeRatio(2) });
      expect(step.status).toBe('pass');
    });

    it('pending without data', () => {
      expect(evaluateVolumeGate({}).status).toBe('pending');
    });
  });

  describe('evaluateRiskGate (paso 3)', () => {
    it('passes with favorable Kelly and shows fraction', () => {
      const { step, kelly } = evaluateRiskGate({ winRate: 0.6, payoffRatio: 2 }, 10_000);
      expect(step.status).toBe('pass');
      expect(kelly).not.toBeNull();
      expect(kelly!.fraction).toBeCloseTo(0.2, 5); // 0.4 full × 0.5
    });

    it('fails when edge is negative', () => {
      const { step } = evaluateRiskGate({ winRate: 0.3, payoffRatio: 1 });
      expect(step.status).toBe('fail');
    });

    it('pending without Kelly inputs', () => {
      expect(evaluateRiskGate(undefined).step.status).toBe('pending');
    });
  });

  describe('evaluateDailyProtocol (checklist completo)', () => {
    it('ready when all three steps pass', () => {
      const result = evaluateDailyProtocol({
        roicPercent: 20,
        waccPercent: 9,
        volumeRatio: 1.7,
        kelly: { winRate: 0.6, payoffRatio: 2 },
        capital: 5000,
      });
      expect(result.state).toBe('ready');
      expect(result.steps.every((s) => s.status === 'pass')).toBe(true);
      expect(result.canProceedToTechnical).toBe(true);
      expect(result.canProceedToRisk).toBe(true);
      expect(result.kellyRecommendation).toContain('Kelly');
    });

    it('blocked when fundamental gate fails (sequence is mandatory)', () => {
      const result = evaluateDailyProtocol({
        roicPercent: 5,
        waccPercent: 12,
        volumeRatio: 1.7,
        kelly: { winRate: 0.6, payoffRatio: 2 },
      });
      expect(result.state).toBe('blocked');
      expect(result.canProceedToTechnical).toBe(false);
      expect(result.canProceedToRisk).toBe(false);
    });

    it('incomplete when data missing', () => {
      const result = evaluateDailyProtocol({});
      expect(result.state).toBe('incomplete');
      expect(result.steps.filter((s) => s.status === 'pending')).toHaveLength(3);
    });

    it('blocked when volume gate fails even if fundamentals pass', () => {
      const result = evaluateDailyProtocol({
        roicPercent: 20,
        waccPercent: 9,
        volumeRatio: 0.5,
        kelly: { winRate: 0.6, payoffRatio: 2 },
      });
      expect(result.state).toBe('blocked');
      expect(result.canProceedToTechnical).toBe(true);
      expect(result.canProceedToRisk).toBe(false);
    });
  });
});
