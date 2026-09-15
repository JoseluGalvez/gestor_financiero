# Portafolio Intel — Dashboard de Inversión All-in-One

> **Tu cartera de inversión, analizada en un solo lugar.**

Portafolio Intel es la plataforma de gestión patrimonial que necesitas para monitorizar, analizar y tomar decisiones sobre todas tus inversiones sin cambiar de pestaña. Fondos indexados, ETFs, préstamos P2P, bonos, liquidez, impuestos, rebalanceo y análisis técnico: todo convergente en un panel único, preciso y elegante.

No más copiar datos entre hojas de cálculo. No más dudas sobre cuánto pagarás en impuestos. No más estrés ante un rebalanceo.

---

## ¿Qué es Portafolio Intel?

Portafolio Intel es una aplicación web FinTech/WealthTech que consolida la visión completa de tu cartera de inversión en un único dashboard interactivo. Diseñada para inversores particulares, asesores financieros y pequeños fondos, reúne en una sola interfaz lo que otras plataformas reparten en 5 o 6 herramientas distintas.

**Un panel de control único** para que puedas monitorizar, analizar y gestionar tus inversiones en múltiples clases de activos — Fondos Indexados, ETFs, Crowdlending/Préstamos P2P, Bonos y Liquidez — sin saltar entre diferentes plataformas.

---

## Módulos y Funcionalidades

### MÓDULO A — Dashboard Consolidado

El corazón de Portafolio Intel. Un tablero ejecutivo con:

- **Selector de usuario:** visualiza la cartera de un inversor concreto o la vista consolidada de todos ellos (multi-tenant).
- **KPIs principales:** valor total, retorno anualizado (TIR), diversificación, plusvalía latente.
- **Gráfico de evolución temporal:** área interactiva con rangos 1A/3A/5A que muestra la evolución del patrimonio.
- **Distribución de activos:** gráfico de donut con desglose por clase (ETF, P2P, RV, Bonos, Efectivo) y porcentaje de cada una.
- **Tabla de rebalanceo:** comparación visual objetivo vs actual con indicadores BUY/SELL/HOLD en tiempo real.

### MÓDULO B — Préstamos P2P / Crowdlending

Para inversores en plataformas como Mintos, Twino, Bondora, PeerBerry o Estateguru:

- **KPIs especializados:** total invertido, interés medio ponderado, plazo promedio, diversificación geográfica (países).
- **Filtros inteligentes:** por estado (corriente, periodo de gracia, mora, impago), país y nivel de riesgo — con radio buttons y filtros combinados.
- **Tabla interactiva con paginación, sorting y exportación CSV.**
- **Botón "Vender" funcional:** simulación de venta en mercado secundario con confirmación persistente (localStorage) y toast de notificación.
- **Gráficos de distribución:** por tramos de interés y por tramos de plazo.

### MÓDULO C — Renta Variable y Fondos

Vista de tus fondos indexados y acciones:

- **Tabla con sparklines:** gráficos de tendencia inline (SVG) para cada posición.
- **KPIs:** valor total, variación diaria, número de posiciones activas.

### Simulador Fiscal (Tax Tracker)

Planificación de impuestos con regla FIFO (First In, First Out):

- **Escenarios de venta:** simula vender el 100%, 50% o 25% de tu cartera.
- **Motor FIFO real:** calcula plusvalía realizada, impuesto estimado (19% IRPF) y efecto divisa por separado.
- **Tabla de lotes:** desglose por fecha de adquisición, precio de compra, valor actual y ganancia no realizada.

### Rebalanceo Automático

Mantén tu estrategia de inversión en línea con tus objetivos:

- **Targets editables:** ajusta el porcentaje objetivo de cada clase de activo.
- **Motor de cálculo:** genera órdenes BUY/SELL/HOLD para cada clase con el monto exacto en euros.
- **Validación en tiempo real:** el desviador se actualiza al modificar los targets.

### Calendario de Dividendos y Cupones

Planifica tus flujos de efectivo:

- **Heatmap estilo GitHub:** visualización de días con ingresos (verde) y gastos (rojo) en formato calendario.
- **Proyección 6 meses:** gráfico de barras con los próximos 6 meses proyectados.
- **KPIs de flujo:** ingresos totales del mes, gastos, saldo neto.

