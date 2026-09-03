export type PlatformId = 
  | "degiro"
  | "interactive-brokers"
  | "trade-republic"
  | "myinvestor"
  | "bingx"
  | "kraken"
  | "coinbase"
  | "binance"
  | "metamask"
  | "ledger"
  | "other";

export type AssetClass = 
  | "equity"
  | "etf"
  | "bond"
  | "fund"
  | "crypto"
  | "derivative"
  | "cash"
  | "other";

export type TransactionType = 
  | "buy"
  | "sell"
  | "dividend"
  | "interest"
  | "deposit"
  | "withdrawal"
  | "fee"
  | "tax"
  | "split"
  | "merge"
  | "transfer-in"
  | "transfer-out"
  | "staking-reward"
  | "airdrop"
  | "other";

export type CurrencyCode = 
  | "EUR"
  | "USD"
  | "GBP"
  | "CHF"
  | "JPY"
  | "BTC"
  | "ETH"
  | "USDT"
  | "USDC"
  | string;

export interface RawPosition {
  platform: PlatformId;
  platformAccountId?: string;
  symbol: string;
  name?: string;
  isin?: string;
  assetClass: AssetClass;
  quantity: number;
  averagePrice: number;
  currency: CurrencyCode;
  currentPrice?: number;
  currentValue?: number;
  unrealizedPnl?: number;
  unrealizedPnlPct?: number;
  metadata?: Record<string, unknown>;
}

export interface RawTransaction {
  platform: PlatformId;
  platformAccountId?: string;
  date: string;
  type: TransactionType;
  symbol: string;
  name?: string;
  isin?: string;
  assetClass: AssetClass;
  quantity: number;
  price: number;
  amount: number;
  currency: CurrencyCode;
  fees?: number;
  tax?: number;
  exchangeRate?: number;
  referenceId?: string;
  notes?: string;
  metadata?: Record<string, unknown>;
}

export interface UnifiedPosition {
  id: string;
  symbol: string;
  name: string;
  isin?: string;
  assetClass: AssetClass;
  totalQuantity: number;
  weightedAveragePrice: number;
  totalCostBasis: number;
  currency: CurrencyCode;
  currentPrice?: number;
  currentValue?: number;
  unrealizedPnl?: number;
  unrealizedPnlPct?: number;
  byPlatform: Map<PlatformId, PlatformPosition>;
  lastUpdated: number;
}

export interface PlatformPosition {
  platform: PlatformId;
  platformAccountId?: string;
  quantity: number;
  averagePrice: number;
  costBasis: number;
  currentValue?: number;
  unrealizedPnl?: number;
  transactions: UnifiedTransaction[];
}

export interface UnifiedTransaction {
  id: string;
  platform: PlatformId;
  platformAccountId?: string;
  date: string;
  type: TransactionType;
  symbol: string;
  name?: string;
  isin?: string;
  assetClass: AssetClass;
  quantity: number;
  price: number;
  amount: number;
  currency: CurrencyCode;
  fees: number;
  tax: number;
  exchangeRate: number;
  amountBaseCurrency: number;
  referenceId?: string;
  notes?: string;
}

export interface PortfolioAggregation {
  positions: UnifiedPosition[];
  totalValue: number;
  totalCostBasis: number;
  totalUnrealizedPnl: number;
  totalUnrealizedPnlPct: number;
  allocation: AllocationBreakdown;
  performance: PerformanceMetrics;
  cashBalance: Map<CurrencyCode, number>;
  lastUpdated: number;
}

export interface AllocationBreakdown {
  byAssetClass: Map<AssetClass, AllocationSlice>;
  byCurrency: Map<CurrencyCode, AllocationSlice>;
  byPlatform: Map<PlatformId, AllocationSlice>;
  bySector?: Map<string, AllocationSlice>;
  byRegion?: Map<string, AllocationSlice>;
}

export interface AllocationSlice {
  value: number;
  percentage: number;
  costBasis: number;
  unrealizedPnl: number;
  count: number;
}

export interface PerformanceMetrics {
  twr: number;
  xirr: number;
  totalReturn: number;
  totalReturnPct: number;
  annualizedReturn?: number;
  volatility?: number;
  sharpeRatio?: number;
  maxDrawdown?: number;
  periodStart: string;
  periodEnd: string;
}

export interface CashFlow {
  date: string;
  amount: number;
  type: "contribution" | "withdrawal" | "dividend" | "interest" | "fee" | "tax";
  description: string;
}

export interface TimeWeightedReturnPoint {
  date: string;
  portfolioValue: number;
  cashFlows: CashFlow[];
  subPeriodReturn: number;
}

export interface XirrCashFlow {
  date: string;
  amount: number;
}

export interface ImportResult {
  success: boolean;
  positions: RawPosition[];
  transactions: RawTransaction[];
  errors: ImportError[];
  warnings: string[];
  platform: PlatformId;
  accountId?: string;
  importDate: number;
}

export interface ImportError {
  row: number;
  field?: string;
  message: string;
  severity: "error" | "warning";
  rawData?: Record<string, unknown>;
}

export interface PlatformAdapter {
  platform: PlatformId;
  name: string;
  supportedFormats: ("csv" | "xlsx" | "json")[];
  requiredColumns: PositionColumns | TransactionColumns;
  optionalColumns: string[];
  detectFormat: (headers: string[]) => boolean;
  parsePositions: (rows: Record<string, unknown>[]) => RawPosition[];
  parseTransactions: (rows: Record<string, unknown>[]) => RawTransaction[];
  normalizeSymbol: (symbol: string, raw: Record<string, unknown>) => string;
  normalizeCurrency: (currency: string) => CurrencyCode;
}

export interface PositionColumns {
  symbol: string[];
  name?: string[];
  isin?: string[];
  quantity: string[];
  averagePrice: string[];
  currency: string[];
  currentPrice?: string[];
  currentValue?: string[];
  unrealizedPnl?: string[];
  assetClass?: string[];
}

export interface TransactionColumns {
  date: string[];
  type: string[];
  symbol: string[];
  name?: string[];
  isin?: string[];
  quantity: string[];
  price: string[];
  amount: string[];
  currency: string[];
  fees?: string[];
  tax?: string[];
  exchangeRate?: string[];
  typeMapping: Record<string, TransactionType>;
}

export const DEFAULT_POSITION_COLUMNS: PositionColumns = {
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

export const DEFAULT_TRANSACTION_COLUMNS: TransactionColumns = {
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

export interface PortfolioStorage {
  version: number;
  encrypted: boolean;
  data: EncryptedPortfolioData | PortfolioAggregation;
  lastSync: number;
}

export interface EncryptedPortfolioData {
  iv: string;
  ciphertext: string;
  salt: string;
  algorithm: "AES-GCM";
  keyDerivation: "PBKDF2";
  iterations: number;
}