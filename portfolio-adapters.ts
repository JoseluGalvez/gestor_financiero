import type { PositionColumns, TransactionColumns, DEFAULT_POSITION_COLUMNS, DEFAULT_TRANSACTION_COLUMNS, PlatformAdapter, PlatformId, ImportError } from "./portfolio-types";
import {
  parseNumber,
  parseDate,
  mapTransactionType,
  createPositionId,
  createTransactionId,
  validateRow,
  normalizeCurrencyInput,
  normalizeSymbolInput,
  inferAssetClass,
} from "./portfolio-csv-parser";

import type { RawPosition, RawTransaction, AssetClass, TransactionType, ImportError, PlatformAdapter, PlatformId } from "./portfolio-types";
import {
  parseNumber,
  parseDate,
  mapTransactionType,
  createPositionId,
  createTransactionId,
  validateRow,
  normalizeCurrencyInput,
  normalizeSymbolInput,
  inferAssetClass,
} from "./portfolio-csv-parser";

export function createDegiroAdapter(): PlatformAdapter {
  return {
    platform: "degiro",
    name: "DEGIRO",
    supportedFormats: ["csv"],
    requiredColumns: {
      symbol: ["Product", "ISIN"],
      quantity: ["Size"],
      averagePrice: ["Price"],
      currency: ["Currency"],
    },
    optionalColumns: ["Asset Type", "Exchange", "Value", "Unrealized P&L", "P&L %"],
    detectFormat: (headers) => headers.some((h) => h.toLowerCase().includes("product") || h.toLowerCase().includes("isin")),
    parsePositions: (rows) => {
      const positions: RawPosition[] = [];
      const errors: ImportError[] = [];
      rows.forEach((row, idx) => {
        const errs = validateRow(row, idx + 2, ["Product", "Size", "Price", "Currency"]);
        if (errs.length) { errors.push(...errs); return; }
        const symbol = normalizeSymbolInput(String(row["Product"] ?? row["ISIN"] ?? ""));
        const name = String(row["Product"] ?? "");
        const isin = String(row["ISIN"] ?? "").trim() || undefined;
        const assetClass = inferAssetClass(symbol, name, isin);
        positions.push({
          platform: "degiro",
          symbol,
          name,
          isin,
          assetClass,
          quantity: parseNumber(row["Size"]),
          averagePrice: parseNumber(row["Price"]),
          currency: normalizeCurrencyInput(String(row["Currency"] ?? "EUR")),
          currentPrice: parseNumber(row["Current Price"] ?? row["Price"]),
          currentValue: parseNumber(row["Value"]),
          unrealizedPnl: parseNumber(row["Unrealized P&L"]),
        });
      });
      return positions;
    },
    parseTransactions: (rows) => {
      const transactions: RawTransaction[] = [];
      let seq = 0;
      rows.forEach((row, idx) => {
        const errs = validateRow(row, idx + 2, ["Date", "Product", "Type", "Quantity", "Price", "Currency"]);
        if (errs.length) return;
        const typeRaw = String(row["Type"] ?? "");
        const type = mapTransactionType(typeRaw, {
          buy: "buy",
          sell: "sell",
          dividend: "dividend",
          interest: "interest",
          deposit: "deposit",
          withdrawal: "withdrawal",
          fee: "fee",
          tax: "tax",
        });
        transactions.push({
          platform: "degiro",
          date: parseDate(row["Date"]) ?? new Date().toISOString().split("T")[0],
          type,
          symbol: normalizeSymbolInput(String(row["Product"] ?? row["ISIN"] ?? "")),
          name: String(row["Product"] ?? ""),
          isin: String(row["ISIN"] ?? "").trim() || undefined,
          assetClass: inferAssetClass(normalizeSymbolInput(String(row["Product"] ?? "")), String(row["Product"] ?? ""), String(row["ISIN"] ?? "")),
          quantity: Math.abs(parseNumber(row["Quantity"])),
          price: parseNumber(row["Price"]),
          amount: parseNumber(row["Total"] ?? row["Amount"]),
          currency: normalizeCurrencyInput(String(row["Currency"] ?? "EUR")),
          fees: parseNumber(row["Fee"]),
          tax: parseNumber(row["Tax"]),
          exchangeRate: 1,
        });
        seq++;
      });
      return transactions;
    },
    normalizeSymbol: (symbol) => normalizeSymbolInput(symbol),
    normalizeCurrency: (currency) => normalizeCurrencyInput(currency),
  };
}

