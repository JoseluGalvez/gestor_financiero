export type PlatformTransaction = {
  id: string;
  data_source_id: string | null;
  instrument_id: string | null;
  occurred_at: string;
  kind: string;
  quantity: number | null;
  gross_amount: number;
  fees: number;
  currency: string;
};

export type PlatformComparisonRow = {
  sourceId: string;
  sourceName: string;
  eligibleTransactions: number;
  salesWithKnownCost: number;
  proceeds: number;
  disposedCost: number;
  realizedResult: number;
  realizedReturn: number | null;
  incompleteSales: number;
  caveat: string | null;
};

type Lot = { quantity: number; cost: number };

export function comparePlatforms(
  transactions: PlatformTransaction[],
  sources: Array<{ id: string; display_name: string }>,
  baseCurrency: string,
): PlatformComparisonRow[] {
  const nameBySource = new Map(sources.map((source) => [source.id, source.display_name]));
  const transactionsBySource = new Map<string, PlatformTransaction[]>();
  transactions.forEach((transaction) => {
    if (!transaction.data_source_id) return;
    const rows = transactionsBySource.get(transaction.data_source_id) ?? [];
    rows.push(transaction);
    transactionsBySource.set(transaction.data_source_id, rows);
  });
  return [...transactionsBySource.entries()].map(([sourceId, rows]) => {
    const lotsByInstrument = new Map<string, Lot[]>();
    let proceeds = 0;
    let disposedCost = 0;
    let salesWithKnownCost = 0;
    let incompleteSales = 0;
    const supported = rows.filter((row) => row.currency === baseCurrency && (row.kind === "buy" || row.kind === "sell") && row.instrument_id && row.quantity && row.quantity > 0).sort((left, right) => left.occurred_at.localeCompare(right.occurred_at) || left.id.localeCompare(right.id));
    supported.forEach((row) => {
      const lots = lotsByInstrument.get(row.instrument_id ?? "") ?? [];
      lotsByInstrument.set(row.instrument_id ?? "", lots);
      if (row.kind === "buy") { lots.push({ quantity: row.quantity ?? 0, cost: row.gross_amount + row.fees }); return; }
      const quantity = row.quantity ?? 0;
      const available = lots.reduce((total, lot) => total + lot.quantity, 0);
      if (available + 1e-10 < quantity) { incompleteSales += 1; return; }

      let remaining = quantity;
      let cost = 0;
      while (remaining > 1e-10 && lots.length) {
        const lot = lots[0];
        const used = Math.min(remaining, lot.quantity);
        const portion = lot.cost * (used / lot.quantity);
        lot.quantity -= used;
        lot.cost -= portion;
        remaining -= used;
        cost += portion;
        if (lot.quantity <= 1e-10) lots.shift();
      }
      proceeds += Math.max(0, row.gross_amount - row.fees);
      disposedCost += cost;
      salesWithKnownCost += 1;
    });
    const excluded = rows.length - supported.length;
    const caveat = incompleteSales > 0 ? "Faltan lotes de compra en esta fuente para una o más ventas." : excluded > 0 ? `Se excluyeron ${excluded} movimientos no comparables por divisa, tipo o identificación.` : null;
    return {
      sourceId,
      sourceName: nameBySource.get(sourceId) ?? "Fuente eliminada",
      eligibleTransactions: supported.length,
      salesWithKnownCost,
      proceeds,
      disposedCost,
      realizedResult: proceeds - disposedCost,
      realizedReturn: disposedCost > 0 ? ((proceeds - disposedCost) / disposedCost) * 100 : null,
      incompleteSales,
      caveat,
    };
  }).sort((left, right) => right.realizedResult - left.realizedResult || left.sourceName.localeCompare(right.sourceName));
}
