import { useMemo, useState } from 'react';
import {
  formatCurrency,
  formatPercent,
  type Quote,
} from './market-adapters';

type RegionFilter = 'all' | 'europe' | 'americas' | 'asia' | 'crypto' | 'fx';

const REGION_MAP: Record<string, RegionFilter> = {
  'EE. UU.': 'americas',
  'España': 'europe',
  'Alemania': 'europe',
  'Reino Unido': 'europe',
  'Zona euro': 'europe',
  'Japón': 'asia',
};

const REGION_LABELS: Record<RegionFilter, string> = {
  all: 'Todos',
  europe: 'Europa',
  americas: 'Américas',
  asia: 'Asia-Pacífico',
  crypto: 'Cripto',
  fx: 'Divisas',
};

const POPULAR_SYMBOLS = ['BTC', 'ETH', 'BNB', 'USD', 'GBP', 'JPY', 'IBEX', 'DOW', 'SP500', 'NASDAQ'];

function Sparkline({ data, positive }: { data: number[]; positive: boolean }) {
  if (!data || data.length < 2) return <span className="markets-spark-empty">—</span>;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const width = 120;
  const height = 36;
  const step = width / (data.length - 1);
  const points = data.map((v, i) => `${(i * step).toFixed(1)},${(height - ((v - min) / range) * height).toFixed(1)}`).join(' ');
  const color = positive ? 'var(--gmt-up)' : 'var(--gmt-down)';
  return (
    <svg className="markets-spark" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" aria-hidden="true">
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" />
    </svg>
  );
}

function IndexCard({
  quote,
  isSelected,
  onClick,
}: {
  quote: Quote;
  isSelected: boolean;
  onClick: () => void;
}) {
  const pct = quote.priceChange24hPct ?? 0;
  const isUp = pct >= 0;
  return (
    <button
      className={`markets-index-card ${isSelected ? 'selected' : ''} ${isUp ? 'is-up' : 'is-down'}`}
      onClick={onClick}
      aria-label={`${quote.name}: ${quote.price.toLocaleString('es-ES')} ${formatPercent(pct)}`}
    >
      <div className="markets-card-head">
        <span className="markets-card-symbol">{quote.symbol}</span>
        <span className="markets-card-market">{quote.source === 'yahoo' ? 'Índice' : quote.source === 'ecb' ? 'FX' : 'Cripto'}</span>
      </div>
      <div className="markets-card-price">
        {quote.assetClass === 'fx'
          ? quote.price.toFixed(4)
          : quote.price >= 1000
            ? quote.price.toLocaleString('es-ES', { maximumFractionDigits: 0 })
            : quote.price.toLocaleString('es-ES', { maximumFractionDigits: 2 })}
      </div>
      <div className={`markets-card-change ${isUp ? 'up' : 'down'}`}>
        <span className="markets-card-pct">{formatPercent(pct)}</span>
        <span className="markets-card-abs">
          {isUp ? '+' : ''}{(quote.price * pct / 100).toFixed(quote.assetClass === 'fx' ? 4 : 2)}
        </span>
      </div>
      <Sparkline data={quote.sparkline} positive={isUp} />
      <div className="markets-card-name">{quote.name}</div>
    </button>
  );
}

