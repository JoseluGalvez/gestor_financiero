# Migración: InvalidationScheduler + VersionGuard en RealtimePortfolioApp

Hallazgo: **Realtime AUD-2026-03** — Suscripciones en tiempo real con `loadWorkspace()` sin coalescencia ni guard contra respuestas obsoletas.

## Resumen del cambio

Se reemplazó el bloque `useEffect` de suscripciones en `RealtimePortfolioApp.tsx` por un patrón basado en `InvalidationScheduler` + `VersionGuard` + cargadores segmentados por dominio.

### Antes (problemático)
- Cada evento `postgres_changes` invocaba `loadWorkspace()` entera.
- Sin coalescencia: ráfagas de cambios DB = N cargas simultáneas.
- Sin guard de versión: respuestas obsoletas podían sobrescribir estado reciente.

### Después
- Cada cambio → `domainForTable(table)` → `scheduler.invalidate(domain)`.
- `InvalidationScheduler` coalesca eventos en ventana de `REALTIME_COALESCE_MS = 300 ms`.
- `refreshDomainWithGuard` solo aplica parches si el dominio no tiene versión más reciente.
- `loadDomainData(domain)` carga **solo el fragmento** del dominio afectado.
- `scheduler.dispose()` limpia temporizador al desmontar o cambiar de organización.

## Archivos implicados

### 1. `src/lib/workspace-realtime-scheduler.ts` (NUEVO en repo)
- Mover desde la raíz del entorno standalone (`workspace-realtime-scheduler.ts`) a `src/lib/workspace-realtime-scheduler.ts`.
- Exporta: `InvalidationScheduler`, `VersionGuard`, `refreshDomainWithGuard`, `domainForTable`, tipo `Domain`.
- Incluir el test asociado `src/lib/workspace-realtime-scheduler.test.ts`.

### 2. `src/lib/supabase.ts` (EXISTENTE)
- Necesita exportar `useSupabase` hook si `RealtimePortfolioApp` lo importa desde `@/lib/supabase`. Verificar que exista.

### 3. `src/pages/RealtimePortfolioApp.tsx` (MODIFICADO)
- Nuevo bloque `useEffect`:
  ```tsx
  import { InvalidationScheduler, VersionGuard, refreshDomainWithGuard, domainForTable, type Domain } from "@/lib/workspace-realtime-scheduler";
  const REALTIME_COALESCE_MS = 300;
  ```
- `loadWorkspace()` → `loadDomainData(domain)` por fragmento.
- `handleChange(table)` → `domainForTable(table)` → `scheduler.invalidate(domain)`.
- Limpieza: `scheduler.dispose()` + `supabase.removeChannel(channel)`.

## Dominios mapeados

| Tabla DB | Dominio | Carga |
|---|---|---|
| `portfolio_snapshots` | `snapshots` | `portfolio_snapshots` |
| `market_quotes` | `quotes` | recarga `snapshots` (sin widget propio aún) |
| `alerts` | `alerts` | `alerts` |
| `data_sources` | `sources` | `data_sources` |
| `analysis_runs` | `analysis` | `analysis_runs` |
| `alert_rules` | `rules` | `alert_rules` |

## Pasos de integración en el repo principal

1. **Crear `src/lib/workspace-realtime-scheduler.ts`** con el contenido de `workspace-realtime-scheduler.ts` (entorno standalone).
2. **Crear `src/lib/workspace-realtime-scheduler.test.ts`** con el contenido de `workspace-realtime-scheduler.test.ts`.
3. **Mover/actualizar `RealtimePortfolioApp.tsx`** con el nuevo `useEffect` (ya refactorizado en el entorno standalone).
4. **Verificar que `@/lib/supabase` exporta `useSupabase`** (o ajustar el import).
5. **Ajustar alias de path** en `tsconfig.json`/`vite.config.ts` si `@/lib/*` no resuelve aún.
6. **Ejecutar `tsc --noEmit`** en el repo para confirmar que `RealtimePortfolioApp.tsx` compila.
7. **Ejecutar `npm test`** para confirmar los 98 tests del scheduler siguen verdes.
8. **Ejecutar `npm run build`** para confirmar build sin errores.

## Verificación local (entorno standalone)

- ✅ `npm test` → 98 tests pasan.
- ✅ `npm run build` → build sin errores.
- ⚠️ `RealtimePortfolioApp.tsx` no compila localmente (depende de deps del repo Next.js); se valida en el repo principal.

## Notas de seguridad

- El `VersionGuard` usa `Date.now()` como versión monótona; es monotonía por sesión, no global. Aceptable para evitar respuestas obsoletas dentro de una sesión de navegador.
- `dispose()` del scheduler elimina el `setTimeout` pendiente, evitando memory leaks al cambiar de organización o desmontar el componente.
- La coalescencia de 300 ms equilibra latencia y carga; ajustar si se detectan latencias perceptibles.
