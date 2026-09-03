import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  buildAdapterStatuses,
  fetchCryptoMarkets,
  fetchEcbFx,
  fetchIndexQuotes,
  formatCurrency,
  formatPercent,
  type DataSourceStatus,
  type GlobalMarket,
  type MarketSnapshot,
  type Quote,
} from './market-adapters';
import {
  alertConditionLabel,
  buildAlertSummary,
  createAlertId,
  evaluatePriceAlerts,
  type AlertCondition,
  type PriceAlert,
} from './price-alerts';
import {
  isFavorite,
  loadPreferences,
  movePanel,
  resetPreferences,
  savePreferences,
  toggleFavorite,
  type DashboardPreferences,
  type PanelId,
  type TabId,
} from './dashboard-preferences';

const POLL_INTERVAL_MS = 60_000;
const ALERTS_STORAGE_KEY = 'gmt-price-alerts-v1';
const BOOT_STEPS = [
  'INITIALIZING ADAPTER HANDLES…',
  'NEGOTIATING DATA CHANNELS…',
  'MOUNTING COINGECKO FEED…',
  'MOUNTING ECB FX FEED…',
  'MOUNTING INDEX FEED…',
  'VALIDATING PROVENANCE…',
  'TAPE READY.',
];

function useMarketData() {
  const [snapshot, setSnapshot] = useState<MarketSnapshot | null>(null);
  const [statuses, setStatuses] = useState<DataSourceStatus[]>([]);
  const [booting, setBooting] = useState(true);
  const [bootStep, setBootStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const inFlight = useRef(false);

  const refresh = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;

    const coingeckoStart = performance.now();
    const ecbStart = performance.now();
    const yahooStart = performance.now();

    let coingeckoResult: { ok: boolean; latencyMs: number | null; error?: string; at?: number } = {
      ok: false,
      latencyMs: null,
    };
    let ecbResult: { ok: boolean; latencyMs: number | null; error?: string; at?: number } = {
      ok: false,
      latencyMs: null,
    };
    let yahooResult: { ok: boolean; latencyMs: number | null; error?: string; at?: number } = {
      ok: false,
      latencyMs: null,
    };

    let quotes: Quote[] = [];
    let global: GlobalMarket = {
      totalMarketCapUsd: null,
      totalVolume24hUsd: null,
      btcDominancePct: null,
      ethDominancePct: null,
      activeMarkets: null,
    };

    const cryptoPromise = fetchCryptoMarkets(100)
      .then((res) => {
        coingeckoResult = {
          ok: true,
          latencyMs: Math.round(performance.now() - coingeckoStart),
          at: Date.now(),
        };
        quotes = res.quotes;
        global = res.global;
      })
      .catch((err: unknown) => {
        coingeckoResult = {
          ok: false,
          latencyMs: Math.round(performance.now() - coingeckoStart),
          error: err instanceof Error ? err.message : String(err),
          at: Date.now(),
        };
      });

    const fxPromise = fetchEcbFx()
      .then((fx) => {
        ecbResult = {
          ok: true,
          latencyMs: Math.round(performance.now() - ecbStart),
          at: Date.now(),
        };
        quotes = [...quotes, ...fx];
      })
      .catch((err: unknown) => {
        ecbResult = {
          ok: false,
          latencyMs: Math.round(performance.now() - ecbStart),
          error: err instanceof Error ? err.message : String(err),
          at: Date.now(),
        };
      });

    const indexPromise = fetchIndexQuotes()
      .then((indexes) => {
        yahooResult = {
          ok: true,
          latencyMs: Math.round(performance.now() - yahooStart),
          at: Date.now(),
        };
        quotes = [...quotes, ...indexes];
      })
      .catch((err: unknown) => {
        yahooResult = {
          ok: false,
          latencyMs: Math.round(performance.now() - yahooStart),
          error: err instanceof Error ? err.message : String(err),
          at: Date.now(),
        };
      });

    await Promise.allSettled([cryptoPromise, fxPromise, indexPromise]);

    setSnapshot({ quotes, global, fetchedAt: Date.now() });
    setStatuses(buildAdapterStatuses(coingeckoResult, ecbResult, yahooResult));

    if (coingeckoResult.ok || ecbResult.ok || yahooResult.ok) {
      setError(null);
    } else {
      setError('No se pudo conectar con ninguna fuente de datos. Reintentando…');
    }

    inFlight.current = false;
  }, []);

  useEffect(() => {
    let cancelled = false;

    const runBoot = async () => {
      for (let i = 0; i < BOOT_STEPS.length; i++) {
        if (cancelled) return;
        setBootStep(i);
        await new Promise((r) => setTimeout(r, 220));
      }
      await refresh();
      if (!cancelled) setBooting(false);
    };

    runBoot();
    const interval = setInterval(() => {
      if (!booting) refresh();
    }, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [booting, refresh]);

  return { snapshot, statuses, booting, bootStep, error, refresh };
}

function usePriceAlerts(quotes: Quote[]) {
  const [alerts, setAlerts] = useState<PriceAlert[]>(() => {
    try {
      const raw = localStorage.getItem(ALERTS_STORAGE_KEY);
      return raw ? (JSON.parse(raw) as PriceAlert[]) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(ALERTS_STORAGE_KEY, JSON.stringify(alerts));
    } catch {
      /* almacenamiento no disponible */
    }
  }, [alerts]);

  useEffect(() => {
    setAlerts((prev) => evaluatePriceAlerts(prev, quotes));
  }, [quotes]);

  const addAlert = (symbol: string, name: string, condition: AlertCondition, threshold: number) => {
    setAlerts((prev) => [
      ...prev,
      {
        id: createAlertId(),
        symbol: symbol.toUpperCase(),
        name,
        condition,
        threshold,
        createdAt: Date.now(),
        status: 'active',
        triggeredAt: null,
        triggeredPrice: null,
      },
    ]);
  };

  const dismissAlert = (id: string) => {
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, status: 'dismissed' as const } : a)));
  };

  const removeAlert = (id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  const reactivateAlert = (id: string) =>
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: 'active' as const, triggeredAt: null, triggeredPrice: null } : a)),
    );
  return { alerts, addAlert, dismissAlert, removeAlert, reactivateAlert };
}

