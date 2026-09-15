# PLAN_4.md - Plan de Ejecución Detallado: Portafolio Intel

**Fecha:** 18 Agosto 2026  
**Estado Actual:** MVP funcional (13 rutas, 16 tests, build limpio).  
**Objetivo:** Ejecutar las fases restantes sin ambigüedades, concretando cada tarea con archivos, tipos y criterios de aceptación.  
**Modo Analysis Module:** Quedará para Phase 8 (ver sección 8.7).  

---

## 1. Problemas Críticos Identificados en PLAN_3.md (Solucionados en PLAN_4)

| Categoría | Fallo Detectado | Impacto |
|-----------|-----------------|---------|
| **Arquitectura** | Falta especificación de RLS policies por tabla | Riesgo multi-tenant |
| **Seguridad** | Sin estrategia CSRF, CORS, rate limiting, HSTS | Vulnerable producción |
| **Testing** | Sin criterios de aceptación por test, sin test data factories | Regresiones no detectadas |
| **Diseño** | Sin tokens de diseño formales, sin estados vacíos/loading/error | Inconsistencia UI |
| **Performance** | Sin estrategia de caching, virtual scrolling, bundle budget | No escala >500 filas |
| **Ops** | Sin backup/DR, CI/CD pipeline, monitorización | Despliegues manuales riesgoso |
| **Documentación** | Sin API docs (OpenAPI), sin Storybook, sin ADRs ubicados | Equipo pierde contexto |

> **Nota:** Cada tarea en PLAN_4.md incluye: ID, descripción, archivos afectados, tipos/interfaces, y criterios de aceptación (AC) concretos.

---

## 2. Principios Rectores

1. **Security First:** Autenticación, RLS, validación Zod, CSP, rate limiting son responsabilidad de cada fase, no opcionales.
2. **Type-Safety End-to-End:** TypeScript estricto, tipos compartidos client/server via Zod schemas.
3. **Server-First:** Server Components por defecto (ADR-001), Server Actions para mutaciones (ADR-002).
4. **Testing Pyramid:** 70% unit tests (lib/), 20% integration (MSW), 10% e2e (Playwright critical paths).
5. **Incremental Delivery:** Cada fase entrega valor independiente y reversible.
6. **Performance Budgets:** CI gates con Lighthouse budgets explícitos.
7. **Accessibility Mandatory:** axe-core CI gate 0 violations AA en todas las rutas.

---

## 3. Arquitectura Objetivo (Post-PLAN_4)

```
portfolio-dashboard/
├── src/
│   ├── app/                        # App Router: Server Components por defecto
│   │   ├── layout.tsx              # Providers + Session + QueryClient + Toaster
│   │   ├── page.tsx                # Redirect /dashboard
│   │   ├── dashboard/              # Módulo A: Server Components + selectors
│   │   ├── p2p/                    # Módulo B: TanStack Table + Server Actions
│   │   ├── ronvariable/            # Módulo C: Charts + Server Components
│   │   ├── calendar/               # Calendario: ISR + Heatmap
│   │   ├── tax/                    # Tax Tracker: Server Actions + FIFO
│   │   ├── rebalance/              # Rebalanceo: Server Actions + targets editables
│   │   ├── integrations/           # Plaid/Tink: Client + Webhooks
│   │   ├── currencies/             # Multi-divisa: Server Components
│   │   ├── analysis/               # Phase 8: UI scores (readonly)
│   │   ├── (auth)/                 # Route group: login, register, callback
│   │   └── (dashboard)/            # Route group: protected routes
│   ├── components/
│   │   ├── ui/                     # Primitivas Radix UI: Select, Dialog, Tooltip, Popover
│   │   ├── layout/                 # Sidebar, Header, Breadcrumbs
│   │   ├── tables/                 # DataTable (TanStack wrapper) con virtualization
│   │   ├── charts/                 # ChartWrapper (Recharts) + temas centralizados
│   │   ├── forms/                  # React Hook Form + Zod wrappers
│   │   └── feedback/               # Toast, Alert, Skeleton, EmptyState
│   ├── lib/
│   │   ├── db/                     # Supabase client (server/client), helpers tipados
│   │   ├── auth/                   # NextAuth v5 config + permissions middleware
│   │   ├── calculations/           # TS wrappers → WASM (tir, xirr, rebalance, fx)
│   │   ├── validations/            # Zod schemas (shared client/server)
│   │   ├── hooks/                  # usePortfolio, useP2P, useTax, useRebalance
│   │   ├── utils/                  # formatters, date, currency, cn
│   │   └── constants/              # Asset classes, risk levels, countries, FX rates
│   ├── types/
│   │   ├── database/               # Tipos generados Supabase (Database type)
│   │   ├── analysis/               # Types del módulo análisis (Phase 8)
│   │   └── shared/                 # Tipos compartidos entre client/server
│   ├── styles/
│   │   └── tokens.css              # Tailwind v4 tokens: colores, fuentes, espacios
│   └── hooks/                      # hooks personalizados por módulo
├── supabase/
│   ├── migrations/                 # SQL versionadas (schema + RLS + functions)
│   └── seed.sql                    # Datos de dev (5 usuarios, mock dados)
├── tests/
│   ├── unit/                       # Vitest + RTL: lib/ utils, hooks, components puros
│   ├── integration/                # MSW + Vitest: flujos API → DB
│   └── e2e/                        # Playwright: paths críticos
├── .github/workflows/
│   ├── ci.yml                      # lint + typecheck + test + build
│   └── cd.yml                      # Deploy Vercel con rollback
└── package.json
```

