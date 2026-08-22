export const FACTOR_WEIGHTS = {
  financialHealth: 0.2,
  growth: 0.2,
  valuation: 0.2,
  competitiveAdvantage: 0.15,
  technicalMomentum: 0.15,
  riskManagement: 0.1,
} as const;

export type FactorKey = keyof typeof FACTOR_WEIGHTS;
export type FactorScores = Partial<Record<FactorKey, number | null>>;

export type Candle = {
  at: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
};

export type DcfInput = {
  freeCashFlows: number[];
  discountRate: number;
  terminalGrowthRate?: number;
  sharesOutstanding?: number;
  netDebt?: number;
};

export type KellyInput = {
  winProbability: number;
  payoffRatio: number;
};

export type WeightedScore = {
  score: number | null;
  coveragePct: number;
  includedFactors: FactorKey[];
  warnings: string[];
};

export type TechnicalAnalysis = {
  sma20: number | null;
  sma50: number | null;
  sma200: number | null;
  movingAverageSignal: "golden_cross" | "death_cross" | "neutral" | "insufficient_data";
  macd: number | null;
  macdSignal: number | null;
  macdHistogram: number | null;
  rsi14: number | null;
  rsiZone: "overbought" | "oversold" | "neutral" | "insufficient_data";
  bollingerUpper: number | null;
  bollingerMiddle: number | null;
  bollingerLower: number | null;
  bollingerPercentB: number | null;
  atr14: number | null;
  annualizedVolatility: number | null;
  maxDrawdown: number | null;
  sharpeRatio: number | null;
  observations: string[];
};

export type DcfResult = {
  enterpriseValue: number | null;
  equityValue: number | null;
  valuePerShare: number | null;
  terminalValue: number | null;
  warnings: string[];
};

export type AnalysisSnapshot = {
  score: WeightedScore;
  dcf: DcfResult;
  technical: TechnicalAnalysis;
  kellyFraction: number | null;
  warnings: string[];
};