function useDashboardPreferences() {
  const [prefs, setPrefs] = useState<DashboardPreferences>(() => loadPreferences());

  useEffect(() => {
    savePreferences(prefs);
  }, [prefs]);

  const toggleFav = useCallback((symbol: string) => {
    setPrefs((p) => ({ ...p, watchlist: toggleFavorite(p.watchlist, symbol) }));
  }, []);

  const setTapePaused = useCallback((paused: boolean) => {
    setPrefs((p) => ({ ...p, tapePaused: paused }));
  }, []);

  const setActiveTab = useCallback((tab: TabId) => {
    setPrefs((p) => ({ ...p, activeTab: tab }));
  }, []);

  const move = useCallback((id: PanelId, direction: -1 | 1) => {
    setPrefs((p) => ({ ...p, panelOrder: movePanel(p.panelOrder, id, direction) }));
  }, []);

  const reset = useCallback(() => {
    setPrefs(resetPreferences());
  }, []);

  return { prefs, toggleFav, setTapePaused, setActiveTab, move, reset };
}

function BootScreen({ step }: { step: number }) {
  return (
    <div className="gmt-boot">
      <div className="gmt-boot-title">GMT://TERMINAL</div>
      <div className="gmt-boot-log">
        {BOOT_STEPS.slice(0, step + 1).map((s, i) => (
          <div key={i} className={i === step ? 'gmt-boot-active' : 'gmt-boot-done'}>
            <span className="gmt-boot-caret">&gt;</span> {s}
          </div>
        ))}
      </div>
      <div className="gmt-boot-bar">
        <div className="gmt-boot-fill" style={{ width: `${((step + 1) / BOOT_STEPS.length) * 100}%` }} />
      </div>
    </div>
  );
}

