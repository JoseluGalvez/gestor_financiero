# Demostración de importación desde Google Sheets

**Estado:** hoja ficticia creada; lectura de previsualización verificada; **cero filas escritas en Supabase**.

> La hoja y todas las filas de esta demostración contienen datos ficticios. No representan inversiones, entidades, precios ni recomendaciones reales.

## Hoja de prueba

| Campo | Valor |
|---|---|
| Nombre | Portafolio Intel — Datos ficticios de importación |
| URL | https://docs.google.com/spreadsheets/d/1CndN_QiwH6Q2H-rNsML0jAjuuok74IDzG_a8u5A-uWo/edit |
| ID | `1CndN_QiwH6Q2H-rNsML0jAjuuok74IDzG_a8u5A-uWo` |
| Pestaña | `Transacciones ficticias` |
| Rango probado | `A1:I7` |
| Uso autorizado | Prueba del formulario y previsualización; no usar para datos reales. |

## Configuración que debe introducirse en la aplicación

| Campo del formulario | Valor de prueba |
|---|---|
| Nombre visible | `Google Sheets · Datos ficticios` |
| URL o ID | URL o ID de la tabla anterior |
| Pestaña | `Transacciones ficticias` |
| Rango | `A1:I7` |
| Fecha | `Fecha` |
| Instrumento | `Instrumento` |
| Tipo | `Tipo` |
| Cantidad | `Cantidad` |
| Precio | `Precio` |
| Divisa | `Divisa` |

## Previsualización obtenida en modo lectura

La API de Google Sheets devolvió los encabezados esperados y seis filas de datos. La lectura solo inspeccionó el rango indicado y no modificó la hoja ni la base de datos.

| Fecha | Instrumento | Tipo | Cantidad | Precio | Divisa | ISIN | Comisiones | Notas |
|---|---|---|---:|---:|---|---|---:|---|
| 2026-01-03 | Fondo Atlas Simulado | buy | 12,5 | 104,20 | EUR | DEMO00000001 | 1,50 | DATO FICTICIO |
| 2026-01-17 | Empresa Boreal Demo | buy | 8 | 57,35 | EUR | DEMO00000002 | 0,80 | DATO FICTICIO |
| 2026-02-01 | Fondo Atlas Simulado | dividend | 0 | 1,24 | EUR | DEMO00000001 | 0 | DATO FICTICIO |
| 2026-02-12 | Préstamo Cobalto Demo | interest | 0 | 16,75 | EUR | DEMO00000003 | 0 | DATO FICTICIO |
| 2026-03-02 | Empresa Boreal Demo | sell | 3 | 61,10 | EUR | DEMO00000002 | 0,50 | DATO FICTICIO |
| 2026-03-15 | Efectivo de prueba | deposit | 0 | 500,00 | EUR | DEMO00000004 | 0 | DATO FICTICIO |

## Flujo seguro de previsualización

El formulario de **Fuentes** solicita el identificador/URL de la hoja, pestaña, rango y seis encabezados. Al guardar, la configuración se persiste en `data_sources.connection_config` con estado `pending`. La política RLS solo permite esta escritura a los roles `owner` y `editor` de la organización correspondiente. La configuración no contiene tokens, contraseñas ni datos de fila.

La siguiente etapa de producción es una función de servidor con OAuth de solo lectura. Esa función realizará el primer acceso al rango autorizado, comparará encabezados, validará fechas, tipos de operación, números y divisas, y devolverá una previsualización con filas aceptadas/rechazadas. Solo una confirmación posterior creará un `sync_run` e insertará transacciones; por tanto, una previsualización nunca escribe por sí misma en Supabase.

## Estado del Módulo Extra de Análisis Financiero

| Capacidad | Estado | Fuente de datos requerida |
|---|---|---|
| Score ponderado y cobertura | Implementado, bloqueado bajo 60 % de cobertura. | `analysis_runs.factor_scores` con fuentes trazables. |
| DCF y valor terminal | Implementado con validaciones de WACC, crecimiento y diez FCF. | Fundamentales y proyecciones documentadas. |
| SMA, MACD, RSI, Bollinger y ATR | Implementados como funciones puras. | Serie OHLC permitida y suficiente. |
| Volatilidad, drawdown, Sharpe y Kelly conservador | Implementados con advertencias de entradas inválidas o incompletas. | Serie de precios y escenario explícito. |
| Visualización de resultados | Implementada; consulta `analysis_runs` y se actualiza por Realtime. | Una ejecución persistida por un proceso backend. |
| Recomendaciones de compra/venta | No implementadas intencionalmente. | Fuera del alcance: el módulo es informativo y explicable. |

## Estado de gráficos Recharts y Realtime

| Elemento | Estado | Origen |
|---|---|---|
| `AreaChart` de valor de cartera | Implementado. | `portfolio_snapshots`, no datos estáticos. |
| KPIs de valor, resultado y variación | Implementados. | Últimas instantáneas persistidas. |
| Suscripción Realtime | Implementada. | Cambios en snapshots, cotizaciones, alertas, fuentes, reglas y análisis. |
| Sparklines de cotización externa | Pendientes de un feed licenciado y un sincronizador backend. | `market_quotes` cuando exista proveedor autorizado. |
| Actualización sin recargar | Implementada para cambios emitidos por Supabase Realtime. | Canal de la organización autenticada. |

La hoja ficticia prueba el **primer paso de lectura y validación de columnas**. La importación de datos reales se habilitará después de configurar OAuth de Google en el servidor y añadir una pantalla de confirmación que muestre filas aceptadas/rechazadas antes de crear movimientos financieros.