### Multi-divisa

Para inversores internacionales:

- **Desglose retorno activo vs. retorno FX:** separa cuánto ganaste del activo y cuánto perdiste (o ganaste) por la divisa.
- **Activos por divisa:** tabla con cada posición, su divisa, valor y retorno desglosado.

### Integración Bancaria

Simulación de conexión con instituciones financieras:

- **Instituciones conectadas:** BBVA, Santander, CaixaBank (demo).
- **Flujo de datos:** arquitectura Plaid/Tink simulada con sincronización periódica.
- **Tabla de tipos de cambio:** monedas principales con variación.

---

## Arquitectura Técnica

### Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| **Frontend** | Next.js 16 (App Router) + React 19 + TypeScript |
| **Estilos** | Tailwind CSS v4 con tokens semánticos WCAG AA |
| **Gráficos** | Recharts v3 (bar, pie, area) + ChartWrapper reutilizable |
| **Tablas** | TanStack Table v8 (sorting, filtrado, paginación, export CSV) |
| **Estado** | React Query v5 (staleTime 5min, caché inteligente) |
| **Tests** | Vitest (unit + integración) + Playwright (e2e) + axe-core |
| **BD** | Supabase (PostgreSQL) con RLS multi-tenant |
| **Auth** | Supabase Auth helpers (signIn/signUp/signOut) |
| **Validación** | Zod (schemas en API routes y server actions) |
| **PWA** | Service worker manual (cache-first estáticos, network-first navegación) |
| **Bundle** | next/dynamic con ssr:false para code-splitting de gráficos |

### Seguridad

- Headers de seguridad: CSP, HSTS, X-Frame-Options (DENY), Referrer-Policy, Permissions-Policy.
- Validación Zod en todas las API routes con respuestas 422/400 controladas.
- RLS (Row Level Security) en Supabase para aislamiento multi-tenant.
- Service Worker sin cache de rutas `/api` para evitar datos obsoletos.
- Autenticación con server actions (sin transferencia de credenciales al cliente).

### Accesibilidad (WCAG 2.1 AA)

- Tokens de color ajustados a contraste mínimo 4.5:1: verde #047857, rojo #B91C1C, ámbar #B45309, azul #2563EB.
- Badges sólidos con texto blanco para garantizar legibilidad.
- `aria-label` en todos los selects, radio buttons y campos interactivos.
- Audit axe-core integrado en tests e2e: 0 violaciones AA en dashboard y P2P.

### Testing

- **52 tests** en 10 archivos: motores de cálculo (fifo, fx, rebalance), hooks con MSW, contrato HTTP de API routes.
- **Cobertura de código:** 72.7% sentencias, 75.6% líneas, 68.4% funciones.
- **9 tests e2e** en Playwright (chromium): auth, dashboard, P2P con filtros y exportación CSV.
- **axe-core 0 violaciones AA** en las páginas principales.

---

## Beneficios para el Cliente

### Por qué Portafolio Intel cambia la forma de gestionar inversiones

1. **Visión 360° sin esfuerzo:** consolidation automática de todas las clases de activo en un solo panel. Sin exportar CSVs entre plataformas.

2. **Decisiones fiscales informadas:** el simulador FIFO calcula exactamente cuánto pagarás en impuestos antes de vender. Puedes comparar escenarios (vender todo, mitad, cuarto) en un clic.

3. **Rebalanceo sin estrés:** introduce tus objetivos, haz clic, y obtén las órdenes exactas para volver a la alineación estratégica.

4. **Control de riesgo P2P:** interest rate ponderado, estado de cada préstamo, diversificación geográfica y un botón de venta en mercado secundario integrado.

5. **Multi-divisa inteligente:** separa el retorno de tu activo del efecto divisa para entender realmente cuánto ganas y cuánto pierdes por las fluctuaciones de tipo de cambio.

6. **Accesibilidad y usabilidad:** diseño WCAG AA, badges con colores sólidos, aria-labels, y una interfaz minimalista estilo FinTech (inspirada en Mintos/MyInvestor).

7. **PWA sin instalación:** funciona desde el navegador, se instala como app en el escritorio o móvil, y tiene modo offline para consultas rápidas.

