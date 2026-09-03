# Módulo de análisis financiero: alcance implementado

**Autor:** Manus AI  
**Estado:** preparado para ejecutar cálculos cuando existan datos trazables y permitidos.  
**Propósito:** consolidar datos reportados, cálculos cuantitativos y advertencias de cobertura en una vista explicable.

> **Límite del módulo.** El sistema presenta métricas y observaciones informativas. No emite recomendaciones personalizadas de compra, venta, permanencia o dimensionamiento de posiciones, no ejecuta órdenes y no garantiza resultados.

## Capacidades incorporadas

| Bloque | Implementación | Condición de publicación |
|---|---|---|
| Score ponderado | Seis factores con pesos 20/20/20/15/15/10. | Requiere al menos 60 % de peso con datos en escala 0–100. |
| DCF | Diez FCF proyectados, descuento de flujos y valor terminal. | Requiere WACC superior a la tasa de crecimiento terminal y entradas completas. |
| Tendencia y técnico | SMA 20/50/200, MACD, RSI 14, Bandas de Bollinger y ATR 14. | Requiere series OHLC válidas; el módulo declara las observaciones faltantes. |
| Riesgo | Volatilidad anualizada, máximo drawdown y Sharpe. | Requiere un histórico mínimo de precios válido. |
| Kelly conservador | Fracción completa y media fracción a partir de un escenario documentado. | Requiere probabilidad y relación ganancia/pérdida explícitas; no prescribe una posición. |
| Persistencia | `analysis_runs` con inputs, fuentes, advertencias, fecha y cobertura. | RLS por organización y actualizaciones mediante Realtime. |

## Puntuación y cobertura

El score se normaliza exclusivamente sobre los factores disponibles. Cuando faltan factores que representan más del 40 % del peso total, la puntuación se bloquea y la ejecución se identifica como incompleta. Este mecanismo evita que una cifra aparentemente precisa oculte la ausencia de estados financieros, precios o hipótesis.

| Factor | Peso | Datos mínimos esperados |
|---|---:|---|
| Salud financiera | 20 % | Liquidez, solvencia, endeudamiento y periodo contable. |
| Crecimiento | 20 % | Ingresos, beneficio y EBITDA comparables por periodos. |
| Valoración | 20 % | Ratios, sector/mercado de contraste y fecha de cálculo. |
| Ventaja competitiva | 15 % | Evidencia estructurada, fuente y fecha de revisión. |
| Técnico / momentum | 15 % | Serie OHLC con licencia y fecha de mercado. |
| Gestión de riesgos | 10 % | Retornos, horizonte de observación y tipo sin riesgo declarado. |

## DCF y fórmulas

El motor requiere una serie de diez flujos de caja libre y calcula el valor terminal con la ecuación solicitada:

> **TV = FCF₁₀ × (1 + g) / (WACC − g)**

Posteriormente descuenta cada flujo y el valor terminal. Se bloquea el resultado si `WACC ≤ g`, si faltan proyecciones o si las acciones en circulación no son positivas. El valor por acción no se muestra sin un número válido de acciones y deuda neta con fecha de fuente.

## Interfaz y tiempo real

La sección **Análisis** consulta `analysis_runs` de la organización autenticada y se suscribe a cambios de Supabase Realtime. Cada fila presenta instrumento, estado, cobertura, score si se puede publicar, DCF por acción si se puede publicar y número de advertencias. La interfaz permanece en estado de ausencia de datos hasta que un conector o proceso autorizado persiste resultados; no crea datos de ejemplo.

## Trazabilidad de cada ejecución

| Campo | Finalidad |
|---|---|
| `as_of` | Fecha de corte del cálculo. |
| `factor_scores` | Entradas de scoring por factor. |
| `dcf_inputs` | Hipótesis y proyecciones que permiten reproducir el DCF. |
| `technical_summary` | Indicadores derivados de la serie permitida. |
| `risk_summary` | Volatilidad, drawdown, Sharpe y parámetros de observación. |
| `kelly_inputs` | Escenario explícito que alimenta la fórmula. |
| `source_manifest` | Fuente, licencia, fecha, identificador y cobertura de los datos. |
| `warnings` | Datos faltantes, hipótesis inválidas y limitaciones de interpretación. |

## Siguiente requisito de datos

El módulo ya contiene el esquema, los cálculos y la vista. Para generar la primera ejecución real debe conectarse una fuente de fundamentales y una serie de precios con uso permitido. El conector SEC EDGAR puede alimentar fundamentales de emisores estadounidenses, y el BCE tipos de cambio de referencia; no sustituyen una licencia de cotizaciones en vivo. La decisión sobre un feed comercial debe seguir el inventario de mercados e instrumentos que realmente se mostrarán a usuarios externos.