function DetailView({ quote, onBack }: { quote: Quote; onBack: () => void }) {
  const pct = quote.priceChange24hPct ?? 0;
  const isUp = pct >= 0;
  const absChange = quote.price * pct / 100;

  const metrics = [
    { label: 'PRECIO', value: quote.assetClass === 'fx' ? quote.price.toFixed(4) : quote.price.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) },
    { label: 'VAR. 24H', value: formatPercent(pct), className: isUp ? 'up' : 'down' },
    { label: 'CAMBIO ABS.', value: `${isUp ? '+' : ''}${absChange.toFixed(quote.assetClass === 'fx' ? 4 : 2)}`, className: isUp ? 'up' : 'down' },
    { label: 'CAP. MERCADO', value: formatCurrency(quote.marketCap, 1) },
    { label: 'VOLUMEN 24H', value: formatCurrency(quote.volume24h, 1) },
    { label: 'RANKING', value: quote.rank !== null ? `#${quote.rank}` : '—' },
  ];

  return (
    <div className="markets-detail">
      <button className="markets-back-btn" onClick={onBack}>← Volver a Mercados</button>
      <div className="markets-detail-header">
        <div>
          <h2 className="markets-detail-name">{quote.name}</h2>
          <span className="markets-detail-symbol">{quote.symbol}</span>
          <span className="markets-detail-source">{quote.source}</span>
        </div>
        <div className="markets-detail-price-block">
          <div className="markets-detail-price">
            {quote.assetClass === 'fx'
              ? quote.price.toFixed(4)
              : quote.price.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className={`markets-detail-change ${isUp ? 'up' : 'down'}`}>
            <span>{isUp ? '+' : ''}{absChange.toFixed(quote.assetClass === 'fx' ? 4 : 2)}</span>
            <span>{formatPercent(pct)}</span>
          </div>
        </div>
      </div>
      <div className="markets-detail-chart">
        <Sparkline data={quote.sparkline} positive={isUp} />
      </div>
      <div className="markets-detail-metrics">
        {metrics.map((m) => (
          <div key={m.label} className="markets-detail-metric">
            <span className="markets-metric-label">{m.label}</span>
            <span className={`markets-metric-value ${m.className ?? ''}`}>{m.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PopularBar({ quotes, onSelect }: { quotes: Quote[]; onSelect: (q: Quote) => void }) {
  const popular = useMemo(() => {
    const set = new Set(POPULAR_SYMBOLS);
    return quotes.filter((q) => set.has(q.symbol) && q.price > 0).slice(0, 10);
  }, [quotes]);

  if (popular.length === 0) return null;

  return (
    <div className="markets-popular">
      <div className="markets-popular-label">POPULARES</div>
      <div className="markets-popular-items">
        {popular.map((q) => {
          const pct = q.priceChange24hPct ?? 0;
          const isUp = pct >= 0;
          return (
            <button
              key={`${q.source}-${q.symbol}`}
              className={`markets-popular-item ${isUp ? 'is-up' : 'is-down'}`}
              onClick={() => onSelect(q)}
            >
              <span className="markets-popular-symbol">{q.symbol}</span>
              <span className={`markets-popular-pct ${isUp ? 'up' : 'down'}`}>{formatPercent(pct)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function MarketsView({ quotes }: { quotes: Quote[] }) {
  const [search, setSearch] = useState('');
  const [region, setRegion] = useState<RegionFilter>('all');
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);

  const filteredQuotes = useMemo(() => {
    let list = quotes.filter((q) => q.price > 0);

    if (region !== 'all') {
      if (region === 'crypto') {
        list = list.filter((q) => q.assetClass === 'crypto');
      } else if (region === 'fx') {
        list = list.filter((q) => q.assetClass === 'fx');
      } else {
        list = list.filter((q) => {
          if (q.assetClass === 'crypto' || q.assetClass === 'fx') return false;
          const mapped = REGION_MAP[q.name] ?? REGION_MAP[q.symbol];
          return mapped === region;
        });
      }
    }

    if (search.trim()) {
      const term = search.trim().toLowerCase();
      list = list.filter(
        (q) =>
          q.symbol.toLowerCase().includes(term) ||
          q.name.toLowerCase().includes(term),
      );
    }

    return list;
  }, [quotes, region, search]);

  const indexQuotes = useMemo(() => filteredQuotes.filter((q) => q.assetClass === 'equity'), [filteredQuotes]);
  const cryptoQuotes = useMemo(() => filteredQuotes.filter((q) => q.assetClass === 'crypto'), [filteredQuotes]);
  const fxQuotes = useMemo(() => filteredQuotes.filter((q) => q.assetClass === 'fx'), [filteredQuotes]);

  if (selectedQuote) {
    const live = quotes.find((q) => q.symbol === selectedQuote.symbol && q.source === selectedQuote.source);
    return <DetailView quote={live ?? selectedQuote} onBack={() => setSelectedQuote(null)} />;
  }

  return (
    <div className="markets-view">
      <div className="markets-toolbar">
        <div className="markets-search">
          <span className="markets-search-icon">🔍</span>
          <input
            type="text"
            placeholder="Buscar índice, criptomoneda o divisa..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Buscar en mercados"
          />
          {search && (
            <button className="markets-search-clear" onClick={() => setSearch('')} aria-label="Limpiar búsqueda">✕</button>
          )}
        </div>
        <div className="markets-filters">
          {(Object.keys(REGION_LABELS) as RegionFilter[]).map((key) => (
            <button
              key={key}
              className={`markets-filter-btn ${region === key ? 'active' : ''}`}
              onClick={() => setRegion(key)}
            >
              {REGION_LABELS[key]}
            </button>
          ))}
        </div>
      </div>

      <PopularBar quotes={quotes} onSelect={setSelectedQuote} />

      {indexQuotes.length > 0 && (
        <section className="markets-section">
          <h3 className="markets-section-title">ÍNDICES GLOBALES</h3>
          <div className="markets-grid">
            {indexQuotes.map((q) => (
              <IndexCard
                key={`${q.source}-${q.symbol}`}
                quote={q}
                isSelected={false}
                onClick={() => setSelectedQuote(q)}
              />
            ))}
          </div>
        </section>
      )}

      {cryptoQuotes.length > 0 && (
        <section className="markets-section">
          <h3 className="markets-section-title">CRIPTOACTIVOS</h3>
          <div className="markets-grid">
            {cryptoQuotes.map((q) => (
              <IndexCard
                key={`${q.source}-${q.symbol}`}
                quote={q}
                isSelected={false}
                onClick={() => setSelectedQuote(q)}
              />
            ))}
          </div>
        </section>
      )}

      {fxQuotes.length > 0 && (
        <section className="markets-section">
          <h3 className="markets-section-title">DIVISAS (1 EUR =)</h3>
          <div className="markets-grid">
            {fxQuotes.map((q) => (
              <IndexCard
                key={`${q.source}-${q.symbol}`}
                quote={q}
                isSelected={false}
                onClick={() => setSelectedQuote(q)}
              />
            ))}
          </div>
        </section>
      )}

      {filteredQuotes.length === 0 && (
        <div className="markets-empty">
          <p>No se encontraron resultados para "{search || REGION_LABELS[region]}"</p>
          <button className="markets-filter-btn" onClick={() => { setSearch(''); setRegion('all'); }}>Limpiar filtros</button>
        </div>
      )}
    </div>
  );
}
