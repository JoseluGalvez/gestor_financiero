import { parseNumber, parseDate, mapTransactionType, normalizeCurrencyInput, normalizeSymbolInput, inferAssetClass, validateRow } from "./portfolio-csv-parser";

export function createDegiroAdapter(): any {
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
    detectFormat: (headers: string[]) => headers.some((h) => h.toLowerCase().includes("product") || h.toLowerCase().includes("isin")),
    parsePositions: (rows: any[]) => {
      const positions: any[] = [];
      const errors: any[] = [];
      rows.forEach((row, idx) => {
        const errs = validateRow(row, idx + 2, ["Product", "Size", "Price", "Currency"]);
        if (errs.length) { errors.push(...errs); return; }
        const symbol = String(row["Product"] ?? row["ISIN"] ?? "").toUpperCase().trim().replace(/[^A-Z0-9\.\-]/g, "");
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
          currency: String(row["Currency"] ?? "EUR").toUpperCase().trim().replace(/[^A-Z0-9]/g, ""),
          currentPrice: parseNumber(row["Current Price"] ?? row["Price"]),
          currentValue: parseNumber(row["Value"]),
          unrealizedPnl: parseNumber(row["Unrealized P&L"]),
        });
      });
      return positions;
    },
    parseTransactions: (rows: any[]) => {
      const transactions: any[] = [];
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
          symbol: String(row["Product"] ?? row["ISIN"] ?? "").toUpperCase().trim().replace(/[^A-Z0-9\.\-]/g, ""),
          name: String(row["Product"] ?? ""),
          isin: String(row["ISIN"] ?? "").trim() || undefined,
          assetClass: inferAssetClass(String(row["Product"] ?? "").toUpperCase().trim().replace(/[^A-Z0-9\.\-]/g, ""), String(row["Product"] ?? ""), String(row["ISIN"] ?? "")),
          quantity: Math.abs(parseNumber(row["Quantity"])),
          price: parseNumber(row["Price"]),
          amount: parseNumber(row["Total"] ?? row["Amount"]),
          currency: String(row["Currency"] ?? "EUR").toUpperCase().trim().replace(/[^A-Z0-9]/g, ""),
          fees: parseNumber(row["Fee"]),
          tax: parseNumber(row["Tax"]),
          exchangeRate: 1,
        });
        seq++;
      });
      return transactions;
    },
    normalizeSymbol: (symbol: string) => symbol.toUpperCase().trim().replace(/[^A-Z0-9\.\-]/g, ""),
    normalizeCurrency: (currency: string) => currency.toUpperCase().trim().replace(/[^A-Z0-9]/g, ""),
  };
}

export function createInteractiveBrokersAdapter(): any {
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
    detectFormat: (headers: string[]) => headers.some((h) => h.toLowerCase().includes("symbol") && h.toLowerCase().includes("quantity")),
    parsePositions: (rows: any[]) => {
      const positions: any[] = [];
      rows.forEach((row) => {
        const symbol = String(row["Symbol"] ?? row["Ticker"] ?? "").toUpperCase().trim().replace(/[^A-Z0-9\.\-]/g, "");
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
          currency: String(row["Currency"] ?? row["Ccy"] ?? "USD").toUpperCase().trim().replace(/[^A-Z0-9]/g, ""),
          currentPrice: parseNumber(row["Market Price"] ?? row["Current Price"]),
          currentValue: parseNumber(row["Market Value"]),
          unrealizedPnl: parseNumber(row["Unrealized P&L"] ?? row["P&L"]),
        });
      });
      return positions;
    },
    parseTransactions: (rows: any[]) => {
      const transactions: any[] = [];
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
          symbol: String(row["Symbol"] ?? row["Ticker"] ?? "").toUpperCase().trim().replace(/[^A-Z0-9\.\-]/g, ""),
          name: String(row["Description"] ?? ""),
          isin: String(row["ISIN"] ?? "").trim() || undefined,
          assetClass: inferAssetClass(String(row["Symbol"] ?? "").toUpperCase().trim().replace(/[^A-Z0-9\.\-]/g, ""), String(row["Description"] ?? ""), String(row["ISIN"] ?? "")),
          quantity: Math.abs(parseNumber(row["Quantity"] ?? row["Qty"])),
          price: parseNumber(row["Price"] ?? row["Execution Price"]),
          amount: parseNumber(row["Amount"] ?? row["Total"] ?? row["Consideration"]),
          currency: String(row["Currency"] ?? row["Ccy"] ?? "USD").toUpperCase().trim().replace(/[^A-Z0-9]/g, ""),
          fees: parseNumber(row["Commission"] ?? row["Fee"]),
          tax: parseNumber(row["Tax"] ?? row["Withholding Tax"]),
          exchangeRate: parseNumber(row["FX Rate"] ?? row["Exchange Rate"]) || 1,
        });
      });
      return transactions;
    },
    normalizeSymbol: (symbol: string) => symbol.toUpperCase().trim().replace(/[^A-Z0-9\.\-]/g, ""),
    normalizeCurrency: (currency: string) => currency.toUpperCase().trim().replace(/[^A-Z0-9]/g, ""),
  };
}

