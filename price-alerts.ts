import type { Quote } from './market-adapters';

export type AlertCondition = 'above' | 'below';

export type PriceAlert = {
  id: string;
  symbol: string;
  name: string;
  condition: AlertCondition;
  threshold: number;
  createdAt: number;
  status: 'active' | 'triggered' | 'dismissed';
  triggeredAt: number | null;
  triggeredPrice: number | null;
};

export function createAlertId(): string {
  return `al_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function evaluatePriceAlerts(alerts: PriceAlert[], quotes: Quote[]): PriceAlert[] {
  const quotesBySymbol = new Map<string, Quote>();
  for (const q of quotes) {
    if (q.price > 0) quotesBySymbol.set(q.symbol.toUpperCase(), q);
  }

  return alerts.map((alert) => {
    if (alert.status !== 'active') return alert;
    const quote = quotesBySymbol.get(alert.symbol.toUpperCase());
    if (!quote) return alert;

    const crossed =
      alert.condition === 'above' ? quote.price >= alert.threshold : quote.price <= alert.threshold;

    if (!crossed) return alert;

    return {
      ...alert,
      status: 'triggered' as const,
      triggeredAt: Date.now(),
      triggeredPrice: quote.price,
    };
  });
}

export function buildAlertSummary(alerts: PriceAlert[]): { active: number; triggered: number } {
  return {
    active: alerts.filter((a) => a.status === 'active').length,
    triggered: alerts.filter((a) => a.status === 'triggered').length,
  };
}

export function alertConditionLabel(condition: AlertCondition): string {
  return condition === 'above' ? 'por encima de' : 'por debajo de';
}