import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  buildAdapterStatuses,
  fetchCryptoMarkets,
  fetchEcbFx,
  fetchIndexQuotes,
  formatCurrency,
  formatPercent,
  normalizeFxRates,
  normalizeCoin,
  normalizeYahooIndex,
  INDEX_UNIVERSE,
} from './market-adapters';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('formatCurrency', () => {
  it('formatea magnitudes trillón, billón, millón y miles', () => {
    expect(formatCurrency(1_200_000_000_000)).toBe('$1.20T');
    expect(formatCurrency(52_000_000_000)).toBe('$52.00B');
    expect(formatCurrency(18_500_000)).toBe('$18.50M');
    expect(formatCurrency(12_340)).toBe('$12.34K');
    expect(formatCurrency(123.456)).toBe('$123.46');
  });

  it('devuelve guion para valores no numéricos', () => {
    expect(formatCurrency(null)).toBe('—');
    expect(formatCurrency(undefined)).toBe('—');
    expect(formatCurrency(NaN)).toBe('—');
  });
});

describe('formatPercent', () => {
  it('añade signo + a positivos, - a negativos y deja neutro el cero', () => {
    expect(formatPercent(4.25)).toBe('+4.25%');
    expect(formatPercent(-3.5)).toBe('-3.50%');
    expect(formatPercent(0)).toBe('0.00%');
  });

  it('devuelve guion para nulos', () => {
    expect(formatPercent(null)).toBe('—');
    expect(formatPercent(undefined)).toBe('—');
  });
});

describe('normalizeCoin', () => {
  it('normaliza un activo de CoinGecko', () => {
    const quote = normalizeCoin({
      id: 'bitcoin',
      symbol: 'btc',
      name: 'Bitcoin',
      current_price: 50000,
      market_cap: 1_000_000_000_000,
      market_cap_rank: 1,
      total_volume: 25_000_000_000,
      price_change_percentage_24h_in_currency: 2.5,
      sparkline_in_7d: { price: [49000, 50000] },
    });
    expect(quote).toMatchObject({
      symbol: 'BTC',
      name: 'Bitcoin',
      price: 50000,
      priceChange24hPct: 2.5,
      assetClass: 'crypto',
      source: 'coingecko',
    });
    expect(quote.sparkline).toEqual([49000, 50000]);
  });

  it('tolera campos ausentes', () => {
    const quote = normalizeCoin({ id: 'x', symbol: 'x', name: 'X', current_price: null, market_cap: null, market_cap_rank: null, total_volume: null });
    expect(quote.price).toBe(0);
    expect(quote.marketCap).toBeNull();
    expect(quote.priceChange24hPct).toBeNull();
  });
});

describe('normalizeFxRates', () => {
  it('filtra solo las divisas objetivo y las ordena', () => {
    const quotes = normalizeFxRates({ USD: 1.09, GBP: 0.85, XXX: 123, JPY: '154.62' });
    expect(quotes).toHaveLength(3);
    expect(quotes.map((q) => q.symbol)).toEqual(['GBP', 'JPY', 'USD']);
    expect(quotes[0]).toMatchObject({ symbol: 'GBP', price: 0.85, assetClass: 'fx', source: 'ecb' });
    expect(quotes[2].name).toBe('Dólar estadounidense');
  });

  it('ignora tasas no numéricas', () => {
    const quotes = normalizeFxRates({ USD: 'abc', GBP: 0.85 });
    expect(quotes).toHaveLength(1);
    expect(quotes[0].symbol).toBe('GBP');
  });
});

describe('buildAdapterStatuses', () => {
  it('marca coingecko ok, ecb error y el resto degradado', () => {
    const statuses = buildAdapterStatuses(
      { ok: true, latencyMs: 320, at: 1000 },
      { ok: false, latencyMs: null, error: 'network', at: 1000 },
    );
    const byId = Object.fromEntries(statuses.map((s) => [s.id, s]));
    expect(byId.coingecko.status).toBe('ok');
    expect(byId.coingecko.latencyMs).toBe(320);
    expect(byId.ecb.status).toBe('error');
    expect(byId.ecb.error).toBe('network');
    expect(byId.yahoo.status).toBe('degraded');
    expect(byId['sec-edgar'].status).toBe('degraded');
  });
});

