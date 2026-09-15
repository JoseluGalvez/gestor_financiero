import useSWR from 'swr';
import type { EdgarTickerEntry, EdgarCompanyFacts, EdgarAdapterConfig } from '../../sec-edgar-adapter';

const EDGAR_TICKERS_URL = '/api/sec-www/files/company_tickers.json';
const SEC_DATA_BASE_URL = '/api/sec-data/api/xbrl';

function getEdgarConfig(): EdgarAdapterConfig | undefined {
  if (import.meta.env.DEV) {
    return {
      tickersUrl: EDGAR_TICKERS_URL,
      factsBaseUrl: SEC_DATA_BASE_URL,
    };
  }
  return undefined;
}

export function useEdgarTickers() {
  const config = getEdgarConfig();
  const key = config ? ['edgar-tickers', config.tickersUrl] : null;

  const { data, error, isLoading, mutate } = useSWR<EdgarTickerEntry[]>(
    key,
    async ([_, url]) => {
      const res = await fetch(url, { headers: { 'User-Agent': 'Portafolio-Intel contact@example.com' } });
      if (!res.ok) throw new Error(`SEC tickers: ${res.status} ${res.statusText}`);
      const raw = await res.json();
      const list: EdgarTickerEntry[] = [];
      for (const entry of Object.values(raw)) {
        if (entry && typeof entry === 'object' && 'cik_str' in entry && 'ticker' in entry) {
          list.push({
            cik: (entry as any).cik_str,
            ticker: (entry as any).ticker,
            title: (entry as any).title ?? '',
          });
        }
      }
      return list;
    },
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
      refreshInterval: 0,
    }
  );

  return { tickers: data, error, isLoading, mutate };
}

export function useEdgarCompanyFacts(cik: number | null, config?: EdgarAdapterConfig) {
  const key = cik ? ['edgar-facts', cik, config?.factsBaseUrl] : null;

  const { data, error, isLoading, mutate } = useSWR<EdgarCompanyFacts>(
    key,
    async ([_, cikNum, baseUrl]) => {
      const base = baseUrl ?? 'https://data.sec.gov/api/xbrl';
      const ua = config?.userAgent ?? 'Portafolio-Intel contact@example.com';
      const url = `${base}/companyfacts/CIK${String(cikNum).padStart(10, '0')}.json`;
      const res = await fetch(url, { headers: { 'User-Agent': ua, Accept: 'application/json' } });
      if (!res.ok) throw new Error(`SEC companyfacts: ${res.status} ${res.statusText}`);
      return res.json();
    },
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000,
      refreshInterval: 0,
    }
  );

  return { facts: data, error, isLoading, mutate };
}

export function useEdgarSearch(query: string, tickers: EdgarTickerEntry[] | undefined) {
  const { data } = useSWR<EdgarTickerEntry[]>(
    query.trim().length >= 1 && tickers ? ['edgar-search', query, tickers.length] : null,
    () => {
      const q = query.trim().toLowerCase();
      if (!tickers) return [];
      return tickers.filter(
        (entry) =>
          entry.ticker.toLowerCase().startsWith(q) ||
          entry.title.toLowerCase().includes(q)
      ).slice(0, 25);
    },
    {
      revalidateOnFocus: false,
      dedupingInterval: 0,
    }
  );

  return data ?? [];
}