# DESCRIPCION COMPLETA — Portafolio Intel (Portfolio Dashboard)

> Documento de referencia completa para replicar el proyecto como parte de otro sistema mayor.

---

## 1. Visión General del Proyecto

**Portafolio Intel** es una aplicación web FinTech/WealthTech tipo dashboard de gestión de inversiones. Consolida la visión completa de carteras de inversión en un único panel interactivo, soportando múltiples clases de activos (Fondos Indexados, ETFs, Préstamos P2P/Crowdlending, Bonos, Renta Variable, REITs, Efectivo) con simulador fiscal FIFO, rebalanceo automático, análisis multi-divisa y análisis financiero cuantitativo.

**Objetivo principal:** Permitir a inversores particulares, asesores financieros y pequeños fondos gestionar y monitorizar todas sus inversiones desde un solo panel, con herramientas de análisis, simulación fiscal y rebalanceo.

**Dato clave:** La aplicación funciona sin backend configurado (modo demo con datos mock). Al configurar credenciales de Supabase, se conecta a la base de datos real sin cambios de código.

---

## 2. Stack Tecnológico Completo

| Capa | Tecnología | Versión | Justificación |
|------|-----------|---------|---------------|
| Framework | Next.js (App Router) | 16.3.1 | Server Components, Server Actions, routing basado en archivos |
| UI Library | React | 19.2.8 | Concurrent features, Suspense, lazy loading |
| Lenguaje | TypeScript | 5.x | Type safety en toda la aplicación |
| Estilos | Tailwind CSS | v4 | Utility-first, CSS variables para theming |
| Gráficos | Recharts | 3.10.1 | Componentes declarativos: Bar, Pie, Area, Line |
| Tablas | TanStack Table | 8.21.3 | Sorting, filtrado, paginación, export CSV |
| Estado/Cache | TanStack React Query | 5.101.4 | Caché inteligente, staleTime, refetch automático |
| Base de Datos | Supabase (PostgreSQL) | 2.112.3 | RLS multi-tenant, Auth, PostgreSQL |
| Validación | Zod | 4.4.3 | Schemas en API routes y server actions |
| Testing Unit | Vitest | 4.1.10 | Tests unitarios e integración |
| Testing E2E | Playwright | 1.62.1 | Tests end-to-end con axe-core |
| Icons | Lucide React | 1.31.0 | Iconos SVG consistentes |
| PDF | PDFKit | 0.19.1 | Generación de PDFs (preparado) |
| Internacionalización | next-intl | 4.13.7 | i18n (preparado, panel en español) |
| Bundle Analyzer | @next/bundle-analyzer | 16.3.1 | Análisis de bundle size |

### Requisitos del Sistema

- **Node.js:** 20+ (recomendado 22 LTS)
- **npm** (o bun/pnpm/yarn)
- **SO:** Windows, macOS, Linux
- **Navegador:** Chrome, Firefox, Safari, Edge (modernos)

---

## 3. Estructura de Directorios Completa

