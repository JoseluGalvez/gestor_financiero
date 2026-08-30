# Diseño técnico propuesto: TWR, MWR/XIRR y contrato de calidad/procedencia

**Estado:** propuesta de arquitectura; no se han aplicado migraciones, RPC, Edge Functions, conectores, automatizaciones ni cambios de interfaz.  
**Ámbito:** cartera autenticada de Portafolio Intel. El Canvas local continúa aislado, sin red, Supabase, IA ni persistencia automática.  
**Objetivo:** transformar datos conciliados en métricas de rendimiento reproducibles, con cobertura, fuentes, método, periodo y advertencias visibles.

## 1. Principios de diseño

El motor no debe devolver un número aislado. Cada rendimiento debe publicarse como una **métrica con contexto**, o no publicarse. TWR y MWR/XIRR resuelven preguntas distintas: TWR aproxima el resultado de la cartera aislando los flujos externos; MWR/XIRR representa la experiencia monetaria de quien aporta o retira fondos en fechas concretas. CFA Institute distingue ambas medidas y sus usos de evaluación. [1]

> Regla de publicación: si faltan valoraciones en los límites necesarios, divisas, clasificación de flujos o trazabilidad de la fuente, el resultado será `partial` o `not_available`; nunca se rellenará con una estimación silenciosa.

| Principio | Decisión técnica |
|---|---|
| Reproducibilidad | Persistir versión de método, periodo, divisa base, huella de entradas, advertencias y enlaces de procedencia. |
| Separación de responsabilidades | Normalizar y validar datos en servidor; calcular/agregar en un servicio determinista; presentar una envolvente de métrica en React. |
| Inmutabilidad práctica | Una ejecución cerrada de métricas no se sobrescribe: una corrección crea una versión posterior con su propia procedencia. |
| Fallo seguro | La ausencia de precondiciones devuelve un estado explicable, no `0 %`, `NaN` ni una recomendación. |
| Privacidad | Las fuentes y cálculos persistidos siguen RLS por organización y cartera. El modo local conserva su contrato de memoria efímera. |

## 2. Arquitectura propuesta

```text
Fuente autorizada / importación validada
                │
                ▼
        source_batches (huella, esquema, versión, estado)
                │
        ┌───────┴────────────────┐
        ▼                        ▼
Transacciones normalizadas   Valoraciones/FX normalizados
        │                        │
        └───────────┬────────────┘
                    ▼
       Validador de calidad y clasificación de flujos
                    │
                    ▼
     Motor determinista de rendimiento y atribución
       ├── TWR por subperiodos
       ├── MWR/XIRR por flujos fechados
       └── puente de valor, cobertura y advertencias
                    │
                    ▼
 metric_runs + metric_lineage + metric_components (inmutables)
                    │
                    ▼
 RPC de solo lectura / consulta con RLS → Dashboard y PDF
```

El cálculo se ejecutaría **después** de que los datos de una fuente estén conciliados y no directamente desde el navegador. Esto impide que dos clientes creen resultados divergentes y permite conservar una versión y una procedencia verificables. Una actualización Realtime debe notificar que existe una nueva versión de métrica, no transportar todo el conjunto de transacciones al cliente.

## 3. Modelo de datos propuesto

Las tablas actuales `transactions`, `positions`, `portfolio_snapshots`, `data_sources`, `analysis_runs` y `alerts` no se eliminan. La propuesta añade entidades de cálculo; los nombres son orientativos y requieren una migración aprobada.

