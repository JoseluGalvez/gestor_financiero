import { analyzeRecords, type LocalRecord } from "../src/lib/local-analytics.ts";
import { comparePlatforms } from "../src/lib/platform-comparison.ts";
import { calculateDcf } from "../src/lib/financial-analysis.ts";

const comparison = comparePlatforms([
  { id: "buy-1", data_source_id: "source-a", instrument_id: "btc", occurred_at: "2025-01-01T00:00:00Z", kind: "buy", quantity: 1, gross_amount: 100, fees: 0, currency: "EUR" },
  { id: "sell-incomplete", data_source_id: "source-a", instrument_id: "btc", occurred_at: "2025-02-01T00:00:00Z", kind: "sell", quantity: 2, gross_amount: 300, fees: 0, currency: "EUR" },
  { id: "sell-valid", data_source_id: "source-a", instrument_id: "btc", occurred_at: "2025-03-01T00:00:00Z", kind: "sell", quantity: 1, gross_amount: 160, fees: 0, currency: "EUR" },
], [{ id: "source-a", display_name: "Fuente A" }], "EUR")[0];

if (!comparison || comparison.incompleteSales !== 1) throw new Error("La venta incompleta debe contabilizarse como revisión.");
if (comparison.salesWithKnownCost !== 1 || Math.abs(comparison.disposedCost - 100) > 0.0001 || Math.abs(comparison.realizedResult - 60) > 0.0001) {
  throw new Error(`El inventario debe preservarse después de una venta incompleta: ${JSON.stringify(comparison)}`);
}

const records: LocalRecord[] = [
  { id: "eu", date: "05/01/2025", value: 10, category: "A", platform: "P", geography: "ES", status: "ok", raw: {} },
  { id: "iso", date: "2025-02-20", value: 20, category: "A", platform: "P", geography: "ES", status: "ok", raw: {} },
  { id: "missing", date: "Sin fecha", value: 30, category: "A", platform: "P", geography: "ES", status: "ok", raw: {} },
];

const january = analyzeRecords(records, { from: "2025-01-01", to: "2025-01-31", category: "", platform: "", geography: "" });
if (january.filtered.length !== 1 || january.filtered[0]?.id !== "eu" || january.timeline[0]?.label !== "2025-01") {
  throw new Error(`El filtro debe normalizar DD/MM/AAAA antes de comparar: ${JSON.stringify(january)}`);
}

const validDcfInput = {
  freeCashFlows: [10, 11, 12, 13, 14, 15, 16, 17, 18, 19],
  discountRate: 0.08,
  sharesOutstanding: 10,
};

const nonFiniteGrowth = calculateDcf({ ...validDcfInput, terminalGrowthRate: Number.NaN });
if (nonFiniteGrowth.enterpriseValue !== null || !nonFiniteGrowth.warnings.some((warning) => warning.includes("crecimiento terminal"))) {
  throw new Error(`El DCF debe bloquear crecimiento terminal no finito: ${JSON.stringify(nonFiniteGrowth)}`);
}

const nonFiniteDebt = calculateDcf({ ...validDcfInput, netDebt: Number.POSITIVE_INFINITY });
if (nonFiniteDebt.enterpriseValue !== null || !nonFiniteDebt.warnings.some((warning) => warning.includes("deuda neta"))) {
  throw new Error(`El DCF debe bloquear deuda neta no finita: ${JSON.stringify(nonFiniteDebt)}`);
}

console.log(JSON.stringify({ status: "ok", platformInventoryAtomic: true, localEuropeanDateFilter: true, dcfNonFiniteInputsBlocked: true }));