function Tape({ quotes, paused, onTogglePause }: { quotes: Quote[]; paused: boolean; onTogglePause: () => void }) {
  const ticker = useMemo(() => {
    const crypto = quotes.filter((q) => q.assetClass === 'crypto' && q.price > 0).slice(0, 25);
    const fx = quotes.filter((q) => q.assetClass === 'fx' && q.price > 0);
    return [...crypto, ...fx];
  }, [quotes]);

  return (
    <div className="gmt-tape" role="region" aria-label="Cinta de cotizaciones">
      <button
        className="gmt-tape-toggle"
        onClick={onTogglePause}
        aria-pressed={paused}
        title={paused ? 'Reanudar tape' : 'Pausar tape'}
      >
        TAPE {paused ? '▶' : '⏸'}
      </button>
      <div className="gmt-tape-scroll" style={{ animationPlayState: paused ? 'paused' : 'running' }}>
        <div className="gmt-tape-track">
          {[...ticker, ...ticker].map((q, i) => (
            <span
              key={`${q.source}-${q.symbol}-${i}`}
              className={`gmt-tape-item ${(q.priceChange24hPct ?? 0) >= 0 ? 'is-up' : 'is-down'}`}
            >
              {q.symbol} {q.price.toFixed(q.assetClass === 'fx' ? 4 : 2)}{' '}
              {q.assetClass === 'fx' ? '' : formatPercent(q.priceChange24hPct)}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function Heatmap({ quotes }: { quotes: Quote[] }) {
  const items = useMemo(() => {
    const crypto = quotes
      .filter((q) => q.assetClass === 'crypto' && q.marketCap !== null && q.marketCap! > 0)
      .sort((a, b) => (b.marketCap ?? 0) - (a.marketCap ?? 0))
      .slice(0, 40);

    if (crypto.length === 0) return [];
    const maxCap = crypto[0].marketCap ?? 1;
    return crypto.map((q) => ({
      ...q,
      size: Math.sqrt(Math.min(Math.max((q.marketCap ?? 0) / maxCap, 0.02), 1)),
      pct: q.priceChange24hPct ?? 0,
    }));
  }, [quotes]);

  if (items.length === 0) {
    return <div className="gmt-panel-empty">SIN DATOS DE HEATMAP</div>;
  }

  return (
    <div className="gmt-heatmap">
      {items.map((q) => (
        <div
          key={`${q.source}-${q.symbol}`}
          className={`gmt-heatmap-cell ${q.pct >= 0 ? 'is-up' : 'is-down'}`}
          style={{ flexGrow: q.size, flexBasis: `${q.size * 8}%` }}
          title={`${q.name} — ${formatPercent(q.pct)}`}
        >
          <span className="gmt-heatmap-symbol">{q.symbol}</span>
          <span className="gmt-heatmap-pct">{formatPercent(q.pct)}</span>
        </div>
      ))}
    </div>
  );
}

function MarketTable({ quotes, favorites, onToggleFavorite }: { quotes: Quote[]; favorites: string[]; onToggleFavorite: (symbol: string) => void }) {
  const rows = useMemo(
    () => quotes.filter((q) => q.assetClass === 'crypto').slice(0, 25),
    [quotes],
  );
  if (rows.length === 0) return <div className="gmt-panel-empty">CARGANDO…</div>;

  return (
    <table className="gmt-table">
      <thead>
        <tr>
          <th className="gmt-th-fav">★</th>
          <th>#</th>
          <th>ACTIVO</th>
          <th className="num">PRECIO</th>
          <th className="num">24H</th>
          <th className="num">7D</th>
          <th className="num">CAP. MERCADO</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((q) => (
          <tr key={`${q.source}-${q.symbol}`}>
            <td className="gmt-td-fav">
              <button
                className={isFavorite(favorites, q.symbol) ? 'gmt-fav active' : 'gmt-fav'}
                onClick={() => onToggleFavorite(q.symbol)}
                aria-pressed={isFavorite(favorites, q.symbol)}
                aria-label={isFavorite(favorites, q.symbol) ? `Quitar ${q.symbol} de favoritos` : `Añadir ${q.symbol} a favoritos`}
                title="Fijar en watchlist"
              >
                {isFavorite(favorites, q.symbol) ? '★' : '☆'}
              </button>
            </td>
            <td className="muted">{q.rank ?? '—'}</td>
            <td>
              <span className="gmt-symbol">{q.symbol}</span>{' '}
              <span className="muted small">{q.name}</span>
            </td>
            <td className="num mono">{q.price.toFixed(q.price >= 1000 ? 0 : q.price >= 1 ? 2 : 4)}</td>
            <td className={`num ${(q.priceChange24hPct ?? 0) >= 0 ? 'up' : 'down'}`}>
              {formatPercent(q.priceChange24hPct)}
            </td>
            <td className={`num ${(q.priceChange7dPct ?? 0) >= 0 ? 'up' : 'down'}`}>
              {formatPercent(q.priceChange7dPct)}
            </td>
            <td className="num muted">{formatCurrency(q.marketCap, 1)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function IndexTable({ quotes, favorites, onToggleFavorite }: { quotes: Quote[]; favorites: string[]; onToggleFavorite: (symbol: string) => void }) {
  const rows = useMemo(() => quotes.filter((q) => q.assetClass === 'equity'), [quotes]);
  if (rows.length === 0) {
    return (
      <div className="gmt-panel-empty">
        ÍNDICES: fuente no disponible. En desarrollo requiere <code>npm run dev</code> (proxy local a Yahoo).
      </div>
    );
  }
  return (
    <table className="gmt-table">
      <thead>
        <tr>
          <th className="gmt-th-fav">★</th>
          <th>ÍNDICE</th>
          <th className="num">PRECIO</th>
          <th className="num">VAR. 24H</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((q) => (
          <tr key={`${q.source}-${q.symbol}`}>
            <td className="gmt-td-fav">
              <button
                className={isFavorite(favorites, q.symbol) ? 'gmt-fav active' : 'gmt-fav'}
                onClick={() => onToggleFavorite(q.symbol)}
                aria-pressed={isFavorite(favorites, q.symbol)}
                aria-label={isFavorite(favorites, q.symbol) ? `Quitar ${q.symbol} de favoritos` : `Añadir ${q.symbol} a favoritos`}
                title="Fijar en watchlist"
              >
                {isFavorite(favorites, q.symbol) ? '★' : '☆'}
              </button>
            </td>
            <td>
              <span className="gmt-symbol">{q.symbol}</span> <span className="muted small">{q.name}</span>
            </td>
            <td className="num mono">{q.price.toLocaleString('es-ES', { maximumFractionDigits: 2 })}</td>
            <td className={`num ${(q.priceChange24hPct ?? 0) >= 0 ? 'up' : 'down'}`}>{formatPercent(q.priceChange24hPct)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function FxTable({ quotes, favorites, onToggleFavorite }: { quotes: Quote[]; favorites: string[]; onToggleFavorite: (symbol: string) => void }) {
  const rows = useMemo(() => quotes.filter((q) => q.assetClass === 'fx'), [quotes]);
  if (rows.length === 0) return <div className="gmt-panel-empty">FX: SIN DATOS</div>;
  return (
    <table className="gmt-table">
      <thead>
        <tr>
          <th className="gmt-th-fav">★</th>
          <th>DIVISA</th>
          <th>NOMBRE</th>
          <th className="num">1 EUR =</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((q) => (
          <tr key={`${q.source}-${q.symbol}`}>
            <td className="gmt-td-fav">
              <button
                className={isFavorite(favorites, q.symbol) ? 'gmt-fav active' : 'gmt-fav'}
                onClick={() => onToggleFavorite(q.symbol)}
                aria-pressed={isFavorite(favorites, q.symbol)}
                aria-label={isFavorite(favorites, q.symbol) ? `Quitar ${q.symbol} de favoritos` : `Añadir ${q.symbol} a favoritos`}
                title="Fijar en watchlist"
              >
                {isFavorite(favorites, q.symbol) ? '★' : '☆'}
              </button>
            </td>
            <td className="gmt-symbol">{q.symbol}</td>
            <td className="muted small">{q.name}</td>
            <td className="num mono">{q.price.toFixed(4)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function FxAndIndicesView({ quotes, favorites, onToggleFavorite }: { quotes: Quote[]; favorites: string[]; onToggleFavorite: (symbol: string) => void }) {
  return (
    <>
      <section className="gmt-panel gmt-panel--stats">
        <div className="gmt-panel-head"><span>ÍNDICES GLOBALES · FUENTE YAHOO FINANCE (PROXY DEV)</span></div>
        <IndexTable quotes={quotes} favorites={favorites} onToggleFavorite={onToggleFavorite} />
      </section>
      <section className="gmt-panel gmt-panel--stats">
        <div className="gmt-panel-head"><span>DIVISAS · 1 EUR (FIJA DIARIO BCE VÍA EXCHANGERATE)</span></div>
        <FxTable quotes={quotes} favorites={favorites} onToggleFavorite={onToggleFavorite} />
      </section>
    </>
  );
}

function WatchlistView({ quotes, favorites, onToggleFavorite }: { quotes: Quote[]; favorites: string[]; onToggleFavorite: (symbol: string) => void }) {
  const rows = useMemo(() => {
    const set = new Set(favorites);
    return quotes.filter((q) => q.price > 0 && set.has(q.symbol));
  }, [quotes, favorites]);

  return (
    <section className="gmt-panel gmt-panel--stats">
      <div className="gmt-panel-head"><span>WATCHLIST · ACTIVOS FIJADOS</span></div>
      {rows.length === 0 ? (
        <div className="gmt-panel-empty">
          Sin activos fijados. Marca la estrella ☆ en las pestañas Overview y FX/Índices para guardarlos aquí.
        </div>
      ) : (
        <table className="gmt-table">
          <thead>
            <tr>
              <th className="gmt-th-fav">★</th>
              <th>ACTIVO</th>
              <th className="num">PRECIO</th>
              <th className="num">24H</th>
              <th className="num">CAP. / NOTA</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((q) => (
              <tr key={`${q.source}-${q.symbol}`}>
                <td className="gmt-td-fav">
                  <button
                    className="gmt-fav active"
                    onClick={() => onToggleFavorite(q.symbol)}
                    aria-label={`Quitar ${q.symbol} de favoritos`}
                    title="Quitar de watchlist"
                  >
                    ★
                  </button>
                </td>
                <td>
                  <span className="gmt-symbol">{q.symbol}</span> <span className="muted small">{q.name}</span>
                </td>
                <td className="num mono">
                  {q.price.toFixed(q.assetClass === 'fx' ? 4 : q.price >= 1000 ? 0 : q.price >= 1 ? 2 : 4)}
                </td>
                <td className={`num ${(q.priceChange24hPct ?? 0) >= 0 ? 'up' : 'down'}`}>
                  {q.priceChange24hPct !== null ? formatPercent(q.priceChange24hPct) : '—'}
                </td>
                <td className="num muted">
                  {q.assetClass === 'crypto' ? formatCurrency(q.marketCap, 1) : q.assetClass === 'fx' ? '1 EUR' : 'Índice'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

function AlertsPanel({
  quotes,
  alerts,
  onAdd,
  onDismiss,
  onRemove,
  onReactivate,
}: {
  quotes: Quote[];
  alerts: PriceAlert[];
  onAdd: (symbol: string, name: string, condition: AlertCondition, threshold: number) => void;
  onDismiss: (id: string) => void;
  onRemove: (id: string) => void;
  onReactivate: (id: string) => void;
}) {
  const [symbol, setSymbol] = useState('');
  const [condition, setCondition] = useState<AlertCondition>('above');
  const [threshold, setThreshold] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const selectable = useMemo(() => {
    return quotes
      .filter((q) => q.price > 0)
      .sort((a, b) => a.symbol.localeCompare(b.symbol));
  }, [quotes]);

  const currentPrice = useMemo(() => {
    if (!symbol) return null;
    return selectable.find((q) => q.symbol === symbol)?.price ?? null;
  }, [symbol, selectable]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const selected = selectable.find((q) => q.symbol === symbol);
    const value = parseFloat(threshold);
    if (!selected) {
      setFormError('Selecciona un activo.');
      return;
    }
    if (!Number.isFinite(value) || value <= 0) {
      setFormError('El umbral debe ser un número mayor que cero.');
      return;
    }
    onAdd(selected.symbol, selected.name, condition, value);
    setSymbol('');
    setThreshold('');
    setFormError(null);
  };

  const summary = buildAlertSummary(alerts);
  const suggestedSymbols = useMemo(() => {
    const sorted = [...selectable].sort((a, b) => (b.price - a.price));
    return [sorted[0], selectable.find((q) => q.symbol === 'BTC'), selectable.find((q) => q.symbol === 'USD')].filter(
      (q): q is Quote => Boolean(q),
    );
  }, [selectable]);

  return (
    <>
      <section className="gmt-panel gmt-panel--stats">
        <div className="gmt-panel-head">
          <span>ALERTAS DE PRECIO</span>
          <span className="muted small mono">{summary.active} ACTIVAS · {summary.triggered} DISPARADAS</span>
        </div>
        <form className="gmt-alert-form" onSubmit={handleSubmit}>
          <label className="gmt-alert-field">
            <span className="muted small">ACTIVO</span>
            <select value={symbol} onChange={(e) => setSymbol(e.target.value)}>
              <option value="">— Selecciona —</option>
              {selectable.map((q) => (
                <option key={`${q.source}-${q.symbol}`} value={q.symbol}>{q.symbol} · {q.name}</option>
              ))}
            </select>
          </label>
          <label className="gmt-alert-field">
            <span className="muted small">CONDICIÓN</span>
            <select value={condition} onChange={(e) => setCondition(e.target.value as AlertCondition)}>
              <option value="above">por encima de</option>
              <option value="below">por debajo de</option>
            </select>
          </label>
          <label className="gmt-alert-field">
            <span className="muted small">UMBRAL</span>
            <input type="number" step="any" min="0" value={threshold} onChange={(e) => setThreshold(e.target.value)} placeholder="ej. 90000" />
          </label>
          <button type="submit" className="gmt-btn gmt-btn-primary">AÑADIR</button>
        </form>
        {formError && <div className="gmt-adapter-error" style={{ padding: '0 1rem' }}>{formError}</div>}
        {currentPrice !== null && (
          <div className="muted small" style={{ padding: '0.5rem 1rem' }}>
            Precio actual de {symbol}: <span className="mono">{currentPrice.toFixed(4)}</span>
          </div>
        )}
      </section>

      <section className="gmt-panel gmt-panel--stats">
        <div className="gmt-panel-head"><span>ALERTAS ACTIVAS &amp; RECIENTES</span></div>
        {alerts.length === 0 ? (
          <div className="gmt-panel-empty">Sin alertas. Crea una con el formulario superior.</div>
        ) : (
          <ul className="gmt-alert-list">
            {alerts.map((a) => {
              const live = selectable.find((q) => q.symbol === a.symbol)?.price;
              return (
                <li key={a.id} className={`gmt-alert-row status-${a.status}`}>
                  <div className="gmt-alert-main">
                    <span className="gmt-symbol">{a.symbol}</span>
                    <span className="muted small">{a.name}</span>
                    <span>{alertConditionLabel(a.condition)} {a.threshold.toLocaleString('es-ES')}</span>
                    <span className={`gmt-alert-badge status-${a.status}`}>{a.status.toUpperCase()}</span>
                  </div>
                  <div className="muted small mono">
                    {a.status === 'triggered' && a.triggeredPrice !== null
                      ? `disparada a ${a.triggeredPrice.toLocaleString('es-ES')} · ${a.triggeredAt ? new Date(a.triggeredAt).toLocaleTimeString('es-ES') : ''}`
                      : live !== undefined
                        ? `ahora: ${live.toLocaleString('es-ES')}`
                        : 'sin cotización'}
                  </div>
                  <div className="gmt-alert-actions">
                    {a.status === 'active' && <button className="gmt-btn" onClick={() => onRemove(a.id)}>QUITAR</button>}
                    {a.status === 'triggered' && (
                      <>
                        <button className="gmt-btn" onClick={() => onReactivate(a.id)}>REARMAR</button>
                        <button className="gmt-btn" onClick={() => onDismiss(a.id)}>DESCARTAR</button>
                        <button className="gmt-btn" onClick={() => onRemove(a.id)}>BORRAR</button>
                      </>
                    )}
                    {a.status === 'dismissed' && <button className="gmt-btn" onClick={() => onRemove(a.id)}>BORRAR</button>}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {suggestedSymbols.length > 0 && (
        <section className="gmt-panel gmt-panel--stats">
          <div className="gmt-panel-head"><span>SUGERENCIAS RÁPIDAS</span></div>
          <div className="gmt-suggestions">
            {suggestedSymbols.map((q) => (
              <button
                key={`${q.source}-${q.symbol}`}
                className="gmt-btn"
                onClick={() => {
                  setSymbol(q.symbol);
                  setCondition('above');
                  setThreshold((q.price * 1.1).toFixed(q.price >= 1 ? 2 : 4));
                }}
              >
                {q.symbol} &gt; {(q.price * 1.1).toFixed(q.price >= 1 ? 2 : 4)}
              </button>
            ))}
          </div>
        </section>
      )}
    </>
  );
}

function Sparkline({ data, positive }: { data: number[]; positive: boolean }) {
  if (!data || data.length < 2) return <span className="gmt-spark-empty">·</span>;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const width = 100;
  const height = 32;
  const step = width / (data.length - 1);
  const points = data.map((v, i) => `${(i * step).toFixed(1)},${(height - ((v - min) / range) * height).toFixed(1)}`).join(' ');
  const color = positive ? 'var(--gmt-up)' : 'var(--gmt-down)';
  return (
    <svg className="gmt-spark" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" aria-hidden="true">
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" />
    </svg>
  );
}

function TopMovers({ quotes }: { quotes: Quote[] }) {
  const movers = useMemo(() => {
    const crypto = quotes.filter((q) => q.assetClass === 'crypto' && q.priceChange24hPct !== null);
    const sorted = [...crypto].sort((a, b) => (b.priceChange24hPct ?? 0) - (a.priceChange24hPct ?? 0));
    return { gainers: sorted.slice(0, 5), losers: sorted.slice(-5).reverse() };
  }, [quotes]);

  return (
    <div className="gmt-movers">
      <div className="gmt-movers-col">
        <h4 className="gmt-col-title up">▲ MAYORES SUBIDAS</h4>
        {movers.gainers.map((q) => (
          <div key={`g-${q.symbol}`} className="gmt-mover-row">
            <span className="gmt-symbol">{q.symbol}</span>
            <span className="muted small flex1">{q.name}</span>
            <span className="up mono">{formatPercent(q.priceChange24hPct)}</span>
            <Sparkline data={q.sparkline} positive />
          </div>
        ))}
      </div>
      <div className="gmt-movers-col">
        <h4 className="gmt-col-title down">▼ MAYORES BAJADAS</h4>
        {movers.losers.map((q) => (
          <div key={`l-${q.symbol}`} className="gmt-mover-row">
            <span className="gmt-symbol">{q.symbol}</span>
            <span className="muted small flex1">{q.name}</span>
            <span className="down mono">{formatPercent(q.priceChange24hPct)}</span>
            <Sparkline data={q.sparkline} positive={false} />
          </div>
        ))}
      </div>
    </div>
  );
}

function GlobalStats({ global, quotes }: { global: GlobalMarket; quotes: Quote[] }) {
  const fxCount = useMemo(() => quotes.filter((q) => q.assetClass === 'fx').length, [quotes]);
  const cryptoCount = useMemo(() => quotes.filter((q) => q.assetClass === 'crypto').length, [quotes]);

  const stats = [
    { label: 'CAP. MERCADO GLOBAL', value: formatCurrency(global.totalMarketCapUsd) },
    { label: 'VOLUMEN 24H', value: formatCurrency(global.totalVolume24hUsd) },
    { label: 'DOMINIO BTC', value: formatPercent(global.btcDominancePct) },
    { label: 'DOMINIO ETH', value: formatPercent(global.ethDominancePct) },
    { label: 'CRIPTOACTIVOS', value: global.activeMarkets !== null ? global.activeMarkets.toLocaleString('es-ES') : '—' },
    { label: 'CRIPTO DATOS', value: String(cryptoCount) },
    { label: 'PARES FX (EUR)', value: String(fxCount) },
  ];

  return (
    <div className="gmt-stats">
      {stats.map((s) => (
        <div key={s.label} className="gmt-stat">
          <span className="gmt-stat-label">{s.label}</span>
          <span className="gmt-stat-value mono">{s.value}</span>
        </div>
      ))}
    </div>
  );
}

function AdapterPanel({ statuses, fetchedAt }: { statuses: DataSourceStatus[]; fetchedAt: number | null }) {
  return (
    <div className="gmt-adapters">
      <div className="gmt-panel-head">
        <span>DATA STATUS · ADAPTERS &amp; PROVENANCE</span>
        {fetchedAt && <span className="muted small mono">ÚLTIMA SINCRONIZACIÓN {new Date(fetchedAt).toLocaleTimeString('es-ES')}</span>}
      </div>
      <div className="gmt-adapter-list">
        {statuses.map((s) => (
          <div key={s.id} className={`gmt-adapter status-${s.status}`}>
            <div className="gmt-adapter-head">
              <span className={`gmt-dot status-${s.status}`} />
              <span className="gmt-adapter-name">{s.label}</span>
              <span className={`gmt-adapter-state status-${s.status}`}>{s.status.toUpperCase()}</span>
              <span className="muted small mono flex1 right">{s.latencyMs !== null ? `${s.latencyMs}ms` : ''}</span>
            </div>
            <div className="gmt-adapter-provenance">{s.provenance}</div>
            <div className="gmt-adapter-license muted small">LICENCIA: {s.licenseScope}</div>
            {s.error && <div className="gmt-adapter-error">{s.error}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

function Inspector({ onClose }: { onClose: () => void }) {
  return (
    <div className="gmt-inspector" role="dialog" aria-label="Inspector">
      <div className="gmt-inspector-head">
        <span>INSPECTOR</span>
        <button className="gmt-inspector-close" onClick={onClose} aria-label="Cerrar inspector">Esc cierra ✕</button>
      </div>
      <ul className="gmt-inspector-body">
        <li><strong>Módulo:</strong> GMT Terminal — Global Market Monitor</li>
        <li><strong>Datos en vivo:</strong> CoinGecko (cripto) · ExchangeRate/ECB (FX) · Yahoo Finance (índices, proxy dev)</li>
        <li><strong>Frecuencia de sondeo:</strong> cada {POLL_INTERVAL_MS / 1000}s (plan gratuito, sin WebSocket)</li>
        <li><strong>Alertas:</strong> se evalúan en cada sondeo y se conservan en el navegador.</li>
        <li><strong>Procedencia:</strong> cada cifra expone su fuente, retraso y ámbito de licencia.</li>
        <li><strong>Límites:</strong> datos de referencia y demostración. No constituyen precio ejecutable.</li>
      </ul>
    </div>
  );
}

export default function GmtTerminal() {
  const { snapshot, statuses, booting, bootStep, error, refresh } = useMarketData();
  const quotes = snapshot?.quotes ?? [];
  const { alerts, addAlert, dismissAlert, removeAlert, reactivateAlert } = usePriceAlerts(quotes);
  const { prefs, toggleFav, setTapePaused, setActiveTab, move, reset } = useDashboardPreferences();
  const [inspectorOpen, setInspectorOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setInspectorOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  if (booting) {
    return (
      <div className="gmt-terminal">
        <BootScreen step={bootStep} />
      </div>
    );
  }

  const global = snapshot?.global ?? {
    totalMarketCapUsd: null,
    totalVolume24hUsd: null,
    btcDominancePct: null,
    ethDominancePct: null,
    activeMarkets: null,
  };

  const panelBodies: Record<PanelId, { cls: string; head: string; body: JSX.Element }> = {
    stats: { cls: 'gmt-panel gmt-panel--stats', head: 'MERCADO GLOBAL', body: <GlobalStats global={global} quotes={quotes} /> },
    heatmap: { cls: 'gmt-panel gmt-panel--heatmap', head: 'HEATMAP · CAPITALIZACIÓN POR CAMBIO 24H', body: <Heatmap quotes={quotes} /> },
    movers: { cls: 'gmt-panel gmt-panel--movers', head: 'MAYORES MOVIMIENTOS', body: <TopMovers quotes={quotes} /> },
    table: { cls: 'gmt-panel gmt-panel--table', head: 'RANKING DE CRIPTOACTIVOS', body: <MarketTable quotes={quotes} favorites={prefs.watchlist} onToggleFavorite={toggleFav} /> },
  };

  return (
    <div className="gmt-terminal" id="grid">
      <header className="gmt-header">
        <div className="gmt-header-title">
          <span className="gmt-brand">GMT://TERMINAL</span>
          <span className="gmt-sub">— GLOBAL MARKET MONITOR</span>
        </div>
        <div className="gmt-header-actions">
          <button className="gmt-btn" onClick={() => setInspectorOpen((v) => !v)}>INSPECTOR <span className="muted">Esc</span></button>
          <button className="gmt-btn" onClick={refresh}>⟳ REFRESH</button>
          <button
            className="gmt-btn"
            onClick={() => {
              if (window.confirm('¿Restaurar preferencias por defecto? Se limpiará la watchlist, la pestaña, la pausa del tape y el orden de paneles.')) {
                reset();
              }
            }}
            title="Restaurar preferencias por defecto"
          >
            ↺ RESET PREFS
          </button>
        </div>
      </header>

      <nav className="gmt-tabs" role="tablist" aria-label="Secciones del terminal">
        {(['overview', 'fx', 'alerts', 'watchlist'] as TabId[]).map((v) => (
          <button
            key={v}
            role="tab"
            aria-selected={prefs.activeTab === v}
            className={prefs.activeTab === v ? 'gmt-tab active' : 'gmt-tab'}
            onClick={() => setActiveTab(v)}
          >
            {v === 'overview' ? 'OVERVIEW' : v === 'fx' ? 'FX / ÍNDICES' : v === 'alerts' ? `ALERTAS${alerts.filter((a) => a.status === 'triggered').length > 0 ? ' ●' : ''}` : `WATCHLIST${prefs.watchlist.length > 0 ? ` (${prefs.watchlist.length})` : ''}`}
          </button>
        ))}
      </nav>

      <Tape quotes={quotes} paused={prefs.tapePaused} onTogglePause={() => setTapePaused(!prefs.tapePaused)} />

      {error && <div className="gmt-error-banner">{error}</div>}

      <main className="gmt-grid" role="main">
        {prefs.activeTab === 'overview' &&
          prefs.panelOrder.map((id, idx) => {
            const p = panelBodies[id];
            return (
              <section key={id} className={p.cls}>
                <div className="gmt-panel-head">
                  <span>{p.head}</span>
                  <span className="gmt-panel-order">
                    <button onClick={() => move(id, -1)} disabled={idx === 0} aria-label="Mover arriba">▲</button>
                    <button onClick={() => move(id, 1)} disabled={idx === prefs.panelOrder.length - 1} aria-label="Mover abajo">▼</button>
                  </span>
                </div>
                {p.body}
              </section>
            );
          })}

        {prefs.activeTab === 'fx' && <FxAndIndicesView quotes={quotes} favorites={prefs.watchlist} onToggleFavorite={toggleFav} />}

        {prefs.activeTab === 'alerts' && (
          <AlertsPanel
            quotes={quotes}
            alerts={alerts}
            onAdd={addAlert}
            onDismiss={dismissAlert}
            onRemove={removeAlert}
            onReactivate={reactivateAlert}
          />
        )}

        {prefs.activeTab === 'watchlist' && (
          <WatchlistView quotes={quotes} favorites={prefs.watchlist} onToggleFavorite={toggleFav} />
        )}

        <section className="gmt-panel gmt-panel--adapters">
          <AdapterPanel statuses={statuses} fetchedAt={snapshot?.fetchedAt ?? null} />
        </section>
      </main>

      <footer className="gmt-footer">
        <span>Datos de referencia y demostración. No constituyen asesoramiento ni recomendación de inversión.</span>
        <span className="muted mono">GMT v0.3.0</span>
      </footer>

      {inspectorOpen && <Inspector onClose={() => setInspectorOpen(false)} />}
    </div>
  );
}