---

## 4. Plan de Fases Detallado

### Phase 0: Fundaciones (Semana 0) — Configuración y Herramientas
**Objetivo:** Establecer base limpia, herramientas y convenios.

| ID | Tarea | Descripción Concreta | Archivos | Tipos/Interfaces | Criterios de Aceptación (AC) |
|----|-------|---------------------|----------|------------------|-------------------------------|
| **0.1** | Configurar ESLint strict | `eslint.config.mjs` con `no-unchecked-indexed-access`, `exactOptionalPropertyTypes`, `no-implicit-returns`, `style/jsx-no-literals` | `eslint.config.mjs` | `EslintConfig` | `pnpm lint` pasa sin warnings |
| **0.2** | Configurar TypeScript strict | `tsconfig.json` con `strict: true`, `noImplicitAny: true`, `exactOptionalPropertyTypes: true`, `noUncheckedIncrement: true` | `tsconfig.json` | `TSConfig` | `npx tsc --noEmit` 0 errors |
| **0.3** | Instalar y configurar MSW | `src/setupTests.ts` con MSW browser; `src/mocks/` con handlers para API Routes | `src/mocks/`, `src/setupTests.ts` | `MSWContext` | `MSW intercepta` todas las API Routes en vitest |
| **0.4** | Configurar Vitest + cobertura | `vitest.config.ts` con `coveragereporter`; exclude `/node_modules`, `/.next` | `vitest.config.ts` | `ViteConfig` | `pnpm test:coverage` reporte HTML generado |
| **0.5** | Configurar Tailwind v4 tokens | `src/styles/tokens.css` con `--color-background`, `--color-card`, `--color-accent`, `--font-inter` | `src/styles/tokens.css` | `CSSCustomProperties` | Tokens usados en globals.css vía `@theme` |
| **0.6** | Configurar git hooks (husky) | `package.json` scripts `prepare`; `husky.config.cjs` para lint pre-commit | `package.json` | `HuskyConfig` | `git commit` solo si `pnpm lint` pasa |

**Deliverable Phase 0:** Repositorio con herramientas configuradas, `pnpm lint` y `pnpm typecheck` 0 errores.

---

### Phase 1: Backend Real — Supabase + Auth + API (Semana 1)

| ID | Tarea | Descripción Concreta | Archivos | Tipos/Interfaces | Criterios de Aceptación (AC) |
|----|-------|---------------------|----------|------------------|-------------------------------|
| **1.1** | Crear proyecto Supabase | Nueva project en supabase.io; `schema.sql` importado; RLS enabled; `supabase gen types typescript --project-url $SUPABASE_PROJECT_URL --anon-key $SUPABASE_ANON_KEY` | `supabase/migrations/001_schema.sql`, `supabase/seed.sql`, `src/lib/db/supabase.ts` | `Database` (generated) | Tipos generados en `types/supabase.ts` sin errores |
| **1.2** | Definir RLS policies por tabla | Políticas para: `users`, `portfolios`, `assets`, `p2p_loans`, `dividends`, `cashflow_projections`, `asset_allocation_targets`, `exchange_rates`, `transactions` | `supabase/migrations/002_rls_policies.sql` | `RLSPolicy` | `SELECT`/`INSERT`/`UPDATE`/`DELETE` respetan `user_id` own-row only |
| **1.3** | NextAuth v5 configuración | `src/app/(auth)/layout.tsx` con providers: email/password, Google, Apple; JWT session; middleware protección rutas `(dashboard)/*` | `src/app/(auth)/layout.tsx`, `src/app/(auth)/route.ts`, `src/middleware.ts` | `NextAuthConfig`, `SessionUser` | Login flow funciona; rutas `(dashboard)` redirigen si no autenticado |
| **1.4** | API Routes base con Zod | `/api/assets` (GET/POST), `/api/p2p` (GET con filters), `/api/transactions` (GET/FIFO engine) con validación Zod + Supabase client | `src/app/api/assets/route.ts`, `src/app/api/p2p/route.ts`, `src/app/api/transactions/route.ts`, `src/lib/validations/zod-schemas.ts` | `ZodAssetSchema`, `ZodP2PSchema`, `ZodTransactionSchema` | `pnpm test` pasa para API Routes; filtros server-side funcionan |
| **1.5** | Reemplazar mock-data → Server Components | `dashboard/page.tsx` migrado a `async` Server Component con `supabase.from('portfolios').select('*')`; `revalidateTag('portfolio')` | `src/app/dashboard/page.tsx`, `src/lib/db/helpers.ts` | `PortfolioData`, `PortfolioKPIs` | Dashboard muestra datos reales de Supabase; datos frescos cada 60s |

