# Contratos TypeScript para TWR por subperíodos y flujos irregulares

**Proyecto:** Gestor financiero · Portafolio Intel  
**Fecha:** 27 de agosto de 2026  
**Estado:** especificación de implementación. No existe aún un motor TWR productivo ni se han usado datos financieros reales.  
**Ámbito:** rendimiento de una cartera, cuenta, plataforma o instrumento dentro de una frontera declarada; no fiscalidad, recomendaciones, órdenes, ni valoración garantizada.

> **Contrato de producto.** El motor solo etiqueta una cifra como **TWR exacto** cuando puede construir cada subperíodo con valores y flujos convertidos a una misma moneda base, ordenados de forma determinista, y con cobertura suficiente en todos los cortes. Si esa evidencia no existe, devuelve un diagnóstico; nunca transforma el hueco en `0 %` ni entrega una estimación como si fuera TWR.

---

## Índice

1. [Decisiones de cálculo](#1-decisiones-de-cálculo)
2. [Modelo de tipos](#2-modelo-de-tipos)
3. [Validación y normalización antes del motor](#3-validación-y-normalización-antes-del-motor)
4. [Construcción determinista de subperíodos](#4-construcción-determinista-de-subperíodos)
5. [Fórmulas según momento del flujo](#5-fórmulas-según-momento-del-flujo)
6. [Contrato del motor](#6-contrato-del-motor)
7. [Manejo de flujos irregulares](#7-manejo-de-flujos-irregulares)
8. [Estados de salida y experiencia de usuario](#8-estados-de-salida-y-experiencia-de-usuario)
9. [Invariantes y pruebas recomendadas](#9-invariantes-y-pruebas-recomendadas)
10. [Límites y referencias](#10-límites-y-referencias)

---

## 1. Decisiones de cálculo

El retorno ponderado por tiempo divide el período seleccionado en tramos delimitados por los flujos que **cruzan la frontera** del alcance. Por ejemplo, para el alcance de una cartera completa, una aportación de efectivo desde una cuenta externa es un flujo externo; una compra de acción con el efectivo ya situado dentro de la cartera es un movimiento interno y no debe partir el TWR. La separación de depósitos/retiros frente a compras/ventas internas coincide con el criterio descrito por Portfolio Performance para la rentabilidad de cartera.[1]

| Decisión | Contrato adoptado | Razón operativa |
| --- | --- | --- |
| Frontera | Se pasa como `ReturnScopeRef`; no se infiere por texto de operación. | Una transferencia puede ser externa a una cuenta pero interna a una cartera. |
| Tiempo | Instantes ISO 8601 con zona (`2026-08-27T10:30:00.000Z`), no solo fecha. | Permite ordenar dos flujos irregulares en un mismo día. |
| Moneda | Todo valor/flujos se convierte a una moneda base antes del cálculo. | Evita dividir importes heterogéneos. |
| Orden | `effectiveAt`, después `sequence`, finalmente `id`. | El mismo conjunto de entradas genera idénticos subperíodos. |
| Flujos iguales en el mismo instante | Se agrupan por `flowGroupId` y se compensan de forma trazable. | Evita fabricar un retorno entre dos movimientos sin tiempo de mercado. |
| Flujo intradía | Requiere valoración inmediatamente antes y después, o marca el TWR exacto como no disponible. | No presume la rentabilidad de una parte del día sin valoración. |
| Costes/impuestos | Entran en el valor de la cartera conforme a `ReturnPolicy`; no se suman como flujos externos por defecto. | No duplicar impacto entre flujo y valoración. |
| Fallback | Modified Dietz solo se ofrece si la política lo autoriza y con nombre distinto. | Una aproximación no se presenta como TWR exacto. |

CFA Institute distingue entre retorno ponderado por tiempo y retorno ponderado por dinero en función de la pregunta que se desea responder.[2] Este contrato usa TWR para la evolución de los activos, no para atribuir decisiones temporales de aportación del titular.

---

## 2. Modelo de tipos

### 2.1. Tipos básicos de entrada y diagnóstico

Los alias de tipo no hacen válida una cadena por sí solos; `parseIsoInstant` y `parseBaseAmount` son *type guards* de ejecución. La aplicación no debe convertir una fecha local ambigua ni un `NaN` en una entrada supuestamente correcta.

```ts
export type IsoInstant = string & { readonly __brand: "IsoInstant" };
export type UUID = string & { readonly __brand: "UUID" };
export type CurrencyCode = string & { readonly __brand: "CurrencyCode" };
export type DecimalAmount = number & { readonly __brand: "DecimalAmount" };

export type ReturnScopeKind = "portfolio" | "account" | "instrument" | "platform";

export type ReturnScopeRef = {
  organizationId: UUID;
  portfolioId: UUID;
  scope: ReturnScopeKind;
  accountId: UUID | null;
  instrumentId: UUID | null;
  platformId: UUID | null;
  baseCurrency: CurrencyCode;
};

export type QualityState =
  | "complete"
  | "partial"
  | "blocked"
  | "not_calculable";

export type IssueCode =
  | "INVALID_INSTANT"
  | "DUPLICATE_EVENT_ID"
  | "UNSUPPORTED_CURRENCY"
  | "MISSING_FX"
  | "NON_FINITE_AMOUNT"
  | "NEGATIVE_VALUATION"
  | "OUT_OF_SCOPE_EVENT"
  | "MISSING_START_VALUATION"
  | "MISSING_END_VALUATION"
  | "MISSING_PRE_FLOW_VALUATION"
  | "MISSING_POST_FLOW_VALUATION"
  | "ZERO_OR_NEGATIVE_DENOMINATOR"
  | "AMBIGUOUS_FLOW_ORDER"
  | "UNRECONCILED_VALUATION"
  | "COVERAGE_BELOW_POLICY"
  | "FLOW_GROUP_NOT_BALANCED"
  | "CALCULATION_OVERFLOW";

export type CalculationIssue = {
  code: IssueCode;
  severity: "info" | "warning" | "error";
  message: string;
  eventIds: readonly UUID[];
  asOf: IsoInstant | null;
  remediation: string;
};
```

### 2.2. Flujos externos e internos

`boundary` se normaliza durante la ingesta mediante reglas de producto, cuenta, cartera y fuente. No se debe permitir que la interfaz etiquete libremente una venta como retiro para mejorar una métrica. `cashFlowBase` utiliza el signo desde el libro patrimonial: entrada positiva, salida negativa.

```ts
export type ExternalFlowDirection = "contribution" | "withdrawal";

export type NormalizedFlowKind =
  | "external_contribution"
  | "external_withdrawal"
  | "trade_buy"
  | "trade_sell"
  | "income_dividend"
  | "income_interest"
  | "fee"
  | "tax_withholding"
  | "fx_conversion"
  | "corporate_action"
  | "valuation_adjustment";

export type FlowBoundary = "external" | "internal";

export type BaseMoney = {
  amount: DecimalAmount;
  currency: CurrencyCode;
  fxRateToBase: DecimalAmount;
  fxAsOf: IsoInstant;
  fxSourceId: UUID | null;
};

export type TwrFlowEvent = {
  id: UUID;
  scope: ReturnScopeRef;
  occurredAt: IsoInstant;
  effectiveAt: IsoInstant;
  /** Permite ordenar entradas simultáneas sin depender del orden de llegada. */
  sequence: number;
  /** Identifica movimientos que se aplican como un único corte económico. */
  flowGroupId: string;
  kind: NormalizedFlowKind;
  boundary: FlowBoundary;
  externalDirection: ExternalFlowDirection | null;
  /** Positivo hacia la cartera; negativo fuera de ella. */
  cashFlowBase: BaseMoney | null;
  sourceEventId: UUID | null;
  reversesEventId: UUID | null;
  isReversal: boolean;
  reconciliationState: "reconciled" | "unreconciled" | "review_required";
  sourceVersion: string;
};

export type ExternalTwrFlow = TwrFlowEvent & {
  boundary: "external";
  externalDirection: ExternalFlowDirection;
  cashFlowBase: BaseMoney;
};
```

Las operaciones `internal` permanecen en la trazabilidad para explicar el puente neto, pero el constructor de cortes TWR las excluye de la partición. Una comisión paga dentro de la cartera reduce el valor final neto si la política incluye comisiones; no se recodifica como retirada externa.

### 2.3. Valoraciones con lado de corte

La valoración guarda su posición respecto a un flujo. Esto elimina el supuesto oculto de que la hora de una instantánea es “obviamente” anterior o posterior a una aportación.

```ts
export type ValuationRole =
  | "period_start"
  | "period_end"
  | "pre_external_flow"
  | "post_external_flow";

export type ValuationSource = "market" | "broker_statement" | "manual_reconciled";

export type TwrValuationPoint = {
  id: UUID;
  scope: ReturnScopeRef;
  asOf: IsoInstant;
  /** Solo obligatorio para valoraciones que cierran o abren un corte de flujo. */
  flowGroupId: string | null;
  role: ValuationRole;
  marketValueBase: DecimalAmount | null;
  cashValueBase: DecimalAmount | null;
  totalValueBase: DecimalAmount | null;
  valuationCoveragePct: number;
  fxCoveragePct: number;
  reconciliationState: "reconciled" | "unreconciled" | "review_required";
  source: ValuationSource;
  sourceVersion: string;
};
```

`totalValueBase` no se deriva silenciosamente de dos campos nulos. En validación se exige que sea finito, mayor o igual que cero y que se corresponda con el alcance exacto del cálculo. Si el valor ha sido corregido manualmente, se conserva `source: "manual_reconciled"`, motivo de conciliación y aprobador en el ledger/audit log, no dentro de la UI efímera.

### 2.4. Política de TWR y tolerancias

```ts
export type ExternalFlowCutRule =
  | "flow_at_start"
  | "flow_at_end"
  | "require_pre_and_post";

export type TwrPolicy = {
  id: UUID;
  version: string;
  baseCurrency: CurrencyCode;
  includeFees: boolean;
  includeReportedTaxes: boolean;
  requiredValuationCoveragePct: number;
  requiredFxCoveragePct: number;
  requiredReconciliationState: "reconciled" | "allow_review_required";
  externalFlowCutRule: ExternalFlowCutRule;
  maxBoundaryGapMs: number;
  allowModifiedDietzFallback: boolean;
  annualization: {
    annualDayCount: 365;
    minimumDaysToAnnualize: 365;
  };
};
```

La `version` de policy se almacena en cada resultado. Cambiar `includeFees`, el momento de flujo o el umbral de cobertura crea una nueva versión y obliga a recalcular; no reescribe resultados históricos.

---

## 3. Validación y normalización antes del motor

El motor no recibe filas CSV, objetos de formulario ni respuestas de proveedores. Recibe solo entradas normalizadas y validadas. La secuencia recomendada es: ingestión → validación léxica → conversión a base → clasificación de frontera → conciliación → construcción de cortes → cálculo puro.

| Regla | Acción de validación | Estado de salida si falla |
| --- | --- | --- |
| Instante ISO 8601 real | `Date.parse` + comparación/canonicalización explícita; rechazar fecha local sin zona cuando haya orden intradía. | `blocked`. |
| Identificadores únicos | `Set` por `event.id` y `valuation.id`; detectar además eventos fuente duplicados. | `blocked`. |
| Alcance homogéneo | Cada flujo/valoración debe tener mismo `organizationId`, `portfolioId`, scope y moneda base que el request. | `blocked`. |
| Importe/valor finito | `Number.isFinite`, no `NaN`, no infinito; valor de cartera no negativo. | `blocked`. |
| FX completo | Si moneda de entrada ≠ base, requerir tasa, fecha y fuente según policy. | `blocked` o `partial` solo si no se solicita TWR exacto. |
| Cobertura | Comparar `valuationCoveragePct` y `fxCoveragePct` con policy. | `partial` o `blocked`; nunca completar con cero. |
| Conciliación | Rechazar `unreconciled`; `review_required` solo si policy lo permite y el resultado se etiqueta. | `blocked` o `partial`. |
| Orden simultáneo | Misma marca temporal con distinta secuencia sin `flowGroupId` o lado de valoración definido. | `blocked`. |
| Denominador | Valor inicial de tramo debe ser mayor que cero. | `not_calculable` para ese tramo y resultado total. |

El objeto de entrada tras validación diferencia lo aceptado de lo rechazado para que el usuario vea el motivo y pueda corregirlo sin que se omita silenciosamente un flujo.

```ts
export type ValidatedTwrInput = {
  scope: ReturnScopeRef;
  period: { start: IsoInstant; end: IsoInstant };
  policy: TwrPolicy;
  valuations: readonly TwrValuationPoint[];
  externalFlows: readonly ExternalTwrFlow[];
  ignoredInternalEventIds: readonly UUID[];
  issues: readonly CalculationIssue[];
};

export type TwrInputValidation =
  | { ok: true; value: ValidatedTwrInput }
  | { ok: false; issues: readonly CalculationIssue[] };
```

---

## 4. Construcción determinista de subperíodos

### 4.1. Regla de orden

La ordenación debe ser estable e independiente de la fuente o latencia de Realtime:

```ts
export function compareTwrFlow(a: ExternalTwrFlow, b: ExternalTwrFlow): number {
  const time = a.effectiveAt.localeCompare(b.effectiveAt);
  if (time !== 0) return time;

  const sequence = a.sequence - b.sequence;
  if (sequence !== 0) return sequence;

  return a.id.localeCompare(b.id);
}
```

Al agrupar, el motor combina todas las entradas con el mismo `flowGroupId` y `effectiveAt`. Si un grupo declara un mismo `flowGroupId` con instantes distintos, se bloquea por ambigüedad. La suma se realiza con precisión monetaria definida en la capa de dominio; para importes de producción se recomienda un decimal fijo o biblioteca decimal, no acumular flotantes binarios arbitrarios en la UI.

```ts
export type TwrFlowGroup = {
  id: string;
  effectiveAt: IsoInstant;
  eventIds: readonly UUID[];
  grossContributionBase: DecimalAmount;
  grossWithdrawalBase: DecimalAmount;
  /** Contribuciones positivas + retiradas negativas desde la cartera. */
  netExternalFlowBase: DecimalAmount;
  hasReversal: boolean;
};
```

Un grupo con aportación y retirada del mismo importe puede tener flujo neto cero. Se conserva en auditoría; para la fórmula no crea un tramo sin tiempo. Si contiene dos direcciones y no son reversos o no existe explicación fuente, se marca `review_required` para evitar que un error de importación se neutralice visualmente.

### 4.2. Cortes y valores requeridos

Cada grupo externo divide el período en un tramo. Para un flujo con valoración pre y post disponible, `preFlowValueBase` cierra el tramo anterior y `postFlowValueBase` abre el siguiente. Es el caso más explicable para flujos intradía irregulares.

```ts
export type TwrCut = {
  kind: "period_start" | "external_flow" | "period_end";
  asOf: IsoInstant;
  flowGroup: TwrFlowGroup | null;
  preFlowValueBase: DecimalAmount | null;
  postFlowValueBase: DecimalAmount | null;
  valuationIds: readonly UUID[];
};

export type TwrSubperiodDraft = {
  ordinal: number;
  startCut: TwrCut;
  endCut: TwrCut;
  /** Valor que ya está invertido al inicio del tramo. */
  openingValueBase: DecimalAmount | null;
  /** Valor antes del flujo que cierra el tramo. */
  closingValuePreFlowBase: DecimalAmount | null;
  closingValuePostFlowBase: DecimalAmount | null;
  endExternalFlowBase: DecimalAmount | null;
};
```

La construcción produce el siguiente patrón conceptual para dos aportaciones y un retiro irregulares:

```text
inicio (valoración inicial)
  └─ tramo 1 ─► pre flujo A ─► [flujo A] ─► post flujo A
                  └─ tramo 2 ─► pre flujo B ─► [flujo B] ─► post flujo B
                                    └─ tramo 3 ─► pre retiro C ─► [retiro C] ─► post retiro C
                                                      └─ tramo 4 ─► valoración final
```

El último flujo no requiere un tramo adicional si coincide exactamente con el final del período y la policy `flow_at_end` define la valoración después del flujo como cierre. Sin embargo, no se borra el grupo: debe quedar referenciado como parte del resultado y de la conciliación.

---

## 5. Fórmulas según momento del flujo

La policy declara la convención de flujo. No se puede alternar en el mismo cálculo sin conservarlo en cada período, porque eso cambia el denominador o numerador y puede falsear el rendimiento.

### 5.1. Convención `require_pre_and_post`

Es la opción recomendada para flujos irregulares intradía. Para el tramo `i`, con `Vᵢ,start` igual a la valoración post-flujo del corte anterior, y `Vᵢ,end−` igual al valor inmediatamente antes del siguiente flujo:

```text
rᵢ = (Vᵢ,end− / Vᵢ,start) − 1
TWR = Πᵢ (1 + rᵢ) − 1
```

El nuevo flujo no altera `rᵢ`: se aplica después de cerrar el tramo y la valoración post-flujo inicia el siguiente. Si `Vᵢ,start = 0`, el tramo no es calculable; la aplicación no divide por cero ni “empieza” el retorno antes de que exista capital valorado.

### 5.2. Convención `flow_at_start`

Solo se permite si el evento está documentado como ocurrido al inicio del tramo y hay un valor posterior coherente. Si `CFᵢ` es positivo hacia la cartera, el capital tras el flujo es el denominador del rendimiento del tramo:

```text
rᵢ = (Vᵢ,end / (Vᵢ,start− + CFᵢ)) − 1
```

Una retirada usa `CFᵢ < 0`; si el denominador queda menor o igual que cero, se bloquea. La interfaz muestra expresamente “flujo al inicio” y no mezcla esta convención con la de fin.

### 5.3. Convención `flow_at_end`

Solo se permite si el evento ocurre al final del tramo. Se sustrae el flujo aplicado al cierre para recuperar el valor económico antes de dicho flujo:

```text
rᵢ = ((Vᵢ,end+ − CFᵢ) / Vᵢ,start) − 1
```

Si no hay evidencia de que el flujo ocurre al final o de que el valor es posterior al flujo, se pide el corte pre/post y se usa `require_pre_and_post`. Es preferible bloquear TWR exacto a suponer que un flujo irregular ocurrió al inicio o al final del día.

### 5.4. Retorno compuesto y anualización

```ts
export function compoundTwr(returns: readonly DecimalAmount): DecimalAmount {
  return returns.reduce<DecimalAmount>(
    (accumulator, value) => ((1 + accumulator) * (1 + value) - 1) as DecimalAmount,
    0 as DecimalAmount,
  );
}

export function annualizeTwr(
  cumulativeReturn: DecimalAmount,
  elapsedDays: number,
  policy: TwrPolicy,
): DecimalAmount | null {
  if (elapsedDays < policy.annualization.minimumDaysToAnnualize) return null;
  if (!Number.isFinite(elapsedDays) || elapsedDays <= 0) return null;

  return (
    Math.pow(1 + cumulativeReturn, policy.annualization.annualDayCount / elapsedDays) - 1
  ) as DecimalAmount;
}
```

La anualización se presenta solo como métrica adicional si el período alcanza el umbral de política. GIPS indica que los retornos de períodos inferiores a un año no deben anualizarse en sus reportes; este diseño adopta el principio de presentación sin afirmar conformidad GIPS.[3]

---

## 6. Contrato del motor

El motor es puro y determinista: no consulta Supabase, no pide cotizaciones, no usa `Date.now()`, no lee `localStorage` ni muta sus entradas. La ingesta y persistencia se sitúan fuera del núcleo de cálculo.

```ts
export type TwrMethod = "true_twr" | "modified_dietz" | "not_calculable";

export type TwrSubperiod = {
  ordinal: number;
  startAsOf: IsoInstant;
  endAsOf: IsoInstant;
  startValuationId: UUID;
  endValuationId: UUID;
  openingValueBase: DecimalAmount;
  closingValuePreFlowBase: DecimalAmount;
  endExternalFlowBase: DecimalAmount | null;
  appliedCutRule: ExternalFlowCutRule;
  subperiodReturn: DecimalAmount;
  flowEventIds: readonly UUID[];
  valuationCoveragePct: number;
  fxCoveragePct: number;
  reconciliationState: "reconciled" | "review_required";
  warnings: readonly CalculationIssue[];
};

export type TwrAuditTrail = {
  inputFingerprint: string;
  policyId: UUID;
  policyVersion: string;
  ignoredInternalEventIds: readonly UUID[];
  acceptedExternalEventIds: readonly UUID[];
  valuationIds: readonly UUID[];
  flowGroups: readonly TwrFlowGroup[];
  createdFromSourceVersions: readonly string[];
};

export type TwrResult = {
  scope: ReturnScopeRef;
  period: { start: IsoInstant; end: IsoInstant; elapsedDays: number };
  method: TwrMethod;
  returnPct: DecimalAmount | null;
  annualizedReturnPct: DecimalAmount | null;
  quality: QualityState;
  subperiods: readonly TwrSubperiod[];
  issues: readonly CalculationIssue[];
  audit: TwrAuditTrail;
};

export type TwrCalculation =
  | { ok: true; result: TwrResult }
  | { ok: false; result: TwrResult };

export function calculateTrueTwr(input: ValidatedTwrInput): TwrCalculation {
  // 1. Ordenar y agrupar flujos externos.
  // 2. Asociar valoraciones válidas a inicio, cada pre/post flujo y final.
  // 3. Construir borradores de subperíodo en orden temporal.
  // 4. Calcular solo los tramos con denominador > 0 y evidencia exigida.
  // 5. Componer retornos y determinar estado de calidad.
  // 6. Devolver auditoría completa incluso cuando `ok` es false.
  throw new Error("Especificación: implementar tras aprobación de policy y fixtures.");
}
```

El resultado contiene todos los cortes, IDs de origen, exclusiones y advertencias. Esto permite que la UI muestre el porcentaje, pero también que un revisor responda por qué faltó un tramo o qué flujo se clasificó como externo. `inputFingerprint` se calcula a partir de entradas canónicas, policy y versión de algoritmo; nunca incluye secretos, archivos completos ni texto libre sin minimizar.

---

## 7. Manejo de flujos irregulares

### 7.1. Varios flujos en días distintos

Cada flujo externo crea un corte económico. Con valoraciones de pre/post flujo, el algoritmo calcula los tramos consecutivos y compone sus retornos. El tamaño de los flujos no se usa para ponderar TWR; lo relevante es el valor de la cartera entre cortes.

| Escenario | Tratamiento del motor | Resultado esperado |
| --- | --- | --- |
| Aportación el 3 de mes; retiro el 19; valoración al inicio, pre/post ambos flujos y final. | Construye tres tramos; los flujos quedan fuera de cada `rᵢ`. | `complete`, `true_twr`. |
| Muchas aportaciones irregulares pero una valoración pre/post falta. | No rellena el corte; identifica `flowGroupId` y el origen ausente. | `not_calculable` para TWR exacto; Dietz solo si policy permite. |
| Flujo el mismo instante que inicio. | `flow_at_start` o valoración post-flujo pasa a ser denominador del primer tramo. | Calculable solo con valor post-flujo positivo. |
| Flujo el mismo instante que cierre. | `flow_at_end` descuenta el flujo del numerador o usa valor pre-flujo. | Calculable solo con la convención y evidencia guardadas. |
| Retiro superior al valor disponible. | Falla validación/conciliación; no acepta valor post-flujo negativo. | `blocked`. |

### 7.2. Varias operaciones en el mismo instante

Los flujos con exactamente el mismo `effectiveAt` se agrupan antes de calcular. Una aportación de 100 y una retirada de 40 en el mismo grupo se presenta como contribución bruta 100, retirada bruta 40 y flujo neto +60. Si representan corrección/reverso, `reversesEventId` conserva la causalidad. Si no hay relación ni justificación, la pantalla solicita revisión incluso si el neto es cero.

Nunca se construyen dos subperíodos entre movimientos con el mismo instante, porque no hay tiempo de mercado que medir. Esta regla elimina retornos infinitos o artificiales creados por el orden de llegada de eventos Realtime.

### 7.3. Flujos que llegan tarde o se corrigen

El resultado histórico es inmutable como registro, pero recalculable. Si llega una transacción atrasada o una reversión, la ingesta crea un nuevo `sourceVersion`; el motor genera un nuevo resultado con nuevo `inputFingerprint`, marca el resultado anterior como supersedido y muestra el cambio de cobertura. No modifica el porcentaje antiguo sin rastro.

| Situación | Conducta requerida |
| --- | --- |
| Realtime entrega una corrección fuera de orden. | Invalidar dominio de rentabilidad, cargar instantánea canónica RLS protegida y recalcular desde entradas ordenadas. |
| Se importa dos veces el mismo evento. | La clave idempotente detiene duplicado; el resultado no cambia. |
| Se revierte una aportación. | Conservar ambos eventos vinculados; reconstituir los grupos sin borrar evidencia. |
| Cambia la clasificación de frontera. | Exigir aprobación/regla de normalización nueva y recalcular con `policyVersion`/mapping version trazable. |
| Cambia el FX de una fecha. | Crear fuente/versión nueva, recálculo explícito y mostrar qué resultado fue reemplazado. |

### 7.4. Movimientos internos, ingresos y costes

Una compra, venta o conversión FX dentro de la frontera no divide el TWR de cartera. Un dividendo mantenido como efectivo interno no es aportación externa; aparece en el valor y, si se genera puente de atribución, en “ingresos”. Si el efectivo sale de la cartera posteriormente, ese segundo movimiento es un retiro externo. La política decide si las comisiones e impuestos **informados** se incluyen en el retorno neto y cada resultado deja visible la versión de esa decisión.

---

## 8. Estados de salida y experiencia de usuario

| `quality` | Cuándo aparece | Qué muestra la interfaz | Qué nunca muestra |
| --- | --- | --- | --- |
| `complete` | Todos los cortes, FX, cobertura y conciliación pasan policy. | “TWR exacto”, período, moneda, retorno acumulado, anualización si procede y detalle de tramos. | Una recomendación de inversión o garantía de exactitud futura. |
| `partial` | La policy permite cobertura/revisión limitada, o se usa fallback claramente separado. | Sello “parcial” y causas; Modified Dietz con nombre propio si está habilitado. | La etiqueta “TWR exacto”. |
| `blocked` | Fecha, moneda, alcance, valoración, reconciliación o orden no son válidos. | Lista priorizada de incidencias, eventos y acciones de corrección. | `0 %`, valor calculado parcial oculto o silencioso. |
| `not_calculable` | Denominador cero/no positivo, no hay periodo medible o faltan cortes esenciales. | Explicación matemática y datos necesarios. | Excepción técnica sin contexto para el usuario. |

La cifra se redondea solo en presentación. El motor conserva la precisión acordada, el porcentaje sin formatear y los importes del subperíodo necesarios para reproducir la operación.

---

## 9. Invariantes y pruebas recomendadas

### 9.1. Invariantes que todo resultado `complete` debe cumplir

```ts
export function assertCompleteTwrInvariants(result: TwrResult): void {
  if (result.quality !== "complete") return;
  if (result.method !== "true_twr") throw new Error("Un resultado completo exige true_twr.");
  if (result.returnPct === null || !Number.isFinite(result.returnPct)) {
    throw new Error("Un TWR completo requiere retorno finito.");
  }
  if (result.subperiods.length === 0) {
    throw new Error("Un TWR completo requiere al menos un subperíodo.");
  }
  for (const period of result.subperiods) {
    if (period.openingValueBase <= 0) throw new Error("Denominador no positivo.");
    if (!Number.isFinite(period.subperiodReturn)) throw new Error("Retorno no finito.");
    if (period.subperiodReturn < -1) throw new Error("Retorno inferior a -100 %.");
    if (period.valuationCoveragePct < 0 || period.valuationCoveragePct > 100) {
      throw new Error("Cobertura de valoración fuera de rango.");
    }
  }
}
```

### 9.2. Fixtures deterministas mínimos

| ID | Fixture sintético | Aserción principal |
| --- | --- | --- |
| TWR-001 | Sin flujos externos y dos valoraciones positivas. | Un tramo; `TWR = Vfinal/Vinicio - 1`. |
| TWR-002 | Aportación al inicio, valor post-flujo y valor final. | Usa `flow_at_start`; no atribuye aportación al retorno. |
| TWR-003 | Retiro al final, valor inicial y valor posterior. | Usa `flow_at_end`; resta flujo una sola vez. |
| TWR-004 | Dos aportaciones y un retiro irregulares con pre/post valorados. | Tres o cuatro tramos ordenados; composición equivale a producto de tramos. |
| TWR-005 | Aportación y retiro simultáneos dentro de `flowGroupId`. | Un único corte; bruto y neto auditables; no hay tramo de duración cero. |
| TWR-006 | Mismo instante, secuencias contradictorias sin grupo. | `blocked` con `AMBIGUOUS_FLOW_ORDER`. |
| TWR-007 | Valoración pre-flujo ausente en movimiento intradía. | No `true_twr`; issue `MISSING_PRE_FLOW_VALUATION`. |
| TWR-008 | Inicio cero seguido de aportación y después valoración positiva. | Solo calcula desde post-flujo si policy/evidencia lo permite; nunca divide por cero. |
| TWR-009 | Retiro deja valor post-flujo negativo. | `blocked`, no retorno menor que -100 %. |
| TWR-010 | Operación interna compra/venta dentro de cartera. | No añade corte ni `cashFlowBase` externo. |
| TWR-011 | Comisión y retención informada. | Cambian resultado solo conforme a versión de policy; no generan flujo externo. |
| TWR-012 | Activo en USD con FX de inicio/fin trazable. | Calcula en base común; FX ausente bloquea/etiqueta, no usa 1.0. |
| TWR-013 | Dos importaciones de mismo `sourceEventId`. | Resultado e IDs de tramo idénticos tras idempotencia. |
| TWR-014 | Corrección tardía con versión nueva. | Resultado nuevo con fingerprint distinto; histórico anterior no se sobrescribe. |
| TWR-015 | Permutar el orden de entrada de arrays. | Resultado, grupos y fingerprint canónico no cambian. |
| TWR-016 | Período de 364 días y otro de 365. | Primero no anualiza; segundo aplica fórmula de policy. |
| TWR-017 | Valoraciones con cobertura inferior al umbral. | `partial`/`blocked`, nunca `complete`. |
| TWR-018 | Reverso vinculado a contribución original. | Causalidad visible, suma correcta y sin doble conteo. |

Una prueba de propiedad adicional puede generar permutaciones del mismo fixture: después de normalizar y ordenar, el resultado debe ser idéntico. Los generadores nunca utilizan tasas/valores reales de clientes y sus semillas se guardan para repetir el fallo.

---

## 10. Límites y referencias

El contrato no convierte automáticamente CSV locales en datos del ledger, no almacena archivos originales de Canvas/Cripto y no activa Supabase, Realtime, conectores o cálculos remotos. La decisión de aplicar una migración y habilitar el motor requiere revisión de seguridad, RLS efectiva, pruebas deterministas, reconciliación y autorización explícita.

La calidad de TWR depende de valoraciones y FX de corte. Si el producto no puede obtenerlos con trazabilidad, el resultado correcto es advertir, bloquear o presentar una aproximación explícitamente etiquetada; no afirmar precisión. El resultado es informativo y no constituye asesoramiento de inversión, oferta, orden de mercado ni informe fiscal individual.

[1]: https://help.portfolio-performance.info/en/concepts/performance/money-weighted/ "Portfolio Performance — Money-weighted rate of return"

[2]: https://www.cfainstitute.org/insights/professional-learning/refresher-readings/2026/rates-and-returns "CFA Institute — Rates and Returns"

[3]: https://www.gipsstandards.org/standards/gips-standards-for-firms/ "CFA Institute — GIPS Standards for Firms"

[4]: ./DISENO_PUENTE_ATRIBUCION_TWR_XIRR_2026-08-27.md "Gestor financiero — diseño de TWR, XIRR y puente de atribución"

[5]: ./ESPECIFICACION_PRUEBAS_Y_ESQUEMA_RETORNOS_2026-08-27.md "Gestor financiero — pruebas y esquema de retornos"
