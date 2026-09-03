import { describe, expect, it } from 'vitest';
import { INFLUENTIAL_INVESTORS } from './influential-investors';

describe('INFLUENTIAL_INVESTORS', () => {
  it('contiene los cinco inversores esperados en orden', () => {
    expect(INFLUENTIAL_INVESTORS.map((i) => i.name)).toEqual([
      'Warren Buffett',
      'Jim Simons',
      'Michael Burry',
      'Stanley Druckenmiller',
      'Terry Smith',
    ]);
  });

  it('cada inversor tiene campos obligatorios no vacíos', () => {
    for (const investor of INFLUENTIAL_INVESTORS) {
      expect(investor.name.trim()).not.toBe('');
      expect(investor.firm.trim()).not.toBe('');
      expect(investor.philosophy.trim()).not.toBe('');
      expect(investor.whyFollow.trim()).not.toBe('');
      expect(investor.disclosureLabel.trim()).not.toBe('');
      expect(investor.disclosureCaveat.trim()).not.toBe('');
    }
  });

  it('cada enlace de divulgación es una URL http(s)', () => {
    for (const investor of INFLUENTIAL_INVESTORS) {
      expect(investor.disclosureUrl).toMatch(/^https?:\/\//);
      expect(investor.portfolioVisualizationUrl).toMatch(/^https?:\/\//);
    }
  });

  it('todas las advertencias de divulgación mencionan el alcance limitado', () => {
    for (const investor of INFLUENTIAL_INVESTORS) {
      expect(investor.disclosureCaveat.length).toBeGreaterThan(20);
    }
  });
});