**Deliverable Phase 1:** App funcional con auth, DB real, API tipadas, 0 mock-data en runtime.

---

### Phase 2: State Management & Data Layer (Semana 1-2)

| ID | Tarea | Descripción Concreta | Archivos | Tipos/Interfaces | Criterios de Aceptación (AC) |
|----|-------|---------------------|----------|------------------|-------------------------------|
| **2.1** | Crear hooks personalizados | `usePortfolio()`, `useP2P()`, `useTax()`, `useRebalance()`, `useCurrencies()` — cada uno `return` de `useQuery`/`useMutation` de TanStack Query | `src/lib/hooks/*.ts` | `UsePortfolioReturn`, `UseP2PReturn`, etc. | Hooks funcionan en Server/Client Components; cache dedup works |
| **2.2** | Crear helpers de base de datos | `src/lib/db/helpers.ts` con funciones: `getAssets()`, `getP2PLoans()`, `getTaxScenarios()`, `calculateFIFO()` | `src/lib/db/helpers.ts` | `getAssetsReturn`, `getP2PLoansReturn`, etc. | Helpers encapsulan lógica Supabase; tipados completos |
| **2.3** | Crear constantes compartidas | `src/lib/constants.ts` con: `ASSET_CLASSES`, `RISK_LEVELS`, `COUNTRIES`, `FX_RATES_BASE` (EUR/USD/GBP) | `src/lib/constants.ts` | `AssetClass`, `RiskLevel`, `Country` | Usados en formularios, filtros, validaciones; un solo source of truth |
| **2.4** | Configurar TanStack Query client | `src/app/layout.tsx` con `<QueryClientProvider>`; `staleTime: 300`, `cacheTime: 600`; `refetchOnWindowFocus: false` | `src/app/layout.tsx`, `src/providers.tsx` | `QueryClientConfig` | Query client inicializado en todas las rutas |

**Deliverable Phase 2:** Capa de data funcional con hooks y helpers tipados.

---

### Phase 3: Design System & UI Primitives (Semana 2)

| ID | Tarea | Descripción Concreta | Archivos | Tipos/Interfaces | Criterios de Aceptación (AC) |
|----|-------|---------------------|----------|------------------|-------------------------------|
| **3.1** | Crear tema Recharts centralizado | `src/lib/chart-theme.ts` con `chartTheme` object: colores semánticos, grid, tooltip, leyenda; exportar `ResponsiveContainer` configurado | `src/lib/chart-theme.ts`, `src/components/charts/ChartWrapper.tsx` | `ChartTheme`, `ThemeColors` | Todos los gráficos usan `ChartWrapper` con tema; dark mode ready (solo light por ahora) |
| **3.2** | Crear primitivas UI Radix | `src/components/ui/` con: `Select`, `Dialog`, `Tooltip`, `Popover`, `Badge`, `Label` — todos con `cn` helper y Tailwind v4 classes | `src/components/ui/*.tsx` | `SelectProps`, `DialogProps`, etc. | Primitivas accesibles (ARIA), consistentes con tokens, importables en cualquier componente |
| **3.3** | Crear estados vacíos y loading | `src/components/ui/EmptyState.tsx`, `Skeleton.tsx`, `LoadingSpinner.tsx` — todos con variants y sizes | `src/components/ui/EmptyState.tsx`, etc. | `EmptyStateProps`, `SkeletonProps` | Mostrados cuando data está pending/error/vacia; consistencia visual |
| **3.4** | Migrar HTML tables → TanStack Table | Reemplazar tables en `/p2p`, `/tax`, `/rebalance` con `DataTable` TanStack + `useReactTable` + virtualización `@tanstack/react-virtual` | `src/components/tables/DataTable.tsx`, `src/app/p2p/page.tsx`, `src/app/tax/page.tsx`, `src/app/rebalance/page.tsx` | `ColumnDef`, `TableProps` | Tables: sorting, filtering, pagination, export CSV funcionan; virtualization para >100 filas |
| **3.5** | Crear componente ChartWrapper | Wrapper base que envuelve cualquier chart Recharts con `chartTheme`, `ResponsiveContainer`, `Tooltip`, `Legend` consistente | `src/components/charts/ChartWrapper.tsx` | `ChartWrapperProps` | Cualquier chart usa `<ChartWrapper>`; consistencia visual en módulos |