export function createTradeRepublicAdapter(): any {
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
    detectFormat: (headers: string[]) => headers.some((h) => h.toLowerCase().includes("einstandskurs") || h.toLowerCase().includes("isin")),
    parsePositions: (rows: any[]) => {
      const positions: any[] = [];
      rows.forEach((row) => {
        const symbol = String(row["ISIN"] ?? row["Symbol"] ?? "").toUpperCase().trim().replace(/[^A-Z0-9\.\-]/g, "");
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
          currency: String(row["Currency"] ?? row["Währung"] ?? "EUR").toUpperCase().trim().replace(/[^A-Z0-9]/g, ""),
          currentPrice: parseNumber(row["Current Price"] ?? row["Market Price"]),
          currentValue: parseNumber(row["Market Value"] ?? row["Current Value"]),
          unrealizedPnl: parseNumber(row["Unrealized P&L"] ?? row["P&L"]),
        });
      });
      return positions;
    },
    parseTransactions: (rows: any[]) => {
      const transactions: any[] = [];
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
          symbol: String(row["ISIN"] ?? row["Symbol"] ?? "").toUpperCase().trim().replace(/[^A-Z0-9\.\-]/g, ""),
          name: String(row["Name"] ?? row["Product Name"] ?? ""),
          isin: String(row["ISIN"] ?? "").trim() || undefined,
          assetClass: inferAssetClass(String(row["ISIN"] ?? "").toUpperCase().trim().replace(/[^A-Z0-9\.\-]/g, ""), String(row["Name"] ?? ""), String(row["ISIN"] ?? "")),
          quantity: Math.abs(parseNumber(row["Quantity"] ?? row["Amount"])),
          price: parseNumber(row["Price"] ?? row["Execution Price"]),
          amount: parseNumber(row["Amount"] ?? row["Total"] ?? row["Betrag"]),
          currency: String(row["Currency"] ?? row["Währung"] ?? "EUR").toUpperCase().trim().replace(/[^A-Z0-9]/g, ""),
          fees: parseNumber(row["Fee"] ?? row["Gebühr"]),
          tax: parseNumber(row["Tax"] ?? row["Steuer"]),
          exchangeRate: 1,
        });
      });
      return transactions;
    },
    normalizeSymbol: (symbol: string) => symbol.toUpperCase().trim().replace(/[^A-Z0-9\.\-]/g, ""),
    normalizeCurrency: (currency: string) => currency.toUpperCase().trim().replace(/[^A-Z0-9]/g, ""),
  };
}

export function createMyInvestorAdapter(): any {
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
    detectFormat: (headers: string[]) => headers.some((h) => h.toLowerCase().includes("participaciones") || h.toLowerCase().includes("precio medio")),
    parsePositions: (rows: any[]) => {
      const positions: any[] = [];
      rows.forEach((row) => {
        const symbol = String(row["ISIN"] ?? row["Ticker"] ?? "").toUpperCase().trim().replace(/[^A-Z0-9\.\-]/g, "");
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
          currency: String(row["Currency"] ?? row["Divisa"] ?? "EUR").toUpperCase().trim().replace(/[^A-Z0-9]/g, ""),
          currentPrice: parseNumber(row["Current Price"] ?? row["Market Price"]),
          currentValue: parseNumber(row["Market Value"] ?? row["Current Value"]),
          unrealizedPnl: parseNumber(row["Unrealized P&L"] ?? row["P&L"]),
        });
      });
      return positions;
    },
    parseTransactions: (rows: any[]) => {
      const transactions: any[] = [];
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
          symbol: String(row["ISIN"] ?? row["Ticker"] ?? "").toUpperCase().trim().replace(/[^A-Z0-9\.\-]/g, ""),
          name: String(row["Name"] ?? row["Product Name"] ?? ""),
          isin: String(row["ISIN"] ?? "").trim() || undefined,
          assetClass: inferAssetClass(String(row["ISIN"] ?? "").toUpperCase().trim().replace(/[^A-Z0-9\.\-]/g, ""), String(row["Name"] ?? ""), String(row["ISIN"] ?? "")),
          quantity: Math.abs(parseNumber(row["Quantity"] ?? row["Shares"] ?? row["Participaciones"])),
          price: parseNumber(row["Price"] ?? row["Execution Price"]),
          amount: parseNumber(row["Amount"] ?? row["Total"] ?? row["Importe"]),
          currency: String(row["Currency"] ?? row["Divisa"] ?? "EUR").toUpperCase().trim().replace(/[^A-Z0-9]/g, ""),
          fees: parseNumber(row["Fee"] ?? row["Comisión"]),
          tax: parseNumber(row["Tax"] ?? row["Impuesto"]),
          exchangeRate: 1,
        });
      });
      return transactions;
    },
    normalizeSymbol: (symbol: string) => symbol.toUpperCase().trim().replace(/[^A-Z0-9\.\-]/g, ""),
    normalizeCurrency: (currency: string) => currency.toUpperCase().trim().replace(/[^A-Z0-9]/g, ""),
  };
}

