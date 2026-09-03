export type AssetClass = 'crypto' | 'fx' | 'equity';

export type DataSourceId = 'coingecko' | 'ecb' | 'yahoo' | 'sec-edgar';

export type AdapterStatus = 'boot' | 'ok' | 'degraded' | 'error' | 'stale';

export type DataSourceStatus = {
  id: DataSourceId;
  label: string;
  provenance: string;
  status: AdapterStatus;
  lastUpdatedAt: number | null;
  latencyMs: number | null;
  error?: string;
  licenseScope: string;
};

export type Quote = {
  symbol: string;
  name: string;
  price: number;
  priceChange24hPct: number | null;
  priceChange1hPct: number | null;
  priceChange7dPct: number | null;
  marketCap: number | null;
  rank: number | null;
  volume24h: number | null;
  sparkline: number[];
  assetClass: AssetClass;
  source: DataSourceId;
};

export type GlobalMarket = {
  totalMarketCapUsd: number | null;
  totalVolume24hUsd: number | null;
  btcDominancePct: number | null;
  ethDominancePct: number | null;
  activeMarkets: number | null;
};

export type MarketSnapshot = {
  quotes: Quote[];
  global: GlobalMarket;
  fetchedAt: number;
};

const COINGECKO_BASE = 'https://api.coingecko.com/api/v3';
const EXCHANGE_RATE_URL = 'https://open.er-api.com/v6/latest/EUR';
const YAHOO_PROXY_BASE = '/api/yahoo/v8/finance/chart';
const DEFAULT_TIMEOUT_MS = 12000;

export type IndexInstrument = {
  symbol: string;
  name: string;
  market: string;
};

export const INDEX_UNIVERSE: IndexInstrument[] = [
  { symbol: '^GSPC', name: 'S&P 500', market: 'EE. UU.' },
  { symbol: '^IXIC', name: 'Nasdaq Composite', market: 'EE. UU.' },
  { symbol: '^DJI', name: 'Dow Jones', market: 'EE. UU.' },
  { symbol: '^NDX', name: 'Nasdaq 100', market: 'EE. UU.' },
  { symbol: '^RUT', name: 'Russell 2000', market: 'EE. UU.' },
  { symbol: '^VIX', name: 'VIX (Volatilidad)', market: 'EE. UU.' },
  { symbol: '^IBEX', name: 'IBEX 35', market: 'España' },
  { symbol: '^GDAXI', name: 'DAX 40', market: 'Alemania' },
  { symbol: '^FTSE', name: 'FTSE 100', market: 'Reino Unido' },
  { symbol: '^N225', name: 'Nikkei 225', market: 'Japón' },
  { symbol: '^STOXX50E', name: 'Euro Stoxx 50', market: 'Zona euro' },
];

const FX_TARGETS: Record<string, string> = {
  USD: 'Dólar estadounidense',
  GBP: 'Libra esterlina',
  JPY: 'Yen japonés',
  CHF: 'Franco suizo',
  CNY: 'Yuan chino',
  CAD: 'Dólar canadiense',
  AUD: 'Dólar australiano',
  SEK: 'Corona sueca',
  NOK: 'Corona noruega',
  RUB: 'Rublo ruso',
  TRY: 'Lira turca',
  BRL: 'Real brasileño',
  INR: 'Rupia india',
  MXN: 'Peso mexicano',
  KRW: 'Won surcoreano',
  HKD: 'Dólar de Hong Kong',
  SGD: 'Dólar de Singapur',
  ZAR: 'Rand sudafricano',
  PLN: 'Zloty polaco',
  DKK: 'Corona danesa',
};

export const ADAPTER_REGISTRY: Omit<DataSourceStatus, 'status' | 'lastUpdatedAt' | 'latencyMs'>[] = [
  {
    id: 'coingecko',
    label: 'CoinGecko',
    provenance: 'Precios, capitalización y dominancia de criptoactivos. API pública de demostración, sin key; cuota limitada y datos desde ~60s.',
    licenseScope: 'Plan Demo gratuito (sin WebSocket, no-display).',
  },
  {
    id: 'ecb',
    label: 'ExchangeRate (ECB)',
    provenance: 'Tipos de cambio EUR de referencia basados en el fijado diario del Banco Central Europeo, servidos vía ExchangeRate API gratuita sin key.',
    licenseScope: 'Fuente institucional; datos de referencia, no precio ejecutable intradía.',
  },
  {
    id: 'yahoo',
    label: 'Yahoo Finance (índices)',
    provenance: 'Índices bursátiles globales (S&P 500, Nasdaq, IBEX 35, DAX…). En desarrollo se sirven vía proxy de Vite; en producción requieren adaptador backend o licencia.',
    licenseScope: 'Dev-only vía proxy local. Producción: requiere proveedor con licencia de display.',
  },
  {
    id: 'sec-edgar',
    label: 'SEC EDGAR',
    provenance: 'Fundamentales y presentaciones XBRL de empresas US cotizadas.',
    licenseScope: 'Fuente pública oficial; no proporciona cotizaciones intradía.',
  },
];

