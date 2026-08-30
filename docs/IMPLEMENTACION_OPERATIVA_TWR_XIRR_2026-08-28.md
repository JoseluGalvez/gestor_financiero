# Implementación operativa de TWR y XIRR en el módulo de carteras

**Fecha de diseño:** 28 de agosto de 2026  
**Estado:** propuesta técnica; todavía no se han aplicado migraciones ni se han activado cálculos conectados en Supabase.  
**Objetivo:** convertir TWR y XIRR desde un diseño estático en resultados operativos, reproducibles y auditables dentro de la pantalla **Cartera**.

## 1. Punto de partida y brecha actual

El dashboard ya carga `transactions`, `positions`, `portfolio_snapshots`, `market_quotes` y `analysis_runs`. Las transacciones distinguen, entre otros, `buy`, `sell`, `dividend`, `interest`, `fee`, `deposit`, `withdrawal`, `tax`, `transfer` y `valuation`. Las instantáneas, sin embargo, solo almacenan valor de mercado, coste, ganancia, porcentaje de retorno y versión de fuente. Ese `return_pct` no contiene todavía un contrato suficiente para saber cómo se trataron los flujos externos, las valoraciones intermedias, el cambio de divisa o los costes.

Por ello, el primer paso no es pintar un porcentaje nuevo: es crear un **hecho de rendimiento versionado** con datos de entrada identificables, política de cálculo, cobertura y conciliación. El navegador debe consumir el resultado autorizado, no reconstruirlo silenciosamente a partir de filas incompletas.

## 2. Modelo operativo recomendado

La tabla `transactions` debe seguir siendo el origen de los hechos importados, pero TWR/XIRR necesita una proyección canónica que clasifique el efecto económico de cada hecho. No se debe duplicar el CSV original ni almacenar secretos del proveedor.

### 2.1 Entidades

| Entidad | Propósito | Campos mínimos |
| --- | --- | --- |
| `performance_valuation_points` | Valoraciones de cartera necesarias para cortar subperiodos. | `id`, `organization_id`, `portfolio_id`, `as_of`, `kind`, `market_value_base`, `cash_value_base`, `currency`, `fx_source_id`, `source_version`, `quality_status`. |
| `performance_cash_flows` | Flujos externos normalizados para XIRR y cortes TWR. | `id`, `organization_id`, `portfolio_id`, `transaction_id`, `effective_at`, `sequence`, `scope`, `kind`, `amount_native`, `currency`, `amount_base`, `is_external`, `source_version`, `quality_status`. |
| `performance_runs` | Resultado inmutable de un cálculo reproducible. | `id`, `organization_id`, `portfolio_id`, `period_start`, `period_end`, `method`, `twr_pct`, `xirr_pct`, `coverage_pct`, `status`, `calculation_version`, `policy_version`, `input_fingerprint`, `reconciliation_status`, `warnings`, `created_at`. |
| `performance_subperiods` | Explicación de cada tramo TWR. | `id`, `run_id`, `start_at`, `end_at`, `opening_value_base`, `external_flow_base`, `closing_value_base`, `return_pct`, `valuation_before_flow_id`, `valuation_after_flow_id`, `status`. |
| `performance_attributions` | Componentes monetarios del puente neto. | `id`, `run_id`, `component`, `amount_base`, `source_count`, `status`, `explanation`. |

Los importes monetarios deben almacenarse con `numeric`/decimal en base de datos, no con `float` como representación de autoridad. El TypeScript puede usar una librería decimal en la futura implementación productiva o una política estricta de redondeo y tolerancia documentada; el resultado persistido debe conservar escala y moneda.

### 2.2 Clasificación de movimientos

