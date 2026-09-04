export type RiskMetrics = {
  volatility: number | null;
  sharpeRatio: number | null;
  maxDrawdown: number | null;
  sortinoRatio: number | null;
  profitFactor: number | null;
  winRate: number | null;
  riskMetrics: RiskMetric[];
};

export type RiskMetric = {
  name: string;
  value: number | null;
  unit: "percent" | "ratio";
  level: "low" | "medium" | "high";
  description: string;
};

export type RiskAnalysisParams = {
  returns: number[];
  marketReturns?: number[];
  riskFreeRate?: number;
};

export function calculateReturnSeries(values: number[]): number[] {
  const returns: number[] = [];
  for (let i = 1; i < values.length; i++) {
    if (values[i - 1] !== 0) {
      returns.push((values[i] - values[i - 1]) / values[i - 1]);
    }
  }
  return returns;
}

export function calculateVolatility(returns: number[], annualize = true): number | null {
  if (returns.length < 2) return null;

  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / (returns.length - 1);
  const stdDev = Math.sqrt(variance);

  if (!annualize) return stdDev * 100;

  const daysInYear = 365;
  return stdDev * Math.sqrt(daysInYear) * 100;
}

export function calculateSharpeRatio(
  returns: number[],
  riskFreeRate: number = 0,
  annualize = true,
): number | null {
  if (returns.length < 2) return null;

  const excessReturns = returns.map(r => r - riskFreeRate / 100);
  const mean = excessReturns.reduce((a, b) => a + b, 0) / excessReturns.length;

  const variance = excessReturns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / (excessReturns.length - 1);
  const stdDev = Math.sqrt(variance);

  if (stdDev === 0) return null;

  const sharpe = mean / stdDev;

  if (!annualize) return sharpe;

  const daysInYear = 365;
  return sharpe * Math.sqrt(daysInYear);
}

export function calculateMaxDrawdown(values: number[]): number | null {
  if (values.length < 2) return null;

  let peak = values[0];
  let maxDD = 0;

  for (const value of values) {
    if (value > peak) peak = value;
    if (peak > 0) {
      const drawdown = ((peak - value) / peak) * 100;
      if (drawdown > maxDD) maxDD = drawdown;
    }
  }

  return maxDD;
}

export function calculateSortinoRatio(
  returns: number[],
  riskFreeRate: number = 0,
  targetReturn: number = 0,
): number | null {
  if (returns.length < 2) return null;

  const excessReturns = returns.map(r => r - riskFreeRate / 100 - targetReturn / 100);

  const downsideReturns = excessReturns.filter(r => r < 0);
  if (downsideReturns.length === 0) return null;

  const downsideVariance = downsideReturns.reduce((sum, r) => sum + Math.pow(r, 2), 0) / downsideReturns.length;
  const downsideStdDev = Math.sqrt(downsideVariance);

  if (downsideStdDev === 0) return null;

  const meanExcess = excessReturns.reduce((a, b) => a + b, 0) / excessReturns.length;

  const daysInYear = 365;
  return (meanExcess / downsideStdDev) * Math.sqrt(daysInYear);
}

export function calculateProfitFactor(trades: { profit: number }[]): number | null {
  if (trades.length === 0) return null;

  const totalProfit = trades.filter(t => t.profit > 0).reduce((sum, t) => sum + t.profit, 0);
  const totalLoss = Math.abs(trades.filter(t => t.profit < 0).reduce((sum, t) => sum + t.profit, 0));

  if (totalLoss === 0) return null;

  return totalProfit / totalLoss;
}

export function calculateWinRate(trades: { profit: number }[]): number | null {
  if (trades.length === 0) return null;

  const winCount = trades.filter(t => t.profit > 0).length;
  return (winCount / trades.length) * 100;
}

export function analyzeRisk(params: RiskAnalysisParams): RiskMetrics {
  const volatility = calculateVolatility(params.returns, true);
  const sharpeRatio = calculateSharpeRatio(params.returns, params.riskFreeRate ?? 0, true);
  const maxDrawdown = calculateMaxDrawdown(params.returns);

  const riskFreeRate = params.riskFreeRate ?? 0;
  const sortinoRatio = calculateSortinoRatio(params.returns, riskFreeRate);

  const riskMetrics: RiskMetric[] = [];

  if (volatility !== null) {
    const level = volatility > 25 ? "high" : volatility > 15 ? "medium" : "low";
    riskMetrics.push({
      name: "Volatilidad anualizada",
      value: volatility,
      unit: "percent",
      level,
      description: "Rendimiento estándar anualizado",
    });
  }

  if (sharpeRatio !== null) {
    const level = sharpeRatio > 2 ? "low" : sharpeRatio > 1 ? "medium" : "high";
    riskMetrics.push({
      name: "Ratio de Sharpe",
      value: sharpeRatio,
      unit: "ratio",
      level,
      description: "Rendimiento ajustado por riesgo",
    });
  }

  if (maxDrawdown !== null) {
    const level = maxDrawdown > 30 ? "high" : maxDrawdown > 15 ? "medium" : "low";
    riskMetrics.push({
      name: "Máximo drawdown",
      value: maxDrawdown,
      unit: "percent",
      level,
      description: "Caída máxima desde el pico",
    });
  }

  if (sortinoRatio !== null) {
    const level = sortinoRatio > 2 ? "low" : sortinoRatio > 1 ? "medium" : "high";
    riskMetrics.push({
      name: "Ratio de Sortino",
      value: sortinoRatio,
      unit: "ratio",
      level,
      description: "Rendimiento ajustado por riesgo (solo downside)",
    });
  }

  return {
    volatility,
    sharpeRatio,
    maxDrawdown,
    sortinoRatio,
    profitFactor: null,
    winRate: null,
    riskMetrics,
  };
}

export function calculateRiskScore(metrics: RiskMetrics): number | null {
  const scores: number[] = [];

  if (metrics.volatility !== null) {
    const volScore = Math.max(0, 100 - metrics.volatility * 2);
    scores.push(volScore);
  }

  if (metrics.sharpeRatio !== null) {
    const sharpeScore = Math.min(100, metrics.sharpeRatio * 20);
    scores.push(sharpeScore);
  }

  if (metrics.maxDrawdown !== null) {
    const ddScore = Math.max(0, 100 - metrics.maxDrawdown * 2);
    scores.push(ddScore);
  }

  if (metrics.sortinoRatio !== null) {
    const sortinoScore = Math.min(100, metrics.sortinoRatio * 20);
    scores.push(sortinoScore);
  }

  return scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : null;
}