export function createInteractiveBrokersAdapter(): PlatformAdapter {
  return {
    platform: "interactive-brokers",
    name: "Interactive Brokers",
    supportedFormats: ["csv", "xlsx"],
    requiredColumns: {
      symbol: ["Symbol", "Ticker"],
      quantity: ["Quantity", "Qty"],
      averagePrice: ["Avg Price", "AvgPrice", "Cost Basis"],
      currency: ["Currency", "Ccy"],
    },
    optionalColumns: ["Asset Class", "Exchange", "Market Value", "Unrealized P&L", "P&L"],
    detectFormat: (headers) => headers.some((h) => h.toLowerCase().includes("symbol") && h.toLowerCase().includes("quantity")),
    parsePositions: (rows) => {
      const positions: RawPosition[] = [];
      rows.forEach((row) => {
        const symbol = normalizeSymbolInput(String(row["Symbol"] ?? row["Ticker"] ?? ""));
        const name = String(row["Description"] ?? row["Name"] ?? "");
        const assetClass = inferAssetClass(symbol, name, String(row["ISIN"] ?? ""));
        positions.push({
          platform: "interactive-brokers",
          symbol,
          name,
          isin: String(row["ISIN"] ?? "").trim() || undefined,
          assetClass,
          quantity: parseNumber(row["Quantity"] ?? row["Qty"]),
          averagePrice: parseNumber(row["Avg Price"] ?? row["AvgPrice"] ?? row["Cost Basis"]),
          currency: normalizeCurrencyInput(String(row["Currency"] ?? row["Ccy"] ?? "USD")),
          currentPrice: parseNumber(row["Market Price"] ?? row["Current Price"]),
          currentValue: parseNumber(row["Market Value"]),
          unrealizedPnl: parseNumber(row["Unrealized P&L"] ?? row["P&L"]),
        });
      });
      return positions;
    },
    parseTransactions: (rows) => {
      const transactions: RawTransaction[] = [];
      rows.forEach((row) => {
        const typeRaw = String(row["Type"] ?? row["Action"] ?? "");
        const type = mapTransactionType(typeRaw, {
          buy: "buy",
          sell: "sell",
          dividend: "dividend",
          interest: "interest",
          deposit: "deposit",
          withdrawal: "withdrawal",
          fee: "fee",
          tax: "tax",
        });
        transactions.push({
          platform: "interactive-brokers",
          date: parseDate(row["Date"] ?? row["Trade Date"] ?? row["Settlement Date"]) ?? new Date().toISOString().split("T")[0],
          type,
          symbol: normalizeSymbolInput(String(row["Symbol"] ?? row["Ticker"] ?? "")),
          name: String(row["Description"] ?? ""),
          isin: String(row["ISIN"] ?? "").trim() || undefined,
          assetClass: inferAssetClass(normalizeSymbolInput(String(row["Symbol"] ?? "")), String(row["Description"] ?? ""), String(row["ISIN"] ?? "")),
          quantity: Math.abs(parseNumber(row["Quantity"] ?? row["Qty"])),
          price: parseNumber(row["Price"] ?? row["Execution Price"]),
          amount: parseNumber(row["Amount"] ?? row["Total"] ?? row["Consideration"]),
          currency: normalizeCurrencyInput(String(row["Currency"] ?? row["Ccy"] ?? "USD")),
          fees: parseNumber(row["Commission"] ?? row["Fee"]),
          tax: parseNumber(row["Tax"] ?? row["Withholding Tax"]),
          exchangeRate: parseNumber(row["FX Rate"] ?? row["Exchange Rate"]) || 1,
        });
      });
      return transactions;
    },
    normalizeSymbol: normalizeSymbolInput,
    normalizeCurrency: normalizeCurrencyInput,
  };
}