| Tabla propuesta | Claves y columnas esenciales | Propósito |
|---|---|---|
| `source_batches` | `id`, `organization_id`, `portfolio_id`, `data_source_id`, `received_at`, `schema_fingerprint`, `input_hash`, `status`, `row_count`, `source_version` | Identifica una lectura/importación autorizada y su estado de validación. |
| `valuation_points` | `id`, `organization_id`, `portfolio_id`, `as_of`, `market_value_base`, `base_currency`, `source_batch_id`, `pricing_status`, `fx_status`, `quality_context_id` | Guarda puntos de valoración aptos para rendimiento, no solo una cifra agregada sin contexto. |
| `cash_flow_events` | `id`, `organization_id`, `portfolio_id`, `occurred_at`, `amount_base`, `flow_kind`, `is_external`, `source_transaction_id`, `source_batch_id`, `quality_context_id` | Clasifica aportaciones, retiros, dividendos pagados, intereses retirados, comisiones, impuestos y ajustes. |
| `quality_contexts` | `id`, `organization_id`, `as_of`, `freshness_status`, `valuation_coverage_pct`, `fx_coverage_pct`, `cost_coverage_pct`, `classification_coverage_pct`, `warnings`, `input_hash` | Resume calidad de las entradas usadas por una valoración o métrica. |
| `metric_runs` | `id`, `organization_id`, `portfolio_id`, `metric_key`, `period_start`, `period_end`, `base_currency`, `value`, `status`, `method_version`, `inputs_hash`, `quality_context_id`, `computed_at`, `warnings` | Publica la métrica y su contexto, como una ejecución inmutable. |
| `metric_components` | `metric_run_id`, `component_key`, `amount_base`, `coverage_pct`, `details` | Conserva el puente de valor: flujos, mercado, FX, costes, impuestos y residuo. |
| `metric_lineage` | `metric_run_id`, `source_batch_id`, `entity_kind`, `entity_id`, `role`, `as_of` | Relaciona cada resultado con los lotes y entidades de entrada. |

Todas las tablas nuevas deben incluir `organization_id` y `portfolio_id` donde aplique. Las políticas RLS propuestas deben restringir `SELECT` a miembros de la organización y `INSERT/UPDATE` a roles autorizados o a funciones server-side con identidad validada. No se debe exponer un rol de servicio al navegador.

## 4. Clasificación previa de flujos

Un rendimiento solo es consistente si se conoce qué movimientos son externos a la cartera y cuáles son eventos internos. El motor debe recibir eventos ya normalizados, no inferirlos a partir de texto libre.

| `flow_kind` | ¿Es flujo externo para TWR/MWR? | Tratamiento de atribución |
|---|---:|---|
| `contribution` | Sí | Aumenta capital aportado; se elimina del subperiodo TWR. |
| `withdrawal` | Sí | Reduce capital invertido; se elimina del subperiodo TWR. |
| `dividend_reinvested` | No | Permanece dentro de la valoración y contribuye al retorno total. |
| `dividend_paid_out` | Sí | Entrada monetaria para MWR; retirada externa a efectos de TWR. |
| `interest_reinvested` | No | Parte del rendimiento interno. |
| `trading_fee` | No, si ya reduce valoración/caja de cartera | Se muestra como coste; no se descuenta una segunda vez. |
| `management_fee` | No, si reduce el patrimonio valorado | Se refleja en rendimiento neto y en componente de coste. |
| `tax_withholding` | Depende de que salga de caja de cartera | Requiere política explícita y etiqueta de cobertura fiscal. |
| `corporate_action` | No por defecto | Ajusta cantidad/coste/valoración; requiere evento trazable. |
| `unknown` | No calculable | Bloquea o degrada la métrica según impacto material. |

La política de comisiones debe estar versionada. Si una comisión ya está incluida en `market_value_base`, el motor no debe restarla otra vez. Si se paga desde fuera de la cartera, debe declararse como flujo externo y advertir que el rendimiento neto puede no ser comparable con un valor patrimonial que no recoge ese pago.

## 5. Diseño de TWR

### 5.1. Precondiciones

Para publicar TWR exacto se necesitan un valor de cartera base positivo al inicio, puntos de valoración en los límites de cada flujo externo material y un valor final, todos convertidos a la misma moneda base y con calidad suficiente. Una valoración diaria con un flujo intradía sin valor antes/después del flujo no debe venderse como TWR exacto.

| Estado | Condición | Resultado |
|---|---|---|
| `ready` | Todos los límites de subperiodo están valorados y la cobertura supera el umbral configurado. | Se publica TWR. |
| `partial` | Faltan límites no materiales o cobertura inferior al umbral de visualización. | Se muestra solo con advertencias y sin ranking/comparación. |
| `not_available` | Falta valor inicial/final, hay flujo no clasificado material o no existe valoración de corte. | No se calcula TWR. |