| Hecho de origen | Tratamiento TWR | Tratamiento XIRR/MWR | Revisión necesaria |
| --- | --- | --- | --- |
| `deposit` | Flujo externo en la frontera; se exige valoración compatible. | Aporte negativo desde la perspectiva del inversor. | Confirmar que no es transferencia interna. |
| `withdrawal` | Flujo externo en la frontera. | Retirada positiva desde la perspectiva del inversor. | Confirmar fecha efectiva y cuenta receptora si procede. |
| `buy` / `sell` | No son flujos externos por sí mismos; alteran composición y liquidez interna. | No entran como aportes del titular salvo que la operación represente una aportación/retirada no registrada. | Revisar caja y reconciliación. |
| `dividend` / `interest` | Retorno interno si se reinvierte o queda dentro de la cartera; flujo externo si se distribuye al titular. | Solo se incluye como flujo del titular cuando sale de la cartera. | Requiere `is_external` explícito. |
| `fee` / `tax` | Atribución como coste o impuesto informado; no se deben esconder dentro de mercado. | Política explícita: neto dentro del valor o flujo separado, pero nunca mezcla silenciosa. | Declarar bruto/neto. |
| `transfer` | Transferencia interna entre carteras propias: no es aportación económica consolidada. | Se excluye o se consolida según el perímetro elegido. | Requiere `transfer_group_id`. |
| `valuation` | No es flujo; crea un punto de valoración si tiene calidad suficiente. | No es flujo del titular. | Debe cuadrar con la posición. |

La clasificación debe ser un campo revisable, no una inferencia irreversible por el texto de la operación. Los casos ambiguos deben reducir cobertura y quedar en `review`, no convertirse en una aportación ficticia.

## 3. Cálculo TWR por subperiodos

### 3.1 Preparación

1. Seleccionar una cartera y un intervalo `[period_start, period_end]` autorizado por RLS.
2. Obtener transacciones, valoraciones y FX aplicables al mismo corte temporal.
3. Convertir importes a la moneda base usando el tipo de cambio declarado en el instante del hecho.
4. Ordenar de forma estable por `effective_at`, `sequence` e `id`.
5. Separar flujos externos de operaciones internas y agrupar flujos simultáneos con el mismo `flow_group_id`.
6. Requerir una valoración de apertura, una valoración de cierre y valoraciones compatibles alrededor de cada frontera de flujo.

### 3.2 Fórmula

Para cada subperiodo `k`, usando una valoración justo antes y justo después del flujo:

```text
r_k = (V_post_k - F_external_k) / V_pre_k - 1
TWR = Π(1 + r_k) - 1
```

La fórmula solo se publica si `V_pre_k > 0`, el flujo está clasificado, la valoración es válida y el importe está convertido a la moneda base. La convención `V_post − F` presupone que el flujo se incorpora al valor posterior; si la fuente usa una convención de final de día diferente, debe almacenarse en `policy_version` y probarse con fixtures específicos.

Un flujo externo no debe crear una falsa rentabilidad. Si entra un depósito y no existe valoración previa/posterior suficiente, el motor devuelve `partial` o `blocked` y explica qué corte falta.

### 3.3 Invariantes TWR

- Con cero flujos externos, TWR coincide con `(valor_final / valor_inicial) − 1` dentro de tolerancia.
- Un depósito y la misma cartera con el mismo rendimiento de activos no deben alterar el TWR cuando existen valoraciones válidas en la frontera.
- Componer dos subperiodos equivale al resultado de calcular el intervalo completo con las mismas políticas.
- Permutar filas con la misma fecha no cambia el resultado si tienen el mismo `flow_group_id` y secuencia válida.
- Un denominador cero, negativo o no finito bloquea el subperiodo; no se transforma en una cifra arbitraria.

## 4. Cálculo XIRR/MWR para flujos irregulares

### 4.1 Convención de signos

Desde la perspectiva del inversor, un depósito/aporte es negativo, una retirada es positiva y el valor final de la cartera se añade como flujo positivo en `period_end`. El motor exige al menos un flujo de cada signo y fechas reales ordenables.

```text
NPV(r) = Σ [CF_i / (1 + r)^((date_i - date_0) / 365)]
XIRR = r tal que NPV(r) = 0
```

La base `365` es una política inicial; si se adopta otra convención, debe versionarse y mostrarse en el informe. El cálculo debe utilizar fechas UTC normalizadas y rechazar calendarios imposibles, duplicados ambiguos o flujos en una moneda no convertible.

### 4.2 Resolución numérica segura