8. **Multi-tenant nativo:** cada inversor ve solo su cartera. Los administradores pueden alternar entre usuarios o ver la vista consolidada.

9. **Tests exhaustivos:** 52 tests automatizados + 9 e2e + axe-core = confianza en cada despliegue.

10. **Escalabilidad real:** arquitectura preparada para conectar Supabase real (credenciales = producción) sin cambios de código.

### Para inversores particulares

- Deja de perder tiempo saltando entre Mintos, MyInvestor, tu banco y Excel.
- Sabe exactamente cuánto pagarás de impuestos antes de vender.
- Rebalancea tu cartera en 3 clics sin calcular nada manualmente.

### Para asesores financieros

- Gestiona múltiples carteras de clientes desde un mismo panel.
- Exporta datos con un clic para incluir en informes a clientes.
- Toma decisiones de rebalanceo basadas en datos, no en intuición.

### Para pequeños fondos / family offices

- Consolidación multi-divisa con desglose preciso del efecto FX.
- Simulación fiscal para optimizar el momento de venta.
- Arquitectura multi-tenant que escala con el número de inversores.

---

## Futuras Mejoras

### Corto plazo

- **Backend real:** Conexión completa con Supabase para persistencia de datos en producción. Reemplazo de mock-data con queries optimizadas e índices.

- **API Routes avanzadas:** endpoints `/api/webhooks/plaid` y `/api/webhooks/tink` para sincronización real con cuentas bancarias e instituciones financieras.

- **Autenticación completa:** integración con Supabase Auth para login/registro real con email verification, password reset y sesiones persistentes.

- **Gráficos dinámicos:** Recharts con datos en tiempo real procedentes de la base de datos, no de datos estáticos. Dashboards que se actualizan automáticamente.

### Medio plazo

- **Tablas enterprise:** migración a AG Grid / TanStack Table con virtualización para carteras con miles de posiciones. Agrupación, pivoting y exportación a Excel.

- **Sparklines en tiempo real:** conexión WebSocket para cotizaciones en vivo. Los gráficos de tendencia se actualizan sin recargar la página.

- **PDF Reports:** generación de informes profesionales del Tax Tracker, Calendario de dividendos y Portfolio Summary listos para enviar a clientes o Hacienda.

- **Alertas inteligentes:** notificaciones push de mora en préstamos P2P, dividendos próximos, desviaciones de rebalanceo que superen un umbral configurable, y cambios significativos en tipos de cambio.

### Largo plazo

- **ML para predicción:** modelos de machine learning para estimar TIR futura, riesgo de default en préstamos P2P y recomendaciones de rebalanceo basadas en datos históricos.

- **Conexión bancaria real:** integración con Plaid/Tink en producción para sincronización automática de cuentas, transacciones y dividendos recibidos.

- **Mobile App:** aplicación nativa con React Native que comparte la lógica de negocio con la web. Consultas rápidas desde el móvil sin abrir el navegador.

- **Compliance automático:** cumplimiento RGPD, auditoría fiscal automática, generación de modelos 720/721 para la Agencia Tributaria.

---

## Módulo Extra: Análisis Financiero

Un módulo avanzado de análisis de inversiones basado en metodologías de inversión cuantitativa profesional.

### Scoring System

Motor de puntuación 0-100 con pesos ponderados:

| Factor | Peso | Descripción |
|--------|------|-------------|
| Salud Financiera | 20% | Ratios de liquidez, solvencia y endeudamiento |
| Crecimiento | 20% | Evolución de ingresos, beneficios y EBITDA |
| Valoración | 20% | P/E, P/B, EV/EBITDA vs sector y histórico |
| Ventaja Competitiva | 15% | Posicionamiento de mercado, marca, barreras de entrada |
| Técnico / Momentum | 15% | Tendencia de precio, volumen, indicadores |
| Gestión de Riesgos | 10% | Volatilidad, drawdown máximo, ratio Sharpe |

### Modelo DCF (Descuento de Flujos de Efectivo)

Cálculo automático del valor intrínseco con valor terminal:

**TV = FCF₁₀ × (1 + g_terminal) / (WACC - g_terminal)**

donde FCF₁₀ es el flujo libre de efectivo del año 10, g_terminal es la tasa de crecimiento terminal (2% por defecto) y WACC es el coste medio ponderado del capital.