### 5.2. Fórmula y algoritmo

Sea `V_i_start` el valor inmediatamente posterior al flujo anterior y `V_i_end` el valor inmediatamente anterior al flujo siguiente. El retorno del subperiodo es:

```text
r_i = (V_i_end / V_i_start) - 1
TWR = Π(1 + r_i) - 1
```

El algoritmo propuesto es determinista:

1. Validar moneda base, orden temporal, valor positivo y calidad de cada punto.
2. Ordenar valoraciones y flujos por `occurred_at`, rompiendo empates con un identificador estable.
3. Construir cortes antes/después de cada `cash_flow_event.is_external = true`.
4. Calcular `r_i` solo si existen valores de inicio/fin coherentes para el corte.
5. Componer los subperiodos mediante producto, sin anualizar periodos inferiores a un año.
6. Persistir los puntos usados, flujos excluidos, periodo, cobertura, fórmula y versión del algoritmo.

Si el producto se aproxima a cero por valores inválidos o falta un corte, el resultado debe ser `not_available`, no una división forzada. Las pautas GIPS ayudan a fundamentar la necesidad de políticas consistentes para flujos externos, costes y comparabilidad, pero la aplicación no afirmará cumplimiento GIPS. [2]

## 6. Diseño de MWR/XIRR

### 6.1. Convención de signos

MWR/XIRR se calcula desde el punto de vista de la persona inversora. La inversión de dinero se representa como flujo negativo; recuperaciones de efectivo y valor terminal, como positivos.

```text
fecha inicial:       - valor inicial de cartera
aportación:          - importe aportado
retiro/dividendo:    + importe recibido fuera de cartera
fecha final:         + valor de cartera final
```

Se agregan los flujos que coincidan exactamente en fecha y moneda base. Cada flujo conserva el vínculo al evento de origen y al tipo de cambio aplicado.

### 6.2. Ecuación y solucionador

El rendimiento `r` resuelve la función de valor presente neto fechada:

```text
XNPV(r) = Σ [ CF_i / (1 + r)^((d_i - d_0) / 365) ] = 0,   r > -1
```

El diseño evita depender de Newton-Raphson como único método, ya que puede no converger o escoger una raíz no deseada. La implementación debe usar un solucionador híbrido y determinista:

| Etapa | Regla |
|---|---|
| Validación | Exigir al menos un flujo negativo y uno positivo, fechas válidas, valor terminal y cobertura mínima. |
| Dominio | Buscar inicialmente entre `-0,9999` y `10,0` (de −99,99 % a 1.000 %), rango explícitamente configurable y registrado. |
| Detección de raíces | Muestrear intervalos en escala apropiada; si existen varios cambios de signo, declarar `ambiguous_multiple_roots` y no publicar un único XIRR. |
| Resolución | Aplicar bisección/Brent sobre un intervalo con cambio de signo; tolerancia de tasa `1e-8` y tolerancia NPV definida en moneda base. |
| Resultado | Devolver tasa, iteraciones, residuo NPV, intervalo final, rango usado y advertencias. |
| Fallo | `not_available` con causa `no_bracket`, `non_convergent`, `ambiguous_multiple_roots` o `insufficient_cash_flows`. |

El resultado no debe anualizar ni interpretar automáticamente una tasa de un periodo corto como resultado anual; el periodo y convención de día deben quedar visibles. La función debe ser pura, sin acceso a red ni a estado React.

## 7. Puente de atribución

Además de TWR y MWR, el dashboard necesita explicar el cambio de valor. La reconciliación propuesta es:

```text
valor_final = valor_inicial
            + aportaciones_externas - retiros_externos
            + rendimiento_de_mercado
            + dividendos_e_intereses_internos
            - comisiones
            - impuestos_pagados_desde_cartera
            ± efecto_FX
            ± ajustes_corporativos
            + residuo_de_conciliación
```

El residuo no se oculta: se calcula con tolerancia monetaria configurable, por ejemplo `max(0,01, 0,01 % del valor final)`. Si lo supera, el puente queda `partial`, enumera las fuentes incompletas y bloquea su uso como base de ranking o informe definitivo.

