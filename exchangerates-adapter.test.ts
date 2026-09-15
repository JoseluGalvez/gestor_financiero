import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  normalizeLatestResponse,
  normalizeFluctuationResponse,
  normalizeTimeseriesResponse,
  fetchLatestRates,
  fetchFluctuation,
  fetchTimeseries,
} from './exchangerates-adapter';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('exchangerates-adapter', () => {
  describe('normalizeLatestResponse', () => {
    it('normalizes valid response', () => {
      const result = normalizeLatestResponse({
        success: true,
        base: 'EUR',
        date: '2024-09-04',
        rates: { USD: 1.085, GBP: 0.845, INVALID: 'abc' },
      });
      expect(result.success).toBe(true);
      expect(result.base).toBe('EUR');
      expect(result.date).toBe('2024-09-04');
      expect(result.rates.USD).toBe(1.085);
      expect(result.rates.GBP).toBe(0.845);
      expect(result.rates.INVALID).toBeUndefined();
    });

    it('handles missing success field', () => {
      const result = normalizeLatestResponse({ base: 'EUR', date: '2024-01-01', rates: {} } as any);
      expect(result.success).toBe(true);
    });

    it('filters non-positive rates', () => {
      const result = normalizeLatestResponse({
        success: true,
        base: 'EUR',
        date: '2024-01-01',
        rates: { USD: 1.09, GBP: 0, JPY: -1.5 },
      });
      expect(result.rates.USD).toBe(1.09);
      expect(result.rates.GBP).toBeUndefined();
      expect(result.rates.JPY).toBeUndefined();
    });
  });

  describe('normalizeFluctuationResponse', () => {
    it('normalizes fluctuation data', () => {
      const result = normalizeFluctuationResponse({
        success: true,
        base: 'EUR',
        start_date: '2024-09-01',
        end_date: '2024-09-04',
        rates: {
          USD: { start_rate: 1.08, end_rate: 1.09, change: 0.01, change_pct: 0.93 },
          GBP: { start_rate: 0.85, end_rate: 0.84, change: -0.01, change_pct: -1.18 },
        },
      });
      expect(result.rates.USD.end_rate).toBe(1.09);
      expect(result.rates.USD.change_pct).toBe(0.93);
      expect(result.rates.GBP.change).toBe(-0.01);
    });

    it('filters invalid currencies', () => {
      const result = normalizeFluctuationResponse({
        success: true,
        base: 'EUR',
        start_date: '2024-09-01',
        end_date: '2024-09-04',
        rates: {
          USD: { start_rate: 1.08, end_rate: 1.09, change: 0.01, change_pct: 0.93 },
          INVALID: { start_rate: 1, end_rate: 1, change: 0, change_pct: 0 },
        },
      });
      expect(result.rates.USD).toBeDefined();
      expect(result.rates.INVALID).toBeUndefined();
    });
  });

  describe('normalizeTimeseriesResponse', () => {
    it('normalizes timeseries data', () => {
      const result = normalizeTimeseriesResponse({
        success: true,
        base: 'EUR',
        start_date: '2024-09-01',
        end_date: '2024-09-03',
        rates: {
          '2024-09-01': { USD: 1.08 },
          '2024-09-02': { USD: 1.09 },
        },
      });
      expect(result.rates['2024-09-01'].USD).toBe(1.08);
      expect(result.rates['2024-09-02'].USD).toBe(1.09);
    });

    it('returns empty rates for undefined input', () => {
      const result = normalizeTimeseriesResponse({
        success: true,
        base: 'EUR',
        start_date: '2024-09-01',
        end_date: '2024-09-03',
        rates: undefined as any,
      });
      expect(Object.keys(result.rates)).toHaveLength(0);
    });
  });

  describe('fetchLatestRates', () => {
    it('fetches and normalizes latest rates', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue(
          new Response(
            JSON.stringify({ success: true, base: 'EUR', date: '2024-09-04', rates: { USD: 1.085, GBP: 0.845 } }),
            { status: 200 },
          ),
        ),
      );
      const result = await fetchLatestRates('test-key', { base: 'EUR', symbols: ['USD', 'GBP'] });
      expect(result.success).toBe(true);
      expect(result.rates.USD).toBe(1.085);
      expect(result.rates.GBP).toBe(0.845);
    });

    it('throws when no API key provided', async () => {
      await expect(fetchLatestRates('')).rejects.toThrow('API key requerida');
    });

    it('throws on HTTP error', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 401, statusText: 'Unauthorized' })));
      await expect(fetchLatestRates('bad-key')).rejects.toThrow(/401/);
    });
  });

  describe('fetchFluctuation', () => {
    it('fetches and normalizes fluctuation data', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue(
          new Response(
            JSON.stringify({
              success: true,
              base: 'EUR',
              start_date: '2024-09-01',
              end_date: '2024-09-04',
              rates: {
                USD: { start_rate: 1.08, end_rate: 1.09, change: 0.01, change_pct: 0.93 },
              },
            }),
            { status: 200 },
          ),
        ),
      );
      const result = await fetchFluctuation('test-key', '2024-09-01', '2024-09-04');
      expect(result.success).toBe(true);
      expect(result.rates.USD.end_rate).toBe(1.09);
    });

    it('throws on HTTP error', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 500, statusText: 'Server Error' })));
      await expect(fetchFluctuation('key', '2024-09-01', '2024-09-04')).rejects.toThrow(/500/);
    });
  });

  describe('fetchTimeseries', () => {
    it('fetches and normalizes timeseries data', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue(
          new Response(
            JSON.stringify({
              success: true,
              base: 'EUR',
              start_date: '2024-09-01',
              end_date: '2024-09-03',
              rates: {
                '2024-09-01': { USD: 1.08 },
                '2024-09-02': { USD: 1.09 },
              },
            }),
            { status: 200 },
          ),
        ),
      );
      const result = await fetchTimeseries('test-key', '2024-09-01', '2024-09-03');
      expect(result.success).toBe(true);
      expect(result.rates['2024-09-01'].USD).toBe(1.08);
    });

    it('throws on HTTP error', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 429, statusText: 'Too Many Requests' })));
      await expect(fetchTimeseries('key', '2024-09-01', '2024-09-03')).rejects.toThrow(/429/);
    });
  });
});