**Deliverable Phase 3:** Sistema de diseño coherente, tables enterprise, charts con tema unificado.

---

### Phase 4: Module Enhancements (Semanas 2-4) — P2P, Portfolio, Calendar, Tax, Rebalance, Currencies

| ID | Módulo | Tarea | Descripción Concreta | Archivos | AC |
|----|--------|-------|---------------------|----------|-----|
| **4.1** | **P2P (Modulo B)** | Implementar BarChart Recharts reales (no listas estáticas) | `src/components/charts/PPBarChart.tsx`, `src/app/p2p/page.tsx` | `PPBarChartProps` | BarChart con datos dinámicos Recharts; tooltips, legend, responsive |
| **4.2** | **P2P** | Agregar filtros múltiples server-side (estado/país/riesgo) | `src/app/p2p/page.tsx` con `useP2P()` + filtros debounced → query params | `useP2PReturn` | Filtros aplican en Supabase `.filter()`; URL shareable con params |
| **4.3** | **P2P** | Badges de estado con colores semánticos (verde corriente, amarillo mora, rojo impago) | `src/components/ui/Badge.tsx` + `src/app/p2p/page.tsx` | `BadgeStatus` | Badges renderizan colores correctos según estado loan |
| **4.4** | **P2P** | Botón "Vender" por fila → Server Action | `src/app/p2p/actions.ts` con `sellLoan()` que actualiza estado y recalcula KPIs | `sellLoan` mutation | Vendor flow: actualiza BD, recalcula KPIs, muestra toast success |
| **4.5** | **Portfolio (Modulo A)** | ÁreaChart evolución valor total (1M/3M/1A/YTD/All) con selector rango temporal | `src/app/dashboard/page.tsx` con `AreaChart` Recharts + `chartTheme` | `AreaChartProps` | AreaChart muestra evolución; selector cambia rango y datos se re-fetch |
| **4.6** | **Portfolio** | Selector de usuario (consolidado + 5 users) recalcula KPIs, Donut y panel de rebalanceo | `src/components/SelectorUsuario.tsx` + `src/app/dashboard/page.tsx` | `SelectorUserItem` | Dropdown tiene 6 opciones (consolidado + 5 users); KPIs se recalculan en vivo |
| **4.7** | **Calendar** | HeatmapCalendar estilo GitHub para dividendos/cupones + BarChart proyección 6 meses | `src/components/charts/HeatmapCalendar.tsx`, `src/app/calendar/page.tsx` | `HeatmapCalendarProps` | Heatmap muestra flujo mes a mes; BarChart proyección con datos deterministas |
| **4.8** | **Tax** | Implementar FIFO engine con escenarios venta (100%/50%/25%) | `src/lib/calculations/fifo.ts` + `src/app/tax/actions.ts` | `FIFOResult`, `TaxScenario` | FIFO calcula costo base correcto; escenarios muestran plusvalías/minusvalías + impuesto 19% |
| **4.9** | **Tax** | Badges semánticos: éxito/atención/alerta según plusvalía neta | `src/components/ui/Badge.tsx` + `src/app/tax/page.tsx` | `TaxBadgeStatus` | Badges según rango: verde (<5k), amarillo (5k-50k), rojo (>50k) |
| **4.10** | **Rebalanceo** | Targets editables (%) → cálculo BUY/SELL/HOLD con lista órdenes recomendadas | `src/app/rebalance/page.tsx` con formulario editables + `calculateRebalance()` | `RebalanceTarget`, `RebalanceOrder` | Cálculo: si target actual < target objetivo → BUY; si > → SELL; HOLD si dentro de umbral |
| **4.11** | **Rebalanceo** | Persistencia de targets en Supabase por usuario | `supabase.from('asset_allocation_targets').upsert()` + `revalidatePath('/rebalance')` | `AssetAllocationTarget` | Targets se guardan y persisten entre sesiones |
| **4.12** | **Multi-divisa** | Separar retorno activo vs FX para USD/EUR/GBP activos | `src/lib/calculations/fx.ts` con tipos de cambio históricos | `FXRate`, `CurrencyResult` | Retorno = retorno activo + retorno divisa; tipos de cambio vienen de `exchange_rates` tabla |
| **4.13** | **Integraciones** | Scaffolding Plaid/Tink: `/integrations` page con link_token flow setup | `src/app/integrations/page.tsx`, `src/lib/integrations/plaid.ts` (mock) | `PlaidLinkConfig` | Page muestra botón "Connect Bank"; flow genera link_token mock |

