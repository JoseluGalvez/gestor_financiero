import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  fetchLatestEcbRates,
  fetchEcbHistoricalRates,
  normalizeEcbLatest,
  normalizeEcbSeries,
  crossRateFromEur,
  convertCurrency,
} from './ecb-fx-adapter';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const mockLatestPayload = {
  amount: 1,
  base: 'EUR',
  date: '2024-09-04',
  rates: { USD: 1.085, GBP: 0.845, INVALID: 'abc', XXX: 1.0 },
};

describe('ecb-fx-adapter', () => {
  describe('normalizeEcbLatest', () => {
    it('normalizes valid response', () => {
      const result = normalizeEcbLatest(mockLatestPayload);
      expect(result.base).toBe('EUR');
      expect(result.date).toBe('2024-09-04');
      expect(result.rates.USD).toBe(1.085);
      expect(result.rates.GBP).toBe(0.845);
    });

    it('filters invalid currencies', () => {
      const result = normalizeEcbLatest(mockLatestPayload);
      expect(result.rates.INVALID).toBeUndefined();
      expect(result.rates.XXX).toBeDefined();
    });

    it('throws on invalid date', () => {
      expect(() => normalizeEcbLatest({ base: 'EUR', rates: {} })).toThrow('fecha de respuesta inválida');
    });
  });

  describe('normalizeEcbSeries', () => {
    it('parses and sorts daily series', () => {
      const raw = {
        base: 'EUR',
        start_date: '2024-01-02',
        end_date: '2024-01-04',
        rates: {
          '2024-01-03': { USD: 1.09 },
          '2024-01-02': { USD: 1.08 },
          bad: { USD: 1.1 },
          '2024-01-04': { USD: 1.10 },
        },
      };
      const series = normalizeEcbSeries(raw);
      expect(series.length).toBe(3);
      expect(series[0].date).toBe('2024-01-02');
      expect(series[2].date).toBe('2024-01-04');
    });
  });

  describe('crossRateFromEur', () => {
    it('computes cross rate EUR→USD', () => {
      const table = { USD: 1.085, GBP: 0.845 };
      expect(crossRateFromEur(table, 'EUR', 'USD')).toBe(1.085);
      expect(crossRateFromEur(table, 'USD', 'EUR')).toBeCloseTo(1 / 1.085, 4);
      expect(crossRateFromEur(table, 'USD', 'GBP')).toBeCloseTo(0.845 / 1.085, 4);
    });

    it('returns null for missing currency', () => {
      expect(crossRateFromEur({}, 'EUR', 'XXX')).toBeNull();
      expect(crossRateFromEur({ USD: 0 }, 'USD', 'GBP')).toBeNull();
    });
  });

  describe('convertCurrency', () => {
    it('converts using cross rate', () => {
      const eurRates = { USD: 1.085, GBP: 0.845 };
      expect(convertCurrency(100, 'EUR', 'USD', eurRates)).toBeCloseTo(108.5, 2);
      expect(convertCurrency(1000, 'USD', 'EUR', eurRates)).toBeCloseTo(921.66, 1);
    });
  });

  describe('fetchLatestEcbRates', () => {
    it('fetches and normalizes latest rates', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue(new Response(JSON.stringify(mockLatestPayload), { status: 200 })),
      );
      const result = await fetchLatestEcbRates(['USD', 'GBP']);
      expect(result.rates.USD).toBe(1.085);
    });

    it('throws on HTTP error', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 503 })));
      await expect(fetchLatestEcbRates()).rejects.toThrow(/503/);
    });
  });

  describe('fetchEcbHistoricalRates', () => {
    it('validates date format', async () => {
      await expect(fetchEcbHistoricalRates('01/01/2024')).rejects.toThrow('inválida');
      await expect(fetchEcbHistoricalRates('2024-01-01', '01-02-2024')).rejects.toThrow('inválida');
    });

    it('fetches series for date range', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue(
          new Response(
            JSON.stringify({ base: 'EUR', rates: { '2024-01-02': { USD: 1.085 } } }),
            { status: 200 },
          ),
        ),
      );
      const result = await fetchEcbHistoricalRates('2024-01-01', '2024-01-05', ['USD']);
      expect(result).toHaveLength(1);
      expect(result[0].rates.USD).toBe(1.085);
    });
  });
});