La implementación productiva debe preferir una búsqueda robusta por intervalo —por ejemplo, localizar un cambio de signo y aplicar bisección— antes que depender únicamente de Newton-Raphson. Si no se encuentra intervalo, hay múltiples raíces relevantes o la tasa sale fuera de los límites configurados, el estado es `not_calculable` con advertencia. La tolerancia debe comprobar simultáneamente el error de VAN y la diferencia entre iteraciones.

No se debe mostrar `0 %` cuando XIRR no converge. La salida debe distinguir `available`, `partial`, `not_calculable` y `blocked`.

## 5. Puente de atribución neto

El puente convierte el resultado en una explicación monetaria:

```text
Valor final − Valor inicial
  = mercado/precio
  + dividendos e intereses retenidos
  + efecto FX
  + aportes/retiradas según perímetro
  − comisiones
  − impuestos informados
  + otros componentes etiquetados
  + residual de conciliación
```

Los aportes y retiradas no son creación de valor: se muestran como movimiento de capital y se excluyen de la atribución de mercado. Cada componente necesita una fuente contable, un recuento de operaciones y un estado de conciliación. El residual solo puede mostrarse si está dentro de una tolerancia explícita; si no, el puente queda en revisión.

## 6. Contrato TypeScript de salida

```ts
type PerformanceStatus = "ready" | "partial" | "not_calculable" | "blocked";
type PerformanceMethod = "twr" | "xirr" | "both";

type PortfolioPerformanceRequest = {
  organizationId: string;
  portfolioId: string;
  periodStart: string;
  periodEnd: string;
  baseCurrency: string;
  method: PerformanceMethod;
  policyVersion: string;
};

type PortfolioPerformanceResult = {
  status: PerformanceStatus;
  method: PerformanceMethod;
  periodStart: string;
  periodEnd: string;
  baseCurrency: string;
  twrPct: number | null;
  xirrPct: number | null;
  coveragePct: number;
  calculationVersion: string;
  inputFingerprint: string;
  reconciliation: {
    status: "passed" | "review" | "failed";
    openingValue: number | null;
    closingValue: number | null;
    externalFlows: number;
    attributionTotal: number | null;
    residual: number | null;
    tolerance: number;
  };
  subperiods: Array<{
    startAt: string;
    endAt: string;
    openingValue: number;
    externalFlow: number;
    closingValue: number;
    returnPct: number | null;
    status: PerformanceStatus;
  }>;
  warnings: string[];
  provenance: {
    sourceIds: string[];
    sourceVersions: string[];
    valuationCount: number;
    transactionCount: number;
    fxCoveragePct: number;
  };
};
```

El backend debe volver a comprobar `organizationId` a partir de la sesión, aunque el cliente lo envíe. El cliente no debe poder elegir otra organización ni solicitar datos fuera del alcance autorizado.

## 7. Integración en la pantalla Cartera

La pantalla debe añadir dos KPI separados: **TWR del periodo** y **XIRR/MWR del titular**, cada uno con fecha, moneda, cobertura y enlace a “Ver cálculo”. El selector de periodo debe impedir que se presente una cifra como acumulada si el intervalo de valoraciones no cubre toda la ventana.

El detalle debe mostrar una línea temporal con valoraciones y flujos, una tabla de subperiodos y el puente monetario. Un badge de calidad debe distinguir `Completo`, `Parcial`, `No calculable` y `Revisión requerida`. El texto auxiliar debe explicar que TWR responde a “cómo evolucionaron los activos” y XIRR a “qué rendimiento experimentó el capital aportado”.

Al cambiar una transacción, valoración, FX o regla de clasificación, Realtime no debe recargar siete conjuntos completos. Debe invalidar la proyección de rendimiento de esa cartera, agrupar eventos durante una ventana corta y solicitar un único `performance_run` autorizado. Una respuesta antigua se descarta comparando `input_fingerprint` o `run_version` antes de actualizar la interfaz.

## 8. Seguridad y RLS