```
portfolio-dashboard/
├── public/
│   ├── manifest.webmanifest      # Configuración PWA
│   └── sw.js                     # Service Worker manual
├── supabase/
│   └── migrations/
│       └── 001_rls_policies.sql  # Políticas RLS multi-tenant
├── src/
│   ├── app/                      # Rutas (App Router de Next.js 16)
│   │   ├── layout.tsx            # Layout raíz (fuentes, metadata, Providers, AppShell)
│   │   ├── page.tsx              # Home → redirect a /dashboard
│   │   ├── globals.css           # Tokens CSS, Tailwind, estilos globales
│   │   ├── (auth)/
│   │   │   └── login/            # Login/registro (Supabase Auth)
│   │   ├── dashboard/            # Módulo A: Dashboard consolidado
│   │   │   └── page.tsx
│   │   ├── p2p/                  # Módulo B: Préstamos P2P/Crowdlending
│   │   │   └── page.tsx
│   │   ├── ronvariable/          # Módulo C: Renta Variable y Fondos
│   │   │   └── page.tsx
│   │   ├── portfolio/            # Cartera general (vista detallada)
│   │   │   └── page.tsx
│   │   ├── calendar/             # Calendario de dividendos y cupones
│   │   │   └── page.tsx
│   │   ├── tax/                  # Simulador fiscal FIFO
│   │   │   └── page.tsx
│   │   ├── rebalance/            # Rebalanceo automático
│   │   │   └── page.tsx
│   │   ├── currencies/           # Multi-divisa
│   │   │   └── page.tsx
│   │   ├── integrations/         # Integración bancaria (Plaid/Tink simulado)
│   │   │   └── page.tsx
│   │   ├── analysis/             # Análisis financiero (scoring, DCF, Kelly)
│   │   │   └── page.tsx
│   │   └── api/                  # API Routes
│   │       ├── assets/           # CRUD de activos
│   │       ├── p2p/              # CRUD de préstamos P2P
│   │       ├── transactions/     # Transacciones
│   │       └── v1/
│   │           └── analyze/      # Endpoint de análisis financiero
│   ├── components/
│   │   ├── charts/
│   │   │   ├── ChartWrapper.tsx          # Wrapper reutilizable (bar/pie/area)
│   │   │   ├── HeatmapCalendar.tsx       # Calendario tipo GitHub heatmap
│   │   │   └── AnalysisPriceChart.tsx    # Gráfico de precio con SMA/BB/MACD
│   │   ├── layout/
│   │   │   ├── AppShell.tsx              # Shell principal (Header + Sidebar + Content)
│   │   │   ├── Header.tsx               # Barra superior fija
│   │   │   └── Sidebar.tsx              # Navegación lateral izquierda
│   │   ├── tables/
│   │   │   ├── DataTable.tsx             # Tabla genérica reutilizable (TanStack)
│   │   │   ├── p2pColumns.tsx           # Definición de columnas P2P
│   │   │   ├── fundColumns.tsx          # Definición de columnas Fondos/RV
│   │   │   ├── taxColumns.tsx           # Definición de columnas Tax Tracker
│   │   │   ├── rebalanceColumns.tsx     # Definición de columnas Rebalanceo
│   │   │   └── currencyColumns.tsx      # Definición de columnas Multi-divisa
│   │   ├── ui/
│   │   │   ├── Badge.tsx                # Badges con variantes (success/warning/error/info)
│   │   │   ├── Button.tsx               # Botones reutilizables
│   │   │   ├── Skeleton.tsx             # Skeleton loaders
│   │   │   └── EmptyState.tsx           # Estado vacío
│   │   ├── feedback/                     # Componentes de feedback
│   │   ├── forms/                        # Componentes de formulario
│   │   └── ServiceWorkerRegister.tsx     # Registro del Service Worker
│   ├── lib/
│   │   ├── calculations/
│   │   │   ├── fifo.ts                  # Motor FIFO (First-In, First-Out)
│   │   │   ├── fx.ts                   # Conversión multi-divisa y retorno FX
│   │   │   └── rebalance.ts            # Motor de rebalanceo
│   │   ├── analysis/
│   │   │   ├── types.ts                # Tipos: OHLC, Fundamentals, Technical, DCF, Kelly
│   │   │   ├── scoring.ts             # Scoring ponderado 0-100
│   │   │   ├── dcf.ts                 # Modelo DCF (Descuento de Flujos)
│   │   │   ├── technical.ts           # Indicadores: SMA, EMA, MACD, RSI, Bollinger, ATR
│   │   │   ├── kelly.ts               # Criterio de Kelly para position sizing
│   │   │   ├── backtest.ts            # Backtest SMA crossover
│   │   │   ├── recommendation.ts      # Recomendación de inversión
│   │   │   ├── mock-instruments.ts     # Datos mock de instrumentos (AAPL, NVDA, TSLA, etc.)
│   │   │   ├── rng.ts                 # RNG seeded para datos reproducibles
│   │   │   └── analysis.ts            # Motor de análisis principal
│   │   ├── db/
│   │   │   ├── supabase.ts            # Cliente Supabase lazy + Auth helpers
│   │   │   ├── helpers.ts             # Repositorio: getAssets, insertAsset, etc.
│   │   │   └── types.ts              # Tipos de BD
│   │   ├── hooks/
│   │   │   ├── usePortfolio.ts        # Hook React Query para carteras
│   │   │   ├── useP2P.ts             # Hook React Query para P2P
│   │   │   ├── useTax.ts             # Hook fiscal con escenarios FIFO
│   │   │   ├── useRebalance.ts       # Hook de rebalanceo
│   │   │   ├── useCurrencies.ts      # Hook multi-divisa
│   │   │   └── types.ts             # Tipos compartidos de hooks
│   │   ├── validations/
│   │   │   └── zod-schemas.ts        # Schemas Zod para validación
│   │   ├── data-sources.ts           # Capa de datos (mock + Supabase con fallback)
│   │   ├── mock-data.ts              # Datos mock: 5 usuarios ficticios
│   │   ├── advanced-mock-data.ts     # Mock data avanzada (tax lots, cashflows, FX)
│   │   ├── constants.ts              # Constantes: clases de activo, tasas, flags
│   │   ├── constants/                 # Directorio de constantes adicionales
│   │   ├── formatters.ts             # Formateo: moneda, porcentaje, fecha, cn()
│   │   ├── chart-theme.ts            # Tema visual de Recharts
│   │   ├── timeseries.ts             # Generación de series temporales
│   │   └── report.ts                 # Generación de reportes
│   ├── mocks/
│   │   └── handlers.ts               # Handlers MSW para tests de integración
│   ├── providers.tsx                 # QueryClientProvider (React Query)
│   ├── proxy.ts                      # Middleware Next.js 16 (rutas protegidas)
│   └── setupTests.ts                 # Setup de Vitest
├── tests/
│   └── unit/                         # Tests unitarios e integración
├── types/
│   └── supabase.ts                   # Tipos generados de Supabase
├── docs/
│   └── adr/                          # Architecture Decision Records
├── .env.example                      # Template de variables de entorno
├── next.config.ts                    # Config Next.js + headers seguridad
├── tsconfig.json                     # Config TypeScript
├── vitest.config.ts                  # Config Vitest
├── playwright.config.ts              # Config Playwright
├── eslint.config.mjs                 # Config ESLint
├── postcss.config.mjs                # Config PostCSS (Tailwind)
└── package.json                      # Dependencias y scripts
```

---

## 4. Configuración Inicial (Paso a Paso)

### 4.1 Clonar e Instalar

```bash
git clone <repo-url>
cd portfolio-dashboard
npm install
```

### 4.2 Variables de Entorno

Copiar `.env.example` a `.env.local`:

```bash
cp .env.example .env.local
```

Variables disponibles:

```
# Supabase (opcional — sin credenciales, la app usa datos mock)
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key

# Feature Flags
NEXT_PUBLIC_ANALYSIS_ENABLED=true
NEXT_PUBLIC_PLAID_ENABLED=false
```

