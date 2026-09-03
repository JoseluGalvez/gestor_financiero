import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  domainForTable,
  InvalidationScheduler,
  refreshDomainWithGuard,
  VersionGuard,
  type Domain,
} from './workspace-realtime-scheduler';

afterEach(() => {
  vi.useRealTimers();
});

describe('domainForTable', () => {
  it('mapeia cada tabla al dominio correcto', () => {
    expect(domainForTable('portfolio_snapshots')).toBe('snapshots');
    expect(domainForTable('market_quotes')).toBe('quotes');
    expect(domainForTable('alerts')).toBe('alerts');
    expect(domainForTable('data_sources')).toBe('sources');
    expect(domainForTable('analysis_runs')).toBe('analysis');
    expect(domainForTable('alert_rules')).toBe('rules');
  });

  it('devuelve null para tablas desconocidas', () => {
    expect(domainForTable('transactions')).toBeNull();
    expect(domainForTable('')).toBeNull();
  });
});

describe('InvalidationScheduler', () => {
  it('coalesce diez eventos del mismo dominio en un único flush', () => {
    vi.useFakeTimers();
    const flushes: Domain[][] = [];
    const scheduler = new InvalidationScheduler({ coalesceMs: 100, flush: (d) => flushes.push(d) });

    for (let i = 0; i < 10; i++) scheduler.invalidate('snapshots');

    vi.advanceTimersByTime(99);
    expect(flushes).toEqual([]);

    vi.advanceTimersByTime(1);
    expect(flushes).toEqual([['snapshots']]);
    scheduler.dispose();
  });

  it('agrupa dominios distintos manteniendo el orden de inserción', () => {
    vi.useFakeTimers();
    const flushes: Domain[][] = [];
    const scheduler = new InvalidationScheduler({ coalesceMs: 50, flush: (d) => flushes.push(d) });

    scheduler.invalidate('alerts');
    scheduler.invalidate('quotes');
    scheduler.invalidate('alerts');

    vi.advanceTimersByTime(50);
    expect(flushes).toEqual([['alerts', 'quotes']]);
    scheduler.dispose();
  });

  it('no dispara el flush antes de que venza la ventana', () => {
    vi.useFakeTimers();
    const flush = vi.fn();
    const scheduler = new InvalidationScheduler({ coalesceMs: 200, flush });
    scheduler.invalidate('rules');
    vi.advanceTimersByTime(199);
    expect(flush).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(flush).toHaveBeenCalledTimes(1);
    scheduler.dispose();
  });

  it('dispose cancela el temporizador y limpia los pendientes', () => {
    vi.useFakeTimers();
    const flush = vi.fn();
    const scheduler = new InvalidationScheduler({ coalesceMs: 100, flush });
    scheduler.invalidate('alerts');
    scheduler.dispose();
    vi.advanceTimersByTime(1000);
    expect(flush).not.toHaveBeenCalled();
    expect(scheduler.hasPending()).toBe(false);
  });

  it('ignora invalidaciones posteriores a dispose', () => {
    vi.useFakeTimers();
    const flush = vi.fn();
    const scheduler = new InvalidationScheduler({ coalesceMs: 100, flush });
    scheduler.dispose();
    scheduler.invalidate('alerts');
    expect(scheduler.hasPending()).toBe(false);
    vi.advanceTimersByTime(1000);
    expect(flush).not.toHaveBeenCalled();
  });
});

describe('VersionGuard', () => {
  it('incrementa la versión por dominio de forma independiente', () => {
    const guard = new VersionGuard();
    expect(guard.begin('alerts')).toBe(1);
    expect(guard.begin('alerts')).toBe(2);
    expect(guard.begin('quotes')).toBe(1);
  });

  it('isCurrent solo acepta la versión vigente del dominio', () => {
    const guard = new VersionGuard();
    const v1 = guard.begin('snapshots');
    guard.begin('snapshots');
    expect(guard.isCurrent('snapshots', v1)).toBe(false);
    expect(guard.isCurrent('snapshots', guard.begin('snapshots'))).toBe(true);
  });

  it('reset reinicia un dominio o todos', () => {
    const guard = new VersionGuard();
    guard.begin('alerts');
    guard.begin('alerts');
    guard.begin('quotes');
    guard.reset('alerts');
    expect(guard.begin('alerts')).toBe(1);
    guard.reset();
    expect(guard.begin('quotes')).toBe(1);
  });
});

describe('refreshDomainWithGuard', () => {
  it('aplica el resultado solo si sigue siendo la versión vigente', async () => {
    const guard = new VersionGuard();
    const applied: string[] = [];

    let resolveFirst!: (v: string) => void;
    let resolveSecond!: (v: string) => void;
    const first = new Promise<string>((r) => (resolveFirst = r));
    const second = new Promise<string>((r) => (resolveSecond = r));

    const p1 = refreshDomainWithGuard(guard, 'alerts', () => first, (d) => applied.push(`first:${d}`));
    const p2 = refreshDomainWithGuard(guard, 'alerts', () => second, (d) => applied.push(`second:${d}`));

    resolveSecond('B');
    await p2;
    resolveFirst('A');
    await p1;

    expect(applied).toEqual(['second:B']);
  });

  it('aplica el resultado cuando la versión es la vigente', async () => {
    const guard = new VersionGuard();
    const applied: number[] = [];
    await refreshDomainWithGuard(guard, 'quotes', async () => 42, (d) => applied.push(d));
    expect(applied).toEqual([42]);
  });
});