1. Crear las nuevas tablas en una migración revisable y aplicar RLS desde el mismo cambio.
2. Conceder `SELECT` únicamente a miembros de la organización y limitar la fila por `organization_id` y `portfolio_id` autorizado.
3. Reservar `INSERT`/`UPDATE` de resultados derivados al proceso servidor; el navegador solo solicita recalcular y lee el resultado.
4. No publicar en Realtime movimientos crudos ni resultados de otra organización. La suscripción debe filtrar por cartera autorizada y publicar la invalidación mínima.
5. No guardar en `connection_config` tokens, contraseñas ni credenciales de proveedores.
6. Registrar `audit_events` para ejecución, versión de cálculo, cobertura, reconciliación y cambios de clasificación.
7. Revocar y recrear la suscripción cuando cambie la membresía o expire el token.

## 9. Pruebas antes de activar producción

La batería mínima debe cubrir: cartera sin flujos; depósito en mitad del periodo; retirada; varios flujos el mismo día; dividendos reinvertidos; dividendo distribuido; comisión; impuesto informado; transferencia interna; FX con cobertura parcial; valoraciones de cierre faltantes; valoración previa cero; calendario irregular; aportes y retiradas que producen XIRR negativo; XIRR sin raíz; múltiples raíces; sensibilidad a tolerancia; duplicación de evento Realtime; respuesta obsoleta; aislamiento RLS entre organizaciones; y conciliación del puente con residual dentro y fuera de tolerancia.

Los fixtures deben ser pequeños, deterministas y completamente sintéticos. Cada caso debe comprobar resultado, estado, advertencias, procedencia, fingerprint y que repetir el cálculo sea idempotente. Antes del despliegue debe existir una comparación independiente con una hoja de cálculo controlada o implementación de referencia, sin usar datos reales.

## 10. Ruta de implementación por fases

| Fase | Trabajo | Criterio de salida |
| --- | --- | --- |
| 0. Contrato | Aprobar signo, moneda base, día, costes, impuestos y definición de flujo externo. | Política versionada y fixtures aprobados. |
| 1. Proyección | Crear normalizador, valoraciones y cash flows canónicos en staging. | 100 % de filas clasificadas o marcadas para revisión. |
| 2. Motor | Implementar TWR/XIRR puros y el puente con decimal/tolerancia. | Tests deterministas y conciliación sin falsos ceros. |
| 3. Persistencia | Crear `performance_runs` y subperiodos con RLS, grants e historial. | Pruebas de aislamiento y migración reproducible. |
| 4. UI | Añadir KPI, detalle temporal, cobertura, warnings y exportación reproducible. | Recorrido E2E accesible con datos sintéticos. |
| 5. Realtime | Invalidación por dominio, coalescencia, versiones y reconexión. | Ráfagas no provocan recargas integrales ni estados obsoletos. |
| 6. Piloto | Activar para una cartera ficticia o de prueba, comparar con referencia y observar errores. | Reconciliación, rendimiento, seguridad y soporte aprobados. |

Hasta completar las fases 0–3, el módulo debe seguir describiendo TWR/XIRR como **diseño no conectado**. La primera activación aconsejable es solo lectura, con resultados bajo demanda y sin modificar transacciones desde la pantalla de rendimiento.

## Referencias

[1]: https://www.cfainstitute.org/insights/professional-learning/refresher-readings/2026/rates-and-returns "CFA Institute — Rates and Returns"

[2]: https://help.portfolio-performance.info/en/concepts/performance/money-weighted/ "Portfolio Performance — Money-weighted return"

[3]: https://supabase.com/docs/guides/database/postgres/row-level-security "Supabase — Row Level Security"

[4]: https://supabase.com/docs/guides/realtime/postgres-changes "Supabase — Postgres Changes / Realtime"

> Este documento es un diseño técnico y de control. No calcula ni recomienda una inversión concreta y no utiliza datos financieros reales.

**Autor:** Manus AI

**Fecha de referencia:** 28 de agosto de 2026

**Confianza:** alta para la arquitectura y las invariantes descritas; pendiente de validación de negocio de la política de flujos, moneda, costes e impuestos antes de activar el cálculo productivo.

**Cumplimiento:** material informativo y de ingeniería; no asesoramiento financiero personalizado.