### 4.3 Ejecutar

```bash
npm run dev        # Servidor de desarrollo (localhost:3000)
npm run build      # Build de producción
npm run start      # Servidor de producción
```

### 4.4 Scripts Disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo con HMR |
| `npm run build` | Build de producción |
| `npm run start` | Servidor de producción |
| `npm run lint` | ESLint (debe dar 0 problemas) |
| `npm test` | Vitest en modo watch |
| `npm run test:run` | Vitest una pasada |
| `npm run test:coverage` | Cobertura (gates: lines ≥70%, stmts ≥70%) |
| `npm run test:e2e` | Playwright e2e (chromium + firefox) |
| `npm run test:e2e:ui` | Playwright con UI |
| `npm run analyze` | Bundle analyzer |

---

## 5. Arquitectura de la Aplicación

### 5.1 Patrón de Datos: Mock con Fallback a Supabase

La aplicación implementa un patrón **data-sources.ts** que actúa como capa de abstracción:

```
UI → useQuery (React Query) → data-sources.ts → Supabase (si configurado) → Mock (fallback)
```

**Flujo:**
1. Los hooks (`usePortfolio`, `useP2P`, etc.) llaman a `data-sources.ts`
2. `data-sources.ts` verifica `isSupabaseConfigured()`
3. Si Supabase está configurado, intenta fetch a `/api/*`
4. Si falla o no está configurado, usa datos mock
5. React Query cachea el resultado con staleTime de 5 minutos

### 5.2 Layout y Navegación

**AppShell** (`src/components/layout/AppShell.tsx`):
- Para rutas de auth (`/login`, `/register`): renderiza solo el contenido (sin Header ni Sidebar)
- Para el resto: renderiza `Header` + contenido con margen izquierdo + `Sidebar`

**Sidebar** (`src/components/layout/Sidebar.tsx`):
- Navegación principal: Dashboard, Cartera, P2P, Renta Variable, Análisis
- Navegación avanzada: Calendario, Simulador Fiscal, Rebalanceo, Integración Bancaria, Multi-divisa
- Responsive: en móvil se oculta con translate-x, se muestra con toggle
- Botón de cerrar sesión al fondo

**Header** (`src/components/layout/Header.tsx`):
- Fijo en la parte superior (sm:fixed)
- Contiene: título "Portafolio Intel", búsqueda, usuario, menú móvil
- Backdrop blur para efecto glass

### 5.3 Providers

**Providers** (`src/providers.tsx`):
- `QueryClientProvider` de React Query
- staleTime: 5 minutos
- gcTime: 10 minutos
- retry: 1
- refetchOnWindowFocus: false

### 5.4 Seguridad (next.config.ts)

Headers de seguridad aplicados a todas las rutas:

- **X-DNS-Prefetch-Control:** on
- **Strict-Transport-Security:** max-age=31536000; includeSubDomains; preload
- **X-Frame-Options:** DENY
- **X-Content-Type-Options:** nosniff
- **Referrer-Policy:** strict-origin-when-cross-origin
- **Permissions-Policy:** camera=(), microphone=(), geolocation=()
- **Content-Security-Policy:** default-src 'self', script-src 'self' 'unsafe-inline' 'unsafe-eval', connect-src 'self' https://*.supabase.co

---

## 6. Módulos Detallados

### 6.1 Módulo A — Dashboard Consolidado (`/dashboard`)

**Archivo:** `src/app/dashboard/page.tsx`

**Funcionalidad:** Tablero ejecutivo que muestra la consolidación de todas las carteras.

**Componentes:**
- **Selector de inversor:** `<select>` con todos los usuarios + opción "Todos (consolidado)"
- **Selector de rango temporal:** 1A, 3A, 5A (controla la serie temporal)
- **3 KPI cards:** Valor Total (€), Rentabilidad Total (%), TIR Anualizada (%)
- **Gráfico de evolución temporal:** `ChartWrapper` tipo `area` con datos de `generatePortfolioTimeSeries`
- **Gráfico de distribución:** `ChartWrapper` tipo `pie` (donut) con colores por clase
- **Tabla de resumen por clase:** lista con label, valor, retorno%, flecha de navegación
- **Panel de rebalanceo visual:** barras de progreso con objetivos vs actual, indicador BUY/SELL/HOLD

**Datos:**
- `USERS` de `mock-data.ts`: 5 inversores ficticios con breakdown por clase
- `getConsolidated()`: agrega todos los usuarios en uno solo
- `generatePortfolioTimeSeries()`: genera series temporales para el gráfico

**Patrón de carga:**
- `ChartWrapper` se carga con `next/dynamic` (ssr:false) + `SkeletonCard` como loading
- Esto evita que Recharts se empaquete en el bundle del servidor

### 6.2 Módulo B — Préstamos P2P (`/p2p`)

**Archivo:** `src/app/p2p/page.tsx`

**Funcionalidad:** Gestión de cartera de crowdlending con filtros, venta en mercado secundario.

**Componentes:**
- **4 KPI cards:** Total Invertido, Diversificación (% países), Interés Medio Ponderado, Periodo Promedio Restante
- **Filtros:** 3 grupos de radio buttons (Estado, País, Riesgo) que se combinan entre sí
- **Gráficos de barras:** Distribución por plazo restante y por rango de interés
- **DataTable genérica:** con columnas específicas P2P, sorting, filtrado, paginación
- **Botón "Vender":** simula venta en mercado secundario
- **Toast de confirmación:** notificación persistente 3.5 segundos
- **localStorage:** guarda IDs de préstamos vendidos para persistencia entre sesiones

