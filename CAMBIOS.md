# Cambios — Protocolo Diario, Confluencia, Semáforo y Rutas de Perfil

**Fecha**: 2026-09-23
**Plan**: `PLAN_0923.md` (aprobado → ejecutado)
**Especificación**: `DATOS/Guia_de_inversion_2026.md` + transcripciones en `audio/`

---

## 1. Estado anterior de la aplicación

Portafolio Intel era una SPA (Vite + React + TypeScript) centrada en **análisis fundamental estático**:

- **Módulos**: Análisis Fundamental (formulario + 16 ratios + DCF + calidad contable), GMT Terminal, Cartera (placeholder), Comparativa de funcionalidades, Informe.
- **Datos**: SEC EDGAR (XBRL), ECB/Frankfurter, Stooq (OHLCV diario CSV), CoinGecko, Yahoo (proxy dev), Marketstack/ExchangeRates (con API key).
- **Infra**: IndexedDB cache con TTL, Zod, SWP + Workbox, SWR, 258 tests (vitest), build `tsc && vite` OK.
- **Lo que faltaba** (crítica de los audios `audio/*.transcripcion.md`):
  1. Sin **hoja de ruta por perfil** (fundamental vs cuant vs trader).
  2. Sin **semáforo operar vs estudiar** según la fuente de datos.
  3. Los indicadores técnicos vivían aislados: no había **confluencia** (jurado de indicadores).
  4. Sin **checklist diario tecnofundamental** (ROIC>WACC → volumen → Kelly).
  5. Sin ruta única de 3 pasos enlazando teoría ↔ software.

## 2. Estado actual

Nueva pestaña **«Protocolo Diario»** en la navegación principal, que integra los cuatro bloques:

| Módulo | Archivo | Qué hace |
|--------|---------|----------|
| Motor de confluencia | `financial-confluence.ts` | Jurado de 3 categorías: volatilidad (Bollinger + squeeze), momentum (RSI con juez MACD), volumen (ratio media 20d + OBV). Emite `buy` / `sell` / `wait` exigiendo ≥2 categorías convergentes. |
| Checklist diario §8 | `daily-protocol.ts` | 3 pasos en secuencia obligatoria: ① ROIC > WACC (%) → ② volumen ≥ 1,5× media 20d → ③ tamaño por ½ Kelly. Estados `ready` / `blocked` / `incomplete`. |
| Semáforo de datos §6 | `data-semaphore.ts` | Clasifica fuentes en 🟢 `operar` / 🟡 `estudiar` / 🔴 `solo-historico`. Catálogo guía (Finviz, StockCharts, TradingView, Yahoo) + reglas por adaptador de la app. |
| Rutas de perfil §1 | `profile-routes.ts` | Árbol A (fundamental 5-10a), B (cuant/algorítmico), C (trader activo/opciones). Persistencia en `localStorage`. |
| UI | `ProtocoloDiario.tsx` + CSS | Selector de perfil, panel semáforo, formulario checklist, carga OHLCV vía Stooq y panel de confluencia. |
| Integración | `App.tsx` | Union `AppView` + botón de nav + render condicional. |

**Tests nuevos**: 39 pruebas (`financial-confluence`, `daily-protocol`, `data-semaphore`, `profile-routes`).
**Total**: **297 tests pasan** · `npm run build` (tsc + vite + PWA) **OK**.

## 3. Cambios detallados y por qué

### 3.1 `financial-confluence.ts` + test (nuevo)
**Por qué**: La guía (§3) y los audios prohíben operar con un indicador aislado («nunca operes con un solo indicador»). El repo ya tenía `analyzeTechnical` (RSI, MACD, Bollinger) pero no emitía una señal única de decisión.

- `calculateVolumeMetrics()` — media 20d, ratio sesión/20d, OBV y su pendiente (no existían).
- `detectSqueeze()` — ancho actual de bandas vs. media de 20 ventanas (ratio < 0,6).
- `evaluateConfluence()` — regla del jurado: RSI extremo (≥70/≤30) solo cuenta si MACD confirma; squeeze solo cuenta si volumen ≥ 1,5×; se requieren ≥2 categorías en la misma dirección para `buy`/`sell`.
- **Por qué este diseño**: reproduce literalmente el patrón §3.2/§3.3 de la guía y evita señales de un solo indicador, que era la crítica principal de los audios.

### 3.2 `daily-protocol.ts` + test (nuevo)
**Por qué**: Los audios pedían un «checklist de 3 pasos» obligatorio cada mañana; la guía §8 lo formaliza. Sin secuencia, el usuario miraba gráficos antes de saber si la empresa creaba valor.

- Paso 1 `evaluateFundamentalGate` — ROIC y WACC en **porcentaje** (unidades explícitas para evitar la ambigüedad 0-1 vs % que hay en `company-fundamentals` CAPM).
- Paso 2 `evaluateVolumeGate` — ratio explícito o calculado desde OHLCV; ≥1,5× pasa, <1,5× falla («ruptura trampa»).
- Paso 3 `evaluateRiskGate` — reutiliza `analyzeKelly` / `formatKellyRecommendation` (½ Kelly).
- `evaluateDailyProtocol` — si el paso 1 falla, el sistema queda `blocked` aunque el resto pase: la secuencia es lógica, no solo cosmética.

### 3.3 `data-semaphore.ts` + test (nuevo)
**Por qué**: La guía §6 advierte que planes free (Finviz 15-20 min de retraso) son peligrosos para day trading. La app ya tenía `DataSourceStatus` pero solo para el panel GMT, sin traducirlo a «¿puedo operar con esto?».