export function createTradeRepublicAdapter(): PlatformAdapter {
  return {
    platform: "trade-republic",
    name: "Trade Republic",
    supportedFormats: ["csv", "xlsx"],
    requiredColumns: {
      symbol: ["ISIN", "Symbol"],
      quantity: ["Quantity", "Amount"],
      averagePrice: ["Average Price", "Avg Price", "Einstandskurs"],
      currency: ["Currency", "Währung"],
    },
    optionalColumns: ["Name", "Current Price", "Market Value", "Unrealized P&L"],
    detectFormat: (headers) => headers.some((h) => h.toLowerCase().includes("einstandskurs") || h.toLowerCase().includes("isin")),
    parsePositions: (rows) => {
      const positions: RawPosition[] = [];
      rows.forEach((row) => {
        const symbol = normalizeSymbolInput(String(row["ISIN"] ?? row["Symbol"] ?? ""));
        const name = String(row["Name"] ?? row["Product Name"] ?? "");
        const assetClass = inferAssetClass(symbol, name, String(row["ISIN"] ?? ""));
        positions.push({
          platform: "trade-republic",
          symbol,
          name,
          isin: String(row["ISIN"] ?? "").trim() || undefined,
          assetClass,
          quantity: parseNumber(row["Quantity"] ?? row["Amount"]),
          averagePrice: parseNumber(row["Average Price"] ?? row["Avg Price"] ?? row["Einstandskurs"]),
          currency: normalizeCurrencyInput(String(row["Currency"] ?? row["Währung"] ?? "EUR")),
          currentPrice: parseNumber(row["Current Price"] ?? row["Market Price"]),
          currentValue: parseNumber(row["Market Value"] ?? row["Current Value"]),
          unrealizedPnl: parseNumber(row["Unrealized P&L"] ?? row["P&L"]),
        });
      });
      return positions;
    },
    parseTransactions: (rows) => {
      const transactions: RawTransaction[] = [];
      rows.forEach((row) => {
        const typeRaw = String(row["Type"] ?? row["Art"] ?? "");
        const type = mapTransactionType(typeRaw, {
          kauf: "buy",
          verkauf: "sell",
          buy: "buy",
          sell: "sell",
          dividende: "dividend",
          dividend: "dividend",
          zinsen: "interest",
          interest: "interest",
          einzahlung: "deposit",
          deposit: "deposit",
          auszahlung: "withdrawal",
          withdrawal: "withdrawal",
          gebühr: "fee",
          fee: "fee",
          steuer: "tax",
          tax: "tax",
        });
        transactions.push({
          platform: "trade-republic",
          date: parseDate(row["Date"] ?? row["Datum"] ?? row["Trade Date"]) ?? new Date().toISOString().split("T")[0],
          type,
          symbol: normalizeSymbolInput(String(row["ISIN"] ?? row["Symbol"] ?? "")),
          name: String(row["Name"] ?? row["Product Name"] ?? ""),
          isin: String(row["ISIN"] ?? "").trim() || undefined,
          assetClass: inferAssetClass(normalizeSymbolInput(String(row["ISIN"] ?? "")), String(row["Name"] ?? ""), String(row["ISIN"] ?? "")),
          quantity: Math.abs(parseNumber(row["Quantity"] ?? row["Amount"])),
          price: parseNumber(row["Price"] ?? row["Execution Price"]),
          amount: parseNumber(row["Amount"] ?? row["Total"] ?? row["Betrag"]),
          currency: normalizeCurrencyInput(String(row["Currency"] ?? row["Währung"] ?? "EUR")),
          fees: parseNumber(row["Fee"] ?? row["Gebühr"]),
          tax: parseNumber(row["Tax"] ?? row["Steuer"]),
          exchangeRate: 1,
        });
      });
      return transactions;
    },
    normalizeSymbol: normalizeSymbolInput,
    normalizeCurrency: normalizeCurrencyInput,
  };
}

