import { analyzeKelly, formatKellyRecommendation, type KellyInputs, type KellyResult } from './financial-kelly';
import { calculateVolumeMetrics } from './financial-confluence';
import type { OHLCV } from './financial-technical';

/**
 * Protocolo tecnofundamental diario (Guía 2026 §8) — checklist de 3 pasos:
 *
 *  1. Filtro fundamental: exigir ROIC > WACC antes de mirar ningún gráfico.
 *  2. Sincronización técnica: ruptura con volumen 1.5–2× la media de 20 días.
 *  3. Gestión de riesgo: tamaño de posición por Kelly / fracción conservadora.
 *
 * Secuencia lógica: calidad → timing → tamaño. Un paso en fail bloquea el sistema.
 */

export type StepStatus = 'pass' | 'fail' | 'pending';

export type ProtocolStepId = 'fundamental' | 'technical' | 'risk';

export type ProtocolStep = {
  id: ProtocolStepId;
  order: 1 | 2 | 3;
  title: string;
  status: StepStatus;
  detail: string;
  metricLabel?: string;
  metricValue?: string;
};

export type DailyProtocolInput = {
  /** ROIC en porcentaje (ej. 18.5 = 18.5%). */
  roicPercent?: number | null;
  /** WACC en porcentaje (ej. 9.2 = 9.2%). Unidades idénticas a roicPercent. */
  waccPercent?: number | null;
  /** Serie OHLCV para validar el volumen de ruptura (paso 2). */
  ohlcv?: OHLCV[];
  /** Si ya calculaste el ratio de volumen fuera (última media / media20d). Ej. 1.8 = 1.8×. */
  volumeRatio?: number | null;
  kelly?: KellyInputs;
  /** Capital disponible para dimensionar la posición (paso 3). */
  capital?: number | null;
};

export type DailyProtocolResult = {
  steps: ProtocolStep[];
  /** 'ready' = los 3 pasos en pass; 'blocked' = algún fail; 'incomplete' = falta datos. */
  state: 'ready' | 'blocked' | 'incomplete';
  kelly: KellyResult | null;
  kellyRecommendation: string | null;
  canProceedToTechnical: boolean;
  canProceedToRisk: boolean;
};

function isFiniteNumber(n: number | null | undefined): n is number {
  return typeof n === 'number' && Number.isFinite(n);
}

export function evaluateFundamentalGate(roicPercent?: number | null, waccPercent?: number | null): ProtocolStep {
  const title = 'Paso 1 — Filtro fundamental (ROIC > WACC)';
  if (!isFiniteNumber(roicPercent) || !isFiniteNumber(waccPercent)) {
    return {
      id: 'fundamental',
      order: 1,
      title,
      status: 'pending',
      detail: 'Introduce ROIC y WACC en porcentaje. La empresa debe ganar más de lo que le cuesta financiarse.',
      metricLabel: 'ROIC − WACC',
      metricValue: '—',
    };
  }
  const spread = roicPercent - waccPercent;
  const pass = spread > 0;
  return {
    id: 'fundamental',
    order: 1,
    title,
    status: pass ? 'pass' : 'fail',
    detail: pass
      ? `Diferencial positivo (+${spread.toFixed(2)} pp): la empresa crea valor sobre su coste de capital. Pasa al paso 2.`
      : `Diferencial negativo (${spread.toFixed(2)} pp): no supera el filtro de calidad. No mires el gráfico — descarta o investiga más.`,
    metricLabel: 'ROIC − WACC',
    metricValue: `${spread > 0 ? '+' : ''}${spread.toFixed(2)} pp`,
  };
}

