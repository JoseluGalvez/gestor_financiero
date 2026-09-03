import { parseNumber, parseDate, mapTransactionType, validateRow, inferAssetClass } from "./portfolio-csv-parser";

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
      rows.forEach((row, idx) => {
        const errs = validateRow(row, idx + 2, ["Product", "Size", "Price", "Currency"]);
        if (errs.length) return;
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
        const symbol = String(row["symbol"] ?? row["ticker"] ?? row["isin"] ?? row["instrument"] ?? row["product"] ?? "").toUpperCase().trim().replace(/[^A-Z0-9\.\-]/g, "");
        const name = String(row["name"] ?? row["product_name"] ?? row["description"] ?? row["instrument_name"] ?? "");
        const isin = String(row["isin"] ?? row["isin_code"] ?? "").trim() || undefined;
        const assetClass = inferAssetClass(symbol ?? "", String(row["name"] ?? ""), String(row["isin"] ?? ""));
        positions.push({
          platform: "other",
          symbol,
          name,
          isin,
          assetClass,
          quantity: parseNumber(row["quantity"] ?? row["qty"] ?? row["amount"] ?? row["units"] ?? row["shares"]),
          averagePrice: parseNumber(row["average_price"] ?? row["avg_price"] ?? row["buy_price"] ?? row["purchase_price"] ?? row["cost_price"]),
          currency: String(row["currency"] ?? row["ccy"] ?? "EUR").toUpperCase().trim().replace(/[^A-Z0-9]/g, ""),
          currentPrice: parseNumber(row["current_price"] ?? row["market_price"] ?? row["price"] ?? row["last_price"]),
          currentValue: parseNumber(row["current_value"] ?? row["market_value"] ?? row["value"]),
          unrealizedPnl: parseNumber(row["unrealized_pnl"] ?? row["unrealized_pl"] ?? row["profit_loss"] ?? row["pnl"]),
        });
      });
      return positions;
    },
    parseTransactions: (rows: any[]) => {
      const transactions: any[] = [];
      rows.forEach((row) => {
        const typeRaw = String(row["type"] ?? row["transaction_type"] ?? row["side"] ?? row["action"] ?? row["transaction"] ?? "");
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
          date: parseDate(row["date"] ?? row["trade_date"] ?? row["execution_date"] ?? row["settlement_date"] ?? row["datum"]) ?? new Date().toISOString().split("T")[0],
          type,
          symbol: String(row["symbol"] ?? row["ticker"] ?? row["isin"] ?? row["instrument"] ?? row["product"] ?? "").toUpperCase().trim().replace(/[^A-Z0-9\.\-]/g, ""),
          name: String(row["name"] ?? row["product_name"] ?? row["description"] ?? ""),
          isin: String(row["isin"] ?? row["isin_code"] ?? "").trim() || undefined,
          assetClass: inferAssetClass(String(row["symbol"] ?? row["ticker"] ?? row["isin"] ?? row["instrument"] ?? row["product"] ?? "").toUpperCase().trim().replace(/[^A-Z0-9\.\-]/g, ""), String(row["name"] ?? row["product_name"] ?? row["description"] ?? ""), String(row["isin"] ?? row["isin_code"] ?? "")),
          quantity: Math.abs(parseNumber(row["quantity"] ?? row["qty"] ?? row["amount"] ?? row["units"] ?? row["shares"])),
          price: parseNumber(row["price"] ?? row["execution_price"] ?? row["trade_price"] ?? row["rate"]),
          amount: parseNumber(row["amount"] ?? row["value"] ?? row["total"] ?? row["consideration"] ?? row["gross_amount"]),
          currency: String(row["currency"] ?? row["ccy"] ?? "EUR").toUpperCase().trim().replace(/[^A-Z0-9]/g, ""),
          fees: parseNumber(row["fees"] ?? row["commission"] ?? row["commissions"] ?? row["fee"]),
          tax: parseNumber(row["tax"] ?? row["withholding_tax"] ?? row["stamp_duty"]),
          exchangeRate: parseNumber(row["exchange_rate"] ?? row["fx_rate"] ?? row["rate"]) || 1,
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

export { parseNumber, parseDate, mapTransactionType, validateRow, inferAssetClass } from "./portfolio-csv-parser";