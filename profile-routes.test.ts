import { describe, expect, it } from 'vitest';
import {
  INVESTOR_ROUTES,
  PROFILE_ROUTE_STORAGE_KEY,
  getRouteById,
  loadProfileRoute,
  saveProfileRoute,
} from './profile-routes';

describe('profile-routes', () => {
  it('defines exactly three routes A, B and C', () => {
    expect(INVESTOR_ROUTES).toHaveLength(3);
    expect(INVESTOR_ROUTES.map((r) => r.id)).toEqual(['A', 'B', 'C']);
  });

  it('each route has stack, priorities and protocol emphasis', () => {
    for (const route of INVESTOR_ROUTES) {
      expect(route.stack.length).toBeGreaterThan(0);
      expect(route.priorities.length).toBeGreaterThan(0);
      expect(route.protocolEmphasis.length).toBeGreaterThan(0);
      expect(route.ignore.length).toBeGreaterThan(0);
    }
  });

  it('getRouteById returns route or null', () => {
    expect(getRouteById('B')?.title).toContain('cuant');
    expect(getRouteById('Z')).toBeNull();
  });

  it('loadProfileRoute falls back to A when storage empty', () => {
    const storage = { getItem: () => null };
    expect(loadProfileRoute(storage).id).toBe('A');
  });

  it('loadProfileRoute reads saved id', () => {
    const storage = { getItem: (k: string) => (k === PROFILE_ROUTE_STORAGE_KEY ? 'C' : null) };
    expect(loadProfileRoute(storage).id).toBe('C');
  });

  it('saveProfileRoute persists id', () => {
    const store = new Map<string, string>();
    const storage = {
      setItem: (k: string, v: string) => {
        store.set(k, v);
      },
    };
    saveProfileRoute(storage, 'B');
    expect(store.get(PROFILE_ROUTE_STORAGE_KEY)).toBe('B');
  });

  it('loadProfileRoute tolerates corrupted storage value', () => {
    const storage = { getItem: () => 'not-a-route' };
    expect(loadProfileRoute(storage).id).toBe('A');
  });
});
