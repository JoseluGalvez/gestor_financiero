export type OHLCV = {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
};

export type TechnicalIndicator = {
  name: string;
  value: number;
  signal: "bullish" | "bearish" | "neutral";
  description: string;
};

export type TechnicalAnalysis = {
  sma20: number | null;
  sma50: number | null;
  sma200: number | null;
  macd: {
    macdLine: number;
    signalLine: number;
    histogram: number;
    signal: "bullish" | "bearish" | "neutral";
  };
  rsi: {
    value: number | null;
    signal: "overbought" | "oversold" | "neutral";
  };
  bollinger: {
    upper: number;
    middle: number;
    lower: number;
    width: number;
    position: "above" | "below" | "within";
  };
  atr: number | null;
  indicators: TechnicalIndicator[];
};

function calculateSMA(values: number[], period: number): number | null {
  if (values.length < period) return null;
  const slice = values.slice(-period);
  const sum = slice.reduce((a, b) => a + b, 0);
  return sum / period;
}

function calculateEMA(values: number[], period: number): number | null {
  if (values.length < period) return null;

  const k = 2 / (period + 1);
  let ema = values[0];

  for (let i = 1; i < values.length; i++) {
    ema = values[i] * k + ema * (1 - k);
  }

  return ema;
}

function calculateRSI(values: number[], period: number = 14): number | null {
  if (values.length < period + 1) return null;

  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= period; i++) {
    const change = values[i] - values[i - 1];
    if (change >= 0) {
      gains += change;
    } else {
      losses -= change;
    }
  }

  const avgGain = gains / period;
  const avgLoss = losses / period;

  if (avgLoss === 0) return 100;

  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

function calculateATR(ohlcv: OHLCV[], period: number = 14): number | null {
  if (ohlcv.length < period + 1) return null;

  const trueRanges: number[] = [];

  for (let i = 1; i < ohlcv.length; i++) {
    const current = ohlcv[i];
    const previous = ohlcv[i - 1];

    const tr1 = current.high - current.low;
    const tr2 = Math.abs(current.high - previous.close);
    const tr3 = Math.abs(current.low - previous.close);

    trueRanges.push(Math.max(tr1, tr2, tr3));
  }

  if (trueRanges.length === 0) return null;

  const sum = trueRanges.slice(-period).reduce((a, b) => a + b, 0);
  return sum / period;
}

function calculateBB(ohlcv: OHLCV[], period: number = 20, stdDevs: number = 2): { upper: number; middle: number; lower: number } | null {
  if (ohlcv.length < period) return null;

  const closes = ohlcv.slice(-period).map(d => d.close);
  const sma = calculateSMA(closes, period);

  if (sma === null) return null;

  const variance = closes.reduce((sum, price) => sum + Math.pow(price - sma, 2), 0) / period;
  const stdDev = Math.sqrt(variance);

  return {
    upper: sma + stdDevs * stdDev,
    middle: sma,
    lower: sma - stdDevs * stdDev,
  };
}

function calculateMACD(ohlcv: OHLCV[], fastPeriod: number = 12, slowPeriod: number = 26, signalPeriod: number = 9): { macdLine: number; signalLine: number; histogram: number } | null {
  if (ohlcv.length < slowPeriod) return null;

  const closes = ohlcv.slice(-slowPeriod * 2).map(d => d.close);

  const fastEMA = calculateEMA(closes, fastPeriod);
  const slowEMA = calculateEMA(closes, slowPeriod);

  if (fastEMA === null || slowEMA === null) return null;

  const macdLine = fastEMA - slowEMA;

  const macdValues = closes.slice(-slowPeriod).map(() => macdLine);
  const signalLine = calculateEMA([macdLine, ...macdValues], signalPeriod);

  if (signalLine === null) return null;

  const histogram = macdLine - signalLine;

  return { macdLine, signalLine, histogram };
}

function determineRSIStatus(rsi: number | null): "overbought" | "oversold" | "neutral" {
  if (rsi === null) return "neutral";
  if (rsi >= 70) return "overbought";
  if (rsi <= 30) return "oversold";
  return "neutral";
}