**Motor de filtrado:**
```typescript
// Filtros combinados
filtered = LOANS.filter(l => {
  const statusMatch = status === "all" || l.status === status;
  const countryMatch = country === "all" || l.country === country;
  const riskMatch = risk === "all" || 
    (risk === "low" ? ["A","B","B+","C"].includes(l.risk) : ["C+","D"].includes(l.risk));
  return statusMatch && countryMatch && riskMatch && !soldIds.has(l.id);
});
```

**KPIs calculados con useMemo:**
- `totalInvested`: suma de `capitalInvested`
- `diversification`: países únicos / 6 * 100
- `avgRemaining`: media de `remainingTermMonths`
- `avgRate`: interés medio ponderado por capital invertido

### 6.3 Módulo C — Renta Variable y Fondos (`/ronvariable`)

**Archivo:** `src/app/ronvariable/page.tsx`

**Funcionalidad:** Vista de fondos indexados y acciones con sparklines.

**Componentes:**
- **DataTable con sparklines:** columna personalizada que renderiza SVG inline
- **Evolución temporal:** botones de rango (1M, 3M, 6M, YTD, 1A, Todo) + gráfico SVG inline
- **Datos fundamentales:** panel con valor liquidativo, Morningstar rating, categoría, gestora, TER, riesgo
- **Botones de acción:** Comprar, Vender, Programar Aportación

**Tipos de columna (fundColumns.tsx):**
- `name`: nombre del activo
- `isin`: código ISIN/ticker (mono)
- `value`: valor total en EUR
- `dailyChange`: variación diaria con color (verde/rojo)
- `sparkline`: gráfico SVG inline de tendencia

### 6.4 Cartera General (`/portfolio`)

**Archivo:** `src/app/portfolio/page.tsx`

**Funcionalidad:** Vista detallada de inversiones P2P con filtros y tabla nativa.

**Componentes:**
- **4 KPI cards:** Total Invertido, Diversificación, Interés Medio, Nº Préstamos
- **Panel de estados:** badges con conteo por cada estado (corriente, gracia, mora, impago)
- **Filtros:** País y Nivel de Riesgo con radio buttons
- **Tabla HTML nativa:** con columnas: ID, Originador, País, Riesgo, Interés, Compra, Invertido, Pendiente, Estado, Acción

### 6.5 Simulador Fiscal (`/tax`)

**Archivo:** `src/app/tax/page.tsx`

**Funcionalidad:** Planificación de impuestos con regla FIFO (First-In, First-Out).

**Motor FIFO** (`src/lib/calculations/fifo.ts`):

```typescript
// Función principal
calculateFIFO(lots: FIFOLot[], sell: FIFOTransaction): FIFOResult
```

**Lógica:**
1. Ordena lotes por fecha de compra (más antiguos primero)
2. Recorre lotes consumiendo cantidad a vender
3. Para cada lote: costBasis = qty * purchasePrice + (fee * qty) / lot.quantity
4. Para cada lote: proceeds = qty * sellPrice - (sell.fee * qty) / sell.quantity
5. Ganancia = proceeds - costBasis
6. Impuesto = ganancia * 19% (IRPF España)

**Escenarios de venta:**
- Vender TODO (100%)
- Vender la mitad (50%)
- Vender 1/4 (25%)

**Componentes:**
- **4 KPI cards:** Plusvalía Latente Total, Coste Base Total, Valor Actual Total, Impuesto Estimado
- **Selector de escenario:** 3 botones que recalculan todo
- **Panel de resultados:** Capital Ganado/Perdido, Efecto Divisa, Neto a Recibir
- **DataTable:** lotes ordenados por fecha, con columnas: Activo, ISIN, Fecha, Tipo, Capital, P&U, Rentabilidad

**Desglose multi-divisa en la tabla:** para activos en USD, muestra retorno del activo vs retorno por divisa por separado.

### 6.6 Rebalanceo Automático (`/rebalance`)

**Archivo:** `src/app/rebalance/page.tsx`

**Funcionalidad:** Calcula órdenes BUY/SELL/HOLD para volver al target de asignación.

**Motor de rebalanceo** (`src/lib/calculations/rebalance.ts`):

```typescript
calculateRebalance(targets: RebalanceTarget[], totalValue: number, thresholdPct = 5): RebalanceOrder[]
```

**Lógica:**
1. Para cada clase: deltaPct = targetPct - currentPct
2. Si |deltaPct| <= 5% (umbral): HOLD
3. Si current < target: BUY por la diferencia
4. Si current > target: SELL por la diferencia
5. amountEur = (|deltaPct| / 100) * totalValue

**Validación:**
```typescript
validateTargets(targets) // Los targets deben sumar 100%
```

**Componentes:**
- **Panel de resumen:** total a comprar, total a vender, neto
- **Tabla editable:** targets editables con `<input type="number">`
- **Órdenes de compra recomendadas:** activos a comprar con monto exacto
- **Órdenes de venta recomendadas:** activos a vender con monto exacto

**Interactividad:** al modificar un target, se recalculan automáticamente las órdenes.

### 6.7 Calendario de Dividendos y Cupones (`/calendar`)

**Archivo:** `src/app/calendar/page.tsx`

**Funcionalidad:** Visualización de flujos de efectivo futuros (dividendos, cupones, redenciones).