## 8. Contrato de calidad y procedencia

### 8.1. Tipos de dominio en TypeScript

La interfaz no debe recibir un `number` desnudo para un KPI. Debe consumir una envolvente que combina valor, calidad y procedencia.

```ts
export type MetricStatus = "ready" | "partial" | "not_available" | "stale" | "manual_review";
export type FreshnessStatus = "fresh" | "stale" | "missing" | "manual_review";

export type QualityContext = {
  status: MetricStatus;
  asOf: string | null;
  baseCurrency: string;
  valuationCoveragePct: number;
  fxCoveragePct: number;
  costCoveragePct: number;
  classificationCoveragePct: number;
  freshness: FreshnessStatus;
  excludedEntityCount: number;
  warnings: string[];
};

export type LineageRef = {
  role: "valuation" | "cash_flow" | "fx" | "cost" | "classification";
  sourceBatchId: string;
  sourceName: string;
  entityKind: "transaction" | "position" | "valuation" | "fx_rate";
  entityId: string;
  asOf: string | null;
};

export type MetricEnvelope<T> = {
  metricKey: string;
  value: T | null;
  periodStart: string | null;
  periodEnd: string | null;
  methodVersion: string;
  inputHash: string;
  quality: QualityContext;
  lineage: LineageRef[];
};
```

La cobertura no se mezcla en un único porcentaje opaco. El usuario debe poder ver, por ejemplo, que la valoración está al 95 % pero la clasificación geográfica solo al 70 %. El denominador de cada porcentaje debe documentarse y permanecer estable por versión de método.

### 8.2. Reglas de calidad

| Dimensión | Denominador | Numerador | Bloqueo de métrica |
|---|---|---|---|
| Valoración | Valor de posiciones incluidas al final del periodo. | Valor con precio/valoración válida y estado `fresh`. | Si no hay valor inicial/final fiable, TWR y MWR no se publican. |
| FX | Valor no denominado en moneda base. | Valor convertido con tipo trazable y vigente según política. | Si afecta materialmente a valor/flujos, el rendimiento queda `partial`. |
| Coste | Comisiones/retenciones/impuestos esperados según fuente y tipo de operación. | Costes identificados y clasificados. | Impide etiqueta «neto» si faltan costes relevantes. |
| Flujos | Operaciones que alteran caja o capital. | Flujos con `flow_kind` e `is_external` confirmados. | Los flujos desconocidos materiales bloquean TWR/MWR. |
| Clasificación | Valor de posiciones con taxonomía asignada. | Valor clasificado por activo/emisor/sector/país/divisa. | No bloquea rendimiento, pero degrada exposición y riesgo. |

## 9. Integración en componentes actuales

| Componente/módulo actual | Cambio propuesto | Comportamiento visible |
|---|---|---|
| `src/lib/financial-analysis.ts` | Mantener DCF/técnico; extraer `performance.ts` puro con `calculateTwr`, `calculateXirr`, `buildAttributionBridge` y validadores. | Cálculos deterministas, testeables y sin estado. |
| `src/lib/supabase.ts` | Sustituir KPIs escalares por tipos `MetricEnvelope` de lectura; añadir tipos de calidad, lotes y métricas. | El cliente no puede presentar una métrica sin contexto. |
| `RealtimePortfolioApp.tsx` | Cargar un resumen de métricas versionado mediante RPC/read model; no recomputar rendimiento desde listas limitadas de 5.000 transacciones. | Tarjetas de KPI con sello de frescura, cobertura y enlace «Ver método». |
| Resumen | Reemplazar `resultado acumulado` ambiguo por valor, TWR, MWR, rendimiento neto/estado parcial y puente de atribución. | La persona distingue flujos, mercado, FX y costes. |
| Cartera | Añadir `QualityBadge` por posición: precio, FX, coste y clasificación. | Las posiciones pendientes dejan de parecer completas. |
| Plataformas | Conservar FIFO realizado; añadir «alcance de comparación» y costes por fuente cuando exista cobertura. | No se confunde rendimiento realizado con rendimiento total. |
| Informes PDF | Recibir `metric_run_id`; renderizar periodo, cobertura, método, costes y anexos de fuente. | El PDF se puede reproducir contra una ejecución cerrada. |
| Canvas local | No persiste resultados ni usa tablas nuevas. Puede exponer un sello «archivo local / sesión efímera». | Se preserva la promesa de privacidad actual. |