export function evaluateVolumeGate(input: Pick<DailyProtocolInput, 'ohlcv' | 'volumeRatio'>): ProtocolStep {
  const title = 'Paso 2 — Sincronización técnica (volumen 1,5-2× media 20d)';
  let ratio: number | null = isFiniteNumber(input.volumeRatio ?? null) ? (input.volumeRatio as number) : null;

  if (ratio === null && input.ohlcv && input.ohlcv.length > 0) {
    const metrics = calculateVolumeMetrics(input.ohlcv);
    ratio = metrics.volumeRatio;
  }

  if (ratio === null) {
    return {
      id: 'technical',
      order: 2,
      title,
      status: 'pending',
      detail: 'Se necesita el ratio de volumen (última sesión / media 20 días) o una serie OHLCV con volumen.',
      metricLabel: 'Volumen / media 20d',
      metricValue: '—',
    };
  }

  if (ratio >= 1.5) {
    const ideal = ratio <= 2;
    return {
      id: 'technical',
      order: 2,
      title,
      status: 'pass',
      detail: ideal
        ? `Volumen ${ratio.toFixed(2)}× la media de 20 días: ruptura con respaldo de capital (rango ideal 1,5-2×).`
        : `Volumen ${ratio.toFixed(2)}× la media de 20 días: supera el mínimo de 1,5× pero ojo a exceso (>2× puede ser clímax).`,
      metricLabel: 'Volumen / media 20d',
      metricValue: `${ratio.toFixed(2)}×`,
    };
  }

  return {
    id: 'technical',
    order: 2,
    title,
    status: 'fail',
    detail: `Volumen ${ratio.toFixed(2)}× la media de 20 días: por debajo de 1,5× — posible ruptura trampa. No entres.`,
    metricLabel: 'Volumen / media 20d',
    metricValue: `${ratio.toFixed(2)}×`,
  };
}

export function evaluateRiskGate(
  kellyInputs?: KellyInputs,
  capital?: number | null,
): { step: ProtocolStep; kelly: KellyResult | null; recommendation: string | null } {
  const title = 'Paso 3 — Gestión de riesgo (Kelly fraccional)';
  if (!kellyInputs || (kellyInputs.winRate === undefined && !kellyInputs.scenarios)) {
    return {
      step: {
        id: 'risk',
        order: 3,
        title,
        status: 'pending',
        detail: 'Introduce win rate y payoff ratio (o escenarios) para dimensionar la posición con matemática, no con calentón.',
        metricLabel: 'Kelly (conservador)',
        metricValue: '—',
      },
      kelly: null,
      recommendation: null,
    };
  }

  const kelly = analyzeKelly(kellyInputs);
  const recommendation =
    isFiniteNumber(capital ?? null) && capital! > 0 ? formatKellyRecommendation(kelly, capital as number) : null;

  if (!kelly.isWinning || kelly.fraction <= 0) {
    return {
      step: {
        id: 'risk',
        order: 3,
        title,
        status: 'fail',
        detail: 'El escenario no es favorable según Kelly: no se justifica abrir posición con estos parámetros.',
        metricLabel: 'Kelly (conservador)',
        metricValue: `${(kelly.fraction * 100).toFixed(1)}%`,
      },
      kelly,
      recommendation,
    };
  }

  return {
    step: {
      id: 'risk',
      order: 3,
      title,
      status: 'pass',
      detail: `Tamaño sugerido: ${(kelly.fraction * 100).toFixed(1)}% del capital (Kelly conservador = ½ Kelly completo ${(kelly.fullKelly * 100).toFixed(1)}%).`,
      metricLabel: 'Kelly (conservador)',
      metricValue: `${(kelly.fraction * 100).toFixed(1)}%`,
    },
    kelly,
    recommendation,
  };
}

export function evaluateDailyProtocol(input: DailyProtocolInput): DailyProtocolResult {
  const step1 = evaluateFundamentalGate(input.roicPercent, input.waccPercent);
  const step2 = evaluateVolumeGate(input);
  const risk = evaluateRiskGate(input.kelly, input.capital);
  const step3 = risk.step;

  const steps = [step1, step2, step3];

  const anyPending = steps.some((s) => s.status === 'pending');
  const anyFail = steps.some((s) => s.status === 'fail');

  // La secuencia es obligatoria: si el paso 1 falla, los posteriores no deben "pass" como sistema listo.
  let state: DailyProtocolResult['state'];
  if (step1.status === 'fail') state = 'blocked';
  else if (anyFail) state = 'blocked';
  else if (anyPending) state = 'incomplete';
  else state = 'ready';

  return {
    steps,
    state,
    kelly: risk.kelly,
    kellyRecommendation: risk.recommendation,
    canProceedToTechnical: step1.status === 'pass',
    canProceedToRisk: step1.status === 'pass' && step2.status === 'pass',
  };
}
