import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  fetchStooqDaily,
  normalizeStooqSymbol,
  buildStooqUrl,
  parseStooqCsv,
} from './stooq-ohlc-adapter';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const sampleCsv = `Date,Open,High,Low,Close,Volume
2024-09-02,220.5,222.0,219.8,221.5,50000000
2024-09-03,221.0,223.0,220.5,222.8,45000000
2024-09-04,222.5,224.0,221.0,223.9,48000000
bad,row,not,valid,here
2024-09-05,223.0,225.0,222.5,224.5,52000000`;

describe('stooq-ohlc-adapter', () => {
  describe('normalizeStooqSymbol', () => {
    it('normalizes US equity symbols', () => {
      expect(normalizeStooqSymbol('AAPL')).toBe('aapl.us');
      expect(normalizeStooqSymbol('  MSFT  ')).toBe('msft.us');
    });

    it('normalizes index symbols', () => {
      expect(normalizeStooqSymbol('^GSPC')).toBe('^spx');
      expect(normalizeStooqSymbol('^IBEX')).toBe('^ibex');
      expect(normalizeStooqSymbol('^GDAXI')).toBe('^dax');
    });

    it('keeps market suffixes', () => {
      expect(normalizeStooqSymbol('SAN.MC')).toBe('san.mc');
      expect(normalizeStooqSymbol('ITX.MC')).toBe('itx.mc');
    });

    it('returns lowercase for unknown indices', () => {
      expect(normalizeStooqSymbol('^CUSTOM')).toBe('^custom');
    });
  });

  describe('buildStooqUrl', () => {
    it('builds default URL', () => {
      const url = buildStooqUrl('AAPL');
      expect(url).toContain('s=aapl.us');
      expect(url).toContain('i=d');
    });

    it('includes date range when provided', () => {
      const url = buildStooqUrl('SPX', { from: '2024-01-01', to: '2024-06-30' });
      expect(url).toContain('d1=20240101');
      expect(url).toContain('d2=20240630');
    });

    it('uses weekly interval', () => {
      const url = buildStooqUrl('^GSPC', { interval: 'w' });
      expect(url).toContain('i=w');
    });
  });

  describe('parseStooqCsv', () => {
    it('parses valid CSV correctly', () => {
      const { rows, skipped } = parseStooqCsv(sampleCsv);
      expect(rows).toHaveLength(4);
      expect(skipped).toBe(1);
      expect(rows[0].date).toBe('2024-09-02');
      expect(rows[0].close).toBe(221.5);
      expect(rows[0].volume).toBe(50000000);
    });

    it('handles empty CSV', () => {
      const { rows } = parseStooqCsv('');
      expect(rows).toHaveLength(0);
    });

    it('handles no-data text', () => {
      const { rows } = parseStooqCsv('Exceeded the daily hits limit');
      expect(rows).toHaveLength(0);
    });

    it('throws on malformed headers', () => {
      expect(() => parseStooqCsv('Ticker,Price,Volume\nAAPL,100,1000')).toThrow('cabecera');
    });

    it('detects bot challenge HTML', () => {
      expect(() => parseStooqCsv('<!DOCTYPE html><html><body>verify</body></html>')).toThrow('bot challenge');
    });
  });

  describe('fetchStooqDaily', () => {
    it('fetches and parses CSV data', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue(new Response(sampleCsv, { status: 200 })),
      );
      const result = await fetchStooqDaily('AAPL', { from: '2024-09-01', to: '2024-09-09' });
      expect(result).toHaveLength(4);
      expect(result[result.length - 1].close).toBe(224.5);
    });

    it('throws when no rows returned', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('no data', { status: 200 })));
      await expect(fetchStooqDaily('INVALID123')).rejects.toThrow('sin datos');
    });

    it('throws on HTTP error', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 503 })));
      await expect(fetchStooqDaily('AAPL')).rejects.toThrow(/503/);
    });
  });
});