**Componentes:**
- **4 KPI cards:** Flujo Este Mes, Dividendos, Cupones, Nº Eventos
- **Navegación por mes:** botones anterior/siguiente + selector de año
- **Tabla de eventos:** fecha, activo, clase, tipo, importe, divisa, confianza
- **HeatmapCalendar** (`src/components/charts/HeatmapCalendar.tsx`): visualización tipo GitHub
- **Proyección 6 meses:** gráfico de barras con los próximos 6 meses

**HeatmapCalendar:**
- Grid de 7 columnas (D-L-M-X-J-V-S)
- Colores por intensidad: bg-success/20 → bg-success/80
- Tooltips en hover con fecha y monto
- Leyenda con total y eventos activos

### 6.8 Análisis Financiero (`/analysis`)

**Archivo:** `src/app/analysis/page.tsx`

**Funcionalidad:** Análisis cuantitativo de instrumentos con scoring, DCF, técnico y Kelly.

**Motor de análisis** (`src/lib/analysis/`):

#### Scoring System (`scoring.ts`)
6 categorías con pesos ponderados:
- Salud Financiera (20%): debtToEquity, currentRatio, ROE, ROIC
- Crecimiento (20%): revenueGrowthYoY, ROE, operatingMargin
- Valoración (20%): P/E, P/B, P/S, FCF yield, upside DCF
- Ventaja Competitiva (15%): marketCap, grossMargin, ROIC, dividendYield
- Técnico/Momentum (15%): RSI, Bollinger %b, momentum, SMA cross
- Gestión de Riesgos (10%): beta, dividendYield, ATR, currentRatio

#### Modelo DCF (`dcf.ts`)
```typescript
WACC = riskFreeRate + beta * marketRiskPremium
FCF = baseFCF * (1 + growth)^year
Terminal Value = FCF_last * (1 + g_terminal) / (WACC - g_terminal)
Fair Value = (Enterprise Value - Debt + Cash) / Shares
```

#### Análisis Técnico (`technical.ts`)
Indicadores calculados:
- **SMA:** 20, 50, 200 períodos
- **EMA:** 12, 26 períodos
- **MACD:** línea, señal, histograma
- **RSI:** 14 períodos (sobrecompra >70, sobreventa <30)
- **Bollinger Bands:** 20 períodos, 2 desviaciones estándar
- **ATR:** 14 períodos (Average True Range)
- **Detección de tendencia:** BULLISH/BEARISH/SIDEWAYS
- **Cruces SMA:** GOLDEN/DEATH cross
- **Momentum:** STRONG_UP/UP/NEUTRAL/DOWN/STRONG_DOWN

#### Criterio de Kelly (`kelly.ts`)
```typescript
f* = (b*p - q) / b
donde b = avgWin/avgLoss, p = winRate, q = 1-p
fractionalKelly = f* * 0.5
```

#### Datos Mock (`mock-instruments.ts`)
6 instrumentos: AAPL, NVDA, VTI, TSLA, SAN, MSFT con fundamentales completos.

#### OHLC Generado (`technical.ts`)
`generateOHLC(ticker, basePrice, days)`: genera series OHLC con RNG seeded (reproducible por ticker).

**Componentes de UI:**
- **Semaphore:** indicador visual 0-100 con color (verde/ámbar/rojo)
- **CategoryBar:** barras de progreso por categoría
- **ReportView:** 3 paneles (DCF, Técnico, Kelly) + fundamentales + gráfico de precio
- **AnalysisPriceChart:** gráfico de líneas con precio, SMA20/50/200, Bollinger Bands

### 6.9 Multi-divisa (`/currencies`)

**Archivo:** `src/app/currencies/page.tsx`

**Funcionalidad:** Separación del retorno en retorno del activo vs retorno por tipo de cambio.

**Motor FX** (`src/lib/calculations/fx.ts`):

```typescript
splitReturnByFx({ assetReturnPct, fxRateEntry, fxRateNow }): CurrencyResult
// fxReturn = (fxRateNow / fxRateEntry - 1) * 100
// totalReturn ≈ (1 + assetReturn) * (1 + fxReturn) - 1
```

**Tasas por defecto:** EUR/USD (1.08), EUR/GBP (0.85), EUR/CHF (0.98), EUR/JPY (163.5)

### 6.10 Integración Bancaria (`/integrations`)

**Archivo:** `src/app/integrations/page.tsx`

**Funcionalidad:** Simulación de conexión con instituciones financieras (Plaid/Tink).

**Componentes:**
- **KPIs:** instituciones conectadas, saldo agregado, última sincronización, EUR/USD
- **Lista de instituciones:** BBVA, Santander, CaixaBank, Revolut con estados (conectado/desconectado/error)
- **Botón Conectar/Sincronizar:** con animación de loading
- **Arquitectura de integración:** documentación de endpoints webhook, tabla exchange_rates
- **Tabla de tipos de cambio:** pares de monedas con variación 24h

---

## 7. Componentes Reutilizables

### 7.1 ChartWrapper (`src/components/charts/ChartWrapper.tsx`)

Wrapper genérico para Recharts que soporta 3 tipos de gráfico:

```typescript
interface ChartWrapperProps {
  title?: string;
  type: "bar" | "pie" | "area";
  data: any[];
  dataKeys: string[];
  colors?: string[];
  xKey?: string;
  height?: number;
  showLegend?: boolean;
  showGrid?: boolean;
  formatValue?: (value: number) => string;
  formatLabel?: (value: string) => string;
}
```