**Deliverable Phase 4:** Todos los módulos con UI mejorada, cálculos reales, interacciones completas.

---

### Phase 5: Performance, PWA & Observability (Semana 4)

| ID | Tarea | Descripción Concreta | Archivos | AC |
|----|-------|---------------------|----------|-----|
| **5.1** | Code splitting lazy loading | `dynamic()` import para módulos pesados: `/p2p`, `/tax`, `/rebalance`, `/charts`; `Suspense` boundaries en layout | `src/app/dashboard/page.tsx`, `src/app/p2p/page.tsx` | `dynamic()` returns `Promise<Component>` | Bundle inicial < 100KB gz; módulos cargan bajo demanda |
| **5.2** | ISR + Revalidate Tags | `revalidateTag('portfolio')`, `revalidateTag('p2p')`, `revalidateTag('tax')` en mutations; `next/cache` tags | `src/app/dashboard/actions.ts`, etc. | `revalidateTag` calls | Datos frescos sin SSR costoso; invalidación granular por tag |
| **5.3** | PWA: next-pwa | `next-pwa` con Workbox: service worker, manifest, offline fallback, install prompt | `next.config.ts` con `pwa` config; `public/manifest.json` | `PWAConfig` | Lighthouse PWA score > 90; offline page servida cuando sin red |
| **5.4** | Optimización assets | `next/image` para avatares/logos; `next/font` Inter; `AVIF/WebP` formats; `script` loading strategy `beforeInteractive` | `src/components/ui/Avatar.tsx`, `src/app/assets/` | `next/image` props | LCP < 2.5s en dashboard; CLS < 0.1 |
| **5.5** | Bundle analysis + CI budget | `@next/bundle-analyzer` en `next.config.ts; CI fail si inicial JS > 200KB gzipped` | `next.config.ts`, `.bundle-analyzer/` | `AnalyzerConfig` | Fallo CI si presupuesto excedido; reporte generado en `stats.html` |
| **5.6** | Sentry + observability | Configurar Sentry Next.js SDK; `dsn` en `.env.prod`; custom events: `login`, `export`, `calculation`; Vercel Analytics | `src/lib/sentry.ts`, `src/env.mts` | `SentryInitOptions` | Source maps uploads; error tracking en producción; métricas custom |

**Deliverable Phase 5:** Lighthouse 95+ (Perf, A11y, Best Practices, SEO, PWA); offline capable; bundle budget cumplido.

---

### Phase 6: Testing & Quality Gates (Semanas 3-4)

| ID | Tarea | Descripción Concreta | Archivos | AC |
|----|-------|---------------------|----------|-----|
| **6.1** | Unit tests: Vitest + RTL | Coverage > 80% en `src/lib/` (utils calculations: FIFO, TIR, rebalance, FX), hooks, components puros | `tests/unit/*.ts`, `src/lib/calculations/*.test.ts` | `vi.test()` cases | 16 tests passing en 5 archivos mínimo; cobertura reportada |
| **6.2** | Integration tests: MSW | Mock Service Worker para API Routes; tests flujos: login → dashboard → p2p filter → export CSV | `tests/integration/*.ts`, `src/mocks/browser.ts` | `IntegrationTest` | Flujos completos validados sin backend real; MSW responde 200 con datos mock |
| **6.3** | E2E tests: Playwright | Paths críticos: auth, dashboard load, p2p table sort/filter/export, tax scenario, rebalance orders | `tests/e2e/*.spec.ts`, `playwright.config.ts` | `E2ETest` | Confianza en despliegue; detecta regresiones UI reales; `npx playwright test` pasa |
| **6.4** | Static analysis: ESLint + Prettier + TS strict | `eslint` configurado `strict`; `prettier` integrado; `tsc --noEmit` 0 errors | `package.json` scripts; `.eslintrc.cjs` | `lint` config | `pnpm lint` 0 warnings; `pnpm prettier` auto-formate; `tsc` clean |
| **6.5** | Observabilidad: Sentry + métricas | Error tracking source maps; Core Web Vitals custom metrics; business events tracking | `src/lib/sentry.ts`, `src/lib/analytics.ts` | `SentryConfig`, `AnalyticsEvent` | Sentry dashboard conectado; métricas visibles; alertas configuradas |
| **6.6** | Accessibility Audit: axe-core + Lighthouse CI | CI gate: 0 violations AA; keyboard nav, ARIA labels, color contrast, focus management | `vitest.config.ts` axe plugin; `playwright.config.ts` | `AxeConfig` | `0 violations AA` en todas las rutas; Lighthouse score > 90 A11y |

