import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  fetchEdgarTickers,
  fetchEdgarCompanyFacts,
  parseEdgarFacts,
  extractLatestAsOf,
  searchEdgarTickers,
  loadCachedEdgarTickers,
  saveCachedEdgarTickers,
  EDGAR_TICKERS_CACHE_KEY,
  type EdgarCompanyFacts,
  type EdgarTickerEntry,
} from './sec-edgar-adapter';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const mockCompanyFacts: EdgarCompanyFacts = {
  cik: 320193,
  entityName: 'Apple Inc.',
  facts: {
    'us-gaap': {
      Revenues: {
        units: {
          USD: [
            { start: '2022-10-01', end: '2023-09-30', val: 383285000000, form: '10-K' },
            { start: '2023-10-01', end: '2024-09-30', val: 391035000000, form: '10-K' },
          ],
        },
      },
      NetIncomeLoss: {
        units: { USD: [{ start: '2023-10-01', end: '2024-09-30', val: 93736000000, form: '10-K' }] },
      },
      StockholdersEquity: {
        units: { USD: [{ end: '2024-09-28', val: 56950000000, form: '10-K' }] },
      },
      CashAndCashEquivalentsAtCarryingValue: {
        units: { USD: [{ end: '2024-09-28', val: 29900000000, form: '10-K' }] },
      },
      NetCashProvidedByUsedInOperatingActivities: {
        units: { USD: [{ start: '2023-10-01', end: '2024-09-30', val: 118254000000, form: '10-K' }] },
      },
    },
    dei: {
      EntityCommonStockSharesOutstanding: {
        units: { shares: [{ end: '2024-10-11', val: 15115943000, form: '10-K' }] },
      },
    },
  },
};