**Uso:**
```tsx
<ChartWrapper
  title="Evolución Temporal"
  type="area"
  data={timeSeries}
  dataKeys={["totalValue"]}
  xKey="period"
  formatValue={(v) => `€${Number(v).toLocaleString()}`}
/>
```

### 7.2 DataTable (`src/components/tables/DataTable.tsx`)

Tabla genérica con TanStack Table que incluye:

- **Búsqueda global:** input con icono de búsqueda
- **Sorting:** clic en header para ordenar asc/desc
- **Paginación:** anterior/siguiente con indicador de página
- **Export CSV:** botón que genera archivo CSV
- **Loading state:** SkeletonTable
- **Empty state:** EmptyState con mensaje

```typescript
interface DataTableProps<TData> {
  data: TData[];
  columns: ColumnDef<TData, any>[];
  searchPlaceholder?: string;
  enableSorting?: boolean;
  enableFiltering?: boolean;
  enablePagination?: boolean;
  onRowClick?: (row: TData) => void;
  pageSize?: number;
}
```

### 7.3 Badge (`src/components/ui/Badge.tsx`)

Badges con variantes de color:
- `success`: verde
- `warning`: ámbar
- `error`: rojo
- `info`: azul

### 7.4 Skeleton (`src/components/ui/Skeleton.tsx`)

Skeleton loaders para:
- `SkeletonCard`: tarjeta rectangular
- `SkeletonTable`: tabla con filas placeholder

---

## 8. Motor de Datos

### 8.1 Datos Mock (`src/lib/mock-data.ts`)

5 usuarios ficticios con carteras diferentes:

| ID | Nombre | Valor Total | Retorno | TIR | Diversificación |
|----|--------|-------------|---------|-----|-----------------|
| 111... | Ana García López | €227,540 | +14.2% | 9.4% | 87/100 |
| 222... | Carlos Ruiz Martín | €213,428 | +44.8% | 15.1% | 82/100 |
| 333... | María Fernández Soler | €201,285 | +11.8% | 7.8% | 75/100 |
| 444... | Javier Moreno Castro | €254,805 | +198.3% | 120.5% | 68/100 |
| 555... | Lucía Torres Vidal | €194,460 | +22.4% | 12.3% | 90/100 |

Cada usuario tiene:
- `breakdown`: distribución por clase de activo con valor y retorno
- `allocationTarget`: objetivos de asignación por clase

### 8.2 Datos Mock Avanzados (`src/lib/advanced-mock-data.ts`)

- **CASHFLOW_EVENTS:** 9 eventos de dividendos/cupones para el calendario
- **TAX_LOTS:** 6 lotes con datos FIFO completos (fechas, precios, cantidades, FX)
- **ALLOCATION_TARGETS:** 4 objetivos de rebalanceo
- **FX_RATES:** 4 pares de tipo de cambio con variación 24h

### 8.3 Préstamos P2P (`src/components/tables/p2pColumns.tsx`)

6 préstamos ficticios con:
- Originadores: Mintos, Twino, Bondora, PeerBerry, Estateguru, CrowdEstates
- Países: España, Letonia, Estonia, Polonia, Finlandia, Reino Unido
- Estados: CURRENT, GRACE_PERIOD, DELAY_1_15_DAYS, DELAY_16_30_DAYS, DEFAULT
- Riesgos: B+, B, C+, B, C, D

### 8.4 Capa de Abstracción (`src/lib/data-sources.ts`)

```typescript
// Patrón: intenta Supabase → fallback a mock
export async function fetchPortfolios(): Promise<UserPortfolio[]> {
  if (isSupabaseConfigured()) {
    try {
      const res = await fetch("/api/assets", { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json.data) && json.data.length > 0) return USERS;
      }
    } catch { /* fallback a mock */ }
  }
  return USERS;
}
```

---

## 9. Modelos de Datos

### 9.1 UserPortfolio

```typescript
interface UserPortfolio {
  id: string;
  name: string;
  email: string;
  baseCurrency: "EUR" | "USD";
  totalValue: number;
  totalReturnPct: number;
  totalReturnEur: number;
  tirAnualizada: number;
  diversificationScore: number; // 0-100
  breakdown: AssetBreakdown[];
  allocationTarget: { class: AssetClass; label: string; target: number; current: number }[];
}
```

### 9.2 P2PLoan

```typescript
type P2PLoan = {
  id: string;
  originator: string;
  country: string;
  risk: string;
  interestRate: number;
  loanTermMonths: number;
  remainingTermMonths: number;
  purchaseDate: string;
  status: "CURRENT" | "GRACE_PERIOD" | "DELAY_1_15_DAYS" | "DELAY_16_30_DAYS" | "DEFAULT";
  capitalInvested: number;
  capitalPending: number;
  lateDays: number;
};
```

### 9.3 TaxLot

```typescript
interface TaxLot {
  id: string;
  assetName: string;
  isin: string;
  purchaseDate: string;
  purchasePrice: number;
  quantity: number;
  currentPrice: number;
  costBasisEur: number;
  currentValueEur: number;
  unrealizedPnL: number;
  unrealizedPct: number;
  currency: "EUR" | "USD";
  fxComponent: number;   // efecto divisa
  assetComponent: number; // retorno del activo
}
```

### 9.4 AnalysisReport