**Deliverable Phase 6:** Pipeline CI/CD con quality gates; 16+ tests passing; a11y AA certificado; TypeScript limpio.

---

### Phase 7: Internationalización & Accessibility (Semana 5)

| ID | Tarea | Descripción Concreta | Archivos | AC |
|----|-------|---------------------|----------|-----|
| **7.1** | next-intl i18n routing | `next-intl` configurado con locales: `es`, `en`; routing `/es/dashboard`, `/en/dashboard`; diccionarios JSON en `src/locales/` | `next-intl.config.mjs`, `src/locales/es.json`, `src/locales/en.json` | `RoutingConfig` | Rutas i18n funcionan; `next dev --locale es|en` cambia idioma |
| **7.2** | Diccionarios de UI | Traducir: labels buttons, placeholder, messages error, fechas, currency format | `src/locales/*.json` | `Spanish`, `English` dicts | 100% strings de la app traducidas; fallback a español si falta traducción |
| **7.3** | Formato locale-aware | `date-fns/locale` para fechas; `currency` format con locale; `number` format con separadores | `src/lib/formatters.ts` | `formatDate`, `formatCurrency`, `formatNumber` | Fechas y currency se ven según locale del usuario |
| **7.4** | Accessibility full audit | axe-core CI gate 0 violations; ARIA labels en todos los componentes interactivos; color contrast WCAG AA; focus management | `src/components/ui/` todos los componentes | `axeOptions` | 0 violaciones AA; focus visible en teclado; contraste mínimo 4.5:1 |

**Deliverable Phase 7:** App multi-idioma; accessibility AA certificada; formatos locale-aware.

---

### Phase 8: Módulo de Análisis Financiero (Semanas 5-6) — *Per user request, leave for final*

> **NOTE:** Per user instruction, the Analysis module from ANALISIS_2.md integration is deferred to Phase 8 and will not be detailed here to avoid scope creep. The core dashboard/P2P/tax/rebalance modules are the priority.

**If needed later, Phase 8 would include:**
- Scoring System 0-100 with weighted categories
- DCF model with terminal value
- Technical analysis (SMA, EMA, RSI, MACD, Bollinger, ATR)
- Position sizing with Kelly Criterion
- API Routes `/api/v1/analyze`
- UI Dashboard de scores with risk semaphore

---

### Phase 9: Documentation & Hardening (Semana 6)

| ID | Tarea | Descripción Concreta | Archivos | AC |
|----|-------|---------------------|----------|-----|
| **9.1** | API OpenAPI/Swagger docs | `fastify-swagger` o `tsoa` generando docs en `/api-docs` desde API Routes | `src/app/api/docs/route.ts` | `OpenAPI Spec` | Docs reflejan todos los endpoints; `curl` examples generados |
| **9.2** | Componente Storybook | Storybook configurado con stories de: DataTable, ChartWrapper, Badge, SelectorUsuario, EmptyState, Skeleton | `storybook/main.ts`, `src/stories/*.stories.ts` | `StorybookConfig` | `npm run storybook` levanta historias; 20+ stories documentadas |
| **9.3** | ADRs (Architecture Decision Records) | Documentar 3 ADRs clave en `docs/adr/`: Server Components by default, TanStack Table vs HTML tables, Rust/WASM necessity | `docs/adr/ADR-001.md`, etc. | `ADR format` | ADRs versionados; decisión rationale documentada |
| **9.4** | Runbooks operativos | Runbook deploy: `pnpm build → Vercel deploy → smoke tests`; rollback procedure; backup verification | `docs/runbooks/deploy.md` | `Runbook steps` | Deploy scriptado; rollback probado en staging; backups verificados semanalmente |
| **9.5** | Onboarding documentation | `README.md` actualizado; `QUICKSTART.md` para nuevos devs; setup Supabase + NextAuth + environment variables | `README.md`, `QUICKSTART.md` | `setup guide` | New dev puede tener app corriendo en < 30 min; variables .env.example incluidas |

**Deliverable Phase 9:** Documentación completa; Storybook operativo; ADRs versionados; onboarding < 30 min.

---

## 5. Cross-Cutting Concerns (Aplicables en Todas las Fases)

### 5.1 Seguridad (Security Headers)
- **CSP (Content Security Policy):** `default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self'; connect-src self; frame-src 'none';` (ajustable por entorno)
- **HSTS:** `max-age=31536000; includeSubDomains; preload` en headers de respuesta
- **Cookies:** `SameSite=Strict`, `Secure` en prod, `HttpOnly` en cookies de sesión
- **CSRF:** Tokens en forms críticos (tax, rebalance); validación server-side
- **Rate limiting:** Express middleware en API Routes (`express-rate-limit`) — 100 requests/15min por IP