## 10. Ejecución y actualización

La ejecución debe ser idempotente y serializable por cartera y periodo. Una propuesta es registrar una solicitud con `inputs_hash` y usar una restricción única sobre `(portfolio_id, metric_key, period_start, period_end, method_version, inputs_hash)`. Si llega el mismo conjunto, se reutiliza el resultado; si un lote o valoración cambia, se crea una nueva ejecución con nueva huella.

| Evento de datos | Acción propuesta | Evita |
|---|---|---|
| Se valida un `source_batch` | Marcar carteras/periodos afectados como pendientes de recomputación. | Cálculos sobre datos a medio importar. |
| Entra una valoración o FX válido | Recalcular solo periodos afectados y métricas dependientes. | Recargar siete conjuntos de datos completos en todos los clientes. |
| Se corrige una transacción | Crear nueva versión de métrica y mantener el historial previo. | Perder trazabilidad de un informe ya revisado. |
| Se actualiza una métrica | Emitir evento mínimo con `metric_run_id`, cartera y versión. | Enviar transacciones o secretos por Realtime. |

No se recomienda una tarea de agente para cálculos deterministas de rendimiento. El cálculo debe ejecutarse como código server-side versionado; la IA, si llega a activarse, solo explicaría resultados ya autorizados y citados.

## 11. Plan de pruebas

| Grupo | Casos obligatorios | Resultado esperado |
|---|---|---|
| TWR básico | Sin flujos externos, valor inicial/final positivo. | `(final / inicial) - 1`. |
| TWR con aporte/retiro | Flujo en corte con valor pre/post. | El flujo no altera el retorno del subperiodo. |
| TWR inválido | Valor nulo, valor cero, corte ausente o flujo desconocido material. | `not_available`, sin aproximación silenciosa. |
| XIRR básico | Una aportación y valor final posterior. | Raíz única con residuo dentro de tolerancia. |
| XIRR con flujos intermedios | Aportes/retiros en fechas distintas. | Convergencia y signo correctos. |
| XIRR ambiguo | Flujos con múltiples cambios de signo. | `ambiguous_multiple_roots`; no se elige una raíz arbitraria. |
| FX y costes | Falta FX o coste material. | Cobertura degradada y prohibición de etiqueta «neto». |
| Reconciliación | Suma de puente frente a valor final. | Residuo en tolerancia o estado `partial`. |
| RLS | Dos organizaciones ficticias y dos carteras. | Ninguna ejecución ni línea de procedencia cruza el perímetro permitido. |
| Realtime | Ráfaga de eventos de fuente/valoración. | Una versión final consistente, sin respuestas obsoletas. |

## 12. Límites y decisiones pendientes

La primera iteración debe acordar antes de codificar: moneda base por cartera, convención de día para XIRR, definición de «flujo externo», materialidad de cobertura, política de costes, jerarquía de valoración, frescura de precios/FX y tratamiento de impuestos. Hasta entonces, estas definiciones son propuestas, no reglas aplicadas.

El diseño no aporta cotizaciones ni fundamentales nuevos. Cualquier fuente futura deberá usar adaptador server-side, licencia verificable, caché adecuada, límite de tasa, trazabilidad y consentimiento. Ningún resultado de TWR/MWR, DCF, análisis técnico o IA debe formularse como recomendación personalizada o ejecutar operaciones.

## Referencias

[1] [CFA Institute — Rates and Returns](https://www.cfainstitute.org/insights/professional-learning/refresher-readings/2026/rates-and-returns)

[2] [CFA Institute — Overview of the Global Investment Performance Standards](https://www.cfainstitute.org/insights/professional-learning/refresher-readings/2026/overview-of-the-global-investment-performance-standards)

[3] [ESMA — Cost of Investment Products](https://www.esma.europa.eu/investor-corner/cost-investment-products)
