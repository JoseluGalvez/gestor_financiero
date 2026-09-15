import type { SWRConfiguration } from 'swr';

export const swrConfig: SWRConfiguration = {
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  refreshInterval: 0,
  dedupingInterval: 30000,
  errorRetryCount: 3,
  errorRetryInterval: 1000,
  shouldRetryOnError: (error) => {
    if (error.status === 429) return true;
    if (error.status >= 500) return true;
    return false;
  },
  onError: (error, key) => {
    console.error('[SWR] Error fetching', key, error);
  },
  onSuccess: (_data, key) => {
    console.debug('[SWR] Success fetching', key);
  },
};

export const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    const error = new Error(`HTTP ${res.status}: ${res.statusText}`) as Error & { status: number };
    error.status = res.status;
    throw error;
  }
  return res.json();
};