### 5.2 Validación y Sanitización
- **Zod schemas** definidos shared (client/server) en `src/lib/validations/`
- **Schemas por recurso:** `assetSchema`, `p2pLoanSchema`, `taxScenarioSchema`, `rebalanceTargetSchema`
- **Sanitización:** `DOMPurify` en cualquier HTML insertado en UI
- **Input validation:** Todo POST/PUT/DELETE pasa por Zod antes de tocar BD

### 5.3 Manejo de Errores
- **Error classes personalizadas:** `DatabaseError`, `ValidationError`, `NotFoundError`, `ForbiddenError`
- **Error boundaries** en componentes Client críticos
- **Logging estructurado:** `pino` o `winston` con niveles (error, warn, info, debug); logs a Sentry
- **User-facing messages:** Errores genéricos al user; detalles técnicos solo en logs/Sentry

### 5.4 Caching Strategy
- **TanStack Query:** `staleTime: 300` (5 min), `cacheTime: 600` (10 min), `refetchOnWindowFocus: false`
- **ISR:** `revalidateTag()` en mutations; `next/cache` tags por recurso
- **Edge caching:** Vercel Edge Functions para reads-heavy (stats, KPIs summaries)
- **LocalStorage:** Preferences de usuario (column order, table filters) persistidos

### 5.5 Multi-tenant Isolación
- **RLS policies** en Supabase ya definidas en Phase 1 (sección 1.2)
- **user_id** propagado via `supabase.auth.getUser()` en Server Components
- **Middleware** Next.js verifica sesión y inyecta `userId` en contexto
- **Tests de aislamiento:** Integration tests verifican que usuario A no vea datos de usuario B

### 5.6 Feature Flags
- Feature flags en `.env.local` para toggles: `ENABLE_PLAID_INTEGRATION= true`, `ENABLE_ANALYSIS_MODULE= false`, `ENABLE_DARK_MODE= false`
- Helper `isFeatureEnabled(feature: string): boolean` usado en componentes condicionales

---

## 6. Acceptance Criteria Globales (Definición de Hecho - DONE)

Una tarea está "DONE" cuando:

1. ✅ **Code:** TypeScript `tsc --noEmit` 0 errors en módulo afectado
2. ✅ **Lint:** `eslint` 0 warnings (con configuración strict)
3. ✅ **Tests:** Tests unitarios/integration passing con cobertura > 80% en `src/lib/`
4. ✅ **Security:** No hay vulnerabilities OWASP Top 10 en módulo (validación Zod, RLS, CSP headers)
5. ✅ **Performance:** Lighthouse score per-route > 90 en Perf; bundle budget cumplido
6. ✅ **A11y:** axe-core 0 violations AA; focus management ok; color contrast WCAG AA
7. ✅ **Docs:** Storybook story o API doc actualizada;README reflecta cambios
8. ✅ **Deploy:** `npm run build` pasa; `npm run start` en ambiente staging funciona
9. ✅ **BA:** Product Owner valida UI/UX contra diseño Figma/Mintos referencia
10. ✅ **Product:** Feature entregada y funcional (no "parchada" o half-done)

---

## 7. Migración de Datos: Mock → Real (Roadmap)

| Etapa | Descripción | Archivos | Fecha Estimada |
|-------|-------------|----------|----------------|
| **M1** | `schema.sql` + `seed.sql` importados a Supabase project | `supabase/migrations/` | Phase 1 (Semana 1) |
| **M2** | `supabase gen types typescript` → `types/supabase.ts` | `types/supabase.ts` | Phase 1 |
| **M3** | `mock-data.ts` → helpers Supabase (`src/lib/db/helpers.ts`) | `src/lib/db/helpers.ts` | Phase 1-2 |
| **M4** | `seed.sql` data → API Routes responses reales | `src/app/api/*/route.ts` | Phase 1-2 |
| **M5** | Remover `advanced-mock-data.ts` completamente | `src/lib/advanced-mock-data.ts` | Phase 3 |
| **M6** | `mock-data.ts` keep solo como `seed.sql` reference | `supabase/seed.sql` | Phase 9 |

---

## 8. Riesgos y Mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|---------|------------|
| **WASM compilation issues** | Media | Alto | Prototipo Rust → WASM en Phase 1; fallback JS (`lib/calculations/fifo.ts`) listo desde start |
| **Plaid/Tink sandbox limits** | Alta | Medio | Mock webhook server local en desarrollo; staging env dedicado para testing limits |
| **TanStack Table learning curve** | Media | Bajo | Spike técnico Semana 1; componentes wrapper reutilizables (`DataTable`) reducen complejidad |
| **Supabase RLS complexity** | Media | Alto | Diseño RLS en `schema.sql` desde start; tests de aislamiento multi-tenant en Phase 4 |
| **Scope creep "nice-to-have"** | Alta | Medio | Priorización estricta por fase; "no" por defecto; backlog separado en GitHub Projects |
| **Performance regressions** | Media | Alto | Bundle budget en CI; Lighthouse CI gate; perf budgets por ruta definidos en Phase 5 |
| **Accessibility audit failures** | Media | Alto | axe-core CI gate desde Phase 1; diseño con contraste mínimo 4.5:1; ARIA labels en todos los componentes |
| **Internationalization delays** | Baja | Medio | next-intl configurado Phase 7; diccionarios en paralelo con desarrollo English-first |