export function createMyInvestorAdapter(): PlatformAdapter {
  return {
    platform: "myinvestor",
    name: "MyInvestor",
    supportedFormats: ["csv", "xlsx"],
    requiredColumns: {
      symbol: ["ISIN", "Ticker"],
      quantity: ["Quantity", "Shares", "Participaciones"],
      averagePrice: ["Average Price", "Avg Price", "Precio Medio"],
      currency: ["Currency", "Divisa"],
    },
    optionalColumns: ["Name", "Current Price", "Market Value", "Unrealized P&L"],
    detectFormat: (headers) => headers.some((h) => h.toLowerCase().includes("participaciones") || h.toLowerCase().includes("precio medio")),
    parsePositions: (rows) => {
      const positions: RawPosition[] = [];
      rows.forEach((row) => {
        const symbol = normalizeSymbolInput(String(row["ISIN"] ?? row["Ticker"] ?? ""));
        const name = String(row["Name"] ?? row["Product Name"] ?? "");
        const assetClass = inferAssetClass(symbol, name, String(row["ISIN"] ?? ""));
        positions.push({
          platform: "myinvestor",
          symbol,
          name,
          isin: String(row["ISIN"] ?? "").trim() || undefined,
          assetClass,
          quantity: parseNumber(row["Quantity"] ?? row["Shares"] ?? row["Participaciones"]),
          averagePrice: parseNumber(row["Average Price"] ?? row["Avg Price"] ?? row["Precio Medio"]),
          currency: normalizeCurrencyInput(String(row["Currency"] ?? row["Divisa"] ?? "EUR")),
          currentPrice: parseNumber(row["Current Price"] ?? row["Market Price"]),
          currentValue: parseNumber(row["Market Value"] ?? row["Current Value"]),
          unrealizedPnl: parseNumber(row["Unrealized P&L"] ?? row["P&L"]),
        });
      });
      return positions;
    },
    parseTransactions: (rows) => {
      const transactions: RawTransaction[] = [];
      rows.forEach((row) => {
        const typeRaw = String(row["Type"] ?? row["Tipo"] ?? "");
        const type = mapTransactionType(typeRaw, {
          compra: "buy",
          venta: "sell",
          buy: "buy",
          sell: "sell",
          dividendo: "dividend",
          dividend: "dividend",
          interes: "interest",
          interest: "interest",
          ingreso: "deposit",
          deposit: "deposit",
          reintegro: "withdrawal",
          withdrawal: "withdrawal",
          comision: "fee",
          fee: "fee",
          impuesto: "tax",
          tax: "tax",
        });
        transactions.push({
          platform: "myinvestor",
          date: parseDate(row["Date"] ?? row["Fecha"] ?? row["Trade Date"]) ?? new Date().toISOString().split("T")[0],
          type,
          symbol: normalizeSymbolInput(String(row["ISIN"] ?? row["Ticker"] ?? "")),
          name: String(row["Name"] ?? row["Product Name"] ?? ""),
          isin: String(row["ISIN"] ?? "").trim() || undefined,
          assetClass: inferAssetClass(normalizeSymbolInput(String(row["ISIN"] ?? "")), String(row["Name"] ?? ""), String(row["ISIN"] ?? "")),
          quantity: Math.abs(parseNumber(row["Quantity"] ?? row["Shares"] ?? row["Participaciones"])),
          price: parseNumber(row["Price"] ?? row["Execution Price"]),
          amount: parseNumber(row["Amount"] ?? row["Total"] ?? row["Importe"]),
          currency: normalizeCurrencyInput(String(row["Currency"] ?? row["Divisa"] ?? "EUR")),
          fees: parseNumber(row["Fee"] ?? row["Comisión"]),
          tax: parseNumber(row["Tax"] ?? row["Impuesto"]),
          exchangeRate: 1,
        });
      });
      return transactions;
    },
    normalizeSymbol: normalizeSymbolInput,
    normalizeCurrency: normalizeCurrencyInput,
  };
}

