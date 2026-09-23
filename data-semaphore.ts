import type { DataSourceStatus } from './market-adapters';

/**
 * Semáforo de datos (Guía 2026 §6) — operar vs. estudiar.
 *
 * Clasifica cada fuente según latencia y restricciones del plan:
 *  - 'operar'          → apto para ejecutar órdenes a corto plazo (tiempo real sin límites críticos)
 *  - 'estudiar'        → sirve para analizar/planificar, NO para day trading
 *  - 'solo-historico'  → datos sin intradía o caídos: solo fin de día / referencia
 */

export type SemaphoreLevel = 'operar' | 'estudiar' | 'solo-historico';

export type SemaphoreEntry = {
  id: string;
  label: string;
  level: SemaphoreLevel;
  emoji: '🟢' | '🟡' | '🔴';
  reason: string;
  /** Fuente runtime del adaptador (si aplica) o 'guide' para el catálogo estático. */
  origin: 'adapter' | 'guide';
};

/**
 * Catálogo estático de la guía (§6) — planes gratuitos de plataformas externas.
 * Precios/límites 2026: verificar vigencia.
 */
export const GUIDE_PLATFORM_SEMAPHORE: SemaphoreEntry[] = [
  {
    id: 'finviz-free',
    label: 'Finviz (plan free)',
    level: 'solo-historico',
    emoji: '🔴',
    reason: 'Retraso de 15-20 min y gráficos estáticos con refresco manual: prohibido para day trading.',
    origin: 'guide',
  },
  {
    id: 'stockcharts-free',
    label: 'StockCharts (plan free)',
    level: 'solo-historico',
    emoji: '🔴',
    reason: 'Sin datos intradía (solo diario/semanal): inútil para corto plazo; válido para inversor a meses vista.',
    origin: 'guide',
  },
  {
    id: 'tradingview-basic',
    label: 'TradingView (plan básico)',
    level: 'estudiar',
    emoji: '🟡',
    reason: 'Cotizaciones en tiempo real, pero solo 2 indicadores por gráfico: análisis mutilado para confluencia completa.',
    origin: 'guide',
  },
  {
    id: 'yahoo-finance',
    label: 'Yahoo Finance',
    level: 'estudiar',
    emoji: '🟡',
    reason: 'Adecuado para aprender y reconocer patrones; para ejecución en real usar bróker con feed serio.',
    origin: 'guide',
  },
  {
    id: 'atas-sierra',
    label: 'ATAS / Sierra Chart / TT',
    level: 'operar',
    emoji: '🟢',
    reason: 'Order flow de nivel institucional — solo tiene sentido con feed profesional de pago/exchange (no son "free tiers").',
    origin: 'guide',
  },
];

/** Reglas por adaptador de la app (market-adapters DataSourceId). */
type AdapterRule = { level: SemaphoreLevel; reason: string };

const ADAPTER_RULES: Record<string, AdapterRule> = {
  coingecko: {
    level: 'estudiar',
    reason: 'API pública demo con datos desde ~60s y sin WebSocket: apto para paneles, no para ejecución intradía.',
  },
  ecb: {
    level: 'solo-historico',
    reason: 'Fijado diario del BCE: referencia macro, no precio ejecutable intradía.',
  },
  yahoo: {
    level: 'estudiar',
    reason: 'Índices vía proxy dev / requiere licencia de display en producción: panel informativo, no flujo de órdenes.',
  },
  'sec-edgar': {
    level: 'solo-historico',
    reason: 'Fundamentales XBRL oficiales sin cotizaciones: filtro fundamental (paso 1 del protocolo), no timing.',
  },
  marketstack: {
    level: 'operar',
    reason: 'Intradía y EOD estructurados; en plan free la cuota limita el volumen de peticiones (verificar vigencia).',
  },
};

function levelEmoji(level: SemaphoreLevel): SemaphoreEntry['emoji'] {
  if (level === 'operar') return '🟢';
  if (level === 'estudiar') return '🟡';
  return '🔴';
}

export function classifyAdapterUseCase(status: DataSourceStatus): SemaphoreEntry {
  const rule = ADAPTER_RULES[status.id];
  let level: SemaphoreLevel;
  let reason: string;

  if (status.status === 'error' || status.status === 'stale') {
    level = 'solo-historico';
    reason = status.error
      ? `Fuente caída o obsoleta: ${status.error}`
      : 'Fuente caída u obsoleta: no apta ni siquiera para estudiar en esta sesión.';
  } else if (status.status === 'degraded' || status.status === 'boot') {
    level = rule?.level === 'operar' ? 'estudiar' : (rule?.level ?? 'estudiar');
    reason = rule
      ? `${rule.reason} (estado ${status.status}: verificar configuración.)`
      : `Proveedor no configurado o degradado (estado ${status.status}).`;
  } else {
    // status ok
    level = rule?.level ?? 'estudiar';
    reason = rule?.reason ?? 'Sin regla específica: tratar como estudio hasta verificar latencia.';
  }

  return {
    id: status.id,
    label: status.label,
    level,
    emoji: levelEmoji(level),
    reason,
    origin: 'adapter',
  };
}

export function buildSemaphoreList(statuses: DataSourceStatus[]): SemaphoreEntry[] {
  return statuses.map(classifyAdapterUseCase);
}

/** Catálogo guía + adaptadores (guía primero), sin duplicar ids. */
export function buildFullSemaphore(statuses: DataSourceStatus[] = []): SemaphoreEntry[] {
  const adapters = buildSemaphoreList(statuses);
  const adapterIds = new Set(adapters.map((a) => a.id));
  const guideOnly = GUIDE_PLATFORM_SEMAPHORE.filter((g) => !adapterIds.has(g.id));
  return [...guideOnly, ...adapters];
}

export function isLevelOperational(entry: SemaphoreEntry): boolean {
  return entry.level === 'operar';
}
