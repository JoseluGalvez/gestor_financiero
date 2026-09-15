import { z } from 'zod';

export const companyFundamentalsSchema = z.object({
  companyName: z.string().min(1, 'Company name is required'),
  asOf: z.string().min(1, 'As-of date is required'),
  currency: z.string().default('EUR'),
  sourceLabel: z.string().min(1, 'Source label is required'),
  pricePerShare: z.number().positive().optional().nullable(),
  sharesOutstanding: z.number().positive().optional().nullable(),
  marketCapitalization: z.number().positive().optional().nullable(),
  netIncome: z.number().positive().optional().nullable(),
  equity: z.number().positive().optional().nullable(),
  totalDebt: z.number().min(0).optional().nullable(),
  cashAndEquivalents: z.number().min(0).optional().nullable(),
  ebitda: z.number().positive().optional().nullable(),
  ebit: z.number().optional().nullable(),
  interestExpense: z.number().min(0).optional().nullable(),
  revenue: z.number().positive().optional().nullable(),
  costOfRevenue: z.number().min(0).optional().nullable(),
  freeCashFlow: z.number().optional().nullable(),
  taxRate: z.number().min(0).max(1).optional().nullable(),
  wacc: z.number().min(0).max(1).optional().nullable(),
  riskFreeRate: z.number().min(0).max(1).optional().nullable(),
  beta: z.number().min(0).optional().nullable(),
  marketRiskPremium: z.number().min(0).max(1).optional().nullable(),
  revenueSource: z.string().optional(),
  revenueForm: z.string().optional(),
  revenueFp: z.string().optional(),
  revenueFiled: z.string().optional(),
  netIncomeSource: z.string().optional(),
  netIncomeForm: z.string().optional(),
  netIncomeFp: z.string().optional(),
  netIncomeFiled: z.string().optional(),
});

export type CompanyFundamentalsFormData = z.infer<typeof companyFundamentalsSchema>;

export function validateCompanyFundamentalsInput(data: unknown): { success: true; data: CompanyFundamentalsFormData } | { success: false; errors: z.ZodError } {
  return companyFundamentalsSchema.safeParse(data) as any;
}

export const cikSchema = z.object({
  cik: z.number().int().positive(),
});

export const tickerSchema = z.object({
  ticker: z.string().min(1, 'Ticker is required'),
  name: z.string().optional(),
});

export const formFieldSchema = z.object({
  key: z.string(),
  value: z.union([z.string(), z.number(), z.null(), z.undefined()]),
  error: z.string().optional(),
});

export function validateFormField(input: { key: string; value: string | number | null; error?: string }) {
  return formFieldSchema.safeParse(input);
}

export const portfolioPositionSchema = z.object({
  symbol: z.string().min(1, 'Symbol is required'),
  name: z.string().optional(),
  platform: z.string().min(1, 'Platform is required'),
  quantity: z.number().min(0, 'Quantity must be non-negative'),
  buyPrice: z.number().min(0, 'Buy price must be non-negative'),
  sellPrice: z.number().min(0, 'Sell price must be non-negative').optional().nullable(),
  buyDate: z.string().datetime().optional().nullable(),
  sellDate: z.string().datetime().optional().nullable(),
  commission: z.number().min(0).optional().default(0),
  fees: z.number().min(0).optional().default(0),
  status: z.enum(['open', 'closed', 'pending']).default('open'),
});

export type PortfolioPosition = z.infer<typeof portfolioPositionSchema>;

export function validatePortfolioPosition(data: unknown) {
  return portfolioPositionSchema.safeParse(data);
}