### Análisis Técnico

Detección automática de patrones e indicadores:

- **Medias móviles:** SMA 20, SMA 50, SMA 200 y cruces (Golden Cross / Death Cross).
- **MACD:** línea MACD, línea de señal e histograma.
- **RSI 14:** índice de fuerza relativa con zonas de sobrecompra (>70) y sobreventa (<30).
- **Bandas de Bollinger:** detección de volatilidad y %b para identificar posiciones relativas.
- **ATR:** rango verdadero medio para gestión de stop-loss.

### Position Sizing — Criterio de Kelly

Cálculo de la posición óptima según la teoría de la información:

**f* = (bp - q) / b**

donde b es la ganancia potencial por unidad apostada, p es la probabilidad de ganar y q = 1 - p. La fracción resultante (Kelly fraction) se reduce a la mitad para obtener la "fracción Kelly" más conservadora.

### Recomendación de Inversión

| Score | Recomendación | Acción sugerida |
|-------|---------------|----------------|
| ≥ 90 | Alta Convicción | Compra agresiva |
| 80 – 89 | Compra | Compra moderada |
| 70 – 79 | Mantener | No nuevas posiciones, mantener actuales |
| 60 – 69 | Neutral | Observar, sin acción |
| < 60 | Venta / Evitar | Reducir posición o no entrar |

### Stack del Módulo de Análisis

- **Frontend:** Next.js 16 + React 19 + Tailwind v4 + Recharts + TanStack Table
- **Backend:** Python FastAPI + LangGraph + LangChain en Google Cloud Run / AWS Lambda
- **Base de datos:** Supabase (PostgreSQL + pgvector para RAG)
- **IA:** OpenAI GPT-4o para análisis agente
- **APIs de datos:** SEC EDGAR, CNMV, Polygon.io, Alpha Vantage, TradingView

### Ventajas del Módulo de Análisis (cuando esté terminado)

1. **Análisis automatizado:** sin necesidad de abrir múltiples webs para consultar fundamentales, técnicos y valoración. Todo en un solo informe generado automáticamente.

2. **Recomendaciones accionables:** cada instrumento recibe una puntuación de 0 a 100 con una recomendación clara (comprar, mantener, vender) y el tamaño de posición óptimo según Kelly.

3. **Integración con la cartera existente:** los resultados del análisis se vinculan directamente con las posiciones actuales de la cartera, permitiendo tomar decisiones basadas en datos combinados (tu posición + el análisis).

4. **Análisis técnico sin configurar:** detección automática de cruces, divergencias y señales. Sin necesidad de configurar alertas o indicadores manualmente.

5. **Valoración DCF automática:** el modelo de descuento de flujos se ejecuta con datos actualizados, eliminando la necesidad de spreadsheets complejos.

6. **IA explicable:** el motor LangChain genera explicaciones en lenguaje natural de por qué un instrumento recibe una determinada puntuación, facilitando la comprensión para inversores no expertos.

---

## Estado Actual de la Aplicación

### Lo que ya está terminado y verificado

- 15 rutas funcionales con prerenderizado estático.
- 52 tests automatizados (unitarios + integración) pasando.
- 9 tests e2e en Playwright con axe-core 0 violaciones WCAG AA.
- Build de producción limpio sin errores TypeScript.
- ESLint con 0 problemas.
- Cobertura de código: 72.7% sentencias / 75.6% líneas.
- PWA instalable con service worker y offline capability.
- Headers de seguridad (CSP, HSTS, X-Frame-Options) activos.
- Diseño WCAG AA (contraste de color 4.5:1, aria-labels, badges sólidos).
- 4 ADRs documentados (Server Components, Server Actions, TanStack Table, fallback mock).

### Lo que queda pendiente (requiere decisión del cliente)

- Conexión con Supabase real (configuración de credenciales).
- i18n (internacionalización) — el panel está en español, con next-intl listo para traducir.
- Módulo de análisis financiero (FASE 8) — el stack y la arquitectura están definidos.
- Storybook para documentación de componentes.
- CI/CD pipeline (GitHub Actions).

---

**Portafolio Intel** — Gestión patrimonial inteligente, sin complejidad.

*Documento generado el 18 de Agosto de 2026*