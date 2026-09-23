import { describe, expect, it } from 'vitest';
import {
  GUIDE_PLATFORM_SEMAPHORE,
  buildFullSemaphore,
  buildSemaphoreList,
  classifyAdapterUseCase,
  isLevelOperational,
} from './data-semaphore';
import type { DataSourceStatus } from './market-adapters';

function status(overrides: Partial<DataSourceStatus> = {}): DataSourceStatus {
  return {
    id: 'marketstack',
    label: 'Marketstack',
    provenance: 'test',
    status: 'ok',
    lastUpdatedAt: Date.now(),
    latencyMs: 120,
    licenseScope: 'test',
    ...overrides,
  };
}

describe('data-semaphore', () => {
  describe('catálogo guía (§6)', () => {
    it('contains the four guide platforms with levels', () => {
      const ids = GUIDE_PLATFORM_SEMAPHORE.map((e) => e.id);
      expect(ids).toContain('finviz-free');
      expect(ids).toContain('stockcharts-free');
      expect(ids).toContain('tradingview-basic');
      expect(ids).toContain('yahoo-finance');
    });

    it('marks Finviz free as solo-historico (15-20 min delay)', () => {
      const finviz = GUIDE_PLATFORM_SEMAPHORE.find((e) => e.id === 'finviz-free')!;
      expect(finviz.level).toBe('solo-historico');
      expect(finviz.emoji).toBe('🔴');
      expect(finviz.reason).toContain('15-20');
    });

    it('marks TradingView basic as estudiar (2 indicator limit)', () => {
      const tv = GUIDE_PLATFORM_SEMAPHORE.find((e) => e.id === 'tradingview-basic')!;
      expect(tv.level).toBe('estudiar');
      expect(tv.emoji).toBe('🟡');
      expect(tv.reason).toContain('2 indicadores');
    });
  });

  describe('classifyAdapterUseCase (adaptadores de la app)', () => {
    it('marketstack ok is operar (intraday)', () => {
      const entry = classifyAdapterUseCase(status({ id: 'marketstack' }));
      expect(entry.level).toBe('operar');
      expect(entry.emoji).toBe('🟢');
      expect(entry.origin).toBe('adapter');
      expect(isLevelOperational(entry)).toBe(true);
    });

    it('sec-edgar ok is solo-historico (no quotes)', () => {
      const entry = classifyAdapterUseCase(status({ id: 'sec-edgar', label: 'SEC EDGAR' }));
      expect(entry.level).toBe('solo-historico');
      expect(entry.emoji).toBe('🔴');
    });

    it('ecb ok is solo-historico (daily fix)', () => {
      const entry = classifyAdapterUseCase(status({ id: 'ecb', label: 'ECB' }));
      expect(entry.level).toBe('solo-historico');
    });

    it('coingecko ok is estudiar (~60s delay)', () => {
      const entry = classifyAdapterUseCase(status({ id: 'coingecko', label: 'CoinGecko' }));
      expect(entry.level).toBe('estudiar');
      expect(entry.emoji).toBe('🟡');
    });

    it('error status always downgrades to solo-historico', () => {
      const entry = classifyAdapterUseCase(status({ id: 'marketstack', status: 'error', error: 'timeout' }));
      expect(entry.level).toBe('solo-historico');
      expect(entry.reason).toContain('timeout');
    });

    it('degraded marketstack is not operar', () => {
      const entry = classifyAdapterUseCase(status({ id: 'marketstack', status: 'degraded' }));
      expect(entry.level).not.toBe('operar');
    });
  });

  describe('buildSemaphoreList / buildFullSemaphore', () => {
    it('lists one entry per adapter', () => {
      const list = buildSemaphoreList([
        status({ id: 'marketstack' }),
        status({ id: 'sec-edgar' }),
      ]);
      expect(list).toHaveLength(2);
    });

    it('full semaphore merges guide and adapters without duplicate guide ids for adapters', () => {
      const full = buildFullSemaphore([status({ id: 'coingecko' })]);
      const guide = full.filter((e) => e.origin === 'guide');
      const adapters = full.filter((e) => e.origin === 'adapter');
      expect(adapters).toHaveLength(1);
      // coingecko no está en el catálogo guía → todos los guía permanecen
      expect(guide).toHaveLength(GUIDE_PLATFORM_SEMAPHORE.length);
      const ids = full.map((e) => e.id);
      expect(new Set(ids).size).toBe(ids.length);
    });
  });
});
