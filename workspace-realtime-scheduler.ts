export type Domain = 'snapshots' | 'quotes' | 'alerts' | 'sources' | 'analysis' | 'rules';

export const DOMAINS: readonly Domain[] = ['snapshots', 'quotes', 'alerts', 'sources', 'analysis', 'rules'];

export const TABLE_TO_DOMAIN: Record<string, Domain> = {
  portfolio_snapshots: 'snapshots',
  market_quotes: 'quotes',
  alerts: 'alerts',
  data_sources: 'sources',
  analysis_runs: 'analysis',
  alert_rules: 'rules',
};

export function domainForTable(table: string): Domain | null {
  return TABLE_TO_DOMAIN[table] ?? null;
}

export type InvalidationSchedulerOptions = {
  coalesceMs: number;
  flush: (domains: Domain[]) => void;
};

export class InvalidationScheduler {
  private readonly pending = new Set<Domain>();
  private timer: ReturnType<typeof setTimeout> | null = null;
  private disposed = false;
  private readonly coalesceMs: number;
  private readonly flush: (domains: Domain[]) => void;

  constructor(options: InvalidationSchedulerOptions) {
    this.coalesceMs = options.coalesceMs;
    this.flush = options.flush;
  }

  invalidate(domain: Domain): void {
    if (this.disposed) return;
    this.pending.add(domain);
    if (this.timer !== null) return;
    this.timer = setTimeout(() => this.runFlush(), this.coalesceMs);
  }

  private runFlush(): void {
    this.timer = null;
    if (this.disposed) return;
    const domains = Array.from(this.pending);
    this.pending.clear();
    if (domains.length > 0) this.flush(domains);
  }

  hasPending(): boolean {
    return this.pending.size > 0;
  }

  dispose(): void {
    this.disposed = true;
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.pending.clear();
  }
}

export class VersionGuard {
  private readonly versions: Record<Domain, number> = {
    snapshots: 0,
    quotes: 0,
    alerts: 0,
    sources: 0,
    analysis: 0,
    rules: 0,
  };

  begin(domain: Domain): number {
    this.versions[domain] += 1;
    return this.versions[domain];
  }

  isCurrent(domain: Domain, version: number): boolean {
    return this.versions[domain] === version;
  }

  reset(domain?: Domain): void {
    if (domain) {
      this.versions[domain] = 0;
      return;
    }
    for (const d of DOMAINS) {
      this.versions[d] = 0;
    }
  }
}

export async function refreshDomainWithGuard<T>(
  guard: VersionGuard,
  domain: Domain,
  loader: () => Promise<T>,
  apply: (data: T) => void,
): Promise<void> {
  const version = guard.begin(domain);
  const data = await loader();
  if (guard.isCurrent(domain, version)) {
    apply(data);
  }
}