export function createGenericAdapter(): any {
  const DEFAULT_POSITION_COLUMNS = {
    symbol: ["symbol", "ticker", "isin", "instrument", "product"],
    name: ["name", "product_name", "description", "instrument_name"],
    isin: ["isin", "isin_code"],
    quantity: ["quantity", "qty", "amount", "units", "shares"],
    averagePrice: ["average_price", "avg_price", "buy_price", "purchase_price", "cost_price"],
    currency: ["currency", "ccy", "denomination"],
    currentPrice: ["current_price", "market_price", "price", "last_price"],
    currentValue: ["current_value", "market_value", "value"],
    unrealizedPnl: ["unrealized_pnl", "unrealized_pl", "profit_loss", "pnl"],
    assetClass: ["asset_class", "type", "category", "instrument_type"],
  };

  const DEFAULT_TRANSACTION_COLUMNS = {
    date: ["date", "trade_date", "execution_date", "settlement_date", "datum"],
    type: ["type", "transaction_type", "side", "action", "transaction"],
    symbol: ["symbol", "ticker", "isin", "instrument", "product"],
    name: ["name", "product_name", "description"],
    isin: ["isin", "isin_code"],
    quantity: ["quantity", "qty", "amount", "units", "shares"],
    price: ["price", "execution_price", "trade_price", "rate"],
    amount: ["amount", "value", "total", "consideration", "gross_amount"],
    currency: ["currency", "ccy", "denomination"],
    fees: ["fees", "commission", "commissions", "fee"],
    tax: ["tax", "withholding_tax", "stamp_duty"],
    exchangeRate: ["exchange_rate", "fx_rate", "rate"],
    typeMapping: {
      buy: "buy",
      sell: "sell",
      dividend: "dividend",
      interest: "interest",
      deposit: "deposit",
      withdrawal: "withdrawal",
      fee: "fee",
      tax: "tax",
      split: "split",
      merge: "merge",
      transfer: "transfer-in",
      staking: "staking-reward",
      airdrop: "airdrop",
    },
  };

  function findColumnValue(row: Record<string, unknown>, candidates: string[]): string | null {
    for (const candidate of candidates) {
      if (row[candidate] !== undefined && row[candidate] !== null && String(row[candidate]).trim()) {
        return String(row[candidate]);
      }
    }
    return null;
  }

  return {
    platform: "other",
    name: "Genérico (CSV/XLSX)",
    supportedFormats: ["csv", "xlsx"],
    requiredColumns: {
      symbol: ["symbol", "ticker", "isin", "instrument", "product"],
      quantity: ["quantity", "qty", "amount", "units", "shares"],
      averagePrice: ["average_price", "avg_price", "buy_price", "purchase_price", "cost_price"],
      currency: ["currency", "ccy", "denomination"],
    },
    optionalColumns: [],
    detectFormat: () => true,
    parsePositions: (rows: any[]) => {
      const positions: any[] = [];
      rows.forEach((row) => {
        const symbol = findColumnValue(row, ["symbol", "ticker", "isin", "instrument", "product"]);
        const name = findColumnValue(row, ["name", "product_name", "description", "instrument_name"]);
        const isin = findColumnValue(row, ["isin", "isin_code"]);
        const assetClass = inferAssetClass(symbol ?? "", name, isin);
        positions.push({
          platform: "other",
          symbol: (symbol ?? "").toUpperCase().trim().replace(/[^A-Z0-9\.\-]/g, ""),
          name: name ?? "",
          isin: isin ?? undefined,
          assetClass,
          quantity: parseNumber(findColumnValue(row, ["quantity", "qty", "amount", "units", "shares"])),
          averagePrice: parseNumber(findColumnValue(row, ["average_price", "avg_price", "buy_price", "purchase_price", "cost_price"])),
          currency: String(findColumnValue(row, ["currency", "ccy", "denomination"]) ?? "EUR").toUpperCase().trim().replace(/[^A-Z0-9]/g, ""),
          currentPrice: parseNumber(findColumnValue(row, ["current_price", "market_price", "price", "last_price"])),
          currentValue: parseNumber(findColumnValue(row, ["current_value", "market_value", "value"])),
          unrealizedPnl: parseNumber(findColumnValue(row, ["unrealized_pnl", "unrealized_pl", "profit_loss", "pnl"])),
        });
      });
      return positions;
    },
    parseTransactions: (rows: any[]) => {
      const transactions: any[] = [];
      rows.forEach((row) => {
        const typeRaw = String(findColumnValue(row, ["type", "transaction_type", "side", "action", "transaction"]) ?? "");
        const type = mapTransactionType(typeRaw, {
          buy: "buy",
          sell: "sell",
          dividend: "dividend",
          interest: "interest",
          deposit: "deposit",
          withdrawal: "withdrawal",
          fee: "fee",
          tax: "tax",
          split: "split",
          merge: "merge",
          transfer: "transfer-in",
          staking: "staking-reward",
          airdrop: "airdrop",
        });
        transactions.push({
          platform: "other",
          date: parseDate(findColumnValue(row, ["date", "trade_date", "execution_date", "settlement_date", "datum"])) ?? new Date().toISOString().split("T")[0],
          type,
          symbol: String(findColumnValue(row, ["symbol", "ticker", "isin", "instrument", "product"]) ?? "").toUpperCase().trim().replace(/[^A-Z0-9\.\-]/g, ""),
          name: String(findColumnValue(row, ["name", "product_name", "description"]) ?? ""),
          isin: String(findColumnValue(row, ["isin", "isin_code"]) ?? "").trim() || undefined,
          assetClass: inferAssetClass(
            String(findColumnValue(row, ["symbol", "ticker", "isin", "instrument", "product"]) ?? "").toUpperCase().trim().replace(/[^A-Z0-9\.\-]/g, ""),
            String(findColumnValue(row, ["name", "product_name", "description"]) ?? ""),
            String(findColumnValue(row, ["isin", "isin_code"]) ?? "")
          ),
          quantity: Math.abs(parseNumber(findColumnValue(row, ["quantity", "qty", "amount", "units", "shares"]))),
          price: parseNumber(findColumnValue(row, ["price", "execution_price", "trade_price", "rate"])),
          amount: parseNumber(findColumnValue(row, ["amount", "value", "total", "consideration", "gross_amount"])),
          currency: String(findColumnValue(row, ["currency", "ccy", "denomination"]) ?? "EUR").toUpperCase().trim().replace(/[^A-Z0-9]/g, ""),
          fees: parseNumber(findColumnValue(row, ["fees", "commission", "commissions", "fee"])),
          tax: parseNumber(findColumnValue(row, ["tax", "withholding_tax", "stamp_duty"])),
          exchangeRate: parseNumber(findColumnValue(row, ["exchange_rate", "fx_rate", "rate"])) || 1,
        });
      });
      return transactions;
    },
    normalizeSymbol: (symbol: string) => symbol.toUpperCase().trim().replace(/[^A-Z0-9\.\-]/g, ""),
    normalizeCurrency: (currency: string) => currency.toUpperCase().trim().replace(/[^A-Z0-9]/g, ""),
  };
}

export function getAllAdapters(): any[] {
  return [
    createDegiroAdapter(),
    createInteractiveBrokersAdapter(),
    createTradeRepublicAdapter(),
    createMyInvestorAdapter(),
    createGenericAdapter(),
  ];
}

export function getAdapterForPlatform(platform: string): any | undefined {
  return getAllAdapters().find((a) => a.platform === platform);
}

export { parseNumber, parseDate, mapTransactionType, normalizeCurrencyInput, normalizeSymbolInput, inferAssetClass, validateRow } from "./portfolio-csv-parser";