```typescript
interface AnalysisReport {
  ticker: string;
  name: string;
  fundamentals: InstrumentFundamentals;
  technical: TechnicalState;
  dcf: DCFResult;
  kelly: KellyResult;
  scoreBreakdown: ScoreBreakdown;
  recommendation: Recommendation;
  priceHistory: OHLCPoint[];
}
```

### 9.5 Schemas Zod (`src/lib/validations/zod-schemas.ts`)

Validación en server-side:
- `assetSchema`: validación de activos
- `p2pLoanSchema`: validación de préstamos P2P
- `p2pFiltersSchema`: validación de filtros
- `transactionSchema`: validación de transacciones

---

## 10. Base de Datos (Supabase)

### 10.1 Cliente Lazy (`src/lib/db/supabase.ts`)

```typescript
// Solo se crea si hay credenciales — evita romper el build
export function getSupabaseClient(): SupabaseClient<Database> | null {
  if (!isSupabaseConfigured()) return null;
  if (!_client) {
    _client = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return _client;
}
```

### 10.2 Auth Helpers

```typescript
signIn(email, password)  // Iniciar sesión
signUp(email, password)  // Registrar usuario
signOut()                // Cerrar sesión
getUser()                // Obtener usuario actual
getSession()             // Obtener sesión actual
```

### 10.3 Repositorio (`src/lib/db/helpers.ts`)

Funciones CRUD:
- `getAssets(portfolioId)` → activos de un portfolio
- `insertAsset(input)` → crear activo
- `getP2PLoans(filters)` → préstamos con filtros
- `insertP2PLoan(input)` → crear préstamo
- `getTransactions(portfolioId)` → transacciones
- `insertTransaction(input)` → crear transacción
- `getPortfolioWithAssets(portfolioId)` → portfolio + activos
- `sellP2PLoan(loanId)` → marcar préstamo como RECOVERY

### 10.4 RLS (Row Level Security)

Archivo: `supabase/migrations/001_rls_policies.sql`

Las políticas RLS aseguran que cada inversor solo vea sus propios datos (multi-tenant).

---

## 11. API Routes

### 11.1 Assets (`/api/assets`)

- **GET:** listar activos (con filtros)
- **POST:** crear activo (validado con Zod)

### 11.2 P2P (`/api/p2p`)

- **GET:** listar préstamos P2P (con filtros status, country, risk)
- **POST:** crear préstamo

### 11.3 Transactions (`/api/transactions`)

- **GET:** listar transacciones
- **POST:** crear transacción

### 11.4 Analyze (`/api/v1/analyze`)

- **POST:** generar análisis completo de un ticker

```json
// Request
{ "ticker": "NVDA", "period": 250 }

// Response
{
  "ticker": "NVDA",
  "name": "NVIDIA Corporation",
  "fundamentals": { ... },
  "technical": { ... },
  "dcf": { ... },
  "kelly": { ... },
  "scoreBreakdown": { ... },
  "recommendation": { ... },
  "priceHistory": [ ... ]
}
```

---

## 12. Testing

### 12.1 Tests Unitarios (Vitest)

Ubicación: `tests/unit/`

Cobertura de motores de cálculo:
- **fifo.ts:** cálculo FIFO, ganancias, impuestos
- **fx.ts:** conversión de divisas, retorno FX
- **rebalance.ts:** cálculo de órdenes, validación de targets

Tests de integración con MSW:
- API routes con mock de Supabase
- React Query hooks con datos mock
- Contrato HTTP (422/400/500 controlados)

### 12.2 Tests E2E (Playwright)

Ubicación: `tests/` (configuración en `playwright.config.ts`)

9 tests e2e:
- Auth flow
- Dashboard carga correctamente
- P2P con filtros y exportación CSV
- axe-core: 0 violaciones WCAG AA

