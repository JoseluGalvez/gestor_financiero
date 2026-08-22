import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabasePublishableKey) {
  throw new Error("Falta la configuración pública de Supabase. Define NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.");
}

export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export type PortfolioSnapshot = {
  id: number;
  portfolio_id: string;
  organization_id: string;
  as_of: string;
  market_value: number;
  cost_basis: number;
  gain: number;
  return_pct: number | null;
  source_version: string;
};

export type PortfolioAlert = {
  id: string;
  organization_id: string;
  severity: "info" | "warning" | "critical";
  status: "open" | "acknowledged" | "resolved" | "suppressed";
  title: string;
  body: string;
  triggered_at: string;
};

export type PortfolioRecord = {
  id: string;
  organization_id: string;
  name: string;
  base_currency: string;
};

export type MembershipRecord = {
  organization_id: string;
  role: "owner" | "editor" | "viewer";
};
