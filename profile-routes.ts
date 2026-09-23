/**
 * Rutas de lectura por perfil inversor (Guía 2026 §1) — árbol de decisión A/B/C.
 *
 * Cada ruta lleva a un stack mínimo y a las secciones del protocolo con mayor
 * peso. El usuario híbrido elige "sombrero" cada mañana; no se mezclan rutas
 * en el mismo bloque de trabajo.
 */

export type ProfileRouteId = 'A' | 'B' | 'C';

export type ProfileRoute = {
  id: ProfileRouteId;
  title: string;
  shortLabel: string;
  description: string;
  priorities: string[];
  stack: string[];
  /** Énfasis del checklist diario (§8) para esta ruta. */
  protocolEmphasis: string;
  ignore: string[];
};

export const INVESTOR_ROUTES: ProfileRoute[] = [
  {
    id: 'A',
    title: 'Inversor fundamental a largo plazo',
    shortLabel: 'A · Fundamental',
    description:
      'Valorar empresas a 5-10 años, dividendos y fundamentales. El timing de milisegundos no importa; sí la calidad (ROIC > WACC) y el precio respecto al valor intrínseco.',
    priorities: [
      'Filtro fundamental: ROIC > WACC, Deuda/EBITDA < 3, FCF positivo',
      'Percentiles históricos de valoración (10 años)',
      'Margen de seguridad sobre valor intrínseco (DCF / múltiplos)',
    ],
    stack: ['Coyfin o Stock Rover (valoración)', 'Finviz o Gainify (filtro y contexto)', 'Yahoo Finance o TradingView básico (gráfico simple)'],
    protocolEmphasis:
      'Paso 1 (fundamental) es tu puerta de entrada obligatoria; el paso 2 (volumen) solo confirma entradas puntuales.',
    ignore: ['ATAS / Sierra Chart (order flow)', 'Trading Technologies', 'NautilusTrader'],
  },
  {
    id: 'B',
    title: 'Desarrollador cuant / algorítmico',
    shortLabel: 'B · Cuant',
    description:
      'Programar estrategias, backtesting con paridad live, baja latencia y futuros. La latencia y la memoria del runtime importan más que los flujos de caja a 10 años.',
    priorities: [
      'Paridad backtest ↔ ejecución en vivo (mismo código)',
      'Latencia de ejecución y calidad del feed',
      'Confluencia automatizada (confluencia §3) sin sesgo de confirmación',
    ],
    stack: ['NautilusTrader (Rust, backtest=live)', 'Trading Technologies / NinjaTrader (futuros)', 'MetaTrader 5 (Forex, bots)', 'TrendSpider (trazado con IA)'],
    protocolEmphasis:
      'Pasos 2 y 3 (volumen + Kelly fraccional) automatizables; el paso 1 se externaliza al screener fundamental.',
    ignore: ['Tutoriales de "qué es el RSI"', 'Heatmaps básicos de fase 1'],
  },
  {
    id: 'C',
    title: 'Trader activo y de opciones',
    shortLabel: 'C · Trader activo',
    description:
      'Operar a diario, swing y opciones. Los datos no pueden tener 15-20 min de retraso: el semáforo de §6 es obligatorio para ti.',
    priorities: [
      'Confluencia de indicadores (jurado RSI+MACD+Bollinger+Volumen)',
      'Semáforo de datos: nada de planes free con retraso',
      'Simulación realista (slippage, depth) antes de capital real',
    ],
    stack: ['Thinkorswim Paper Money o Webull (simulación)', 'TradingView (confluencia)', 'Interactive Brokers (cuando pases a real)'],
    protocolEmphasis:
      'Checklist diario completo en cada sesión; el paso 2 (volumen 1,5-2×) es tu filtro antitrampas principal.',
    ignore: ['Screeners fundamental de 500+ parámetros (usa A cuando lo necesites)'],
  },
];

export const PROFILE_ROUTE_STORAGE_KEY = 'portafolio-intel-profile-route-v1';

export function getRouteById(id: string): ProfileRoute | null {
  return INVESTOR_ROUTES.find((r) => r.id === id) ?? null;
}

export function loadProfileRoute(storage: Pick<Storage, 'getItem'>): ProfileRoute {
  try {
    const raw = storage.getItem(PROFILE_ROUTE_STORAGE_KEY);
    if (raw) {
      const route = getRouteById(raw);
      if (route) return route;
    }
  } catch {
    // storage no disponible → ruta A por defecto
  }
  return INVESTOR_ROUTES[0];
}

export function saveProfileRoute(storage: Pick<Storage, 'setItem'>, id: ProfileRouteId): void {
  try {
    storage.setItem(PROFILE_ROUTE_STORAGE_KEY, id);
  } catch {
    // best-effort
  }
}