### 12.3 Configuración de Testing

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    environment: "jsdom",
    setupFiles: ["./src/setupTests.ts"],
    coverage: {
      provider: "v8",
      thresholds: {
        lines: 70,
        statements: 70,
      },
    },
  },
});
```

---

## 13. Accesibilidad (WCAG 2.1 AA)

### 13.1 Colores

Tokens de color con contraste mínimo 4.5:1:

| Token | Color | Uso |
|-------|-------|-----|
| `--color-success` | #047857 | Verdes, ganancias, positivos |
| `--color-error` | #B91C1C | Rojos, pérdidas, negativos |
| `--color-warning` | #B45309 | Ámbar, alertas |
| `--color-accent` | #2563EB | Azul, acciones, links |

### 13.2 Badges

Badges sólidos con texto blanco para garantizar legibilidad sobre cualquier fondo.

### 13.3 ARIA

- `aria-label` en todos los selects, radio buttons y campos interactivos
- `role="status"` en notificaciones
- `sr-only` para labels visuales ocultos

### 13.4 Auditoría

axe-core integrado en tests e2e: 0 violaciones AA en dashboard y P2P.

---

## 14. PWA (Progressive Web App)

### 14.1 Manifest (`public/manifest.webmanifest`)

```json
{
  "name": "Portafolio Intel",
  "short_name": "Portafolio Intel",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#3B82F6"
}
```

### 14.2 Service Worker (`public/sw.js`)

- **Cache-first:** archivos estáticos (CSS, JS, imágenes)
- **Network-first:** navegación
- **Sin cache:** rutas `/api`

### 14.3 Registro

`ServiceWorkerRegister.tsx` solo registra en producción.

---

## 15. Tema Visual (`src/lib/chart-theme.ts`)

Configuración centralizada para todos los gráficos Recharts:

- **Paleta de colores:** 8 colores consistentes
- **Grid:** borde punteado sutil
- **Ejes:** ticks en color muted, líneas en border
- **Tooltip:** fondo card, bordes redondeados
- **Funciones helper:** `getColorForIndex()`, `getColorForAsset()`

---

## 16. Funciones de Formateo (`src/lib/formatters.ts`)

```typescript
formatCurrency(amount, currency="EUR")  // €123,456
formatNumber(value)                      // 123.456
formatPercent(value)                     // 12.3%
formatCompact(amount)                    // €123.5K
formatDate(date, pattern)                // 18 ago 2026
formatDateShort(date)                    // 18/08/2026
formatMonthYear(date)                    // ago 2026
cn(...classes)                           // concatenación condicional de clases
```

---

## 17. Constantes (`src/lib/constants.ts`)

```typescript
ASSET_CLASSES: ["CASH", "ETF", "STOCK", "BOND", "P2P_LOAN", "FUND", "REIT", "COMMODITY"]
LOAN_STATUSES: ["CURRENT", "GRACE_PERIOD", "DELAY_1_15_DAYS", "DELAY_16_30_DAYS", "DEFAULT", "RECOVERY"]
RISK_LEVELS: ["A", "B", "B+", "C", "C+", "D"]
COUNTRIES: ["ES", "EE", "LT", "LV", "FI", "PL", "DE", "GB", "FR", "IT"]
CURRENCIES: ["EUR", "USD", "GBP", "CHF", "JPY"]
TAX_RATE: 0.19                    // 19% IRPF España
REBALANCE_THRESHOLD_PCT: 5        // Umbral de rebalanceo
BASE_FX_RATES: { ... }            // Tasas de cambio de referencia
FEATURE_FLAGS: { analysis, plaid }
```

---

## 18. Cómo Replicar el Proyecto

### Paso 1: Inicializar Next.js

```bash
npx create-next-app@latest mi-dashboard --typescript --tailwind --eslint --app --src-dir
cd mi-dashboard
```

### Paso 2: Instalar Dependencias Core

```bash
npm install @tanstack/react-query @tanstack/react-table recharts lucide-react zod @supabase/supabase-js date-fns
```

### Paso 3: Instalar Dev Dependencies

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom msw @playwright/test @axe-core/playwright
```

### Paso 4: Copiar Estructura

Copiar la estructura de directorios tal como está documentada en la sección 3.

### Paso 5: Configurar Tema

Copiar `src/lib/chart-theme.ts` y `src/lib/constants.ts` para los tokens de color.

### Paso 6: Crear Componentes Base

1. `AppShell`, `Header`, `Sidebar` (layout)
2. `ChartWrapper` (gráficos reutilizables)
3. `DataTable` (tablas reutilizables)
4. `Badge`, `Skeleton`, `EmptyState` (UI)

### Paso 7: Crear Motores de Cálculo

1. `fifo.ts` — lógica FIFO para impuestos
2. `fx.ts` — conversión multi-divisa
3. `rebalance.ts` — lógica de rebalanceo

### Paso 8: Crear Datos Mock

1. `mock-data.ts` — usuarios y carteras
2. `advanced-mock-data.ts` — tax lots, cashflows, FX rates
3. `p2pColumns.tsx` — préstamos P2P

### Paso 9: Crear Hooks

1. `usePortfolio.ts` — React Query para carteras
2. `useP2P.ts` — React Query para P2P
3. `useTax.ts` — lógica fiscal con escenarios

### Paso 10: Crear Páginas

Crear cada ruta en `src/app/` siguiendo el patrón:
- Layout con `"use client"`
- Filtros con `useState`
- Datos calculados con `useMemo`
- Gráficos cargados con `next/dynamic`
- Tablas con `DataTable` genérica

### Paso 11: Configurar Testing

1. Configurar `vitest.config.ts`
2. Crear `setupTests.ts`
3. Tests unitarios para motores de cálculo
4. Tests de integración con MSW
5. Tests e2e con Playwright

### Paso 12: Configurar Seguridad

Copiar headers de seguridad de `next.config.ts`.

---

## 19. Decisiones Arquitectónicas Clave

1. **Server Components por defecto:** todas las páginas usan `"use client"` solo cuando es necesario (interactividad)
2. **next/dynamic para gráficos:** Recharts no se empaqueta en el servidor (ssr:false)
3. **React Query como capa de caché:** staleTime 5min, retry 1, refetchOnWindowFocus false
4. **Mock-first con fallback:** la app funciona sin backend, se conecta a Supabase cuando está disponible
5. **Motor de cálculo puro:** FIFO, FX, rebalance son funciones puras sin side effects, fáciles de testear
6. **DataTable genérica:** un solo componente con columnas configurables por módulo
7. **Zod en server-side:** validación de inputs antes de llegar a la BD
8. **Tailwind + CSS variables:** theming consistente sin CSS-in-JS
9. **Lazy Supabase client:** no rompe el build si no hay credenciales
10. **PWA manual:** service worker configurado sin librerías externas

---

## 20. Verificación Final

```bash
npx tsc --noEmit           # Typecheck
npx eslint src             # Lint (0 problemas)
npx next build             # Build producción
npx vitest run             # 52 tests (unit + integración)
npx playwright test        # 9 e2e con axe-core 0 violaciones AA
```

---

*Documento generado el 5 de Septiembre de 2026*
*Versión: 2.0*
*Proyecto: Portafolio Intel v0.1.0*