export function analyzeTechnical(ohlcv: OHLCV[]): TechnicalAnalysis {
  const closes = ohlcv.map(d => d.close);

  const sma20 = calculateSMA(closes, 20);
  const sma50 = calculateSMA(closes, 50);
  const sma200 = calculateSMA(closes, 200);

  const macd = calculateMACD(ohlcv);
  const rsi = calculateRSI(closes);
  const atr = calculateATR(ohlcv);
  const bb = calculateBB(ohlcv);

  const lastClose = closes[closes.length - 1];

  const indicators: TechnicalIndicator[] = [
    {
      name: "SMA 20",
      value: sma20 ?? 0,
      signal: lastClose !== null && sma20 !== null ? (lastClose > sma20 ? "bullish" : "bearish") : "neutral",
      description: "Media móvil simple de 20 periodos",
    },
    {
      name: "SMA 50",
      value: sma50 ?? 0,
      signal: lastClose !== null && sma50 !== null ? (lastClose > sma50 ? "bullish" : "bearish") : "neutral",
      description: "Media móvil simple de 50 periodos",
    },
    {
      name: "SMA 200",
      value: sma200 ?? 0,
      signal: lastClose !== null && sma200 !== null ? (lastClose > sma200 ? "bullish" : "bearish") : "neutral",
      description: "Media móvil simple de 200 periodos",
    },
    {
      name: "RSI 14",
      value: rsi ?? 0,
      signal: determineRSIStatus(rsi) !== "neutral" ? (determineRSIStatus(rsi) === "overbought" ? "bearish" : "bullish") : "neutral",
      description: "Indicador de momentum (sobrecompra > 70, sobrevenda < 30)",
    },
    {
      name: "MACD",
      value: macd?.histogram ?? 0,
      signal: macd !== null ? (macd.histogram > 0 ? "bullish" : macd.histogram < 0 ? "bearish" : "neutral") : "neutral",
      description: "Convergence Divergence of Moving Averages",
    },
  ];

  if (bb && lastClose !== null) {
    const position = lastClose > bb.upper ? "above" : lastClose < bb.lower ? "below" : "within";
    indicators.push({
      name: "Bollinger Bands",
      value: bb.middle,
      signal: position === "above" ? "bearish" : position === "below" ? "bullish" : "neutral",
      description: `Precio ${position} de las bandas`,
    });
  }

  if (atr !== null) {
    indicators.push({
      name: "ATR 14",
      value: atr,
      signal: "neutral",
      description: "Average True Range - volatilidad promedio",
    });
  }

  return {
    sma20,
    sma50,
    sma200,
    macd: macd
      ? { ...macd, signal: macd.histogram > 0 ? ("bullish" as const) : macd.histogram < 0 ? ("bearish" as const) : ("neutral" as const) }
      : { macdLine: 0, signalLine: 0, histogram: 0, signal: "neutral" as const },
    rsi: { value: rsi, signal: determineRSIStatus(rsi) },
    bollinger: bb && lastClose !== undefined
      ? { ...bb, width: bb.upper - bb.lower, position: (lastClose > bb.upper ? "above" : lastClose < bb.lower ? "below" : "within") as "above" | "below" | "within" }
      : { upper: 0, middle: 0, lower: 0, width: 0, position: "within" as const },
    atr,
    indicators,
  };
}

export function calculateTechnicalScore(analysis: TechnicalAnalysis): number | null {
  const scores: number[] = [];

  if (analysis.sma20 !== null && analysis.sma50 !== null) {
    const crossoverSignal = analysis.sma20 > analysis.sma50 ? 60 : 40;
    scores.push(crossoverSignal);
  }

  if (analysis.rsi.value !== null) {
    if (analysis.rsi.value < 30) scores.push(80);
    else if (analysis.rsi.value > 70) scores.push(20);
    else scores.push(50);
  }

  if (analysis.macd.signal !== "neutral") {
    scores.push(analysis.macd.signal === "bullish" ? 70 : 30);
  }

  if (analysis.bollinger.upper !== 0) {
    scores.push(
      analysis.bollinger.position === "below" ? 80 :
      analysis.bollinger.position === "above" ? 20 : 50
    );
  }

  return scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : null;
}