import { analyzeTechnical, type OHLCV } from './financial-technical';

/**
 * Motor de confluencia (Guía 2026 §3 — ecosistema de indicadores).
 *
 * Regla del jurado: nunca operar con un indicador aislado. Se exige convergencia
 * de 3 categorías distintas — volatilidad (Bollinger), momentum (RSI + MACD) y
 * volumen (ratio vs. media 20d + OBV) — antes de emitir una señal operativa.
 *
 * - RSI > 70 (o < 30) es una ALERTA; el MACD hace de juez (confirma/veta).
 * - El squeeze de Bollinger solo vale si el volumen acompaña la ruptura.
 */

export type CategorySignal = 'bullish' | 'bearish' | 'neutral';

export type JuryVerdict = 'buy' | 'sell' | 'wait';

export type VolumeMetrics = {
  lastVolume: number | null;
  averageVolume20: number | null;
  /** lastVolume / averageVolume20 — la guía exige 1.5–2× para confirmar rupturas. */
  volumeRatio: number | null;
  obv: number | null;
  obvSlope: CategorySignal;
};

export type ConfluenceCategory = {
  id: 'volatility' | 'momentum' | 'volume';
  label: string;
  signal: CategorySignal;
  detail: string;
};

export type ConfluenceResult = {
  categories: ConfluenceCategory[];
  bullishCount: number;
  bearishCount: number;
  neutralCount: number;
  /** Categorías no neutras que convergen en la misma dirección (máx. 2 de 3). */
  agreement: number;
  verdict: JuryVerdict;
  /** true si RSI está en extremo y el MACD lo confirma (patrón §3.2). */
  rsiMacdConfirmed: boolean;
  /** true si hay squeeze de Bollinger con volumen ≥ 1.5× media 20d (§3.3). */
  squeezeVolumeConfirmed: boolean;
  notes: string[];
  insufficientData: boolean;
};

function calculateOBV(ohlcv: OHLCV[]): number | null {
  if (ohlcv.length < 2) return null;
  if (ohlcv.every((bar) => bar.volume === undefined || bar.volume === null)) return null;

  let obv = 0;
  for (let i = 1; i < ohlcv.length; i++) {
    const prev = ohlcv[i - 1];
    const curr = ohlcv[i];
    const vol = curr.volume ?? 0;
    if (curr.close > prev.close) obv += vol;
    else if (curr.close < prev.close) obv -= vol;
  }
  return obv;
}

function obvSlopeSignal(ohlcv: OHLCV[]): CategorySignal {
  if (ohlcv.length < 6) return 'neutral';
  const window = ohlcv.slice(-5);
  let rising = 0;
  let falling = 0;
  let obv = 0;
  for (let i = 1; i < window.length; i++) {
    const prev = window[i - 1];
    const curr = window[i];
    const vol = curr.volume ?? 0;
    if (curr.close > prev.close) obv += vol;
    else if (curr.close < prev.close) obv -= vol;
    if (i >= 2) {
      // pendiente acumulada proxy: comparar cierres del tramo con volumen
      if (curr.close > prev.close && vol > 0) rising++;
      if (curr.close < prev.close && vol > 0) falling++;
    }
  }
  if (rising > falling && obv >= 0) return 'bullish';
  if (falling > rising && obv <= 0) return 'bearish';
  return 'neutral';
}

export function calculateVolumeMetrics(ohlcv: OHLCV[]): VolumeMetrics {
  const withVolume = ohlcv.filter((b) => typeof b.volume === 'number' && b.volume >= 0);
  if (withVolume.length === 0) {
    return { lastVolume: null, averageVolume20: null, volumeRatio: null, obv: calculateOBV(ohlcv), obvSlope: 'neutral' };
  }

  const last = withVolume[withVolume.length - 1];
  const lastVolume = last.volume ?? null;

  const window = withVolume.slice(-20);
  const averageVolume20 = window.reduce((sum, b) => sum + (b.volume ?? 0), 0) / window.length;

  const volumeRatio = averageVolume20 > 0 && lastVolume !== null ? lastVolume / averageVolume20 : null;

  return {
    lastVolume,
    averageVolume20,
    volumeRatio,
    obv: calculateOBV(ohlcv),
    obvSlope: obvSlopeSignal(ohlcv),
  };
}

