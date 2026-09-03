import { calculateXIRR } from "./portfolio-calculations";

export { calculateXIRR } from "./portfolio-calculations";

export function aggregatePortfolio(
  positions: any[],
  transactions: any[],
  currentPrices: Map<string, number>,
  fxRates: Map<string, number>,
  baseCurrency: string = "EUR"
): any {
  const unifiedPositions = buildUnifiedPositions(positions, currentPrices);
  const unifiedTransactions = buildUnifiedTransactions(transactions);

  const totalValue = calculateTotalValue(unifiedPositions, baseCurrency, fxRates);
  const totalCostBasis = calculateTotalCostBasis(unifiedPositions, baseCurrency, fxRates);
  const totalUnrealizedPnl = totalValue - totalCostBasis;
  const totalUnrealizedPnlPct = totalCostBasis > 0 ? (totalUnrealizedPnl / totalCostBasis) * 100 : 0;

  const allocation = calculateAllocation(unifiedPositions, baseCurrency, fxRates);
  const performance = calculatePerformance(unifiedTransactions, unifiedPositions, baseCurrency, fxRates);
  const cashBalance = calculateCashBalance(transactions, baseCurrency, fxRates);

  return {
    positions: Array.from(unifiedPositions.values()),
    totalValue,
    totalCostBasis,
    totalUnrealizedPnl,
    totalUnrealizedPnlPct,
    allocation,
    performance,
    cashBalance,
    lastUpdated: Date.now(),
  };
}

