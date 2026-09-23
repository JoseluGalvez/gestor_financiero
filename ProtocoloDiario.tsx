import { useMemo, useState } from 'react';
import {
  INVESTOR_ROUTES,
  loadProfileRoute,
  saveProfileRoute,
  type ProfileRoute,
  type ProfileRouteId,
} from './profile-routes';
import { buildFullSemaphore, type SemaphoreEntry } from './data-semaphore';
import { evaluateDailyProtocol, type DailyProtocolResult } from './daily-protocol';
import { evaluateConfluence, type ConfluenceResult } from './financial-confluence';
import { fetchStooqDaily, normalizeStooqSymbol } from './stooq-ohlc-adapter';
import type { OHLCV } from './financial-technical';
import type { DataSourceStatus } from './market-adapters';
import { ADAPTER_REGISTRY } from './market-adapters';

const PASSIVE_STATUSES: DataSourceStatus[] = ADAPTER_REGISTRY.map((entry) => ({
  ...entry,
  status: 'boot' as const,
  lastUpdatedAt: null,
  latencyMs: null,
}));

function toNumber(value: string): number | null {
  if (value.trim() === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function protocolStateLabel(state: DailyProtocolResult['state']): { label: string; className: string } {
  if (state === 'ready') return { label: 'Listo para operar', className: 'status-pass' };
  if (state === 'blocked') return { label: 'Bloqueado', className: 'status-fail' };
  return { label: 'Incompleto', className: 'status-pending' };
}

function confluenceVerdictLabel(verdict: ConfluenceResult['verdict']): { label: string; className: string } {
  if (verdict === 'buy') return { label: 'Confluencia alcista (jurado ✓)', className: 'status-pass' };
  if (verdict === 'sell') return { label: 'Confluencia bajista (jurado ✓)', className: 'status-fail' };
  return { label: 'Esperar — jurado no converge', className: 'status-pending' };
}

export default function ProtocoloDiario() {
  const [route, setRoute] = useState<ProfileRoute>(() => loadProfileRoute(window.localStorage));
  const [roic, setRoic] = useState('');
  const [wacc, setWacc] = useState('');
  const [volumeRatio, setVolumeRatio] = useState('');
  const [winRate, setWinRate] = useState('');
  const [payoffRatio, setPayoffRatio] = useState('');
  const [capital, setCapital] = useState('');
  const [symbol, setSymbol] = useState('');
  const [ohlcv, setOhlcv] = useState<OHLCV[] | null>(null);
  const [fetchState, setFetchState] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle');
  const [fetchMsg, setFetchMsg] = useState('');

  const semaphore: SemaphoreEntry[] = useMemo(() => buildFullSemaphore(PASSIVE_STATUSES), []);

  const protocol: DailyProtocolResult = useMemo(
    () =>
      evaluateDailyProtocol({
        roicPercent: toNumber(roic),
        waccPercent: toNumber(wacc),
        volumeRatio: volumeRatio.trim() === '' && ohlcv ? null : toNumber(volumeRatio),
        ohlcv: ohlcv ?? undefined,
        kelly:
          toNumber(winRate) !== null && toNumber(payoffRatio) !== null
            ? { winRate: (toNumber(winRate) as number) / 100, payoffRatio: toNumber(payoffRatio) as number }
            : undefined,
        capital: toNumber(capital),
      }),
    [roic, wacc, volumeRatio, winRate, payoffRatio, capital, ohlcv],
  );

  const confluence = useMemo<ConfluenceResult | null>(() => (ohlcv && ohlcv.length >= 30 ? evaluateConfluence(ohlcv) : null), [ohlcv]);

  const handleRouteChange = (id: ProfileRouteId) => {
    const next = INVESTOR_ROUTES.find((r) => r.id === id);
    if (!next) return;
    setRoute(next);
    saveProfileRoute(window.localStorage, id);
  };

  const handleFetchOhlcv = async () => {
    const q = symbol.trim();
    if (!q) {
      setFetchState('error');
      setFetchMsg('Introduce un ticker o símbolo (ej. AAPL, SAN.MC).');
      return;
    }
    try {
      setFetchState('loading');
      setFetchMsg('Descargando serie diaria desde Stooq…');
      const to = new Date();
      const from = new Date();
      from.setDate(from.getDate() - 120);
      const fmt = (d: Date) => d.toISOString().slice(0, 10);
      const rows = await fetchStooqDaily(normalizeStooqSymbol(q), { from: fmt(from), to: fmt(to) });
      setOhlcv(rows);
      setFetchState('ok');
      setFetchMsg(`${rows.length} velas cargadas para ${q.toUpperCase()} — confluencia evaluada.`);
    } catch (err) {
      setOhlcv(null);
      setFetchState('error');
      setFetchMsg(err instanceof Error ? err.message : String(err));
    }
  };

  const stateMeta = protocolStateLabel(protocol.state);

  return (
    <div className="protocolo-diario">
      <header className="protocolo-header">
        <h2>Protocolo Diario Tecnofundamental</h2>
        <p className="section-hint">
          Checklist obligatorio de 3 pasos (Guía 2026 §8): calidad → timing → tamaño. La secuencia es lógica: sin
          ROIC &gt; WACC no se mira el gráfico; sin volumen de ruptura no se calcula el tamaño.
        </p>
      </header>

      <section className="section protocolo-routes">
        <h3>1 · Ruta por perfil (§1)</h3>
        <p className="section-hint">Elige el sombrero de hoy. No mezcles rutas en el mismo bloque de trabajo.</p>
        <div className="route-selector" role="radiogroup" aria-label="Perfil inversor">
          {INVESTOR_ROUTES.map((r) => (
            <button
              key={r.id}
              type="button"
              role="radio"
              aria-checked={route.id === r.id}
              className={`route-card ${route.id === r.id ? 'selected' : ''}`}
              onClick={() => handleRouteChange(r.id)}
            >
              <span className="route-short">{r.shortLabel}</span>
              <span className="route-title">{r.title}</span>
            </button>
          ))}
        </div>
        <div className="route-detail">
          <p>{route.description}</p>
          <div className="route-cols">
            <div>
              <h4>Prioridades</h4>
              <ul>
                {route.priorities.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </div>
            <div>
              <h4>Stack mínimo</h4>
              <ul>
                {route.stack.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </div>
            <div>
              <h4>Checklist (énfasis)</h4>
              <p className="route-emphasis">{route.protocolEmphasis}</p>
              <h4>Ignorar en esta ruta</h4>
              <ul className="route-ignore">
                {route.ignore.map((i) => (
                  <li key={i}>{i}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="section protocolo-semaphore">
        <h3>2 · Semáforo de datos — ¿operar o solo estudiar? (§6)</h3>
        <p className="section-hint">
          Clasifica cada fuente por latencia y licencia. Solo 🟢 es apto para ejecutar órdenes; 🟡 para analizar;
          🔴 solo fin de día / referencia.
        </p>
        <div className="semaphore-grid">
          {semaphore.map((entry) => (
            <div key={entry.id} className={`semaphore-card level-${entry.level}`}>
              <div className="semaphore-head">
                <span className="semaphore-emoji" aria-hidden="true">
                  {entry.emoji}
                </span>
                <strong>{entry.label}</strong>
                <span className={`semaphore-level level-${entry.level}`}>{entry.level}</span>
              </div>
              <p>{entry.reason}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section protocolo-checklist">
        <h3>3 · Checklist diario (§8)</h3>
        <div className={`checklist-state ${stateMeta.className}`}>{stateMeta.label}</div>

        <div className="checklist-grid">
          <div className="checklist-group">
            <h4>Paso 1 — Filtro fundamental</h4>
            <label className="field">
              <span className="field-label">ROIC (%)</span>
              <input type="number" step="0.1" value={roic} onChange={(e) => setRoic(e.target.value)} placeholder="ej. 18.5" />
            </label>
            <label className="field">
              <span className="field-label">WACC (%)</span>
              <input type="number" step="0.1" value={wacc} onChange={(e) => setWacc(e.target.value)} placeholder="ej. 9.2" />
            </label>
            <p className="field-help-text">Unidades en porcentaje (15 = 15%). Exigir ROIC &gt; WACC.</p>
          </div>

          <div className="checklist-group">
            <h4>Paso 2 — Sincronización técnica</h4>
            <label className="field">
              <span className="field-label">Volumen / media 20d (×)</span>
              <input
                type="number"
                step="0.1"
                value={volumeRatio}
                onChange={(e) => setVolumeRatio(e.target.value)}
                placeholder={ohlcv ? 'calculado de la serie' : 'ej. 1.8'}
              />
            </label>
            <label className="field">
              <span className="field-label">Símbolo (Stooq, serie diaria)</span>
              <input
                type="text"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                placeholder="ej. AAPL, SAN.MC"
                list="stooq-symbol"
              />
            </label>
            <button type="button" className="btn btn-secondary" onClick={() => void handleFetchOhlcv()} disabled={fetchState === 'loading'}>
              {fetchState === 'loading' ? 'Cargando…' : 'Cargar OHLCV'}
            </button>
            {fetchMsg && (
              <p className={`edgar-status edgar-status-${fetchState}`} role="status">
                {fetchMsg}
              </p>
            )}
            <p className="field-help-text">Se exige ≥ 1,5× la media de 20 días (rango ideal 1,5-2×).</p>
          </div>

          <div className="checklist-group">
            <h4>Paso 3 — Gestión de riesgo (Kelly)</h4>
            <label className="field">
              <span className="field-label">Win rate (%)</span>
              <input type="number" step="1" value={winRate} onChange={(e) => setWinRate(e.target.value)} placeholder="ej. 60" />
            </label>
            <label className="field">
              <span className="field-label">Payoff ratio</span>
              <input type="number" step="0.1" value={payoffRatio} onChange={(e) => setPayoffRatio(e.target.value)} placeholder="ej. 2" />
            </label>
            <label className="field">
              <span className="field-label">Capital (€)</span>
              <input type="number" step="100" value={capital} onChange={(e) => setCapital(e.target.value)} placeholder="ej. 10000" />
            </label>
            <p className="field-help-text">Se usa ½ Kelly (conservador). Tamaño = fraction × capital.</p>
          </div>
        </div>

        <ol className="protocol-steps">
          {protocol.steps.map((step) => (
            <li key={step.id} className={`protocol-step status-${step.status}`}>
              <div className="protocol-step-head">
                <span className="protocol-step-status" aria-hidden="true">
                  {step.status === 'pass' ? '✓' : step.status === 'fail' ? '✗' : '…'}
                </span>
                <strong>{step.title}</strong>
                {step.metricValue && (
                  <span className="protocol-step-metric">
                    {step.metricLabel}: {step.metricValue}
                  </span>
                )}
              </div>
              <p>{step.detail}</p>
            </li>
          ))}
        </ol>

        {protocol.kellyRecommendation && (
          <div className="kelly-recommendation">
            <strong>Sizing sugerido:</strong> {protocol.kellyRecommendation}
          </div>
        )}
      </section>

      <section className="section protocolo-confluence">
        <h3>4 · Motor de confluencia — jurado de indicadores (§3)</h3>
        {!ohlcv ? (
          <div className="empty-state-large">
            <h3>Sin serie OHLCV</h3>
            <p>Carga un símbolo en el paso 2 para evaluar el jurado: volatilidad (Bollinger) + momentum (RSI/MACD) + volumen (ratio 20d/OBV).</p>
          </div>
        ) : confluence ? (
          <>
            <div className={`confluence-verdict ${confluenceVerdictLabel(confluence.verdict).className}`}>
              {confluenceVerdictLabel(confluence.verdict).label}
              {confluence.insufficientData ? ' (datos insuficientes)' : ''}
            </div>
            <div className="confluence-grid">
              {confluence.categories.map((cat) => (
                <div key={cat.id} className={`confluence-card signal-${cat.signal}`}>
                  <div className="confluence-card-head">
                    <strong>{cat.label}</strong>
                    <span className={`confluence-signal signal-${cat.signal}`}>{cat.signal}</span>
                  </div>
                  <p>{cat.detail}</p>
                </div>
              ))}
            </div>
            <ul className="confluence-notes">
              {confluence.notes.map((note, i) => (
                <li key={i}>{note}</li>
              ))}
            </ul>
          </>
        ) : (
          <div className="empty-state-large">
            <h3>Velas insuficientes</h3>
            <p>Se requieren al menos 30 velas con la serie cargada ({ohlcv.length} disponibles).</p>
          </div>
        )}
      </section>
    </div>
  );
}