/** Squeeze: ancho actual de bandas vs. ancho medio de las últimas 20 velas (ratio < 0.6 ⇒ compresión). */
function detectSqueeze(ohlcv: OHLCV[], currentWidth: number): boolean {
  if (ohlcv.length < 40 || currentWidth <= 0) return false;
  const widths: number[] = [];
  for (let end = 20; end <= ohlcv.length; end++) {
    const slice = ohlcv.slice(end - 20, end);
    const closes = slice.map((d) => d.close);
    const sma = closes.reduce((a, b) => a + b, 0) / closes.length;
    const variance = closes.reduce((s, c) => s + (c - sma) ** 2, 0) / closes.length;
    const std = Math.sqrt(variance);
    widths.push(4 * std); // upper - lower a 2 desvíos
  }
  if (widths.length < 2) return false;
  const avgWidth = widths.reduce((a, b) => a + b, 0) / widths.length;
  return avgWidth > 0 && currentWidth / avgWidth < 0.6;
}

export function evaluateConfluence(ohlcv: OHLCV[]): ConfluenceResult {
  const emptyNotes: string[] = [];
  if (ohlcv.length < 30) {
    return {
      categories: [],
      bullishCount: 0,
      bearishCount: 0,
      neutralCount: 0,
      agreement: 0,
      verdict: 'wait',
      rsiMacdConfirmed: false,
      squeezeVolumeConfirmed: false,
      notes: ['Datos insuficientes: se requieren al menos 30 velas para el jurado.'],
      insufficientData: true,
    };
  }

  const analysis = analyzeTechnical(ohlcv);
  const volume = calculateVolumeMetrics(ohlcv);
  const notes: string[] = [];

  // --- Categoría MOMENTUM: RSI (alerta) + MACD (juez) ---
  const rsiValue = analysis.rsi.value;
  const rsiExtreme = rsiValue !== null && (rsiValue >= 70 || rsiValue <= 30);
  const rsiSignal: CategorySignal =
    rsiValue === null ? 'neutral' : rsiValue >= 70 ? 'bearish' : rsiValue <= 30 ? 'bullish' : 'neutral';
  const macdSignal = analysis.macd.signal;

  let momentumSignal: CategorySignal = 'neutral';
  let momentumDetail = '';

  if (rsiExtreme && macdSignal !== 'neutral') {
    // El juez confirma o veta la alerta del RSI
    const agree =
      (rsiSignal === 'bearish' && macdSignal === 'bearish') ||
      (rsiSignal === 'bullish' && macdSignal === 'bullish');
    if (agree) {
      momentumSignal = rsiSignal;
      momentumDetail = `RSI ${rsiValue?.toFixed(1)} en extremo y MACD ${macdSignal} confirma (jurado §3.2).`;
      notes.push(momentumDetail);
    } else {
      momentumSignal = 'neutral';
      momentumDetail = `RSI ${rsiValue?.toFixed(1)} alerta ${rsiSignal}, pero el MACD dice ${macdSignal}: el jurado no delibera — esperar.`;
      notes.push(momentumDetail);
    }
  } else if (macdSignal !== 'neutral' && (rsiValue === null || (rsiValue > 30 && rsiValue < 70))) {
    momentumSignal = macdSignal;
    momentumDetail = `MACD ${macdSignal} sin extremo de RSI (RSI ${rsiValue?.toFixed(1) ?? 'n/d'}).`;
  } else {
    momentumDetail = `RSI ${rsiValue?.toFixed(1) ?? 'n/d'} en zona neutral; sin señal de momentum.`;
  }

  const rsiMacdConfirmed = rsiExtreme && momentumSignal !== 'neutral' && momentumSignal === rsiSignal;

  // --- Categoría VOLATILIDAD: posición en Bollinger + squeeze ---
  const bb = analysis.bollinger;
  const squeeze = detectSqueeze(ohlcv, bb.width);
  const priceAbove = bb.position === 'above';
  const priceBelow = bb.position === 'below';

  let volatilitySignal: CategorySignal = 'neutral';
  let volatilityDetail = '';

  if (squeeze) {
    const expansionUp = volume.volumeRatio !== null && volume.volumeRatio >= 1.5 && priceAbove;
    const expansionDown = volume.volumeRatio !== null && volume.volumeRatio >= 1.5 && priceBelow;
    if (expansionUp) {
      volatilitySignal = 'bullish';
      volatilityDetail = 'Squeeze de Bollinger con ruptura al alza y volumen ≥ 1.5× media 20d.';
    } else if (expansionDown) {
      volatilitySignal = 'bearish';
      volatilityDetail = 'Squeeze de Bollinger con ruptura a la baja y volumen ≥ 1.5× media 20d.';
    } else {
      volatilitySignal = 'neutral';
      volatilityDetail = 'Squeeze detectado, pero sin confirmación de volumen: posible trampa (§3.3).';
      notes.push(volatilityDetail);
    }
  } else if (priceAbove) {
    volatilitySignal = 'neutral';
    volatilityDetail = 'Precio sobre banda superior: sobrecompra de volatilidad, no direccional por sí solo.';
  } else if (priceBelow) {
    volatilitySignal = 'neutral';
    volatilityDetail = 'Precio bajo banda inferior: sobrevenda de volatilidad, no direccional por sí solo.';
  } else {
    volatilityDetail = 'Precio dentro de bandas; volatilidad normal.';
  }

  const squeezeVolumeConfirmed = squeeze && volume.volumeRatio !== null && volume.volumeRatio >= 1.5 && bb.position !== 'within';

  // --- Categoría VOLUMEN: ratio vs. media 20d + pendiente OBV ---
  let volumeSignal: CategorySignal = 'neutral';
  let volumeDetail = '';

  const ratio = volume.volumeRatio;
  if (ratio === null) {
    volumeDetail = 'Sin datos de volumen: la categoría volumen no puede deliberar.';
    notes.push(volumeDetail);
  } else if (ratio >= 1.5 && volume.obvSlope === 'bullish') {
    volumeSignal = 'bullish';
    volumeDetail = `Volumen ${ratio.toFixed(2)}× media 20d y OBV al alza: ruptura respaldada por capital.`;
  } else if (ratio >= 1.5 && volume.obvSlope === 'bearish') {
    volumeSignal = 'bearish';
    volumeDetail = `Volumen ${ratio.toFixed(2)}× media 20d pero OBV a la baja: divergencia — cuidado.`;
  } else if (ratio >= 1.5) {
    volumeSignal = 'neutral';
    volumeDetail = `Volumen ${ratio.toFixed(2)}× media 20d sin pendiente OBV concluyente.`;
  } else if (ratio < 1 && volume.obvSlope === 'bearish') {
    volumeSignal = 'bearish';
    volumeDetail = `Volumen plano/bajo (${ratio.toFixed(2)}×) con OBV a la baja: movimiento sin respaldo.`;
  } else {
    volumeDetail = `Volumen ${ratio.toFixed(2)}× media 20d: sin confirmación (se exige ≥ 1.5×).`;
  }

  const categories: ConfluenceCategory[] = [
    { id: 'volatility', label: 'Volatilidad (Bollinger)', signal: volatilitySignal, detail: volatilityDetail },
    { id: 'momentum', label: 'Momentum (RSI + MACD)', signal: momentumSignal, detail: momentumDetail },
    { id: 'volume', label: 'Volumen (ratio 20d + OBV)', signal: volumeSignal, detail: volumeDetail },
  ];

  const bullishCount = categories.filter((c) => c.signal === 'bullish').length;
  const bearishCount = categories.filter((c) => c.signal === 'bearish').length;
  const neutralCount = categories.filter((c) => c.signal === 'neutral').length;

  let verdict: JuryVerdict = 'wait';
  if (bullishCount >= 2 && bullishCount > bearishCount) verdict = 'buy';
  else if (bearishCount >= 2 && bearishCount > bullishCount) verdict = 'sell';

  const agreement = Math.max(bullishCount, bearishCount);

  if (verdict === 'wait' && emptyNotes.length === 0) {
    notes.push('El jurado no ha convergido: se requieren ≥ 2 categorías en la misma dirección (confluencia §3.1).');
  }

  return {
    categories,
    bullishCount,
    bearishCount,
    neutralCount,
    agreement,
    verdict,
    rsiMacdConfirmed,
    squeezeVolumeConfirmed,
    notes,
    insufficientData: false,
  };
}
