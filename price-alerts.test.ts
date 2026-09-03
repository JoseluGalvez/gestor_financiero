import { describe, expect, it } from 'vitest';
import {
  alertConditionLabel,
  buildAlertSummary,
  createAlertId,
  evaluatePriceAlerts,
  type PriceAlert,
} from './price-alerts';
import type { Quote } from './market-adapters';

function quote(symbol: string, price: number): Quote {
  return {
    symbol,
    name: symbol,
    price,
    priceChange24hPct: null,
    priceChange1hPct: null,
    priceChange7dPct: null,
    marketCap: null,
    rank: null,
    volume24h: null,
    sparkline: [],
    assetClass: 'crypto',
    source: 'coingecko',
  };
}

function alert(overrides: Partial<PriceAlert>): PriceAlert {
  return {
    id: 'al_1',
    symbol: 'BTC',
    name: 'Bitcoin',
    condition: 'above',
    threshold: 90000,
    createdAt: 0,
    status: 'active',
    triggeredAt: null,
    triggeredPrice: null,
    ...overrides,
  };
}

describe('createAlertId', () => {
  it('genera identificadores con prefijo y únicos', () => {
    const a = createAlertId();
    const b = createAlertId();
    expect(a.startsWith('al_')).toBe(true);
    expect(a).not.toBe(b);
  });
});

describe('evaluatePriceAlerts', () => {
  it('dispara una alerta "above" cuando el precio cruza el umbral', () => {
    const result = evaluatePriceAlerts([alert({ condition: 'above', threshold: 90000 })], [quote('BTC', 91000)]);
    expect(result[0].status).toBe('triggered');
    expect(result[0].triggeredPrice).toBe(91000);
  });

  it('dispara una alerta "below" cuando el precio cae bajo el umbral', () => {
    const result = evaluatePriceAlerts([alert({ condition: 'below', threshold: 50000 })], [quote('BTC', 49000)]);
    expect(result[0].status).toBe('triggered');
    expect(result[0].triggeredPrice).toBe(49000);
  });

  it('no dispara si el precio no cruza el umbral', () => {
    const result = evaluatePriceAlerts([alert({ condition: 'above', threshold: 90000 })], [quote('BTC', 89000)]);
    expect(result[0].status).toBe('active');
    expect(result[0].triggeredAt).toBeNull();
  });

  it('mantiene el estado de las alertas ya disparadas o descartadas', () => {
    const triggered = alert({ status: 'triggered', triggeredAt: 123, triggeredPrice: 91000 });
    const dismissed = alert({ id: 'al_2', status: 'dismissed' });
    const result = evaluatePriceAlerts([triggered, dismissed], [quote('BTC', 95000)]);
    expect(result[0].status).toBe('triggered');
    expect(result[1].status).toBe('dismissed');
  });

  it('no cambia una alerta cuyo símbolo no tiene cotización', () => {
    const result = evaluatePriceAlerts([alert({ symbol: 'XYZ' })], [quote('BTC', 91000)]);
    expect(result[0].status).toBe('active');
  });

  it('ignora cotizaciones con precio no positivo', () => {
    const result = evaluatePriceAlerts([alert({ condition: 'below', threshold: 100 })], [quote('BTC', 0)]);
    expect(result[0].status).toBe('active');
  });
});

describe('buildAlertSummary', () => {
  it('cuenta activas y disparadas', () => {
    const summary = buildAlertSummary([
      alert({}),
      alert({ id: 'al_2', status: 'active' }),
      alert({ id: 'al_3', status: 'triggered' }),
      alert({ id: 'al_4', status: 'dismissed' }),
    ]);
    expect(summary.active).toBe(2);
    expect(summary.triggered).toBe(1);
  });
});

describe('alertConditionLabel', () => {
  it('devuelve etiqueta legible', () => {
    expect(alertConditionLabel('above')).toBe('por encima de');
    expect(alertConditionLabel('below')).toBe('por debajo de');
  });
});