describe('fetchEcbFx', () => {
  it('normaliza la respuesta JSON de tipos de cambio', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ result: 'success', base_code: 'EUR', rates: { USD: 1.09, GBP: 0.85 } }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      ),
    );
    const quotes = await fetchEcbFx();
    expect(quotes).toHaveLength(2);
    expect(quotes[1].price).toBe(1.09);
  });

  it('propaga el error cuando el servidor responde distinto de 200', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('err', { status: 503, statusText: 'Unavailable' })));
    await expect(fetchEcbFx()).rejects.toThrow(/503/);
  });
});

describe('fetchCryptoMarkets', () => {
  const marketsPayload = [
    {
      id: 'bitcoin',
      symbol: 'btc',
      name: 'Bitcoin',
      current_price: 50000,
      market_cap: 1_000_000_000_000,
      market_cap_rank: 1,
      total_volume: 25_000_000_000,
      price_change_percentage_24h_in_currency: 2.5,
      sparkline_in_7d: { price: [49000, 49500, 50000] },
    },
  ];

  const globalPayload = {
    data: {
      total_market_cap: { usd: 2_500_000_000_000 },
      total_volume: { usd: 100_000_000_000 },
      market_cap_percentage: { btc: 40, eth: 17 },
      active_cryptocurrencies: 15000,
    },
  };

  it('devuelve quotes normalizadas y datos globales', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        if (String(url).includes('/global')) {
          return new Response(JSON.stringify(globalPayload), { status: 200 });
        }
        return new Response(JSON.stringify(marketsPayload), { status: 200 });
      }),
    );

    const { quotes, global } = await fetchCryptoMarkets(100);
    expect(quotes).toHaveLength(1);
    expect(quotes[0]).toMatchObject({
      symbol: 'BTC',
      name: 'Bitcoin',
      price: 50000,
      priceChange24hPct: 2.5,
      assetClass: 'crypto',
      source: 'coingecko',
    });
    expect(quotes[0].sparkline).toEqual([49000, 49500, 50000]);
    expect(global.totalMarketCapUsd).toBe(2_500_000_000_000);
    expect(global.btcDominancePct).toBe(40);
    expect(global.activeMarkets).toBe(15000);
  });

  it('propaga error si el endpoint markets falla', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('err', { status: 429, statusText: 'Too Many Requests' })));
    await expect(fetchCryptoMarkets(100)).rejects.toThrow(/429/);
  });
});

describe('normalizeYahooIndex', () => {
  it('normaliza el meta de un índice de Yahoo y elimina el prefijo ^', () => {
    const quote = normalizeYahooIndex('^GSPC', 'S&P 500', {
      symbol: '^GSPC',
      regularMarketPrice: 7631.47,
      regularMarketChangePercent: -0.711,
      longName: 'S&P 500',
    });
    expect(quote).toMatchObject({
      symbol: 'GSPC',
      name: 'S&P 500',
      price: 7631.47,
      priceChange24hPct: -0.711,
      assetClass: 'equity',
      source: 'yahoo',
    });
  });
});

describe('fetchIndexQuotes', () => {
  const chartPayload = {
    chart: {
      result: [{ meta: { symbol: '^GSPC', regularMarketPrice: 7631.47, regularMarketChangePercent: -0.711 } }],
      error: null,
    },
  };

  it('recupera y normaliza los índices del universo', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(JSON.stringify(chartPayload), { status: 200, headers: { 'Content-Type': 'application/json' } }),
      ),
    );

    const quotes = await fetchIndexQuotes();
    expect(quotes).toHaveLength(INDEX_UNIVERSE.length);
    expect(quotes[0]).toMatchObject({ symbol: 'GSPC', price: 7631.47, source: 'yahoo' });
  });

  it('ignora índices individuales que fallan sin romper el conjunto', async () => {
    let call = 0;
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        call += 1;
        if (call === 1) {
          return new Response('err', { status: 501, statusText: 'Not Implemented' });
        }
        return new Response(JSON.stringify(chartPayload), { status: 200 });
      }),
    );

    const quotes = await fetchIndexQuotes();
    expect(quotes).toHaveLength(INDEX_UNIVERSE.length - 1);
  });

  it('devuelve array vacío si todas las llamadas fallan', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('err', { status: 502, statusText: 'Bad Gateway' })));
    const quotes = await fetchIndexQuotes();
    expect(quotes).toEqual([]);
  });
});