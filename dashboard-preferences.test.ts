import { describe, expect, it } from 'vitest';
import {
  DEFAULT_PANEL_ORDER,
  DEFAULT_PREFERENCES,
  isFavorite,
  loadPreferences,
  movePanel,
  resetPreferences,
  sanitizePreferences,
  savePreferences,
  toggleFavorite,
  type PanelId,
  type StorageLike,
} from './dashboard-preferences';

function memoryStorage(initial: Record<string, string> = {}): StorageLike & { data: Record<string, string> } {
  const data = { ...initial };
  return {
    data,
    getItem: (key: string) => (key in data ? data[key] : null),
    setItem: (key: string, value: string) => {
      data[key] = value;
    },
  };
}

describe('toggleFavorite', () => {
  it('añade un símbolo normalizado a mayúsculas', () => {
    expect(toggleFavorite([], 'btc')).toEqual(['BTC']);
  });

  it('quita un símbolo ya existente', () => {
    expect(toggleFavorite(['BTC', 'ETH'], 'btc')).toEqual(['ETH']);
  });

  it('ignora símbolos vacíos', () => {
    expect(toggleFavorite(['BTC'], '  ')).toEqual(['BTC']);
  });
});

describe('movePanel', () => {
  const order: PanelId[] = ['stats', 'heatmap', 'movers', 'table'];

  it('desplaza un panel hacia abajo', () => {
    expect(movePanel(order, 'stats', 1)).toEqual(['heatmap', 'stats', 'movers', 'table']);
  });

  it('desplaza un panel hacia arriba', () => {
    expect(movePanel(order, 'movers', -1)).toEqual(['stats', 'movers', 'heatmap', 'table']);
  });

  it('no mueve en los bordes', () => {
    expect(movePanel(order, 'stats', -1)).toEqual(order);
    expect(movePanel(order, 'table', 1)).toEqual(order);
  });

  it('no cambia el orden si el id no existe', () => {
    expect(movePanel(order, 'nope' as PanelId, 1)).toEqual(order);
  });
});

describe('isFavorite', () => {
  it('detecta un símbolo favorito sin importar mayúsculas', () => {
    expect(isFavorite(['BTC', 'GSPC'], 'btc')).toBe(true);
    expect(isFavorite(['BTC'], 'eth')).toBe(false);
  });
});

describe('sanitizePreferences', () => {
  it('devuelve valores por defecto ante entradas inválidas', () => {
    expect(sanitizePreferences(null)).toEqual({ ...DEFAULT_PREFERENCES, panelOrder: [...DEFAULT_PANEL_ORDER] });
    expect(sanitizePreferences('x')).toEqual({ ...DEFAULT_PREFERENCES, panelOrder: [...DEFAULT_PANEL_ORDER] });
    expect(sanitizePreferences({})).toEqual({ ...DEFAULT_PREFERENCES, panelOrder: [...DEFAULT_PANEL_ORDER] });
  });

  it('normaliza la watchlist (dedupe y mayúsculas)', () => {
    const prefs = sanitizePreferences({ watchlist: ['btc', 'BTC', 'eth', 42, null] });
    expect(prefs.watchlist).toEqual(['BTC', 'ETH']);
  });

  it('conserva valores válidos de tapePaused y activeTab', () => {
    const prefs = sanitizePreferences({ tapePaused: true, activeTab: 'alerts' });
    expect(prefs.tapePaused).toBe(true);
    expect(prefs.activeTab).toBe('alerts');
  });

  it('rechaza activeTab inválido', () => {
    const prefs = sanitizePreferences({ activeTab: 'hack' });
    expect(prefs.activeTab).toBe('overview');
  });

  it('solo acepta un panelOrder completo y válido', () => {
    const valid = sanitizePreferences({ panelOrder: ['table', 'movers', 'heatmap', 'stats'] });
    expect(valid.panelOrder).toEqual(['table', 'movers', 'heatmap', 'stats']);

    const incomplete = sanitizePreferences({ panelOrder: ['stats', 'stats'] });
    expect(incomplete.panelOrder).toEqual([...DEFAULT_PANEL_ORDER]);

    const invalid = sanitizePreferences({ panelOrder: ['nope', 'x', 'y', 'z'] });
    expect(invalid.panelOrder).toEqual([...DEFAULT_PANEL_ORDER]);
  });
});

describe('loadPreferences / savePreferences', () => {
  it('devuelve defaults si no hay datos', () => {
    const storage = memoryStorage();
    expect(loadPreferences(storage)).toEqual({ ...DEFAULT_PREFERENCES, panelOrder: [...DEFAULT_PANEL_ORDER] });
  });

  it('devuelve defaults si el JSON está corrupto', () => {
    const storage = memoryStorage({ 'gmt-dashboard-preferences-v1': '{corrupt' });
    expect(loadPreferences(storage).activeTab).toBe('overview');
  });

  it('carga preferencias guardadas', () => {
    const storage = memoryStorage({
      'gmt-dashboard-preferences-v1': JSON.stringify({ version: 1, watchlist: ['BTC'], tapePaused: true, activeTab: 'fx', panelOrder: ['table', 'stats', 'heatmap', 'movers'] }),
    });
    const prefs = loadPreferences(storage);
    expect(prefs.watchlist).toEqual(['BTC']);
    expect(prefs.tapePaused).toBe(true);
    expect(prefs.activeTab).toBe('fx');
    expect(prefs.panelOrder).toEqual(['table', 'stats', 'heatmap', 'movers']);
  });

  it('persiste las preferencias en storage', () => {
    const storage = memoryStorage();
    savePreferences({ ...DEFAULT_PREFERENCES, panelOrder: [...DEFAULT_PANEL_ORDER], watchlist: ['GSPC'] }, storage);
    expect(JSON.parse(storage.data['gmt-dashboard-preferences-v1']).watchlist).toEqual(['GSPC']);
  });
});

describe('resetPreferences', () => {
  it('devuelve preferencias por defecto con panelOrder clonado', () => {
    const prefs = resetPreferences();
    expect(prefs).toEqual({ ...DEFAULT_PREFERENCES, panelOrder: [...DEFAULT_PANEL_ORDER] });
    expect(prefs.panelOrder).not.toBe(DEFAULT_PANEL_ORDER);
  });
});