async function fetchWithTimeout(url: string, timeoutMs: number = DEFAULT_TIMEOUT_MS): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal, headers: { Accept: 'application/json' } });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

function toFiniteNumber(value: unknown): number | null {
  const n = typeof value === 'number' ? value : parseFloat(String(value));
  return Number.isFinite(n) ? n : null;
}

type CoinGeckoCoin = {
  id: string;
  symbol: string;
  name: string;
  current_price: number | null;
  market_cap: number | null;
  market_cap_rank: number | null;
  total_volume: number | null;
  price_change_percentage_1h_in_currency?: number | null;
  price_change_percentage_24h_in_currency?: number | null;
  price_change_percentage_7d_in_currency?: number | null;
  sparkline_in_7d?: { price?: number[] };
};

export function normalizeCoin(coin: CoinGeckoCoin): Quote {
  return {
    symbol: (coin.symbol ?? '').toUpperCase(),
    name: coin.name ?? coin.symbol ?? '—',
    price: toFiniteNumber(coin.current_price) ?? 0,
    priceChange24hPct: toFiniteNumber(coin.price_change_percentage_24h_in_currency),
    priceChange1hPct: toFiniteNumber(coin.price_change_percentage_1h_in_currency),
    priceChange7dPct: toFiniteNumber(coin.price_change_percentage_7d_in_currency),
    marketCap: toFiniteNumber(coin.market_cap),
    rank: toFiniteNumber(coin.market_cap_rank),
    volume24h: toFiniteNumber(coin.total_volume),
    sparkline: Array.isArray(coin.sparkline_in_7d?.price) ? coin.sparkline_in_7d.price : [],
    assetClass: 'crypto',
    source: 'coingecko',
  };
}

type CoinGeckoGlobal = {
  data?: {
    total_market_cap?: Record<string, number>;
    total_volume?: Record<string, number>;
    market_cap_percentage?: Record<string, number>;
    active_cryptocurrencies?: number;
  };
};

export async function fetchCryptoMarkets(perPage = 100): Promise<{ quotes: Quote[]; global: GlobalMarket }> {
  const [marketsRes, globalRes] = await Promise.all([
    fetchWithTimeout(
      `${COINGECKO_BASE}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${perPage}&page=1&sparkline=true&price_change_percentage=1h%2C24h%2C7d`,
    ),
    fetchWithTimeout(`${COINGECKO_BASE}/global`),
  ]);

  if (!marketsRes.ok) {
    throw new Error(`CoinGecko markets: ${marketsRes.status} ${marketsRes.statusText}`);
  }

  const coins = (await marketsRes.json()) as CoinGeckoCoin[];
  const quotes = coins.map(normalizeCoin);

  let global: GlobalMarket = {
    totalMarketCapUsd: null,
    totalVolume24hUsd: null,
    btcDominancePct: null,
    ethDominancePct: null,
    activeMarkets: null,
  };

  if (globalRes.ok) {
    const raw = (await globalRes.json()) as CoinGeckoGlobal;
    const d = raw.data ?? {};
    global = {
      totalMarketCapUsd: toFiniteNumber(d.total_market_cap?.usd),
      totalVolume24hUsd: toFiniteNumber(d.total_volume?.usd),
      btcDominancePct: toFiniteNumber(d.market_cap_percentage?.btc),
      ethDominancePct: toFiniteNumber(d.market_cap_percentage?.eth),
      activeMarkets: toFiniteNumber(d.active_cryptocurrencies),
    };
  }

  return { quotes, global };
}

type ExchangeRateResponse = {
  result?: string;
  base_code?: string;
  rates?: Record<string, number | string>;
};

export function normalizeFxRates(rates: Record<string, number | string>): Quote[] {
  const result: Quote[] = [];
  for (const [currency, rawRate] of Object.entries(rates)) {
    const key = currency.toUpperCase();
    if (!FX_TARGETS[key]) continue;
    const price = toFiniteNumber(rawRate);
    if (price === null) continue;
    result.push({
      symbol: key,
      name: FX_TARGETS[key],
      price,
      priceChange24hPct: null,
      priceChange1hPct: null,
      priceChange7dPct: null,
      marketCap: null,
      rank: null,
      volume24h: null,
      sparkline: [],
      assetClass: 'fx',
      source: 'ecb',
    });
  }
  return result.sort((a, b) => a.symbol.localeCompare(b.symbol));
}