- Catálogo estático `GUIDE_PLATFORM_SEMAPHORE` (Finviz 🔴, StockCharts 🔴, TradingView 🟡, Yahoo 🟡, ATAS/Sierra 🟢).
- `classifyAdapterUseCase()` — reglas por `DataSourceId`; cualquier `error`/`stale` degrada a `solo-historico`; `marketstack` solo es 🟢 si está `ok`.
- **Por qué mezclar guía + adaptadores**: el usuario necesita una vista única de todas las fuentes, internas y externas.

### 3.4 `profile-routes.ts` + test (nuevo)
**Por qué**: Los audios insisten en «no mezclar perfiles»: un inversor a 10 años no debería gastar tiempo en order flow, y un cuant no necesita screeners fundamental de 500 parámetros. El árbol A/B/C de la guía §1 no estaba en la UI.

- `INVESTOR_ROUTES` con prioridades, stack mínimo, énfasis del checklist y qué ignorar.
- Persistencia (`PROFILE_ROUTE_STORAGE_KEY`) con fallback seguro a A si el storage falla.

### 3.5 `ProtocoloDiario.tsx` (nuevo)
**Por qué**: concentrar los 4 bloques en una sola vista diaria evita saltar entre módulos. La carga Stooq permite evaluar confluencia con datos reales sin API key.

### 3.6 `App.tsx` (modificado)
- `AppView` += `'protocolo'`; botón «Protocolo Diario» en `moduleNav`; `{view === 'protocolo' && <ProtocoloDiario />}`.
- **Por qué**: patrón idéntico al resto de pestañas (GMT, Informe…), sin romper rutas existentes.

### 3.7 `styles.css` (modificado)
- Bloque `/* ====== PROTOCOLO DIARIO ====== */` al final: rutas, semáforo, checklist, pasos y confluencia con los tokens `--color-*` existentes.
- **Por qué**: seguir el sistema de diseño actual (sin añadir Tailwind ni otra lib) y no tocar estilos de otros módulos.

### 3.8 Fix de test (`daily-protocol.ts`)
- `metricValue` del paso 1 ahora muestra `+8.00 pp` en lugar de `8.00 pp` para diferenciales positivos (más legible; el test esperaba el `+`).

## 4. Comparación: antes vs. ahora

| Área | Antes | Ahora | Valor |
|------|-------|-------|-------|
| Decisión de compra | Subjetiva; ratios sueltos | Checklist de 3 pasos con estado global | Reduce errores de proceso |
| Indicadores técnicos | `analyzeTechnical` aislado | Jurado de confluencia con veredicto | Alineado con buenas prácticas (no un solo indicador) |
| Fuentes de datos | Solo estado GMT (`ok/error`) | Semáforo operar/estudiar/histórico + catálogo guía | Evita operar con datos retrasados |
| Perfil del usuario | Ruta única implícita | Rutas A/B/C explícitas y persistentes | Enfoca la atención en lo que importa por perfil |
| Carga de datos técnicos | Módulos sueltos | OHLCV Stooq → confluencia en la misma vista | Menos fricción |
| Cobertura de tests | 258 | **297** (+39) | Mayor confianza en regresiones |

**Mi valoración**: el salto cualitativo es real — la app pasó de *informar* a *guiar una decisión diaria*. La secuencia ROIC→volumen→Kelly y el jurado de confluencia son las piezas con más impacto porque codifican disciplina, no solo cálculos. El semáforo es sencillo pero evita el error más caro (operar con datos inadecuados).

**Limitaciones actuales (honestas)**:
- El OHLCV de confluencia es diario (Stooq); no usa el feed intradía de Marketstack.
- El semáforo de adaptadores usa un estado estático `boot` en la UI (no lee el runtime del GMT en vivo).
- El checklist no persiste entre sesiones (solo el perfil A/B/C).
- El choke de bundle (`index-*.js` ~709 kB) sigue por encima de 500 kB.

## 5. Futuras mejoras sugeridas

1. **Persistir el checklist diario** — guardar en `localStorage`/IndexedDB la última evaluación (fecha, ticker, veredicto) para historial de disciplina.
2. **Confluencia con Marketstack intradía** — sustituir Stooq diario por velas intradía cuando haya `MARKETSTACK_API_KEY`, para rutas B/C.
3. **Semáforo en vivo** — conectar `ProtocoloDiario` a los `DataSourceStatus` reales del GMT (evento/hook) en lugar del array estático `boot`.
4. **Code-splitting** — `React.lazy` para Protocolo/GMT/Cartera y reducir el chunk principal < 500 kB.
5. **Alertas cuando el jurado converge** — notificación Push cuando `evaluateConfluence` pase de `wait` a `buy`/`sell`.
6. **Comparativa sectorial (§7)** y **escenarios macro** — ya en el roadmap de `777.md`, complementarían el paso 1 fundamental.
7. **Tests E2E Playwright** — flujos: cargar perfil C → subir ROIC → ver bloqueo → cargar ticker → ver confluencia.
8. **Ajuste de umbrales por perfil** — perfil A podría relajar el paso 2 (largo plazo tolera menos urgencia de volumen); perfil C exigir ratio ≥ 2× opcional.

---

*Generado: 2026-09-23 · Estado: 297 tests ✅ · build ✅ · pestaña Protocolo Diario operativa*
