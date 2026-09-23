import { describe, expect, it } from 'vitest';
import { evaluateConfluence, calculateVolumeMetrics, type OHLCV } from './financial-confluence';

function buildUptrend(withVolume = true): OHLCV[] {
  const bars: OHLCV[] = [];
  let close = 100;
  for (let i = 0; i < 60; i++) {
    close += 0.8 + (i % 3) * 0.1;
    const volume = withVolume
      ? i >= 55
        ? 2_500_000 // últimos días: volumen 2.5× de la media (~1M)
        : 1_000_000
      : undefined;
    bars.push({
      date: `2024-03-${String((i % 28) + 1).padStart(2, '0')}`,
      open: close - 0.3,
      high: close + 0.5,
      low: close - 0.7,
      close,
      volume,
    });
  }
  return bars;
}

function buildSideways(): OHLCV[] {
  const bars: OHLCV[] = [];
  for (let i = 0; i < 60; i++) {
    const close = 100 + Math.sin(i) * 0.5;
    bars.push({
      date: `2024-04-${String((i % 28) + 1).padStart(2, '0')}`,
      open: close,
      high: close + 0.2,
      low: close - 0.2,
      close,
      volume: 500_000,
    });
  }
  return bars;
}

describe('financial-confluence', () => {
  describe('calculateVolumeMetrics', () => {
    it('calculates average volume 20d and ratio', () => {
      const bars = buildUptrend();
      const metrics = calculateVolumeMetrics(bars);
      expect(metrics.averageVolume20).not.toBeNull();
      expect(metrics.lastVolume).toBe(2_500_000);
      expect(metrics.volumeRatio).not.toBeNull();
      expect(metrics.volumeRatio as number).toBeGreaterThan(1.5);
    });

    it('returns nulls when volume is missing', () => {
      const bars = buildUptrend(false);
      const metrics = calculateVolumeMetrics(bars);
      expect(metrics.averageVolume20).toBeNull();
      expect(metrics.volumeRatio).toBeNull();
    });
  });

  describe('evaluateConfluence', () => {
    it('insufficient data returns wait with flag', () => {
      const result = evaluateConfluence([
        { date: '2024-01-01', open: 1, high: 2, low: 1, close: 1.5 },
      ]);
      expect(result.insufficientData).toBe(true);
      expect(result.verdict).toBe('wait');
      expect(result.categories).toHaveLength(0);
    });

    it('evaluates all three jury categories with enough data', () => {
      const result = evaluateConfluence(buildUptrend());
      expect(result.insufficientData).toBe(false);
      expect(result.categories).toHaveLength(3);
      const ids = result.categories.map((c) => c.id).sort();
      expect(ids).toEqual(['momentum', 'volatility', 'volume']);
      expect(result.bullishCount + result.bearishCount + result.neutralCount).toBe(3);
    });

    it('buy requires at least two bullish categories', () => {
      const result = evaluateConfluence(buildUptrend());
      if (result.verdict === 'buy') {
        expect(result.bullishCount).toBeGreaterThanOrEqual(2);
      }
      // En tendencia fuerte con volumen, al menos momentum o volumen deben ser bullish
      expect(result.bullishCount).toBeGreaterThanOrEqual(1);
    });

    it('sideways market tends to wait (jury does not converge)', () => {
      const result = evaluateConfluence(buildSideways());
      expect(result.verdict).toBe('wait');
    });

    it('notes explain jury non-convergence on wait', () => {
      const result = evaluateConfluence(buildSideways());
      if (result.verdict === 'wait') {
        expect(result.notes.length).toBeGreaterThan(0);
      }
    });
  });
});
