export type TabId = 'overview' | 'fx' | 'alerts' | 'watchlist';

export const VALID_TABS: readonly TabId[] = ['overview', 'fx', 'alerts', 'watchlist'];

export const OVERVIEW_PANELS = ['stats', 'heatmap', 'movers', 'table'] as const;

export type PanelId = (typeof OVERVIEW_PANELS)[number];

export type DashboardPreferences = {
  version: 1;
  watchlist: string[];
  tapePaused: boolean;
  activeTab: TabId;
  panelOrder: PanelId[];
};

export const DEFAULT_PANEL_ORDER: PanelId[] = ['stats', 'heatmap', 'movers', 'table'];

export const DEFAULT_PREFERENCES: DashboardPreferences = {
  version: 1,
  watchlist: [],
  tapePaused: false,
  activeTab: 'overview',
  panelOrder: [...DEFAULT_PANEL_ORDER],
};

export const PREFERENCES_STORAGE_KEY = 'gmt-dashboard-preferences-v1';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function normalizeSymbols(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const symbols = value
    .filter((s): s is string => typeof s === 'string')
    .map((s) => s.trim().toUpperCase())
    .filter((s) => s.length > 0);
  return Array.from(new Set(symbols));
}

export function sanitizePreferences(value: unknown): DashboardPreferences {
  const base: DashboardPreferences = { ...DEFAULT_PREFERENCES, panelOrder: [...DEFAULT_PANEL_ORDER] };

  if (!isRecord(value)) return base;

  base.watchlist = normalizeSymbols(value.watchlist);

  if (typeof value.tapePaused === 'boolean') {
    base.tapePaused = value.tapePaused;
  }

  if (typeof value.activeTab === 'string' && (VALID_TABS as readonly string[]).includes(value.activeTab)) {
    base.activeTab = value.activeTab as TabId;
  }

  if (Array.isArray(value.panelOrder)) {
    const order = value.panelOrder.filter((p): p is PanelId => typeof p === 'string' && (OVERVIEW_PANELS as readonly string[]).includes(p)) as PanelId[];
    const deduped = Array.from(new Set(order));
    if (deduped.length === OVERVIEW_PANELS.length) {
      base.panelOrder = deduped;
    }
  }

  return base;
}

export function loadPreferences(storage: StorageLike = defaultStorageLike()): DashboardPreferences {
  try {
    const raw = storage.getItem(PREFERENCES_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_PREFERENCES, panelOrder: [...DEFAULT_PANEL_ORDER] };
    return sanitizePreferences(JSON.parse(raw));
  } catch {
    return { ...DEFAULT_PREFERENCES, panelOrder: [...DEFAULT_PANEL_ORDER] };
  }
}

export function savePreferences(preferences: DashboardPreferences, storage: StorageLike = defaultStorageLike()): void {
  try {
    storage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(preferences));
  } catch {
    /* almacenamiento no disponible */
  }
}

export type StorageLike = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
};

function defaultStorageLike(): StorageLike {
  if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') {
    return { getItem: () => null, setItem: () => undefined };
  }
  return window.localStorage;
}

export function toggleFavorite(watchlist: string[], symbol: string): string[] {
  const s = symbol.trim().toUpperCase();
  if (!s) return watchlist;
  return watchlist.includes(s) ? watchlist.filter((x) => x !== s) : [...watchlist, s];
}

export function movePanel(panelOrder: PanelId[], id: PanelId, direction: -1 | 1): PanelId[] {
  const index = panelOrder.indexOf(id);
  const target = index + direction;
  if (index < 0 || target < 0 || target >= panelOrder.length) {
    return panelOrder;
  }
  const next = [...panelOrder];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

export function isFavorite(watchlist: string[], symbol: string): boolean {
  return watchlist.includes(symbol.trim().toUpperCase());
}

export function resetPreferences(): DashboardPreferences {
  return { ...DEFAULT_PREFERENCES, panelOrder: [...DEFAULT_PANEL_ORDER] };
}