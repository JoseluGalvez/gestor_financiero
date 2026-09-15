import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  normalizeEodCandles,
  normalizeIntradayCandles,
  normalizeTickerQuote,
  fetchMarketstackEod,
  fetchMarketstackIntraday,
  fetchMarketstackTicker,
} from './marketstack-adapter';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('marketstack-adapter', () => {
  describe('normalizeEodCandles', () => {
    it('normalizes valid EOD candles', () => {
      const data = {
        symbol: 'AAPL',
        eod: [
          { date: '2024-09-04', open: 190.5, high: 192.0, low: 189.5, close: 191.2, volume: 50000000 },
          { date: '2024-09-03', open: 188.0, high: 190.0, low: 187.5, close: 189.8, volume: 45000000 },
        ],
      };
      const rows = normalizeEodCandles(data, 'AAPL');
      expect(rows).toHaveLength(2);
      expect(rows[0].date).toBe('2024-09-03');
      expect(rows[1].date).toBe('2024-09-04');
      expect(rows[1].open).toBe(190.5);
      expect(rows[1].volume).toBe(50000000);
    });

    it('returns empty for null/undefined data', () => {
      expect(normalizeEodCandles(undefined, 'AAPL')).toEqual([]);
      expect(normalizeEodCandles(null as any, 'AAPL')).toEqual([]);
    });

    it('filters rows with invalid fields', () => {
      const data = {
        symbol: 'AAPL',
        eod: [
          { date: '2024-09-04', open: null, high: 192.0, low: 189.5, close: 191.2 },
          { date: '', open: 190.0, high: 192.0, low: 189.5, close: 191.2 },
          { date: '2024-09-04', open: 190.0, high: 192.0, low: 189.5, close: 191.2 },
        ],
      };
      const rows = normalizeEodCandles(data, 'AAPL');
      expect(rows).toHaveLength(1);
    });

    it('sorts by date ascending', () => {
      const data = {
        symbol: 'AAPL',
        eod: [
          { date: '2024-09-05', open: 1, high: 1, low: 1, close: 1 },
          { date: '2024-09-03', open: 1, high: 1, low: 1, close: 1 },
          { date: '2024-09-04', open: 1, high: 1, low: 1, close: 1 },
        ],
      };
      const rows = normalizeEodCandles(data, 'AAPL');
      expect(rows.map((r) => r.date)).toEqual(['2024-09-03', '2024-09-04', '2024-09-05']);
    });
  });

  describe('normalizeIntradayCandles', () => {
    it('normalizes intraday data and extracts date part', () => {
      const data = {
        symbol: 'AAPL',
        intraday: [
          { date: '2024-09-04T10:30:00+0000', open: 190.5, high: 191.0, low: 190.2, close: 190.8, volume: 100000 },
          { date: '2024-09-04T10:00:00+0000', open: 190.0, high: 190.6, low: 189.9, close: 190.5, volume: 80000 },
        ],
      };
      const rows = normalizeIntradayCandles(data, 'AAPL');
      expect(rows).toHaveLength(2);
      expect(rows[0].date).toBe('2024-09-04');
      expect(rows[1].date).toBe('2024-09-04');
    });

    it('returns empty for missing intraday array', () => {
      expect(normalizeIntradayCandles(undefined, 'AAPL')).toEqual([]);
      expect(normalizeIntradayCandles({ symbol: 'AAPL' } as any, 'AAPL')).toEqual([]);
    });

    it('filters invalid bars', () => {
      const data = {
        symbol: 'AAPL',
        intraday: [
          { date: '2024-09-04T10:30:00+0000', open: null, high: 191.0, low: 190.2, close: 190.8 },
          { date: '', open: 190.0, high: 190.6, low: 189.9, close: 190.5 },
        ],
      };
      expect(normalizeIntradayCandles(data, 'AAPL')).toHaveLength(0);
    });
  });

  describe('normalizeTickerQuote', () => {
    it('normalizes ticker data', () => {
      const quote = normalizeTickerQuote({
        symbol: 'AAPL',
        name: 'Apple Inc.',
        exchange: 'XNAS',
        last: 191.2,
        change: 1.5,
        change_pct: 0.79,
        volume: 50000000,
      });
      expect(quote).not.toBeNull();
      expect(quote!.symbol).toBe('AAPL');
      expect(quote!.name).toBe('Apple Inc.');
      expect(quote!.price).toBe(191.2);
      expect(quote!.change).toBe(1.5);
      expect(quote!.changePct).toBe(0.79);
      expect(quote!.exchange).toBe('XNAS');
    });

    it('returns null for null data', () => {
      expect(normalizeTickerQuote(null)).toBeNull();
      expect(normalizeTickerQuote(undefined)).toBeNull();
    });

    it('tolerates missing optional fields', () => {
      const quote = normalizeTickerQuote({ symbol: 'AAPL' });
      expect(quote).not.toBeNull();
      expect(quote!.price).toBe(0);
      expect(quote!.change).toBeNull();
      expect(quote!.exchange).toBeNull();
    });
  });

  describe('fetchMarketstackEod', () => {
    it('fetches and normalizes EOD data', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue(
          new Response(
            JSON.stringify({
              data: {
                symbol: 'AAPL',
                eod: [
                  { date: '2024-09-04', open: 190.5, high: 192.0, low: 189.5, close: 191.2, volume: 50000000 },
                ],
              },
            }),
            { status: 200 },
          ),
        ),
      );
      const rows = await fetchMarketstackEod('AAPL', 'test-key');
      expect(rows).toHaveLength(1);
      expect(rows[0].close).toBe(191.2);
    });

    it('throws when API returns error object', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue(
          new Response(
            JSON.stringify({ error: { code: 'access_restricted', message: 'Invalid key' } }),
            { status: 200 },
          ),
        ),
      );
      await expect(fetchMarketstackEod('AAPL', 'bad-key')).rejects.toThrow('Invalid key');
    });

    it('throws on HTTP error', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 401, statusText: 'Unauthorized' })));
      await expect(fetchMarketstackEod('AAPL', 'key')).rejects.toThrow(/401/);
    });

    it('throws when no API key provided', async () => {
      await expect(fetchMarketstackEod('AAPL', '')).rejects.toThrow('API key requerida');
    });
  });

  describe('fetchMarketstackIntraday', () => {
    it('fetches and normalizes intraday data', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue(
          new Response(
            JSON.stringify({
              data: {
                symbol: 'AAPL',
                intraday: [
                  { date: '2024-09-04T10:30:00+0000', open: 190.5, high: 191.0, low: 190.2, close: 190.8, volume: 100000 },
                ],
              },
            }),
            { status: 200 },
          ),
        ),
      );
      const rows = await fetchMarketstackIntraday('AAPL', 'test-key');
      expect(rows).toHaveLength(1);
      expect(rows[0].close).toBe(190.8);
    });

    it('throws on HTTP error', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 500, statusText: 'Server Error' })));
      await expect(fetchMarketstackIntraday('AAPL', 'key')).rejects.toThrow(/500/);
    });
  });

  describe('fetchMarketstackTicker', () => {
    it('fetches and normalizes ticker info', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue(
          new Response(
            JSON.stringify({
              data: {
                symbol: 'AAPL',
                name: 'Apple Inc.',
                exchange: 'XNAS',
                last: 191.2,
                change: 1.5,
                change_pct: 0.79,
              },
            }),
            { status: 200 },
          ),
        ),
      );
      const quote = await fetchMarketstackTicker('AAPL', 'test-key');
      expect(quote).not.toBeNull();
      expect(quote!.symbol).toBe('AAPL');
      expect(quote!.price).toBe(191.2);
    });

    it('throws on HTTP error', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 403, statusText: 'Forbidden' })));
      await expect(fetchMarketstackTicker('AAPL', 'key')).rejects.toThrow(/403/);
    });
  });
});