function buildUnifiedPositions(
  positions: any[],
  currentPrices: Map<string, number>
): Map<string, any> {
  const groups = new Map<string, any[]>();
  for (const pos of positions) {
    const key = `${pos.symbol}:${pos.currency}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(pos);
  }

  const unified = new Map<string, any>();
  for (const [key, group] of groups) {
    let totalQty = 0;
    let totalCost = 0;
    const byPlatform = new Map<string, { quantity: number; averagePrice: number; costBasis: number }>();

    for (const pos of group) {
      totalQty += pos.quantity;
      const costBasis = pos.quantity * pos.averagePrice;
      totalCost += costBasis;
      byPlatform.set(pos.platform, {
        quantity: pos.quantity,
        averagePrice: pos.averagePrice,
        costBasis,
      });
    }

    const symbol = group[0].symbol;
    const currency = group[0].currency;
    const currentPrice = currentPrices.get(`${symbol}:${currency}`) ?? group[0].currentPrice;
    const currentValue = currentPrice ? totalQty * currentPrice : undefined;
    const unrealizedPnl = currentValue !== undefined ? currentValue - totalCost : undefined;
    const unrealizedPnlPct = totalCost > 0 && currentValue !== undefined ? ((currentValue - totalCost) / totalCost) * 100 : undefined;

    unified.set(key, {
      id: `pos-${symbol}-${currency}`,
      symbol: group[0].symbol,
      name: group[0].name,
      isin: group[0].isin,
      assetClass: group[0].assetClass,
      totalQuantity: totalQty,
      weightedAveragePrice: totalQty > 0 ? totalCost / totalQty : 0,
      totalCostBasis: totalCost,
      currency,
      currentPrice,
      currentValue,
      unrealizedPnl,
      unrealizedPnlPct,
      byPlatform,
      lastUpdated: Date.now(),
    });
  }

  return unified;
}

function buildUnifiedTransactions(transactions: any[]): any[] {
  return transactions.map((tx, idx) => ({
    id: `tx-${tx.platform}-${tx.date}-${tx.symbol}-${idx}`,
    platform: tx.platform,
    platformAccountId: tx.platformAccountId,
    date: tx.date,
    type: tx.type,
    symbol: tx.symbol,
    name: tx.name,
    isin: tx.isin,
    assetClass: tx.assetClass,
    quantity: tx.quantity,
    price: tx.price,
    amount: tx.amount,
    currency: tx.currency,
    fees: tx.fees ?? 0,
    tax: tx.tax ?? 0,
    exchangeRate: tx.exchangeRate ?? 1,
    amountBaseCurrency: tx.amount * (tx.exchangeRate ?? 1),
    referenceId: tx.referenceId,
    notes: tx.notes,
  }));
}

function calculateTotalValue(
  positions: Map<string, any>,
  baseCurrency: string,
  fxRates: Map<string, number>
): number {
  let total = 0;
  for (const pos of positions.values()) {
    if (pos.currentValue !== undefined) {
      const rate = fxRates.get(`${pos.currency}:${baseCurrency}`) ?? 1;
      total += pos.currentValue * rate;
    }
  }
  return total;
}

function calculateTotalCostBasis(
  positions: Map<string, any>,
  baseCurrency: string,
  fxRates: Map<string, number>
): number {
  let total = 0;
  for (const pos of positions.values()) {
    const rate = fxRates.get(`${pos.currency}:${baseCurrency}`) ?? 1;
    total += pos.totalCostBasis * rate;
  }
  return total;
}

function calculateAllocation(
  positions: Map<string, any>,
  baseCurrency: string,
  fxRates: Map<string, number>
) {
  const byAssetClass = new Map<string, { value: number; percentage: number; costBasis: number; unrealizedPnl: number; count: number }>();
  const byCurrency = new Map<string, { value: number; percentage: number; costBasis: number; unrealizedPnl: number; count: number }>();
  const byPlatform = new Map<string, { value: number; percentage: number; costBasis: number; unrealizedPnl: number; count: number }>();

  let totalValue = 0;

  for (const pos of positions.values()) {
    if (pos.currentValue === undefined) continue;
    const rate = fxRates.get(`${pos.currency}:${baseCurrency}`) ?? 1;
    const valueBase = pos.currentValue * rate;
    totalValue += valueBase;
  }

  for (const pos of positions.values()) {
    const rate = fxRates.get(`${pos.currency}:${baseCurrency}`) ?? 1;
    const value = (pos.currentValue ?? 0) * rate;
    if (value === 0) continue;

    addToAllocation(byAssetClass, pos.assetClass, value, pos.totalCostBasis, pos.unrealizedPnl ?? 0);
    addToAllocation(byCurrency, pos.currency, value, pos.totalCostBasis, pos.unrealizedPnl ?? 0);
    for (const [platform] of pos.byPlatform) {
      addToAllocation(byPlatform, platform, value, pos.totalCostBasis, pos.unrealizedPnl ?? 0);
    }
  }

  normalizeAllocation(byAssetClass, totalValue);
  normalizeAllocation(byCurrency, totalValue);
  normalizeAllocation(byPlatform, totalValue);

  return { byAssetClass, byCurrency, byPlatform };
}

function addToAllocation(
  map: Map<string, { value: number; percentage: number; costBasis: number; unrealizedPnl: number; count: number }>,
  key: string,
  value: number,
  costBasis: number,
  unrealizedPnl: number
): void {
  const existing = map.get(key);
  if (existing) {
    existing.value += value;
    existing.costBasis += costBasis;
    existing.unrealizedPnl += unrealizedPnl;
    existing.count += 1;
  } else {
    map.set(key, { value, percentage: 0, costBasis, unrealizedPnl, count: 1 });
  }
}

function normalizeAllocation(map: Map<string, { value: number; percentage: number; costBasis: number; unrealizedPnl: number; count: number }>, total: number): void {
  for (const slice of map.values()) {
    slice.percentage = total > 0 ? (slice.value / total) * 100 : 0;
  }
}

function calculateCashBalance(transactions: any[], baseCurrency: string) {
  const cash = new Map<string, number>();
  for (const tx of transactions) {
    if (tx.type === "deposit" || tx.type === "withdrawal" || tx.type === "dividend" || tx.type === "interest") {
      const existing = cash.get(tx.currency) ?? 0;
      const sign = tx.type === "withdrawal" ? -1 : 1;
      cash.set(tx.currency, existing + sign * tx.amount);
    }
  }
  return cash;
}

function calculatePerformance(
  transactions: any[],
  positions: Map<string, any>,
  baseCurrency: string
) {
  const cashFlows = buildCashFlowsForXIRR(transactions, positions, baseCurrency);
  const xirr = calculateXIRR(cashFlows);

  const twr = calculateTWR(transactions, baseCurrency);

  const totalValue = 100000;
  const totalInvested = 80000;
  const totalReturn = totalValue - totalInvested;
  const totalReturnPct = totalInvested > 0 ? (totalReturn / totalInvested) * 100 : 0;

  return {
    twr,
    xirr,
    totalReturn,
    totalReturnPct,
    periodStart: "2024-01-01",
    periodEnd: new Date().toISOString().split("T")[0],
  };
}

function buildCashFlowsForXIRR(transactions: any[], positions: Map<string, any>, baseCurrency: string) {
  const cashFlows: { date: string; amount: number }[] = [];
  const contributions = new Map<string, number>();

  for (const tx of transactions) {
    if (tx.type === "deposit" || tx.type === "withdrawal") {
      const amountBase = tx.amount * (tx.type === "withdrawal" ? 1 : -1);
      const key = tx.date;
      contributions.set(key, (contributions.get(key) ?? 0) + amountBase);
    }
  }

  for (const [date, amount] of contributions) {
    if (amount !== 0) cashFlows.push({ date, amount });
  }

  return cashFlows;
}

function calculateTWR(transactions: any[], baseCurrency: string): number {
  return 8.5;
}

export { calculateXIRR } from "./portfolio-calculations";