function finite(value: number | null | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function standardDeviation(values: number[]): number | null {
  const mean = average(values);
  if (mean === null || values.length < 2) return null;
  return Math.sqrt(values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / (values.length - 1));
}

function sma(values: number[], period: number): number | null {
  if (values.length < period || period <= 0) return null;
  return average(values.slice(-period));
}

function emaSeries(values: number[], period: number): number[] {
  if (values.length < period || period <= 0) return [];
  const multiplier = 2 / (period + 1);
  const output: number[] = [];
  let current = average(values.slice(0, period));
  if (current === null) return [];
  output.push(current);
  for (const value of values.slice(period)) {
    current = value * multiplier + current * (1 - multiplier);
    output.push(current);
  }
  return output;
}

function rsi(values: number[], period = 14): number | null {
  if (values.length <= period) return null;
  const changes = values.slice(1).map((value, index) => value - values[index]);
  const seed = changes.slice(0, period);
  let averageGain = seed.reduce((sum, change) => sum + Math.max(change, 0), 0) / period;
  let averageLoss = seed.reduce((sum, change) => sum + Math.max(-change, 0), 0) / period;
  for (const change of changes.slice(period)) {
    averageGain = (averageGain * (period - 1) + Math.max(change, 0)) / period;
    averageLoss = (averageLoss * (period - 1) + Math.max(-change, 0)) / period;
  }
  if (averageLoss === 0) return 100;
  const relativeStrength = averageGain / averageLoss;
  return 100 - 100 / (1 + relativeStrength);
}

function atr(candles: Candle[], period = 14): number | null {
  if (candles.length <= period) return null;
  const trueRanges = candles.slice(1).map((candle, index) => {
    const previousClose = candles[index].close;
    return Math.max(candle.high - candle.low, Math.abs(candle.high - previousClose), Math.abs(candle.low - previousClose));
  });
  let current = average(trueRanges.slice(0, period));
  if (current === null) return null;
  for (const range of trueRanges.slice(period)) current = (current * (period - 1) + range) / period;
  return current;
}

function maxDrawdownFromPrices(prices: number[]): number | null {
  if (prices.length < 2) return null;
  let peak = prices[0];
  let maximum = 0;
  for (const price of prices) {
    peak = Math.max(peak, price);
    maximum = Math.min(maximum, (price - peak) / peak);
  }
  return maximum;
}

function annualizedVolatility(prices: number[]): number | null {
  if (prices.length < 3) return null;
  const returns = prices.slice(1).map((price, index) => (price - prices[index]) / prices[index]);
  const deviation = standardDeviation(returns);
  return deviation === null ? null : deviation * Math.sqrt(252);
}

function safeRound(value: number | null, digits = 4): number | null {
  return value === null || !Number.isFinite(value) ? null : Number(value.toFixed(digits));
}

export function calculateWeightedScore(scores: FactorScores): WeightedScore {
  const includedFactors = (Object.keys(FACTOR_WEIGHTS) as FactorKey[]).filter((factor) => finite(scores[factor]) && scores[factor]! >= 0 && scores[factor]! <= 100);
  const availableWeight = includedFactors.reduce((sum, factor) => sum + FACTOR_WEIGHTS[factor], 0);
  const coveragePct = availableWeight * 100;
  const warnings: string[] = [];
  for (const factor of Object.keys(FACTOR_WEIGHTS) as FactorKey[]) {
    const value = scores[factor];
    if (value !== null && value !== undefined && (!finite(value) || value < 0 || value > 100)) warnings.push(`El factor ${factor} no está dentro del rango 0–100 y se ha excluido.`);
  }
  if (coveragePct < 60) warnings.push("La cobertura de factores es inferior al 60 %. No se publica una puntuación agregada.");
  const rawScore = availableWeight === 0 ? null : includedFactors.reduce((sum, factor) => sum + scores[factor]! * FACTOR_WEIGHTS[factor], 0) / availableWeight;
  return { score: coveragePct >= 60 ? safeRound(rawScore, 2) : null, coveragePct: safeRound(coveragePct, 2) ?? 0, includedFactors, warnings };
}

export function calculateDcf(input: DcfInput): DcfResult {
  const warnings: string[] = [];
  const terminalGrowthRate = input.terminalGrowthRate ?? 0.02;
  if (input.freeCashFlows.length !== 10 || input.freeCashFlows.some((value) => !finite(value))) warnings.push("El DCF requiere diez proyecciones anuales de flujo de caja libre válidas.");
  if (!finite(input.discountRate) || input.discountRate <= terminalGrowthRate || input.discountRate <= -1) warnings.push("El WACC debe ser superior al crecimiento terminal y mayor que −100 %.");
  if (warnings.length > 0) return { enterpriseValue: null, equityValue: null, valuePerShare: null, terminalValue: null, warnings };
  const discountedFlows = input.freeCashFlows.map((cashFlow, index) => cashFlow / (1 + input.discountRate) ** (index + 1));
  const finalCashFlow = input.freeCashFlows[9];
  const terminalValue = finalCashFlow * (1 + terminalGrowthRate) / (input.discountRate - terminalGrowthRate);
  const enterpriseValue = discountedFlows.reduce((sum, cashFlow) => sum + cashFlow, 0) + terminalValue / (1 + input.discountRate) ** 10;
  const equityValue = enterpriseValue - (input.netDebt ?? 0);
  const shares = input.sharesOutstanding;
  if (shares !== undefined && (!finite(shares) || shares <= 0)) warnings.push("Las acciones en circulación no son válidas; no se calcula el valor por acción.");
  return { enterpriseValue: safeRound(enterpriseValue, 2), equityValue: safeRound(equityValue, 2), valuePerShare: finite(shares) && shares > 0 ? safeRound(equityValue / shares, 4) : null, terminalValue: safeRound(terminalValue, 2), warnings };
}

export function calculateTechnicalAnalysis(candles: Candle[], riskFreeAnnual = 0): TechnicalAnalysis {
  const ordered = [...candles].filter((item) => finite(item.open) && finite(item.high) && finite(item.low) && finite(item.close) && item.high >= item.low).sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
  const prices = ordered.map((item) => item.close);
  const sma20 = sma(prices, 20);
  const sma50 = sma(prices, 50);
  const sma200 = sma(prices, 200);
  const shortSeries = emaSeries(prices, 12);
  const longSeries = emaSeries(prices, 26);
  const macdSeries = longSeries.length ? longSeries.map((long, index) => shortSeries[index + (shortSeries.length - longSeries.length)] - long) : [];
  const signalSeries = emaSeries(macdSeries, 9);
  const macd = macdSeries.at(-1) ?? null;
  const macdSignal = signalSeries.at(-1) ?? null;
  const macdHistogram = macd !== null && macdSignal !== null ? macd - macdSignal : null;
  const rsi14 = rsi(prices, 14);
  const middle = sma(prices, 20);
  const std = prices.length >= 20 ? standardDeviation(prices.slice(-20)) : null;
  const upper = middle !== null && std !== null ? middle + 2 * std : null;
  const lower = middle !== null && std !== null ? middle - 2 * std : null;
  const latestPrice = prices.at(-1) ?? null;
  const percentB = latestPrice !== null && upper !== null && lower !== null && upper !== lower ? (latestPrice - lower) / (upper - lower) : null;
  const volatility = annualizedVolatility(prices);
  const drawdown = maxDrawdownFromPrices(prices);
  const returns = prices.slice(1).map((price, index) => (price - prices[index]) / prices[index]);
  const meanReturn = average(returns);
  const deviation = standardDeviation(returns);
  const sharpe = meanReturn !== null && deviation !== null && deviation > 0 ? ((meanReturn - riskFreeAnnual / 252) / deviation) * Math.sqrt(252) : null;
  let movingAverageSignal: TechnicalAnalysis["movingAverageSignal"] = "insufficient_data";
  if (sma50 !== null && sma200 !== null) movingAverageSignal = sma50 > sma200 ? "golden_cross" : sma50 < sma200 ? "death_cross" : "neutral";
  let rsiZone: TechnicalAnalysis["rsiZone"] = "insufficient_data";
  if (rsi14 !== null) rsiZone = rsi14 > 70 ? "overbought" : rsi14 < 30 ? "oversold" : "neutral";
  const observations: string[] = [];
  if (prices.length < 200) observations.push("La serie tiene menos de 200 observaciones; SMA 200 y señales de largo plazo pueden no estar disponibles.");
  if (movingAverageSignal === "golden_cross") observations.push("La SMA 50 está por encima de la SMA 200; esta es una observación de tendencia, no una orden.");
  if (movingAverageSignal === "death_cross") observations.push("La SMA 50 está por debajo de la SMA 200; esta es una observación de tendencia, no una orden.");
  if (rsiZone === "overbought" || rsiZone === "oversold") observations.push(`El RSI 14 se encuentra en zona ${rsiZone === "overbought" ? "alta" : "baja"}; requiere interpretación con contexto y volumen.`);
  return { sma20: safeRound(sma20), sma50: safeRound(sma50), sma200: safeRound(sma200), movingAverageSignal, macd: safeRound(macd), macdSignal: safeRound(macdSignal), macdHistogram: safeRound(macdHistogram), rsi14: safeRound(rsi14), rsiZone, bollingerUpper: safeRound(upper), bollingerMiddle: safeRound(middle), bollingerLower: safeRound(lower), bollingerPercentB: safeRound(percentB), atr14: safeRound(atr(ordered, 14)), annualizedVolatility: safeRound(volatility), maxDrawdown: safeRound(drawdown), sharpeRatio: safeRound(sharpe), observations };
}

export function calculateConservativeKelly(input: KellyInput): { fullKelly: number | null; halfKelly: number | null; warnings: string[] } {
  const warnings: string[] = [];
  if (!finite(input.winProbability) || input.winProbability < 0 || input.winProbability > 1 || !finite(input.payoffRatio) || input.payoffRatio <= 0) {
    return { fullKelly: null, halfKelly: null, warnings: ["Kelly requiere una probabilidad entre 0 y 1 y una relación ganancia/pérdida positiva y documentada."] };
  }
  const fullKelly = (input.payoffRatio * input.winProbability - (1 - input.winProbability)) / input.payoffRatio;
  if (fullKelly < 0) warnings.push("La fórmula produce una fracción negativa; se informa como 0 y no implica una instrucción de operación.");
  const bounded = Math.max(0, Math.min(fullKelly, 1));
  return { fullKelly: safeRound(bounded, 6), halfKelly: safeRound(bounded / 2, 6), warnings };
}

export function buildAnalysisSnapshot(input: { factorScores: FactorScores; dcf: DcfInput; candles: Candle[]; kelly?: KellyInput; riskFreeAnnual?: number }): AnalysisSnapshot {
  const score = calculateWeightedScore(input.factorScores);
  const dcf = calculateDcf(input.dcf);
  const technical = calculateTechnicalAnalysis(input.candles, input.riskFreeAnnual ?? 0);
  const kelly = input.kelly ? calculateConservativeKelly(input.kelly) : { fullKelly: null, halfKelly: null, warnings: ["No se ha proporcionado un escenario de Kelly documentado."] };
  return { score, dcf, technical, kellyFraction: kelly.halfKelly, warnings: [...score.warnings, ...dcf.warnings, ...technical.observations, ...kelly.warnings] };
}
