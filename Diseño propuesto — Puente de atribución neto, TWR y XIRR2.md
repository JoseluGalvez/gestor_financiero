# Diseño propuesto — Puente de atribución neto, TWR y XIRR

**Proyecto:** Gestor financiero · Portafolio Intel  
**Fecha de diseño:** 27 de agosto de 2026  
**Estado:** propuesta técnica; no está implementada ni activada sobre datos reales.  
**Principio rector:** resultado explicable, datos con procedencia, privacidad por defecto y ausencia de recomendaciones u órdenes de inversión.

> **Decisión principal.** El producto debe mostrar **dos rendimientos distintos y complementarios**: TWR para medir la evolución de la cartera neutralizando aportaciones y retiradas externas, y XIRR/MWR para expresar el resultado experimentado por el titular, sensible a fechas e importes de sus flujos. Ninguno sustituye al otro. El puente en euros explica la variación neta entre valor inicial y valor final; no intenta “atribuir XIRR” sumando porcentajes, porque la TIR es no lineal.

![Arquitectura propuesta de TWR, XIRR y atribución neta](https://private-us-east-1.manuscdn.com/sessionFile/2HPSZTOXIOTEUQEqz69T8F/sandbox/gfNry4zO1D3Zhu6uZRqZIo-images_1787815344077_na1fn_L2hvbWUvdWJ1bnR1L2dlc3Rvcl9maW5hbmNpZXJvL2RvY3MvYXNzZXRzL3JlbmRpbWllbnRvL2FycXVpdGVjdHVyYS10d3IteGlyci1hdHJpYnVjaW9u.png?Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvMkhQU1pUT1hJT1RFVVFFcXo2OVQ4Ri9zYW5kYm94L2dmTnJ5NHpPMUQzWmh1NnVaUnFaSW8taW1hZ2VzXzE3ODc4MTUzNDQwNzdfbmExZm5fTDJodmJXVXZkV0oxYm5SMUwyZGxjM1J2Y2w5bWFXNWhibU5wWlhKdkwyUnZZM012WVhOelpYUnpMM0psYm1ScGJXbGxiblJ2TDJGeWNYVnBkR1ZqZEhWeVlTMTBkM0l0ZUdseWNpMWhkSEpwWW5WamFXOXUucG5nIiwiQ29uZGl0aW9uIjp7IkRhdGVMZXNzVGhhbiI6eyJBV1M6RXBvY2hUaW1lIjoxNzg5NDMwNDAwfX19XX0_&Key-Pair-Id=K2QY5QTL8JSY6C&Signature=MEUCIQDPeRtAF0M3mrE8eW9TwD7UP9NoKI~38ho5y7cni4PHSwIgQ-iw5h5U9hqK2iXMfudfIh9IjGacLHyKPRyZ44tuGo0_)

*Figura 1. Arquitectura determinista propuesta. La salida se bloquea o marca como parcial cuando faltan datos de valoración, divisa, conciliación o procedencia.*

---

## Índice

1. [Objetivo y frontera funcional](#1-objetivo-y-frontera-funcional)
2. [Por qué se muestran TWR y XIRR juntos](#2-por-qué-se-muestran-twr-y-xirr-juntos)
3. [Modelo conceptual de flujo y signo](#3-modelo-conceptual-de-flujo-y-signo)
4. [Contrato de datos propuesto](#4-contrato-de-datos-propuesto)
5. [Motor TWR: retorno ponderado por tiempo](#5-motor-twr-retorno-ponderado-por-tiempo)
6. [Motor XIRR: retorno ponderado por dinero](#6-motor-xirr-retorno-ponderado-por-dinero)
7. [Puente de atribución neto](#7-puente-de-atribución-neto)
8. [Control de calidad, conciliación y estados de salida](#8-control-de-calidad-conciliación-y-estados-de-salida)
9. [Diseño de interfaz y explicabilidad](#9-diseño-de-interfaz-y-explicabilidad)
10. [Arquitectura técnica y plan de implementación](#10-arquitectura-técnica-y-plan-de-implementación)
11. [Matriz de pruebas deterministas](#11-matriz-de-pruebas-deterministas)
12. [Comparación con alternativas de mercado](#12-comparación-con-alternativas-de-mercado)
13. [Mejoras de salto cualitativo](#13-mejoras-de-salto-cualitativo)
14. [Límites y referencias](#14-límites-y-referencias)

---

## 1. Objetivo y frontera funcional

El diseño convierte una variación patrimonial en una explicación reproducible. El punto de partida y de llegada no debe ser una cifra de “rentabilidad” aislada, sino un registro que permita responder: **qué valor se comparó, qué flujos entraron o salieron, qué movimientos son internos, qué costes se pagaron, qué tipo de cambio se aplicó, qué datos quedaron fuera y qué versión de cálculo produjo el resultado**.

El alcance propuesto es la rentabilidad de cartera y de subcarteras seleccionadas. No cubre recomendaciones de compra/venta, ejecución de órdenes, planificación fiscal individual, cálculo legal de impuestos ni promesa de precisión de un proveedor de mercado. El Canvas local mantiene su modo sin red; el motor se podrá usar en local con archivos explícitos o en el espacio autenticado solo cuando RLS, procedencia y conciliación estén terminados.

| Pregunta de negocio | Métrica o vista propuesta | Respuesta admisible | Respuesta que se debe evitar |
| --- | --- | --- | --- |
| ¿Cómo evolucionaron los activos, al margen de aportaciones/retiros? | **TWR neto de costes definidos**. | Retorno de cartera en un período y moneda declarados. | “La persona ganó X %” sin aislar cuándo entró/salió capital. |
| ¿Qué rendimiento experimentó el titular con su calendario de flujos? | **XIRR/MWR**. | Tasa anualizada que iguala los flujos y la valoración final. | Compararla como si fuera retorno puro de estrategia. |
| ¿Por qué cambió el valor? | **Puente de atribución neto en moneda base**. | Mercado, ingresos, FX, costes, impuestos, flujos y ajustes que cuadran. | Atribuir una TIR a categorías sumando porcentajes. |
| ¿Se puede confiar en el resultado? | Sello de **calidad y procedencia**. | Completo, parcial, bloqueado o no calculable, con motivo. | Mostrar `0 %`, `—` o una cifra redonda sin explicar el hueco. |

---

## 2. Por qué se muestran TWR y XIRR juntos

CFA Institute distingue medidas de retorno ponderadas por tiempo y por dinero; su elección responde a la pregunta que se intenta responder.[1] Sharesight también describe que su retorno ponderado por dinero considera el tamaño y el momento de los flujos, mientras que TWR elimina entradas y salidas externas para evaluar la evolución de las inversiones.[2]

### 2.1. TWR

El **retorno ponderado por tiempo** encadena retornos de subperíodos delimitados por flujos externos. Su propósito es neutralizar que una persona aporte o retire capital en una fecha concreta. Es adecuado para comparar una estrategia, una cartera modelo o dos plataformas **cuando la cobertura de valoraciones y la política de flujos es homogénea**.

### 2.2. XIRR/MWR

El **retorno ponderado por dinero**, expresado mediante XIRR con fechas reales, resuelve la tasa anual que hace cero el valor presente de los flujos desde la perspectiva del titular. Es adecuado para explicar su experiencia económica: sí incorpora que aportó más capital antes de una subida o que retiró capital antes de una caída.

Portfolio Performance describe el retorno ponderado por dinero como una TIR que tiene en cuenta fecha e importe de los flujos.[3] La misma fuente advierte que, a nivel de cartera, depósitos y retiradas son los flujos relevantes, mientras que una compra/venta dentro de la cartera es un movimiento interno. Esta separación es esencial para evitar duplicar flujos en XIRR.[3]

| Aspecto | TWR | XIRR / MWR |
| --- | --- | --- |
| Pregunta que responde | ¿Cómo evolucionó la cartera, aislando la decisión de aportar/retirar? | ¿Qué rendimiento experimentó el titular con sus flujos reales? |
| Sensibilidad a aportaciones/retiros | Las neutraliza si se dispone de valoración en el corte. | Las incorpora por importe y fecha. |
| Resultado | Retorno compuesto del período; anualización solo cuando corresponda. | Tasa anualizada de la ecuación de flujos con fechas reales. |
| Requisito crítico | Valoraciones fiables en cada corte de flujo externo. | Al menos un flujo negativo y uno positivo, fechas válidas y valoración final. |
| Riesgo de interpretación | Llamarlo rendimiento del titular. | Llamarlo desempeño puro del gestor/estrategia. |
| Tratamiento ante huecos de datos | Bloquear o etiquetar parcial; Modified Dietz solo como aproximación explícita. | No devolver una tasa si no hay una raíz única y verificable. |

> **Regla de presentación.** Si la cartera contiene flujos externos y hay cobertura suficiente, la interfaz muestra ambas métricas una junto a otra: “TWR — evolución de cartera” y “XIRR — experiencia del titular”. Nunca se ordenan plataformas como “mejor” con una métrica que mezcla períodos, monedas, flujos, cobertura o política de costes diferentes.

---

## 3. Modelo conceptual de flujo y signo

### 3.1. Frontera de cartera

La frontera se fija por `portfolio_id` y versión de cálculo. Un evento es **externo** si cruza esa frontera: por ejemplo, una aportación desde fuera, un retiro hacia fuera, una transferencia de valores entrante o saliente valorada. Una compra, venta, dividendo reinvertido, cobro de cupón que queda en efectivo de la misma cartera o transferencia entre dos cuentas dentro de la misma cartera es **interno** a nivel de cartera.

La clasificación nunca se deduce solo del nombre de la transacción. Debe guardarse como dato normalizado, con su regla y fuente. El mismo tipo económico puede ser interno o externo según el alcance seleccionado. Por ejemplo, un dividendo es ingreso de cartera mientras permanece dentro de la frontera; si se retira a una cuenta externa, la retirada se registra como flujo externo separado.

| Clase normalizada | Ejemplos | Efecto TWR de cartera | Efecto XIRR de cartera | Efecto en puente neto |
| --- | --- | --- | --- | --- |
| `external_contribution` | Aportación de efectivo o valores desde fuera. | Neutraliza delimitando subperíodo. | Flujo negativo para el titular. | Aumenta valor; se muestra separada de rendimiento. |
| `external_withdrawal` | Retiro de efectivo/valores fuera de la cartera. | Neutraliza delimitando subperíodo. | Flujo positivo para el titular. | Reduce valor; se muestra separada de rendimiento. |
| `trade_buy` / `trade_sell` | Compra o venta entre efectivo y activo dentro de la cartera. | Interno. | Interno. | No aparece como aportación/retiro; mueve composición. |
| `income_dividend` / `income_interest` | Dividendo, cupón o interés retenido en cartera. | Incluido en retorno según política de cálculo. | Incluido en valoración final, no flujo externo. | Componente positivo “Ingresos”. |
| `fee` | Comisión de custodia, gestión, ejecución o conversión. | Reduce TWR neto si la política es neta de comisiones. | Reduce valor/flujo según dónde se pague. | Componente negativo “Comisiones”. |
| `tax_withholding` | Retención/impuesto ya informado y soportado en cartera. | Política explícita: vista neta para titular; bruta antes de impuestos para comparador. | Reduce experiencia neta si es coste de cartera. | Componente negativo “Impuestos/retenciones informados”. |
| `fx_conversion` | Cambio de divisa interno o tasa aplicada a conversión. | Forma parte de retorno base si la moneda base es común. | Interno salvo que cruce frontera. | Componentes “FX” y, si aplica, “coste FX”. |
| `corporate_action` | Split, fusión, spin-off, devolución de capital. | Depende de clasificación y valoración. | Normalmente interno. | Ajuste trazable separado para no forzar mercado/ingreso. |
| `valuation_adjustment` | Corrección conciliada o valoración manual aprobada. | Solo si la política permite la valoración. | Puede afectar valoración final. | Componente separado y visible; nunca oculto en mercado. |

### 3.2. Convención de signo única

El motor utiliza una sola convención interna para evitar inversiones accidentales de signo.

| Perspectiva | Aportación externa | Retiro externo | Valor inicial | Valor final |
| --- | ---:| ---:| ---:| ---:|
| **Libro de patrimonio de la cartera** | Positivo | Negativo | Positivo | Positivo |
| **XIRR de la persona titular** | Negativo: capital invertido | Positivo: capital recuperado | Negativo: inversión al inicio | Positivo: valor liquidable al cierre |
| **Puente neto** | Positivo y separado | Negativo y separado | Ancla | Ancla final |

La adaptación entre perspectivas se realiza en una función explícita, versionada y probada. No se permite a la interfaz aplicar signos ad hoc.

---

## 4. Contrato de datos propuesto

### 4.1. Por qué el modelo actual no basta todavía

El dashboard actual dispone de `TransactionRow` con `occurred_at`, `kind`, `quantity`, `gross_amount`, `fees` y `currency`, y de `PortfolioSnapshot` con `as_of`, `market_value`, `cost_basis`, `gain`, `return_pct` y `source_version`. Es una base útil, pero todavía no identifica de forma suficiente: frontera externa/interna, importe convertido a divisa base, FX aplicado, impuestos, estado de conciliación, valoración antes/después de flujo, procedencia detallada y versión de la política de retorno.

Por tanto, se propone conservar las tablas actuales y añadir un **libro mayor de rendimiento derivado**. Las filas crudas nunca se reescriben; el libro mayor normalizado se regenera de forma idempotente desde un lote de ingesta y una política de cálculo concretos.

### 4.2. Tipos TypeScript propuestos

```ts
export type ReturnScope = "portfolio" | "account" | "instrument" | "platform";

export type QualityState =
  | "complete"
  | "partial"
  | "blocked"
  | "not_calculable";

export type FlowKind =
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

export type DataProvenance = {
  sourceId: string | null;
  sourceVersion: string;
  importedAt: string;
  sourceOccurredAt: string | null;
  mappingVersion: string | null;
  calculationVersion: string;
  reconciledAt: string | null;
  reconciliationState: "reconciled" | "unreconciled" | "review_required";
};

export type BaseAmount = {
  amount: number;
  currency: string;
  baseAmount: number | null;
  baseCurrency: string;
  fxRateToBase: number | null;
  fxAsOf: string | null;
  fxSourceId: string | null;
};

export type ReturnLedgerEvent = {
  id: string;
  organizationId: string;
  portfolioId: string;
  accountId: string | null;
  instrumentId: string | null;
  occurredAt: string;
  effectiveDate: string;
  kind: FlowKind;
  boundary: "external" | "internal";
  amount: BaseAmount;
  quantity: number | null;
  linkedEventId: string | null;
  isReversible: boolean;
  quality: QualityState;
  warnings: string[];
  provenance: DataProvenance;
};

export type PortfolioValuationPoint = {
  id: string;
  organizationId: string;
  portfolioId: string;
  asOf: string;
  baseCurrency: string;
  marketValueBase: number | null;
  cashValueBase: number | null;
  pricedWeightPct: number;
  fxCoveragePct: number;
  valuationCoveragePct: number;
  quality: QualityState;
  provenance: DataProvenance;
};

export type ReturnPolicy = {
  id: string;
  version: string;
  baseCurrency: string;
  annualDayCount: 365;
  includeFees: boolean;
  includeReportedTaxes: boolean;
  valuationFrequency: "event" | "daily" | "periodic";
  externalFlowCutRule: "before_flow" | "after_flow";
  allowModifiedDietzFallback: boolean;
  residualTolerance: {
    absoluteBase: number;
    relative: number;
  };
};
```

Estos tipos no contienen secretos. `sourceId` es un identificador de procedencia, no un token ni una configuración de conexión. Las consultas del dashboard autenticado se mantienen dentro del perímetro de organización y, si se habilita, de acceso por cartera; los cálculos no tienen permiso para cruzar organizaciones.

### 4.3. Reglas de validación previas al motor

| Regla | Acción si falla | Por qué importa |
| --- | --- | --- |
| Fecha ISO y calendario real | Bloquear fila de cálculo y registrar motivo. | Evita ordenar eventos en fechas imposibles. |
| Importe finito y moneda declarada | Bloquear. | Evita `NaN`, infinitos y valores no convertibles. |
| Tipo de cambio trazable si moneda distinta a base | Marcar parcial; bloquear según política. | No mezcla importes heterogéneos sin conversión. |
| Valoración de inicio, fin y cortes de flujo para TWR exacto | No calcular TWR exacto. | Sin esas valoraciones no se puede neutralizar un flujo correctamente. |
| Al menos un flujo negativo y uno positivo para XIRR | No calcular XIRR. | La raíz de TIR no está definida de forma útil si todos los signos son iguales. |
| Eventos internos emparejados cuando se requiera | Marcar revisión. | Evita tratar una venta interna como retiro o duplicar capital. |
| Cobertura y conciliación mínima aprobada | Mostrar parcial/bloqueado. | Previene precisión falsa. |

---

## 5. Motor TWR: retorno ponderado por tiempo

### 5.1. Definición operativa

El motor divide el intervalo seleccionado en subperíodos. Cada subperíodo termina **inmediatamente antes** de un flujo externo y empieza inmediatamente después del flujo externo anterior. Para cada segmento se calcula la variación de valor de los activos ya presentes, y después se encadenan los retornos.

Si `Vᵢ,start` es el valor inmediatamente después del corte anterior y `Vᵢ,end,preFlow` es el valor inmediatamente antes del siguiente flujo externo, el retorno del subperíodo es:

```text
rᵢ = (Vᵢ,end,preFlow / Vᵢ,start) − 1
```

El retorno TWR del período es:

```text
TWR = Π (1 + rᵢ) − 1
```

Cuando el flujo ocurre al comienzo del subperíodo, la valoración post-flujo se convierte en el denominador del siguiente tramo. La regla exacta se almacena en `externalFlowCutRule`; no se cambia por pantalla o por usuario sin crear una nueva versión de política.

> **Anualización.** Para evitar comparaciones engañosas, los períodos inferiores a un año muestran retorno del período y no se anualizan. Cuando el período alcanza o supera un año y la política lo permite, se muestra una anualización adicional, claramente etiquetada, junto al retorno acumulado. GIPS especifica que los períodos inferiores a un año no deben anualizarse en sus reportes; la aplicación adopta este principio de presentación pero no reclama conformidad GIPS.[4]

### 5.2. Algoritmo propuesto

```ts
export function calculateTrueTwr(
  valuations: PortfolioValuationPoint[],
  events: ReturnLedgerEvent[],
  policy: ReturnPolicy,
): TwrResult {
  // 1. Validar moneda base, calidad, orden temporal y valoración de cada corte.
  // 2. Tomar únicamente eventos boundary === "external" con importe base válido.
  // 3. Construir cortes: inicio, cada flujo externo, fin.
  // 4. Para cada tramo, exigir valoración antes/después conforme a la política.
  // 5. Calcular rᵢ y encadenar Π(1 + rᵢ).
  // 6. Generar auditoría por tramo y estado parcial/bloqueado cuando falte evidencia.
}
```

La salida debe devolver los subperíodos y no solo un porcentaje:

```ts
export type TwrPeriod = {
  startAsOf: string;
  endAsOf: string;
  startValueBase: number;
  endValuePreFlowBase: number;
  externalFlowAtEndBase: number | null;
  subperiodReturn: number;
  valuationCoveragePct: number;
  warnings: string[];
};

export type TwrResult = {
  returnPct: number | null;
  annualizedReturnPct: number | null;
  periods: TwrPeriod[];
  quality: QualityState;
  method: "true_twr" | "modified_dietz" | "not_calculable";
  policyVersion: string;
  warnings: string[];
};
```

### 5.3. Fallback: Modified Dietz, solo si se declara

Cuando no hay valoraciones en cada flujo externo, el motor **no debe presentar Modified Dietz como TWR**. Puede ofrecer, si la política lo autoriza, un cálculo aproximado con la etiqueta “Modified Dietz — estimación ponderada por tiempo del flujo”.

```text
Rᴍᴅ = (Vfin − Vinicio − Σ CFᵢ) / (Vinicio + Σ wᵢ × CFᵢ)
```

donde `wᵢ` representa la fracción temporal del período durante la que el flujo estuvo invertido. Esta aproximación debe incluir: frecuencia de valoración, número de flujos afectados, diferencia frente a TWR exacto no disponible y sello `partial`. Sharesight explica que utiliza una variante de Modified Dietz como metodología monetaria y también advierte que distintas metodologías pueden producir resultados diferentes.[2]

| Situación | Resultado que muestra la interfaz |
| --- | --- |
| Valoraciones completas en todos los cortes externos | **TWR exacto**. |
| Valoraciones no disponibles en algún corte, pero política permite aproximación | **Modified Dietz estimado**, nunca nombrado TWR exacto. |
| Valor inicial/final ausente, FX incompleto o conciliación bloqueante | **No calculable** y lista de acciones para resolver. |
| Período sin flujos externos y dos valoraciones completas | Retorno simple del subperíodo, equivalente al TWR de un tramo. |

---

## 6. Motor XIRR: retorno ponderado por dinero

### 6.1. Ecuación y flujos de entrada

XIRR resuelve la tasa anual `r` para la cual el valor presente neto es cero:

```text
XNPV(r) = Σ [ CFᵢ / (1 + r)^((dᵢ − d₀) / 365) ] = 0
```

La convención es desde el punto de vista del titular:

```text
− valor inicial de la cartera (si existe) 
− aportaciones externas 
+ retiradas externas 
+ valor final liquidable
± cualquier flujo que realmente cruce la frontera seleccionada
```

Las compras, ventas, dividendos reinvertidos y transferencias internas no se añaden como flujos XIRR a nivel de cartera, pues ya se reflejan en el valor final. La fuente de Portfolio Performance ofrece el mismo criterio de identificar depósitos y retiradas como flujos de cartera, y no duplicar operaciones internas.[3]

### 6.2. Preparación de flujos

1. Seleccionar el alcance: cartera, cuenta, instrumento o plataforma. Cada alcance tiene su propia frontera y política.
2. Validar fechas reales y convertir todo a la moneda base usando un FX con fuente y corte guardados.
3. Obtener `Vinicio` en la fecha de comienzo y convertirlo en flujo negativo. Si el inicio es valor cero, se registra cero pero no sustituye aportaciones reales.
4. Transformar aportaciones externas a flujos negativos y retiradas a positivos.
5. Añadir `Vfinal` como flujo positivo en la fecha final. Debe ser valor liquidable conforme a política y cobertura.
6. Consolidar los flujos de la misma fecha para estabilidad numérica, conservando la lista de eventos que los componen.
7. Comprobar que existe al menos un importe negativo y uno positivo; si no, devolver `not_calculable`.

### 6.3. Solución numérica segura

No se debe delegar el cálculo en un valor de hoja de cálculo ni aceptar un primer resultado de Newton-Raphson sin validar la raíz. La TIR puede no tener solución o presentar raíces múltiples cuando la secuencia de signos cambia varias veces. Sharesight señala de manera explícita que IRR puede producir resultados múltiples, poco razonables o no poder calcularse en determinadas combinaciones de flujos y volatilidad.[2]

El motor TypeScript propuesto utiliza una búsqueda determinista de intervalos y un método acotado —Brent o bisección como alternativa— dentro del dominio `r > −1`.

```ts
export type XirrResult = {
  annualizedReturnPct: number | null;
  roots: number[];
  selectedRoot: number | null;
  npvResidual: number | null;
  iterations: number;
  quality: QualityState;
  method: "xirr_brent" | "not_calculable";
  warnings: string[];
  cashFlows: Array<{ date: string; amountBase: number; eventIds: string[] }>;
};

export function calculateXirr(cashFlows: XirrCashFlow[]): XirrResult {
  // Validar fechas, base monetaria y mezcla de signos.
  // Muestrear el dominio (-1 + ε, rango positivo configurable) para localizar cambios de signo.
  // Resolver cada intervalo con Brent/bisección, verificando |XNPV(r)| <= tolerancia.
  // Si hay 0 raíces: not_calculable; si hay >1: no seleccionar silenciosamente.
  // Si hay 1 raíz: devolver la tasa anualizada y la evidencia de convergencia.
}
```

| Caso numérico | Comportamiento obligatorio |
| --- | --- |
| Una sola raíz válida con residual dentro de tolerancia | Mostrar XIRR y trazabilidad. |
| Ninguna raíz detectada | `not_calculable`; explicar falta de solución en el dominio evaluado. |
| Más de una raíz | `blocked` o `review_required`; listar raíces sin seleccionar una por defecto. |
| Flujos sin mezcla de signos | `not_calculable`; pedir valoración inicial/final o flujos faltantes. |
| Fecha inválida, importe no finito o FX ausente | `blocked`/`partial` según política; nunca convertir a cero. |
| Iteraciones máximas alcanzadas | `not_calculable`; conservar residual y diagnóstico. |

### 6.4. Tolerancia, dominio y resultados extremos

La tolerancia no debe estar codificada de forma arbitraria en la UI. `ReturnPolicy` define una tolerancia absoluta en moneda base y una relativa al valor nominal de los flujos. La condición de convergencia combina ambas:

```text
|XNPV(r)| ≤ max(tolerancia_absoluta, tolerancia_relativa × Σ |CFᵢ|)
```

El motor conserva precisión interna suficiente y redondea únicamente en la capa de presentación. Los valores extremos se muestran junto con advertencia de sensibilidad; no se bloquean por ser altos o bajos si la raíz y los datos son válidos, pero se exige revisión cuando el resultado depende de flujos concentrados o la cobertura es parcial.

---

## 7. Puente de atribución neto

### 7.1. La ecuación que debe cuadrar

El puente opera en **importe de moneda base**, no en porcentaje. Explica el paso desde el valor inicial hacia el valor final:

```text
Valor final
= Valor inicial
+ Aportaciones externas
− Retiradas externas
+ Efecto mercado local
+ Dividendos e intereses
+ Efecto FX
+ Interacción mercado × FX
− Comisiones
− Impuestos y retenciones informados
± Acciones corporativas y ajustes de valoración conciliados
+ Residual de conciliación
```

El objetivo de producto es que el residual sea cero dentro de la tolerancia aprobada. Si supera el umbral, la pantalla no debe presentar el puente como conciliado: muestra estado `review_required`, cuantía de residual y las entradas pendientes. El residual es una alerta de calidad, no una categoría para ocultar componentes desconocidos.

### 7.2. Componentes y reglas de no doble conteo

| Componente | Definición | Signo esperado | Regla crítica |
| --- | --- | ---:| --- |
| Valor inicial | Valor de cartera en inicio, con fecha, cobertura y moneda base. | Ancla | No usar coste histórico en lugar de valoración del corte. |
| Aportaciones | Capital/valores que cruzan hacia dentro. | Positivo | No incluir compras internas. |
| Retiradas | Capital/valores que cruzan hacia fuera. | Negativo | No incluir ventas que quedan en efectivo interno. |
| Mercado local | Variación del precio en divisa local con FX de inicio. | Positivo/negativo | No incluir efectos de FX ni ingresos en esta línea. |
| Dividendos/intereses | Ingresos mantenidos en el perímetro. | Positivo/negativo | Si se retiran, separar la retirada externa. |
| FX | Cambio de tipo aplicado al valor local de inicio. | Positivo/negativo | Requiere fuente, par y fecha de FX. |
| Interacción mercado × FX | Término cruzado para que la descomposición FX cuadre exactamente. | Positivo/negativo | No esconder dentro de mercado o FX sin convención versionada. |
| Comisiones | Costes identificados de ejecución, gestión/custodia o conversión. | Negativo | No mezclar con impuestos ni restar dos veces en valor/flujo. |
| Impuestos/retenciones informados | Coste fiscal registrado o retención soportada dentro de alcance. | Negativo | No inferir obligación fiscal ni tasa; solo datos informados. |
| Acciones corporativas/ajustes | Split, spin-off, fusión, corrección de valoración u otro movimiento conciliado. | Positivo/negativo | Cada clase requiere motivo, evento origen y revisión. |
| Residual | Diferencia de pie de control. | Idealmente cero | Es diagnóstico, no rendimiento. |

### 7.3. Descomposición de mercado y FX por instrumento

Para una posición sin cambio de unidades entre dos valoraciones:

```text
V₀ = U × P₀ × FX₀
V₁ = U × P₁ × FX₁

Efecto mercado local = U × (P₁ − P₀) × FX₀
Efecto FX            = U × P₀ × (FX₁ − FX₀)
Interacción           = U × (P₁ − P₀) × (FX₁ − FX₀)
```

La suma de los tres efectos equivale exactamente a `V₁ − V₀`. La convención de mostrar el término cruzado como componente separado es más transparente que absorberlo silenciosamente en mercado o FX. Si, por razones de UX, se distribuye la interacción entre ambos, esa regla debe ser fija, estar versionada y aparecer en la ayuda metodológica.

Cuando hay cambios de unidades, el período se divide en cortes de transacción o de flujo y se aplica la misma lógica a cada tramo con unidades constantes. Esto evita asignar una compra reciente al rendimiento de toda la ventana.

### 7.4. Dos vistas netas, no una cifra ambigua

La app debe poder mostrar dos columnas de puente con la misma base, sin borrar ninguna información:

| Vista | Incluye comisiones | Incluye impuestos/retenciones informados | Uso |
| --- | --- | --- | --- |
| **Neta para titular** | Sí. | Sí, cuando los datos están disponibles. | Entender patrimonio y experiencia económica neta. |
| **Antes de impuestos informados** | Sí. | No. | Comparar evolución económica sin mezclar situación tributaria personal. |

La etiqueta “bruta” no debe utilizarse si ya se descuentan comisiones. La política completa debe ser legible: “Neta de comisiones y de impuestos/retenciones informados” o “Neta de comisiones, antes de impuestos informados”. ESMA destaca que los costes y la información sobre rendimiento son componentes relevantes para decisiones informadas de los inversores; el producto debe mostrar los costes, no enterrarlos en una cifra agregada.[5]

### 7.5. Salida propuesta

```ts
export type AttributionLine = {
  key:
    | "start_value"
    | "external_contributions"
    | "external_withdrawals"
    | "market_local"
    | "income"
    | "fx"
    | "fx_interaction"
    | "fees"
    | "reported_taxes"
    | "corporate_actions"
    | "valuation_adjustments"
    | "residual"
    | "end_value";
  amountBase: number;
  sign: "positive" | "negative" | "anchor" | "residual";
  sourceEventIds: string[];
  coveragePct: number;
  warnings: string[];
};

export type NetAttributionBridge = {
  periodStart: string;
  periodEnd: string;
  baseCurrency: string;
  policyVersion: string;
  quality: QualityState;
  lines: AttributionLine[];
  calculatedEndValueBase: number | null;
  observedEndValueBase: number | null;
  residualBase: number | null;
  isTiedOut: boolean;
  warnings: string[];
};
```

---

## 8. Control de calidad, conciliación y estados de salida

### 8.1. Controles que no se deben omitir

| Control | Fórmula o comprobación | Estado si falla |
| --- | --- | --- |
| Pie de valor | `valor_final_calculado − valor_final_observado = residual`. | `review_required` si excede tolerancia. |
| Cobertura de valoración | Valor con precio y FX válidos / valor total. | `partial` o `blocked` según umbral de política. |
| Integridad de flujo | Todo flujo externo tiene fecha, importe, moneda y clasificación. | `blocked`. |
| Integridad de FX | Todo importe no base tiene tipo, fuente y corte. | `partial` o `blocked`; nunca valor cero. |
| Reversibilidad | Cada lote de ingesta y normalización conserva origen. | `review_required` si no se puede rastrear. |
| Política | La métrica conserva ID/versión de la política. | No publicar si no existe versión. |
| XIRR | Raíz única y residual de XNPV dentro de tolerancia. | `not_calculable`/`blocked`. |
| TWR | Valoraciones completas en inicio, fin y cortes externos. | `not_calculable` o “Modified Dietz estimado”. |

### 8.2. Estados visibles y accionables

| Estado | Significado | Ejemplo de mensaje accionable |
| --- | --- | --- |
| **Completo** | Datos y controles alcanzan los mínimos de política. | “Cálculo conciliado; revisa metodología y fecha de corte.” |
| **Parcial** | Hay resultado, pero cobertura declarada por debajo del ideal. | “Falta FX para parte de la cartera; no compares esta métrica con otra completa.” |
| **Revisión requerida** | El motor detecta residual, evento no emparejado o categoría ambigua. | “El puente no cuadra dentro de tolerancia; revisa las filas indicadas.” |
| **No calculable** | No existe evidencia matemática suficiente o XIRR no tiene una raíz válida única. | “Añade valor inicial/final o corrige flujos; no se publica una tasa.” |
| **Bloqueado** | Datos inválidos o incumplimiento de control. | “Hay fecha/moneda/importe inválido; corrígelo antes de recalcular.” |

> **No usar ceros como sustituto.** Si la tasa no es calculable, `null` con explicación es más seguro que `0 %`. Un cero ficticio confundiría ausencia de información con ausencia de rendimiento.

---

## 9. Diseño de interfaz y explicabilidad

### 9.1. Pantalla “Rendimiento y atribución”

La nueva pantalla debe ser horizontal, con información esencial visible sin abrir paneles complejos.

| Zona | Contenido | Decisión de diseño |
| --- | --- | --- |
| Encabezado de alcance | Cartera/subcartera, período, moneda base, política, fecha de corte y sello de calidad. | Evita comparar resultados con bases distintas. |
| Dos KPIs principales | TWR y XIRR, cada uno con nombre completo, período y estado. | No presentar uno como reemplazo del otro. |
| Puente neto | Cascada de inicio → flujos → rendimiento/costes → final, con residual visible. | El valor final debe cuadrar o marcar revisión. |
| Desglose por factor | Mercado, ingresos, FX, comisiones, impuestos, ajustes, por plataforma/activo opcional. | No ordenar por “ganador” si cobertura no es homogénea. |
| Tabla de subperíodos | Fechas, valor inicio, flujo, valor preflujo, retorno y cobertura. | Permite auditar TWR. |
| Tabla XIRR | Flujos agregados por fecha, signo, eventos origen y residual. | Permite auditar la tasa sin exponer secretos. |
| Metodología | Política de costes, frontera, frecuencia de valoración y advertencias. | Separar dato, cálculo y supuesto. |

### 9.2. Reglas de UX

1. El usuario escoge primero **alcance**, **período**, **moneda base** y **vista neta**. La pantalla no presupone que todo el patrimonio debe agregarse.
2. Si el período contiene diferente cobertura por plataforma, se ofrece “comparar solo la parte conciliada” o “ver con cobertura parcial”, con etiquetas distintas.
3. Un icono de información abre fórmulas y lista de entradas, no una explicación genérica.
4. Cada bloque de puente puede abrir sus eventos fuente; el usuario puede ver el lote/origen sin revelar credenciales de un conector.
5. La exportación PDF/CSV captura la política, la calidad, el residual y las advertencias. Debe usar la defensa CSV ya implantada para texto no confiable.
6. La UI no muestra lenguaje de recomendación. “Revisar concentración FX” es apropiado; “vender divisa” no lo es.

---

## 10. Arquitectura técnica y plan de implementación

### 10.1. Módulos propuestos

| Módulo | Responsabilidad | Controles de seguridad y calidad |
| --- | --- | --- |
| `return-ledger-normalizer.ts` | Clasifica transacciones, crea eventos normalizados e identifica frontera. | Funciones puras, validación de fecha/importe, no acceso a red. |
| `return-valuation.ts` | Selecciona valoraciones/FX y calcula cobertura. | Procedencia obligatoria, no inventar precios/FX. |
| `return-twr.ts` | Construye cortes y encadena retornos exactos o fallback declarado. | `null` si falta un corte; auditoría por subperíodo. |
| `return-xirr.ts` | Normaliza flujos y resuelve XNPV con método acotado. | Raíz única, residual, límite de iteración y advertencias. |
| `return-attribution.ts` | Construye puente monetario y controla el pie. | Componentes exclusivos, residual visible, no doble conteo. |
| `return-quality.ts` | Determina estados y mensajes explicables. | Evita que la UI oculte inputs incompletos. |
| `ReturnPerformanceWorkspace.tsx` | Presenta KPIs, cascada, tablas y exportación. | No contiene fórmulas de negocio ni secretos. |
| Worker local opcional | Procesa datasets grandes locales sin bloquear interfaz. | No persiste ni transmite filas; conserva `requestId`. |

### 10.2. Persistencia propuesta en modo autenticado

Las nuevas tablas/eventos deben estar protegidos por el mismo perímetro que transacciones y snapshots: `organization_id` y `portfolio_id`, RLS habilitada, grants mínimos y policies probadas. Los libros de cálculo pueden ser derivados y regenerables; no almacenan secretos ni sustituyen los movimientos crudos.

Antes de persistir o sincronizar el motor en Supabase, deben cerrarse los hallazgos de RLS remota y Realtime: pruebas de dos organizaciones, migraciones reproducibles, carga por dominio/coalescida y chequeo de estado obsoleto. El diseño local puede desarrollarse con fixtures ficticios sin esa activación remota.

### 10.3. Fases de entrega

| Fase | Entrega | Dependencia | Criterio de aceptación |
| --- | --- | --- | --- |
| 0 | Política de rendimiento y glosario de flujos aprobados. | Decisión de producto y revisión financiera. | Tipos, signos, tratamiento de comisiones/impuestos y frontera documentados. |
| 1 | Normalizador de libro mayor con fixtures ficticios. | Fase 0. | Todo evento es interno/externo o queda en revisión; no hay categoría implícita. |
| 2 | Puente neto monetario con pie de control. | Valoraciones y FX con procedencia. | Residual dentro de tolerancia en pruebas; huecos visibles. |
| 3 | TWR exacto y fallback Modified Dietz etiquetado. | Valoraciones en cortes externos. | Pruebas prueban que aportaciones/retiros no alteran TWR exacto. |
| 4 | XIRR con búsqueda de raíces y diagnóstico. | Flujos normalizados. | Casos de raíz única, inexistente y múltiple cubiertos. |
| 5 | Pantalla, informe/exportación y explicación. | Fases 2–4. | Cada KPI abre sus inputs, versión y advertencias. |
| 6 | Integración autenticada segura y Realtime. | RLS remota y Realtime cerrados. | E2E multiusuario no cruza organizaciones y no recarga todo por un evento. |

---

## 11. Matriz de pruebas deterministas

Las pruebas usan solo fixtures identificados como ficticios. No usan cotizaciones reales ni conectores. Cada fixture declara moneda base, política y fechas válidas.

| ID | Caso | Resultado esperado |
| --- | --- | --- |
| RET-001 | Una valoración inicial y final, sin flujos externos. | TWR de un período y XIRR compatibles con el mismo cambio económico; sin anualizar si período menor de un año. |
| RET-002 | Aportación externa justo después de una valoración. | TWR neutraliza el flujo; XIRR cambia con la fecha/importe de la aportación. |
| RET-003 | Retiro externo antes del cierre. | TWR no trata el retiro como pérdida de mercado; XIRR usa flujo positivo para el titular. |
| RET-004 | Compra y venta internas con efectivo dentro de cartera. | No se registran como flujos XIRR a nivel cartera. |
| RET-005 | Dividendo retenido y luego retirado. | Primer evento es ingreso; el retiro posterior es flujo externo, sin doble conteo. |
| RET-006 | Comisión e impuesto informado. | Puente resta ambos en líneas distintas; vista antes de impuestos no resta solo esa línea. |
| RET-007 | Activo extranjero con cambio de precio y FX. | Mercado, FX e interacción suman exactamente la variación de valoración. |
| RET-008 | Valoración ausente en corte de flujo. | TWR exacto no se publica; fallback solo si está habilitado y etiquetado. |
| RET-009 | Fecha imposible o importe `NaN`. | Evento bloqueado; resultado no se convierte a cero. |
| RET-010 | XIRR con todos los flujos del mismo signo. | `not_calculable` con motivo claro. |
| RET-011 | XIRR con dos raíces o sin convergencia. | No se selecciona una tasa silenciosamente; queda `review_required`/`not_calculable`. |
| RET-012 | Residual por encima de tolerancia. | Puente marcado “Revisión requerida”; exportación incluye residual. |
| RET-013 | Dos organizaciones ficticias. | RLS no permite leer/editar ni recibir cálculos de la otra organización. |
| RET-014 | Ráfaga de actualizaciones del mismo snapshot. | Realtime invalida una sola vez el dominio y no renderiza respuesta antigua. |

---

## 12. Comparación con alternativas de mercado

La comparación se limita a funcionalidades declaradas públicamente por cada proveedor, consultadas el 27 de agosto de 2026. No es una auditoría independiente ni una recomendación de contratación.

| Alternativa | Funcionalidad declarada relevante | Ventaja visible | Límite u oportunidad para Gestor financiero |
| --- | --- | --- | --- |
| **Portfolio Performance** | Documenta MWR como IRR, define flujos por alcance y proporciona importación CSV guiada con mapeo.[3] [6] | Referencia sólida para no confundir transferencias internas y externas. | Gestor financiero puede aportar UX web, Canvas local editable y estados de calidad más explícitos. Debe alcanzar primero el mismo rigor de importación/conciliación. |
| **Sharesight** | Declara retorno ponderado por dinero y explica diferencia con TWR; además separa ganancia de capital, dividendos y divisa en su material de rendimiento.[2] | Comunicación clara de retorno personal y componentes. | Su uso de Modified Dietz muestra que la metodología importa: la app debe etiquetar cualquier aproximación y mantener TWR exacto diferenciado. |
| **getquin** | Declara IRR, retorno ponderado por tiempo, costes, impuestos, dividendos, análisis de cartera y agregación de brokers/wallets.[7] | Referencia de experiencia conectada, multiactivo y móvil. | La conectividad no se debe copiar sin RLS, consentimiento, calidad, licencia y caché. El modo local es un diferencial de Gestor financiero. |
| **Kubera** | Declara cobertura multiactivo, entidades/propiedad, colaboración granular y reporting dinámico.[8] | Referencia para patrimonio complejo y acceso por entidad/cartera. | La app no debe vender aislamiento por cartera hasta implementarlo/probarlo; multi-entidad exige RLS más detallada. |
| **Ghostfolio** | Se presenta como plataforma de patrimonio de código abierto orientada a privacidad y propiedad de datos.[9] | Referencia de posicionamiento en privacidad. | Gestor financiero puede diferenciarse si prueba la frontera local y hace visible la procedencia/calidad, no solo si la afirma. |
| **CoinTracking / Koinly** | Declaran importación de exchanges/wallets, cálculo/reportes fiscales y cobertura amplia de categorías cripto.[10] [11] | Referencia de profundidad operativa en cripto. | El producto debe avanzar por categorías verificadas, con lote/origen/regla/advertencia, sin prometer presentación fiscal oficial ni subir ficheros locales por defecto. |

### Implicación competitiva

Las alternativas conectadas lideran en automatización, agregación y amplitud. Gestor financiero puede posicionarse mejor para personas que priorizan **control de archivo local, explicación de cálculo y separación estricta de modo local/conectado**. Para competir en valor, el siguiente núcleo debe ser: procedencia, conciliación, rendimiento neto, riesgo y revisión humana. Agregar IA, cotizaciones o más conectores antes de ello incrementaría la complejidad sin resolver la confianza en el número mostrado.

---

## 13. Mejoras de salto cualitativo

| Prioridad | Mejora | Valor diferencial | Precondiciones |
| --- | --- | --- | --- |
| **P0** | Cerrar RLS remota, grants, vistas y Realtime por dominios. | Hace seguro y estable el modo autenticado sobre datos persistentes. | Staging ficticio, migraciones, pruebas de dos organizaciones y validación de despliegue. |
| **P0** | Libro mayor de rendimiento con procedencia y conciliación. | Cada cifra crítica explica su origen, versión y cobertura. | Contrato de datos y política de rendimiento aprobados. |
| **P1** | Puente neto + TWR/XIRR con pruebas. | Sustituye una variación opaca por una explicación auditable. | Valoraciones, FX y flujos de calidad suficiente. |
| **P1** | Centro de conciliación por fuente/lote. | Detecta duplicados, huecos, saldos imposibles y datos sin FX. | Importación reversible e identificadores de lote. |
| **P1** | Exposición y riesgo de cartera. | Muestra concentración por emisor, activo, país, sector, divisa y plataforma antes de la ganancia agregada. | Taxonomía y cobertura declarada. |
| **P2** | Informes de decisión reproducibles. | PDF/CSV con instantánea cerrada, metodología, fuentes, costes, riesgos y advertencias. | Motores versionados y CSV seguro. |
| **P2** | Conectividad opt-in y reversible. | Importación real desde fuente aprobada sin exponer secretos ni automatizar guardados. | Backend/vault, consentimiento, RLS y auditoría. |
| **P3** | Multi-entidad y permisos por cartera. | Colaboración familiar/profesional con mínimo privilegio real. | Modelo de entidad/ownership y RLS por cartera. |
| **P3** | Asistente de solo lectura explicable. | Ayuda a navegar datos con fuentes/corte visibles sin operar. | RLS cerrada, calidad/procedencia, fuentes licenciadas y controles de datos. |

### Orden recomendado

1. **Seguridad y consistencia:** cerrar RLS remota, Realtime, cabeceras de producción, `terminalGrowthRate` no finito y CI estable.
2. **Calidad y conciliación:** crear la ficha de verdad de cada cifra antes de añadir nuevas visualizaciones.
3. **Rendimiento neto:** implementar el puente monetario, TWR y XIRR con fixtures y pruebas de borde.
4. **Riesgo y reporting:** exponer concentración, calidad y metodología en informes reproducibles.
5. **Conectividad voluntaria:** activar un primer conector solo después de completar backend, permisos, auditoría, reversión y tratamiento de secretos.
6. **Colaboración/IA:** ampliar permisos por cartera y herramientas de solo lectura cuando las capas anteriores estén demostradas.

---

## 14. Límites y referencias

Este diseño no usa datos financieros reales, no estima rendimientos de una cartera concreta y no constituye asesoramiento financiero, fiscal o de inversión personalizado. TWR, XIRR, bridges y comparativas son herramientas de medición; dependen de datos completos, una frontera de cartera bien definida, precio/FX trazable y tratamiento explícito de costes/impuestos. Una discrepancia de datos se debe presentar como discrepancia, no “arreglar” mediante supuestos invisibles.

La referencia a GIPS se limita a principios de consistencia, transparencia, tratamiento de flujos y no anualización de períodos inferiores a un año. La aplicación no debe afirmar conformidad GIPS sin evaluar todos sus requisitos a nivel de entidad y período aplicable.[4]

### Referencias

[1]: https://www.cfainstitute.org/insights/professional-learning/refresher-readings/2026/rates-and-returns "CFA Institute — Rates and Returns"

[2]: https://help.sharesight.com/us/performance_calculation_method/ "Sharesight Help — Return calculation"

[3]: https://help.portfolio-performance.info/en/concepts/performance/money-weighted/ "Portfolio Performance Manual — Money weighted rate of return"

[4]: https://www.gipsstandards.org/standards/gips-standards-for-firms/gips-standards-handbook-for-firms/ "GIPS Standards Handbook for Firms"

[5]: https://www.esma.europa.eu/investor-corner/cost-investment-products "ESMA — Cost of Investment Products"

[6]: https://help.portfolio-performance.info/en/reference/file/import/csv-import/ "Portfolio Performance Manual — Importing a CSV file"

[7]: https://www.getquin.com/portfolio-performance/ "getquin — Portfolio performance tracker"

[8]: https://www.kubera.com/portfolio-tracker "Kubera — Portfolio tracker"

[9]: https://ghostfol.io/ "Ghostfolio — Privacy-first open-source wealth management"

[10]: https://cointracking.info/ "CoinTracking — Crypto Tax Calculator & Portfolio Tracker"

[11]: https://koinly.io/features/ "Koinly — Crypto Tax Calculator"

[12]: ./ANALISIS_MEJORAS_FINANCIERAS.md "Gestor financiero — análisis de mejoras financieras"

[13]: ./HOJA_DE_RUTA_CIERRE_SEGURIDAD_Y_PRODUCTO.md "Gestor financiero — hoja de ruta de seguridad y producto"

---

**Divulgación metodológica.** La propuesta toma como base una moneda de cartera declarada, año de 365 días para XIRR y una política de costes/impuestos explícitamente versionada; no aplica una política fiscal implícita. Las fuentes metodológicas se citan arriba y las funciones de alternativas son declaraciones de sus proveedores consultadas el 27 de agosto de 2026. La confianza de cualquier cálculo futuro dependerá de la procedencia, cobertura, conciliación y pruebas desplegadas. Este documento es investigación y análisis de producto, no asesoramiento financiero personalizado.