export async function fetchEcbFx(): Promise<Quote[]> {
  const res = await fetchWithTimeout(EXCHANGE_RATE_URL, DEFAULT_TIMEOUT_MS);
  if (!res.ok) {
    throw new Error(`FX (ECB): ${res.status} ${res.statusText}`);
  }
  const raw = (await res.json()) as ExchangeRateResponse;
  if (!raw.rates) {
    throw new Error('FX (ECB): respuesta sin tasas');
  }
  return normalizeFxRates(raw.rates);
}

type YahooChartMeta = {
  symbol?: string;
  regularMarketPrice?: number;
  regularMarketChangePercent?: number;
  chartPreviousClose?: number;
  regularMarketPreviousClose?: number;
  longName?: string;
  shortName?: string;
};

type YahooChartResponse = {
  chart?: {
    result?: { meta?: YahooChartMeta }[];
    error?: unknown;
  };
};

export function normalizeYahooIndex(symbol: string, name: string, meta: YahooChartMeta): Quote {
  return {
    symbol: symbol.replace(/^\^/, '').toUpperCase(),
    name,
    price: toFiniteNumber(meta.regularMarketPrice) ?? 0,
    priceChange24hPct: toFiniteNumber(meta.regularMarketChangePercent),
    priceChange1hPct: null,
    priceChange7dPct: null,
    marketCap: null,
    rank: null,
    volume24h: null,
    sparkline: [],
    assetClass: 'equity',
    source: 'yahoo',
  };
}

export async function fetchIndexQuotes(): Promise<Quote[]> {
  const results = await Promise.allSettled(
    INDEX_UNIVERSE.map(async (inst) => {
      const url = `${YAHOO_PROXY_BASE}/${encodeURIComponent(inst.symbol)}?range=1d&interval=1d`;
      const res = await fetchWithTimeout(url, DEFAULT_TIMEOUT_MS);
      if (!res.ok) throw new Error(`Yahoo ${inst.symbol}: ${res.status}`);
      const raw = (await res.json()) as YahooChartResponse;
      const meta = raw.chart?.result?.[0]?.meta;
      if (!meta || raw.chart?.error) throw new Error(`Yahoo ${inst.symbol}: sin datos`);
      return normalizeYahooIndex(inst.symbol, inst.name, meta);
    }),
  );

  const quotes: Quote[] = [];
  for (const r of results) {
    if (r.status === 'fulfilled') quotes.push(r.value);
  }
  return quotes;
}

export function buildAdapterStatuses(
  coingecko: { ok: boolean; latencyMs: number | null; error?: string; at?: number },
  ecb: { ok: boolean; latencyMs: number | null; error?: string; at?: number },
  yahoo?: { ok: boolean; latencyMs: number | null; error?: string; at?: number },
): DataSourceStatus[] {
  return ADAPTER_REGISTRY.map((entry) => {
    let runtime: { status: AdapterStatus; lastUpdatedAt: number | null; latencyMs: number | null; error?: string };
    if (entry.id === 'coingecko') {
      runtime = {
        status: coingecko.ok ? 'ok' : 'error',
        lastUpdatedAt: coingecko.at ?? null,
        latencyMs: coingecko.latencyMs,
        error: coingecko.error,
      };
    } else if (entry.id === 'ecb') {
      runtime = {
        status: ecb.ok ? 'ok' : 'error',
        lastUpdatedAt: ecb.at ?? null,
        latencyMs: ecb.latencyMs,
        error: ecb.error,
      };
    } else if (entry.id === 'yahoo') {
      if (!yahoo) {
        runtime = { status: 'degraded', lastUpdatedAt: null, latencyMs: null, error: 'Proveedor no configurado.' };
      } else {
        runtime = {
          status: yahoo.ok ? 'ok' : 'error',
          lastUpdatedAt: yahoo.at ?? null,
          latencyMs: yahoo.latencyMs,
          error: yahoo.error,
        };
      }
    } else {
      runtime = {
        status: 'degraded',
        lastUpdatedAt: null,
        latencyMs: null,
        error: 'Proveedor no configurado: requiere licencia / API key de servidor.',
      };
    }
    return { ...entry, ...runtime };
  });
}

export function formatCurrency(value: number | null | undefined, digits = 2): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return '—';
  if (Math.abs(value) >= 1_000_000_000_000) return `$${(value / 1_000_000_000_000).toFixed(digits)}T`;
  if (Math.abs(value) >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(digits)}B`;
  if (Math.abs(value) >= 1_000_000) return `$${(value / 1_000_000).toFixed(digits)}M`;
  if (Math.abs(value) >= 1_000) return `$${(value / 1_000).toFixed(digits)}K`;
  return `$${value.toFixed(digits)}`;
}

export function formatPercent(value: number | null | undefined, digits = 2): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return '—';
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(digits)}%`;
}