export function createGenericAdapter(): PlatformAdapter {
  return {
    platform: "other",
    name: "Genérico (CSV/XLSX)",
    supportedFormats: ["csv", "xlsx"],
    requiredColumns: DEFAULT_POSITION_COLUMNS,
    optionalColumns: [],
    detectFormat: () => true,
    parsePositions: (rows) => {
      const positions: RawPosition[] = [];
      rows.forEach((row) => {
        const symbol = findColumnValue(row, DEFAULT_POSITION_COLUMNS.symbol);
        const name = findColumnValue(row, DEFAULT_POSITION_COLUMNS.name);
        const isin = findColumnValue(row, DEFAULT_POSITION_COLUMNS.isin);
        const assetClass = inferAssetClass(symbol, name, isin);
        positions.push({
          platform: "other",
          symbol: normalizeSymbolInput(symbol ?? ""),
          name: name ?? "",
          isin: isin ?? undefined,
          assetClass,
          quantity: parseNumber(findColumnValue(row, DEFAULT_POSITION_COLUMNS.quantity)),
          averagePrice: parseNumber(findColumnValue(row, DEFAULT_POSITION_COLUMNS.averagePrice)),
          currency: normalizeCurrencyInput(String(findColumnValue(row, DEFAULT_POSITION_COLUMNS.currency) ?? "EUR")),
          currentPrice: parseNumber(findColumnValue(row, DEFAULT_POSITION_COLUMNS.currentPrice)),
          currentValue: parseNumber(findColumnValue(row, DEFAULT_POSITION_COLUMNS.currentValue)),
          unrealizedPnl: parseNumber(findColumnValue(row, DEFAULT_POSITION_COLUMNS.unrealizedPnl)),
        });
      });
      return positions;
    },
    parseTransactions: (rows) => {
      const transactions: RawTransaction[] = [];
      rows.forEach((row) => {
        const typeRaw = String(findColumnValue(row, DEFAULT_TRANSACTION_COLUMNS.type) ?? "");
        const type = mapTransactionType(typeRaw, DEFAULT_TRANSACTION_COLUMNS.typeMapping);
        transactions.push({
          platform: "other",
          date: parseDate(findColumnValue(row, DEFAULT_TRANSACTION_COLUMNS.date)) ?? new Date().toISOString().split("T")[0],
          type,
          symbol: normalizeSymbolInput(String(findColumnValue(row, DEFAULT_TRANSACTION_COLUMNS.symbol) ?? "")),
          name: String(findColumnValue(row, DEFAULT_TRANSACTION_COLUMNS.name) ?? ""),
          isin: String(findColumnValue(row, DEFAULT_TRANSACTION_COLUMNS.isin) ?? "").trim() || undefined,
          assetClass: inferAssetClass(
            normalizeSymbolInput(String(findColumnValue(row, DEFAULT_TRANSACTION_COLUMNS.symbol) ?? "")),
            String(findColumnValue(row, DEFAULT_TRANSACTION_COLUMNS.name) ?? ""),
            String(findColumnValue(row, DEFAULT_TRANSACTION_COLUMNS.isin) ?? "")
          ),
          quantity: Math.abs(parseNumber(findColumnValue(row, DEFAULT_TRANSACTION_COLUMNS.quantity))),
          price: parseNumber(findColumnValue(row, DEFAULT_TRANSACTION_COLUMNS.price)),
          amount: parseNumber(findColumnValue(row, DEFAULT_TRANSACTION_COLUMNS.amount)),
          currency: normalizeCurrencyInput(String(findColumnValue(row, DEFAULT_TRANSACTION_COLUMNS.currency) ?? "EUR")),
          fees: parseNumber(findColumnValue(row, DEFAULT_TRANSACTION_COLUMNS.fees)),
          tax: parseNumber(findColumnValue(row, DEFAULT_TRANSACTION_COLUMNS.tax)),
          exchangeRate: parseNumber(findColumnValue(row, DEFAULT_TRANSACTION_COLUMNS.exchangeRate)) || 1,
        });
      });
      return transactions;
    },
    normalizeSymbol: normalizeSymbolInput,
    normalizeCurrency: normalizeCurrencyInput,
  };
}

function findColumnValue(row: Record<string, unknown>, candidates: string[]): string | null {
  for (const candidate of candidates) {
    if (row[candidate] !== undefined && row[candidate] !== null && String(row[candidate]).trim()) {
      return String(row[candidate]);
    }
  }
  return null;
}

export function getAllAdapters(): PlatformAdapter[] {
  return [
    createDegiroAdapter(),
    createInteractiveBrokersAdapter(),
    createTradeRepublicAdapter(),
    createMyInvestorAdapter(),
    createGenericAdapter(),
  ];
}

export function getAdapterForPlatform(platform: PlatformId): PlatformAdapter | undefined {
  return getAllAdapters().find((a) => a.platform === platform);
}