---

## 9. Out of Scope (Explicitamente No Incluido)

1. **Análisis Financiero completo** (scoring, DCF, technical analysis) — quedará para Phase 8 o post-MVP
2. **Backend Rust/WASM** — fuera de alcance para este plan; cálculos en TypeScript puro
3. **Integración bancaria real** (Plaid/Tink producción) — solo scaffolding mock en Phase 6
4. **Mobile app React Native** — fuera de alcance; UI responsive para desktop/mobile web
5. **Plaid/Tink webhooks producción** — requiere contrato banking; fuera de MVP
6. **PDF reports profesionales** — generadores básicos; reports avanzados post-MVP
7. **ML/AI prediction models** — fuera de scope; reglas básicas solo
8. **Multiple currency accounting** — con 3 divisas (USD/EUR/GBP); expansión a más divisas post-MVP
9. **Real-time features** (WebSocket, Supabase Realtime) — opcional post-MVP
10. **Compliance reports (tax authority formats)** — solo simulador fiscal interno; formats oficiales post-MVP

---

## 10. Cronograma Consolidado (6 Semanas + Buffer)

```
Semana 0:  ██████ Phase 0 - Configuración herramientas
Semana 1:  ██████ Phase 1 - Backend Real + Auth + API
Semana 2:  ██████ Phase 2 - State Management + Data Layer
Semana 3:  ██████ Phase 3 - Design System + UI Primitives
Semana 4:  ██████ Phase 4 - Module Enhancements (P2P, Portfolio, Calendar, Tax, Rebalance, Currencies)
Semana 5:  ██████ Phase 5 - Performance + PWA + Observability
Semana 6:  ██████ Phase 6 - Testing + Quality Gates + i18n + Accessibility
Semana 7:  ██████ Phase 7 - Documentation + Hardening + ADRs
Buffer:    20% tiempo para imprevistos, code review, documentación
```

**Fecha objetivo completado:** 1 Septiembre 2026 (6 semanas + 1 semana buffer)

---

## 11. Estructura de Scripts Package.json (Actualizada)

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint",
    "test": "vitest",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage",
    "test:e2e": "playwright test",
    "playwright": "playwright test",
    "storybook": "storybook dev -p 6006",
    "storybook:build": "storybook build -o storybook-static",
    "analyze": "next bundle_analyzer",
    "lint:fix": "eslint --fix",
    "prettier": "prettier --write .",
    "prepare": "husky generate",
    "db:push": "supabase db push",
    "db:migrate": "supabase migration run",
    "supabase:init": "supabase init && supabase linkage add",
    "typecheck": "npx tsc --noEmit"
  }
}
```

---

## 12. Variables de Entorno Obligatorias (.env.example)

```
NEXT_PUBLIC_SUPABASE_URL=tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=genera-un-secreto-de-minimo-32-caracteres
NEXT_PUBLIC_ANALYSIS_ENABLED=false
NEXT_PUBLIC_PLAID_ENABLED=false
NEXT_PUBLIC_RATE_LIMIT_MS=15000
NEXT_PUBLIC_CSP_DEFAULT_SRC=self
NEXT_PUBLIC_HSTS_MAX_AGE=31536000
```

---

## 13. Conclusión

PLAN_4.md transforma las ideas conceptuales de PLAN_3.md en **entregables concretos, medibles y ejecutables**. Cada tarea tiene:
- Archivos específicos a crear/modificar
- Tipos/interfaces TypeScript definidos
- Criterios de aceptación objetivos
- Dependencias claras con fases anteriores

El plan está diseñado para que **una IA de programación pueda desarrollar la aplicación sin ambigüedades**: cada "qué" tiene un "cómo" concreto con rutas de archivo, firmas de función y tests asociados.

**Fuera de scope intencional:** Módulo de análisis financiero (FASE 8 de ANALISIS_2.md) está excluido por petición del usuario para mantener foco en el dashboard/core modules.

---
**Generado por:** Asistente de IA (OpenCode)  
**Fecha:** 18 Agosto 2026  
**Estado:** ✅ Plan detallado listo para ejecución inmediata  
**Siguiente paso:** Ejecutar Phase 0 - Configuración herramientas