describe('sec-edgar-adapter', () => {
  describe('fetchEdgarTickers', () => {
    it('parses ticker list correctly', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue(
          new Response(
            JSON.stringify({
              '0': { cik_str: 320193, ticker: 'AAPL', title: 'Apple Inc.' },
              '1': { cik_str: 789019, ticker: 'MSFT', title: 'Microsoft Corp.' },
            }),
            { status: 200 },
          ),
        ),
      );
      const tickers = await fetchEdgarTickers();
      expect(tickers).toHaveLength(2);
      expect(tickers.find((t) => t.ticker === 'AAPL')?.cik).toBe(320193);
    });

    it('propagates errors on non-200', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 429 })));
      await expect(fetchEdgarTickers()).rejects.toThrow(/429/);
    });
  });

  describe('fetchEdgarCompanyFacts', () => {
    it('fetches and returns company facts', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue(new Response(JSON.stringify(mockCompanyFacts), { status: 200 })),
      );
      const facts = await fetchEdgarCompanyFacts(320193);
      expect(facts.entityName).toBe('Apple Inc.');
      expect(facts.cik).toBe(320193);
    });

    it('throws on invalid CIK', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 500 })));
      await expect(fetchEdgarCompanyFacts(1)).rejects.toThrow(/500/);
    });
  });

  describe('parseEdgarFacts', () => {
    it('extracts fundamentals from XBRL data', () => {
      const result = parseEdgarFacts(mockCompanyFacts, 'AAPL', '2024-09-30');

      expect(result.companyName).toBe('Apple Inc.');
      expect(result.revenue).toBe(391035000000);
      expect(result.netIncome).toBe(93736000000);
      expect(result.equity).toBe(56950000000);
      expect(result.cashAndEquivalents).toBe(29900000000);
      expect(result.freeCashFlow).toBe(118254000000);
      expect(result.sharesOutstanding).toBe(15115943000);
      expect(result.currency).toBe('USD');
      expect(result.sourceLabel).toBe('SEC EDGAR XBRL');
    });

    it('selects newest fiscal year across superseded XBRL tags', () => {
      const superseded: EdgarCompanyFacts = {
        cik: 320193,
        entityName: 'Superseded Co',
        facts: {
          'us-gaap': {
            Revenues: {
              units: {
                USD: [{ start: '2017-10-01', end: '2018-09-30', val: 265595000000, form: '10-K', fp: 'FY' }],
              },
            },
            RevenueFromContractWithCustomerExcludingAssessedTax: {
              units: {
                USD: [{ start: '2023-10-01', end: '2024-09-30', val: 416161000000, form: '10-K', fp: 'FY' }],
              },
            },
          },
        },
      };
      const result = parseEdgarFacts(superseded, 'SUPER', '2024-09-30');
      expect(result.revenue).toBe(416161000000);
    });

    it('handles missing facts gracefully', () => {
      const empty: EdgarCompanyFacts = { cik: 1, entityName: 'Test' };
      const result = parseEdgarFacts(empty, 'TEST', '2024-01-01');
      expect(result.revenue).toBeNull();
      expect(result.netIncome).toBeNull();
    });
  });

  describe('extractLatestAsOf', () => {
    it('returns latest date from facts', () => {
      const date = extractLatestAsOf(mockCompanyFacts);
      expect(date).toBe('2024-10-11');
    });

    it('returns today when no facts', () => {
      const date = extractLatestAsOf(null);
      expect(date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe('searchEdgarTickers', () => {
    const dir: EdgarTickerEntry[] = [
      { cik: 320193, ticker: 'AAPL', title: 'Apple Inc.' },
      { cik: 789019, ticker: 'MSFT', title: 'Microsoft Corp.' },
      { cik: 1318605, ticker: 'TSLA', title: 'Tesla, Inc.' },
    ];

    it('matches by ticker prefix', () => {
      const result = searchEdgarTickers(dir, 'aa');
      expect(result).toHaveLength(1);
      expect(result[0].ticker).toBe('AAPL');
    });

    it('matches by company name', () => {
      const result = searchEdgarTickers(dir, 'tesla');
      expect(result[0].ticker).toBe('TSLA');
    });

    it('respects the limit and empty query', () => {
      expect(searchEdgarTickers(dir, '')).toHaveLength(0);
      expect(searchEdgarTickers(dir, 'a', 1)).toHaveLength(1);
    });
  });

  describe('ticker directory cache', () => {
    function fakeStorage(): { store: Record<string, string>; getItem(k: string): string | null; setItem(k: string, v: string): void } {
      const store: Record<string, string> = {};
      return {
        store,
        getItem: (k) => store[k] ?? null,
        setItem: (k, v) => { store[k] = v; },
      };
    }

    const entries: EdgarTickerEntry[] = [{ cik: 320193, ticker: 'AAPL', title: 'Apple Inc.' }];

    it('round-trips entries within TTL', () => {
      const storage = fakeStorage();
      saveCachedEdgarTickers(storage, entries, 1000);
      expect(storage.store[EDGAR_TICKERS_CACHE_KEY]).toBeDefined();
      const loaded = loadCachedEdgarTickers(storage, 1000 + 60_000);
      expect(loaded).toEqual(entries);
    });

    it('expires entries older than TTL', () => {
      const storage = fakeStorage();
      saveCachedEdgarTickers(storage, entries, 0);
      expect(loadCachedEdgarTickers(storage, 48 * 60 * 60 * 1000)).toBeNull();
    });

    it('returns null on corrupted JSON', () => {
      const storage = fakeStorage();
      storage.setItem(EDGAR_TICKERS_CACHE_KEY, 'not json{');
      expect(loadCachedEdgarTickers(storage)).toBeNull();
    });
  });

  describe('parseEdgarFacts improvements', () => {
    it('computes EBITDA as EBIT + D&A when no explicit EBITDA tag', () => {
      const facts: EdgarCompanyFacts = {
        cik: 1,
        entityName: 'EBITDA Co',
        facts: {
          'us-gaap': {
            OperatingIncomeLoss: { units: { USD: [{ start: '2024-01-01', end: '2024-12-31', val: 10_000_000, form: '10-K' }] } },
            DepreciationDepletionAndAmortization: { units: { USD: [{ start: '2024-01-01', end: '2024-12-31', val: 4_000_000, form: '10-K' }] } },
          },
        },
      };
      const result = parseEdgarFacts(facts, 'EBITDACO', '2024-12-31');
      expect(result.ebit).toBe(10_000_000);
      expect(result.ebitda).toBe(14_000_000);
    });

    it('computes taxRate from income tax / pretax income', () => {
      const facts: EdgarCompanyFacts = {
        cik: 1,
        entityName: 'Tax Co',
        facts: {
          'us-gaap': {
            IncomeTaxExpenseBenefit: { units: { USD: [{ start: '2024-01-01', end: '2024-12-31', val: 250_000, form: '10-K' }] } },
            IncomeLossFromContinuingOperationsBeforeIncomeTaxesExtraordinaryItemsNoncontrollingInterest: {
              units: { USD: [{ start: '2024-01-01', end: '2024-12-31', val: 1_000_000, form: '10-K' }] },
            },
          },
        },
      };
      const result = parseEdgarFacts(facts, 'TAXCO', '2024-12-31');
      expect(result.taxRate).toBeCloseTo(0.25, 4);
    });

    it('sums debt components when LongTermDebt is absent', () => {
      const facts: EdgarCompanyFacts = {
        cik: 1,
        entityName: 'Debt Co',
        facts: {
          'us-gaap': {
            LongTermDebtNoncurrent: { units: { USD: [{ end: '2024-12-31', val: 8_000_000, form: '10-K' }] } },
            LongTermDebtCurrent: { units: { USD: [{ end: '2024-12-31', val: 1_500_000, form: '10-K' }] } },
            ShortTermBorrowings: { units: { USD: [{ end: '2024-12-31', val: 500_000, form: '10-K' }] } },
          },
        },
      };
      const result = parseEdgarFacts(facts, 'DEBTCO', '2024-12-31');
      expect(result.totalDebt).toBe(10_000_000);
    });
  });
});
