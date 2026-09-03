export function calculateXIRR(cashFlows: { date: string; amount: number }[], guess = 0.1): number {
  if (cashFlows.length < 2) return NaN;

  const sorted = [...cashFlows].sort((a, b) => a.date.localeCompare(b.date));
  const dates = sorted.map((cf) => new Date(cf.date).getTime());
  const amounts = sorted.map((cf) => cf.amount);
  const startDate = dates[0];

  const yearsFromStart = dates.map((d) => (d - startDate) / (1000 * 60 * 60 * 24 * 365.25));

  let rate = guess;
  const maxIterations = 100;
  const tolerance = 1e-8;

  for (let iter = 0; iter < maxIterations; iter++) {
    let npv = 0;
    let dnpv = 0;

    for (let i = 0; i < amounts.length; i++) {
      const t = yearsFromStart[i];
      const factor = Math.pow(1 + rate, t);
      npv += amounts[i] / factor;
      dnpv -= (t * amounts[i]) / (factor * (1 + rate));
    }

    if (Math.abs(npv) < tolerance) return rate * 100;

    if (dnpv === 0) break;
    rate -= npv / dnpv;

    if (rate <= -1) rate = -0.99;
    if (rate > 100) rate = 100;
  }

  return rate * 100;
}

export function calculateTWRFromValues(
  periodValues: { date: string; value: number; cashFlows: { date: string; amount: number }[] }[]
): number {
  if (periodValues.length < 2) return NaN;

  const sorted = [...periodValues].sort((a, b) => a.date.localeCompare(b.date));
  let twr = 1;

  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1];
    const curr = sorted[i];

    const startValue = prev.value;
    const endValue = curr.value;

    let netCashFlow = 0;
    for (const cf of curr.cashFlows) {
      const cfDate = new Date(cf.date).getTime();
      const start = new Date(prev.date).getTime();
      const end = new Date(curr.date).getTime();
      if (cfDate > start && cfDate <= end) {
        netCashFlow += cf.amount;
      }
    }

    if (startValue > 0) {
      const periodReturn = (endValue - startValue - netCashFlow) / startValue;
      twr *= (1 + periodReturn);
    }
  }

  return (twr - 1) * 100;
}

export function calculateAnnualizedReturn(totalReturn: number, years: number): number {
  if (years <= 0) return NaN;
  return (Math.pow(1 + totalReturn / 100, 1 / years) - 1) * 100;
}

export function calculateVolatility(returns: number[]): number {
  if (returns.length < 2) return NaN;
  const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / (returns.length - 1);
  return Math.sqrt(variance) * 100;
}

export function calculateSharpeRatio(returns: number[], riskFreeRate = 0): number {
  const excessReturns = returns.map((r) => r - riskFreeRate);
  if (excessReturns.length < 2) return NaN;
  const mean = excessReturns.reduce((sum, r) => sum + r, 0) / excessReturns.length;
  const stdDev = Math.sqrt(excessReturns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / (excessReturns.length - 1));
  return stdDev === 0 ? NaN : mean / stdDev;
}

export function calculateMaxDrawdown(values: number[]): number {
  if (values.length < 2) return NaN;
  let peak = values[0];
  let maxDD = 0;

  for (const value of values) {
    if (value > peak) peak = value;
    const drawdown = ((peak - value) / peak) * 100;
    if (drawdown > maxDD) maxDD = drawdown;
  }
  return maxDD;
}

export function calculateCAGR(startValue: number, endValue: number, years: number): number {
  if (startValue <= 0 || years <= 0) return NaN;
  return (Math.pow(endValue / startValue, 1 / years) - 1) * 100;
}

export function calculateProfitLoss(
  quantity: number,
  buyPrice: number,
  sellPrice: number,
  fees: number = 0,
  tax: number = 0
): { pnl: number; pnlPct: number } {
  const gross = (sellPrice - buyPrice) * quantity;
  const net = gross - fees - tax;
  const invested = buyPrice * quantity + fees;
  const pnlPct = invested > 0 ? (net / invested) * 100 : 0;
  return { pnl: net, pnlPct };
}

export function calculateWeightedAveragePrice(buys: { quantity: number; price: number }[]): number {
  const totalQty = buys.reduce((sum, b) => sum + b.quantity, 0);
  if (totalQty === 0) return 0;
  const totalCost = buys.reduce((sum, b) => sum + b.quantity * b.price, 0);
  return totalCost / totalQty;
}

export function calculateUnrealizedPnl(
  quantity: number,
  averagePrice: number,
  currentPrice: number
): { pnl: number; pnlPct: number } {
  const costBasis = quantity * averagePrice;
  const currentValue = quantity * currentPrice;
  const pnl = currentValue - costBasis;
  const pnlPct = costBasis > 0 ? (pnl / costBasis) * 100 : 0;
  return { pnl, pnlPct };
}

export function calculateRealizedPnl(
  transactions: { type: "buy" | "sell"; quantity: number; price: number; fees?: number }[]
): number {
  let totalPnl = 0;
  const lots: { quantity: number; price: number }[] = [];

  for (const tx of transactions) {
    if (tx.type === "buy") {
      lots.push({ quantity: tx.quantity, price: tx.price });
    } else if (tx.type === "sell") {
      let remainingQty = tx.quantity;
      for (const lot of lots) {
        if (remainingQty <= 0) break;
        const sellQty = Math.min(lot.quantity, remainingQty);
        const pnl = (tx.price - lot.price) * sellQty;
        totalPnl += pnl - (tx.fees ?? 0) * (sellQty / tx.quantity);
        lot.quantity -= sellQty;
        remainingQty -= sellQty;
      }
      lots.filter((lot) => lot.quantity > 0);
    }
  }

  return totalPnl;
}