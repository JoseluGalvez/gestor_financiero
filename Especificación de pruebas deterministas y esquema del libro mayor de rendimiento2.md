# Especificación de pruebas deterministas y esquema del libro mayor de rendimiento

**Proyecto:** Gestor financiero · Portafolio Intel  
**Fecha:** 27 de agosto de 2026  
**Estado:** diseño y especificación; no se ha aplicado ninguna migración ni se han usado datos financieros reales.  
**Alcance:** motores TWR, XIRR/MWR y puente de atribución neto, con persistencia propuesta para el espacio autenticado.

> **Regla de fiabilidad.** Un rendimiento solo se publica cuando sus entradas, política, versión, cobertura y conciliación son reproducibles. Ante un dato ambiguo, incompleto o matemáticamente no resoluble, el resultado correcto es `partial`, `review_required`, `blocked` o `not_calculable`, nunca un porcentaje inventado ni un cero por sustitución.

Los casos de prueba usan **fixtures sintéticos**, no precios, cotizaciones, clientes ni carteras reales. Las cifras de los fixtures deben ser pequeñas, explícitas y legibles; la demostración se valida por identidades matemáticas, signos y estados, no por parecer un escenario de mercado real.

---

## Índice

1. [Principios de prueba](#1-principios-de-prueba)
2. [Convenciones comunes](#2-convenciones-comunes)
3. [Casos deterministas TWR](#3-casos-deterministas-twr)
4. [Casos deterministas XIRR/MWR](#4-casos-deterministas-xirrmwr)
5. [Casos del puente de atribución neto](#5-casos-del-puente-de-atribución-neto)
6. [Pruebas de integración, seguridad y regresión](#6-pruebas-de-integración-seguridad-y-regresión)
7. [Estructura propuesta de la base de datos](#7-estructura-propuesta-de-la-base-de-datos)
8. [Migración SQL propuesta, no aplicada](#8-migración-sql-propuesta-no-aplicada)
9. [RLS, privilegios y Realtime](#9-rls-privilegios-y-realtime)
10. [Orden de implementación y criterios de aceptación](#10-orden-de-implementación-y-criterios-de-aceptación)
11. [Referencias](#11-referencias)

---

## 1. Principios de prueba

TWR y XIRR responden a preguntas distintas. TWR mide la evolución de una cartera aislando los flujos externos cuando existen valoraciones en los cortes; XIRR expresa una tasa anualizada que depende de la fecha y tamaño de los flujos de quien aporta o retira capital.[1] [2] Las pruebas deben demostrar esa diferencia en lugar de obligar a que ambas tasas coincidan.

| Principio | Aplicación en pruebas |
| --- | --- |
| **Determinismo** | No hay reloj, mercado, red ni aleatoriedad. Cada fecha, FX, valoración y política vive en el fixture. |
| **Exactitud antes que redondeo** | La aserción usa precisión interna y tolerancia declarada; el redondeo se verifica solo en la capa de presentación. |
| **Unidades y moneda explícitas** | Todo evento tiene moneda y, cuando no es moneda base, FX, fuente y fecha ficticias. |
| **Inmutabilidad** | El cálculo no modifica las filas de entrada; devuelve objetos nuevos y un `calculationVersion`. |
| **Idempotencia** | El mismo lote de entrada calculado dos veces produce la misma salida, huella y conjunto de líneas. |
| **Explicabilidad** | Cada resultado incluye la lista de tramos TWR, los flujos XIRR o líneas del puente que lo sustentan. |
| **Fallo seguro** | Un dato faltante o inválido no se convierte en cero ni se descarta sin dejar `warning` y estado. |
| **No doble conteo** | Una compra/venta interna no es flujo externo a nivel cartera. Los eventos vinculados se comprueban por ID. |

### 1.1. Tolerancias de prueba

El contrato debe fijar tolerancias por política, no dentro de cada prueba. La guía inicial recomendada es cualitativa:

| Elemento | Criterio de aceptación |
| --- | --- |
| TWR de tramo | Diferencia con la expectativa analítica menor o igual que la tolerancia de retorno de la política. |
| XNPV de la raíz XIRR | Valor absoluto menor o igual a `max(toleranciaAbsolutaBase, toleranciaRelativa × sumaAbsFlujos)`. |
| Puente monetario | Residual en moneda base dentro de su tolerancia absoluta y relativa. |
| Orden temporal | Orden estable por `effective_at`, `sequence` e `id`; ningún cálculo depende del orden de inserción accidental. |
| Redondeo | La suma se realiza sin redondear líneas intermedias; el formato solo se aplica al final. |

### 1.2. Fixtures mínimos compartidos

Cada fixture declara lo siguiente, aunque algunos valores se dejen vacíos de forma deliberada para probar bloqueos.

```ts
export type ReturnFixture = {
  name: string;
  scope: "portfolio" | "account" | "instrument" | "platform";
  policy: ReturnPolicy;
  valuations: PortfolioValuationPoint[];
  events: ReturnLedgerEvent[];
  expected: {
    twrQuality?: QualityState;
    xirrQuality?: QualityState;
    bridgeQuality?: QualityState;
    expectedWarnings?: string[];
    tiedOut?: boolean;
  };
};
```

Todos los IDs de fixture se prefijan por `fx_` y las fuentes por `fixture_source`. Está prohibido incluir tokens, URLs privadas, ficheros de usuarios o `connection_config` en fixtures, logs de pruebas o `snapshot` de resultados.

---

## 2. Convenciones comunes

### 2.1. Frontera, signo y fechas

| Concepto | Convención obligatoria |
| --- | --- |
| Frontera | Se fija por `scope` + `organization_id` + `portfolio_id` antes de clasificar flujos. |
| Fecha | ISO con calendario real y zona temporal normalizada; ordenar por `effective_at`, `sequence`, `id`. |
| Aportación en XIRR | Negativa desde la perspectiva del titular. |
| Retiro en XIRR | Positivo desde la perspectiva del titular. |
| Valor inicial / final en XIRR | Inicial negativo, final liquidable positivo. |
| Aportación en puente | Positiva y separada de rendimiento. |
| Retiro en puente | Negativo y separado de rendimiento. |
| Comisiones / impuestos informados | Negativos, con categoría distinta. |
| Compras, ventas y transferencias internas | No son flujos XIRR de la cartera si no cruzan la frontera. |

### 2.2. Reglas que no se prueban como “éxito numérico”

Algunos casos tienen por resultado correcto **no calcular**. Deben validar mensaje, estado y ausencia de una tasa/puente conciliado.

| Situación | Resultado seguro |
| --- | --- |
| Fecha imposible, importe infinito o moneda vacía | `blocked`; el evento conserva la advertencia. |
| XIRR sin signos opuestos | `not_calculable`; `annualizedReturnPct: null`. |
| XIRR con más de una raíz | `review_required`; no elegir la primera raíz sin intervención/política explícita. |
| Valoración faltante en corte de flujo TWR | `not_calculable` para TWR exacto; Modified Dietz solo si fue autorizado y marcado como aproximación. |
| FX faltante de un importe no base | `partial` o `blocked` según política; nunca convertir como 1. |
| Residual del puente superior a tolerancia | `review_required`; no ocultarlo bajo “otros”. |

---

## 3. Casos deterministas TWR

TWR exacto encadena retornos de subperíodos delimitados por flujos externos. Para un tramo sin flujo, `rᵢ = Vfin_preflujo / Vinicio − 1`; el total es `Π(1 + rᵢ) − 1`. Los flujos externos no son rendimiento; por eso el motor exige valoraciones antes/después según la política. Los períodos inferiores a un año se muestran como retorno del período y no como anualización.[3]

### 3.1. Núcleo de exactitud

| ID | Fixture sintético | Qué valida | Resultado esperado |
| --- | --- | --- | --- |
| **TWR-001** | Dos valoraciones completas, sin flujos externos. | Caso base de un tramo. | TWR coincide con `Vfin/Vinicio − 1`; una sola fila de tramo; `complete`. |
| **TWR-002** | Aportación externa entre dos valoraciones, con valor preflujo y postflujo. | Neutralidad de aportación. | TWR encadena dos tramos y no atribuye la aportación a mercado. |
| **TWR-003** | Retiro externo entre dos valoraciones. | Neutralidad de retiro. | El retiro no aparece como pérdida de mercado; el segundo tramo empieza con valor postretiro. |
| **TWR-004** | Varios flujos externos en días distintos. | Encadenamiento compuesto. | Producto de todos los factores de tramo; tabla de tramos ordenada. |
| **TWR-005** | Flujo al mismo instante que valoración. | Regla de corte. | Se aplica siempre `before_flow` o `after_flow` conforme a `ReturnPolicy`, sin ambigüedad. |
| **TWR-006** | Dos flujos en el mismo instante con `sequence` diferente. | Estabilidad temporal. | Igual resultado al reordenar el array de entrada; secuencia registrada en auditoría. |
| **TWR-007** | Aportación externa seguida de compra interna. | Frontera de cartera. | Solo la aportación corta TWR; compra no crea corte adicional. |
| **TWR-008** | Venta interna que permanece como efectivo. | Movimiento interno. | No se considera retiro ni altera el corte de TWR. |
| **TWR-009** | Dividendo que queda en efectivo de cartera. | Ingreso interno. | Contribuye a retorno/valor, no crea flujo externo. |
| **TWR-010** | Dividendo retirado posteriormente. | Separación económica temporal. | Dividendo permanece en rendimiento; el retiro posterior es flujo externo separado. |

### 3.2. Costes, impuestos y divisa

| ID | Fixture sintético | Qué valida | Resultado esperado |
| --- | --- | --- | --- |
| **TWR-011** | Comisión explícita de operación. | Política neta de comisiones. | Vista “neta de comisiones” reduce retorno; la línea de comisión queda trazable. |
| **TWR-012** | Retención/impuesto informado. | Dos vistas de política. | La vista neta para titular la incorpora; la vista antes de impuestos no; ambas conservan misma procedencia. |
| **TWR-013** | Activo en moneda no base, con FX al inicio y final. | Conversión y cobertura. | TWR se calcula solo en moneda base con FX disponible; se guarda fuente y corte ficticios. |
| **TWR-014** | Cambio de precio local y de FX con unidades constantes. | Separación posterior en puente. | El TWR total usa valores base; las entradas permiten comprobar mercado/FX/interacción sin residuo. |
| **TWR-015** | Falta el FX de una valoración. | Degradación segura. | `partial` o `blocked`; no se sustituye por 1 ni se usa el último FX sin política explícita. |
| **TWR-016** | Comisión FX separada del tipo de cambio. | No doble conteo. | Coste de conversión aparece solo como comisión; FX refleja solo variación de tipo. |

### 3.3. Cobertura, aproximación y casos límite

| ID | Fixture sintético | Qué valida | Resultado esperado |
| --- | --- | --- | --- |
| **TWR-017** | Falta valoración preflujo, política prohíbe fallback. | Exactitud requerida. | `not_calculable`; advertencia identifica el corte faltante. |
| **TWR-018** | Mismo hueco, política autoriza Modified Dietz. | Etiquetado de aproximación. | Método `modified_dietz`, calidad `partial`; nunca etiqueta “TWR exacto”. |
| **TWR-019** | Valor inicial cero y una aportación posterior con valoración postflujo. | Cartera recién abierta. | Primer tramo vacío/no aplicable; TWR empieza cuando existe denominador válido. |
| **TWR-020** | Valor de inicio de tramo cero con activos aún dentro de alcance. | Denominador inválido. | `blocked` o tramo no calculable; no dividir por cero. |
| **TWR-021** | Posición corta/deuda que permite valor neto negativo, si la política futura lo soporta. | Dominio económico. | Por defecto `review_required`; no aplicar fórmula estándar sin política específica de patrimonio neto negativo. |
| **TWR-022** | Split, fusión o spin-off conciliado. | Acción corporativa. | No se cuenta como aportación/retiro; se conserva `corporate_action` y no rompe continuidad de unidades/valor. |
| **TWR-023** | Corrección posterior de una valoración histórica. | Versionado. | Crea nuevo `calculation_run`; el resultado antiguo sigue reproducible por versión. |
| **TWR-024** | Período de menos de 365 días. | Presentación. | Retorno acumulado visible; `annualizedReturnPct: null` por política inicial. |
| **TWR-025** | Período de 365+ días con cobertura completa. | Anualización declarada. | Devuelve acumulado y anualizado, ambos con período y política. |

### 3.4. Propiedades de regresión TWR

Además de resultados concretos, las pruebas deben afirmar propiedades independientes del número elegido.

1. **Invarianza ante aportación neutralizada:** si se inserta una aportación externa y se aportan valoraciones exactas pre/postflujo, el TWR de los activos ya existentes no cambia respecto al fixture equivalente sin el flujo.
2. **Reordenación de entrada:** permutar eventos que tienen fechas distintas no cambia la salida al normalizar el orden estable.
3. **Idempotencia:** calcular dos veces el mismo `input_fingerprint` devuelve líneas, tramos, estado y huella idénticos.
4. **No doble conteo:** añadir una pareja `trade_sell` interno + incremento de efectivo interno no cambia la lista de flujos externos de cartera.
5. **No ocultación de huecos:** si se elimina un FX o una valoración requerida, la calidad no puede mejorar respecto al fixture completo.

---

## 4. Casos deterministas XIRR/MWR

XIRR resuelve `Σ CFᵢ / (1 + r)^((dᵢ − d₀)/365) = 0`, con fechas reales. El resultado es una tasa anual; requiere fechas e importes fiables y no debe publicarse si no existe una raíz única dentro del dominio `r > −1`. Portfolio Performance identifica el retorno ponderado por dinero con IRR y describe la importancia de la fecha y el importe de los flujos.[2] Sharesight advierte que IRR puede no hallar una solución o tener resultados múltiples en secuencias complejas de flujos.[1]

### 4.1. Núcleo numérico y flujos irregulares

| ID | Fixture sintético | Qué valida | Resultado esperado |
| --- | --- | --- | --- |
| **XIRR-001** | Inversión inicial negativa y valor final positivo, fechas distintas. | Raíz única básica. | `complete`; `XNPV(r)` dentro de tolerancia; fechas/flujos devueltos para auditoría. |
| **XIRR-002** | Aportaciones en fechas irregulares y valoración final. | Ponderación por fecha. | XIRR cambia si cambia la fecha de una aportación, aunque el importe total sea idéntico. |
| **XIRR-003** | Mismos importes, diferente calendario. | Diferencia TWR/XIRR. | XIRR puede diferir; la prueba prohíbe asertar igualdad automática con TWR. |
| **XIRR-004** | Aportación y retiro el mismo día. | Consolidación por fecha. | Se agregan para resolver sin perder `eventIds`; el resultado coincide con flujo neto equivalente. |
| **XIRR-005** | Múltiples entradas el mismo día con signos opuestos. | Trazabilidad del neteo. | Una fila agregada con enlaces a todos los eventos; ningún evento desaparece. |
| **XIRR-006** | Saldo inicial distinto de cero, aportaciones posteriores y valor final. | Valor de comienzo. | Se incluye `−Vinicio` como flujo inicial, no coste histórico ni compra original fuera del período. |
| **XIRR-007** | Cartera creada vacía y primera aportación posterior. | Inicio a cero. | No insertar flujo inicial cero de forma que altere solver; usa aportación real como primer flujo. |
| **XIRR-008** | Compra/venta interna y dividendo reinvertido. | Frontera. | Ninguno se vuelve flujo XIRR de la cartera; sí quedan explicados en el puente/valor final. |
| **XIRR-009** | Dividendo retirado fuera de cartera. | Flujo derivado correcto. | Solo el retiro que cruza frontera es positivo; el dividendo queda interno. |
| **XIRR-010** | Retiro parcial y valoración final restante. | Dos recuperaciones. | Tanto retiro como valor final tienen signo positivo y se conserva trazabilidad. |

### 4.2. Fechas complejas, validez e idempotencia

| ID | Fixture sintético | Qué valida | Resultado esperado |
| --- | --- | --- | --- |
| **XIRR-011** | Flujo en 29 de febrero de año bisiesto. | Calendario válido. | El motor acepta la fecha y utiliza distancia de días real. |
| **XIRR-012** | Fecha imposible, por ejemplo mes/día inexistente. | Bloqueo temprano. | Evento `blocked`; no llega a solver ni contribuye al valor final. |
| **XIRR-013** | Dos eventos con mismo `external_id`/lote repetido. | Deduplicación de ingesta. | Solo un evento normalizado activo; la segunda ejecución no cambia la tasa. |
| **XIRR-014** | Evento corregido mediante reverso vinculado. | Reversibilidad. | La suma económica se anula de forma explícita; ningún borrado silencioso altera la auditoría. |
| **XIRR-015** | Evento retroactivo que entra tras cálculo publicado. | Invalidación versionada. | Genera nuevo `calculation_run` y deja histórica la versión anterior. |
| **XIRR-016** | Fecha final anterior a la inicial. | Orden temporal. | `blocked`, con mensaje de período inválido. |
| **XIRR-017** | Importe `NaN`, infinito o sin moneda. | Seguridad numérica. | `blocked`; nunca se transforma a `0`. |
| **XIRR-018** | Importe no base sin FX. | Integridad de moneda. | No calcular o `partial` según política; no usar conversión implícita. |

### 4.3. Dominio y raíces problemáticas

| ID | Fixture sintético | Qué valida | Resultado esperado |
| --- | --- | --- | --- |
| **XIRR-019** | Todos los flujos negativos. | Condición de signos. | `not_calculable`; no raíz seleccionada. |
| **XIRR-020** | Todos los flujos positivos. | Condición de signos. | `not_calculable`; no raíz seleccionada. |
| **XIRR-021** | Patrón de signos que presenta más de un cambio y raíces múltiples. | Ambigüedad de IRR. | `review_required`; `roots` contiene candidatas válidas y `selectedRoot: null`. |
| **XIRR-022** | Secuencia sin cambio de signo de XNPV en el dominio explorado. | Sin solución práctica. | `not_calculable`, diagnóstico de dominio/intervalos evaluados. |
| **XIRR-023** | Raíz cercana a −100 %. | Límite de dominio. | Solver no evalúa `r ≤ −1`; converge solo si existe intervalo válido. |
| **XIRR-024** | Tasa alta pero con raíz única verificable. | No censurar por magnitud. | Publicar con advertencia de sensibilidad, residual e inputs; no recortar a un máximo de UI. |
| **XIRR-025** | Flujos muy pequeños y muy grandes, todos sintéticos. | Estabilidad de escala. | Tolerancia relativa evita falsos fallos; no hay overflow o pérdida de signo. |
| **XIRR-026** | Límite de iteraciones alcanzado. | Fallo controlado del solver. | `not_calculable`, `iterations` y residual disponibles; no devolver último intento como tasa. |
| **XIRR-027** | Bracketing reproducible con distinta semilla/orden de array. | Determinismo del solver. | Igual raíz seleccionada, iteraciones acotadas y misma huella de cálculo. |

### 4.4. Asserts mínimos XIRR

```ts
expect(result.quality).toBe("complete");
expect(result.selectedRoot).not.toBeNull();
expect(Math.abs(result.npvResidual ?? Infinity)).toBeLessThanOrEqual(tolerance);
expect(result.roots).toHaveLength(1);
expect(result.cashFlows.some((flow) => flow.amountBase < 0)).toBe(true);
expect(result.cashFlows.some((flow) => flow.amountBase > 0)).toBe(true);
```

Para una raíz múltiple, la prueba debe afirmar lo contrario:

```ts
expect(result.selectedRoot).toBeNull();
expect(result.quality).toBe("review_required");
expect(result.roots.length).toBeGreaterThan(1);
```

---

## 5. Casos del puente de atribución neto

El puente es una explicación monetaria, no una descomposición aditiva de la tasa XIRR. Debe cumplir:

```text
Vfinal observado − Vfinal calculado = residual
```

La identidad de componentes propuesta es:

```text
Vfinal calculado
= Vinicial
+ aportaciones externas
− retiros externos
+ mercado local
+ dividendos e intereses
+ FX
+ interacción mercado × FX
− comisiones
− impuestos/retenciones informados
± acciones corporativas y ajustes de valoración conciliados
```

| ID | Fixture sintético | Qué valida | Resultado esperado |
| --- | --- | --- | --- |
| **BRG-001** | Solo valor inicial, valor final y mercado local. | Caso base. | Mercado = `Vfinal − Vinicial`; residual dentro de tolerancia. |
| **BRG-002** | Aportación externa sin cambio de mercado. | Separación de capital/rendimiento. | Todo el cambio aparece en aportaciones; mercado igual a cero. |
| **BRG-003** | Retiro externo sin cambio de mercado. | Signo de salida. | Retiro negativo; mercado igual a cero. |
| **BRG-004** | Dividendo conservado. | Ingreso separado. | Aparece en `income`; no se añade a aportaciones. |
| **BRG-005** | Comisión y retención informada. | Desglose de costes. | Dos líneas negativas independientes; política neta las incorpora como corresponda. |
| **BRG-006** | Cambio de precio local con FX estable. | Mercado puro. | FX e interacción son cero; mercado explica toda la variación. |
| **BRG-007** | FX cambia con precio local estable. | FX puro. | Mercado e interacción son cero; FX explica la variación. |
| **BRG-008** | Precio y FX cambian. | Término cruzado. | Mercado + FX + interacción = `V₁ − V₀`; residual dentro de tolerancia. |
| **BRG-009** | Compra a mitad de período y posterior variación. | Corte por unidades. | Solo unidades presentes en cada tramo generan efecto de mercado/FX. |
| **BRG-010** | Split o spin-off conciliado. | Ajuste corporativo trazable. | No crea rendimiento artificial ni flujo externo; línea explícita. |
| **BRG-011** | Corrección manual de valoración aprobada. | Ajuste no oculto. | Línea `valuation_adjustment` con motivo, actor y procedencia. |
| **BRG-012** | Componentes que no cuadran. | Residual. | `review_required`, residual visible; no se reparte automáticamente a “otros”. |
| **BRG-013** | Redondeo de presentación. | Integridad de suma. | Componentes internos cuadran antes de formato; visual puede mostrar aviso de redondeo si necesario. |
| **BRG-014** | Línea de coste repetida en evento bruto y campo `fees`. | No doble conteo. | Normalizador enlaza eventos o bloquea duplicado; comisión se contabiliza una vez. |
| **BRG-015** | Impuesto ausente. | Política de dos vistas. | Vista neta antes de impuestos sigue disponible con etiqueta; no inferir impuesto. |

### 5.1. Propiedades de regresión del puente

1. **Pie de control:** la suma firmada de todas las líneas más valor inicial equivale al valor final observado dentro de tolerancia.
2. **Trazabilidad:** toda línea distinta de ancla final tiene al menos un `source_event_id`, una valoración o una regla de política.
3. **Exclusividad:** un coste no puede alimentar simultáneamente `fees` y `market_local`.
4. **Cobertura monótona:** retirar una fuente/FX/valoración no puede aumentar `coverage_pct`.
5. **Residual visible:** si el residual supera tolerancia, `is_tied_out` siempre es falso y nunca se etiqueta `complete`.

---

## 6. Pruebas de integración, seguridad y regresión

### 6.1. Cadena completa con datos ficticios

| ID | Escenario | Aserción principal |
| --- | --- | --- |
| **INT-RET-001** | Lote de transacciones → normalizador → valoraciones/FX → TWR, XIRR y puente. | Las tres salidas comparten `input_fingerprint`, `policy_version`, período y moneda base. |
| **INT-RET-002** | Reejecución del mismo lote. | No crea líneas duplicadas; devuelve o referencia el mismo cálculo idempotente. |
| **INT-RET-003** | Reverso de un movimiento importado. | Nuevo cálculo cambia solo lo que corresponde y conserva auditoría de ambas versiones. |
| **INT-RET-004** | Un dato inválido junto con datos válidos. | El dato inválido queda bloqueado; no contamina ni desaparece sin aviso. |
| **INT-RET-005** | Lote con FX/valoración incompletos. | TWR/XIRR/puente muestran estado por métrica, no un estado global engañoso. |
| **INT-RET-006** | Exportación de resultado con textos no confiables. | El CSV usa `csvFromRows`/`escapeSpreadsheetCell`; no expone secretos ni fórmulas ejecutables. |

### 6.2. Seguridad y aislamiento organizativo

Las tablas existentes de `transactions`, `portfolio_snapshots` y `data_sources` ya definen el dominio funcional. El libro mayor deriva de esas fuentes, por lo que sus pruebas de acceso deben ser al menos igual de estrictas.

| ID | Actor/escenario ficticio | Aserción de seguridad |
| --- | --- | --- |
| **SEC-RET-001** | Usuario A, organización A. | Lee solo eventos, valoraciones y cálculos de A. |
| **SEC-RET-002** | Usuario B, organización B. | No puede seleccionar, insertar, actualizar ni borrar una fila de A usando IDs conocidos. |
| **SEC-RET-003** | Usuario `viewer` de A. | Puede leer resultados autorizados, pero no modificar política, eventos ni valoraciones. |
| **SEC-RET-004** | Usuario `editor` de A. | Solo puede iniciar acciones permitidas en A; no puede falsificar `organization_id` o `portfolio_id` cruzado. |
| **SEC-RET-005** | Proceso servidor controlado. | Escribe derivados solo tras validar organización/cartera y sin enviar una clave de servicio al navegador. |
| **SEC-RET-006** | Suscripción Realtime de A. | Recibe cambios únicamente de filas visibles por RLS y para los dominios publicados. |
| **SEC-RET-007** | `connection_config` y metadatos. | Ni el ledger, exportaciones, errores ni eventos Realtime contienen secretos, tokens, URL privadas o cabeceras. |

### 6.3. Regressión Realtime vinculada a rendimiento

1. Una modificación de `return_calculation_runs` invalida solo el dominio de rendimiento, no siete colecciones del workspace.
2. Una ráfaga de actualizaciones del mismo cálculo se coalesce en una sola carga/render final.
3. Todo request lleva `requestId` o versión; una respuesta antigua no puede sobrescribir un cálculo más nuevo.
4. Un evento de otra cartera/organización no invalida la vista activa.
5. Tras una reconexión, la aplicación obtiene una instantánea coherente antes de marcar “actualizado”.

---

## 7. Estructura propuesta de la base de datos

### 7.1. Relación con el modelo actual

El núcleo existente contiene `organizations`, `organization_members`, `portfolios`, `data_sources`, `sync_runs`, `transactions`, `positions`, `market_quotes` y `portfolio_snapshots`. La extensión propuesta no reemplaza esos registros: los usa como fuente y produce una capa derivada versionada.

```text
organizations
  └── portfolios
        ├── transactions ────────────────┐
        ├── portfolio_snapshots ─────────┼──► return_ledger_events
        ├── data_sources / sync_runs ────┘          │
        ├── portfolio_valuations ◄──────────────────┤
        ├── return_calculation_runs ────────────────┼──► return_twr_periods
        │                                            ├──► return_xirr_cash_flows
        │                                            └──► return_attribution_bridges ─► return_attribution_lines
        └── return_policies

fx_rate_observations ─────────────────────────────────► importes convertidos y valoraciones base
```

| Tabla propuesta | Naturaleza | Finalidad | Escritura autorizada |
| --- | --- | --- | --- |
| `return_policies` | Configuración versionada. | Declara moneda, costes, corte de flujo, tolerancias y fallback. | Owner/editor mediante flujo controlado. |
| `fx_rate_observations` | Dato de referencia. | Guarda par, fecha, tasa, origen y estado de calidad. | Solo proceso servidor/ingesta aprobada. |
| `portfolio_valuations` | Dato de valoración normalizado. | Valor base, efectivo, cobertura, fuente y corte. | Solo proceso servidor/ingesta aprobada. |
| `return_ledger_events` | Derivado trazable. | Clasifica frontera, tipos, importes base y vínculos de cada movimiento. | Solo normalizador servidor; sin DML directo de cliente. |
| `return_calculation_runs` | Cabecera inmutable de cálculo. | Congela período, huellas, política, estado, versión y métricas. | Solo servicio de cálculo controlado. |
| `return_twr_periods` | Detalle derivado. | Auditoría de cada tramo TWR. | Solo servicio de cálculo controlado. |
| `return_xirr_cash_flows` | Detalle derivado. | Auditoría de flujo agrupado y raíz/residual. | Solo servicio de cálculo controlado. |
| `return_attribution_bridges` | Cabecera de puente. | Resultado, valor inicial/final, residual y calidad. | Solo servicio de cálculo controlado. |
| `return_attribution_lines` | Detalle derivado. | Líneas de mercado, FX, ingresos, costes, impuestos y ajustes. | Solo servicio de cálculo controlado. |

### 7.2. Claves de diseño

| Decisión | Razón |
| --- | --- |
| Todas las tablas contienen `organization_id` y, salvo FX global de referencia, `portfolio_id`. | Permite políticas RLS simples, filtros rápidos y evita mezclar datos entre organizaciones. |
| Se usa FK compuesta `(organization_id, portfolio_id)`. | Impide que un `portfolio_id` de otra organización sea enlazado por accidente. |
| Las tablas derivadas no borran filas crudas. | Permite reproducir y auditar un cálculo tras una corrección. |
| `calculation_run` almacena huellas de entrada y política, no una copia indiscriminada de archivos. | Reproducibilidad sin duplicar datos/sensibles ni aumentar exposición. |
| Política y algoritmo se versionan. | Un informe histórico explica con qué regla se calculó. |
| `source_event_id`, `source_valuation_id` y `source_fx_rate_id` son referencias, no JSON libre. | Facilita trazabilidad y evita `metadata` opaca. |
| Las observaciones de FX no llevan tokens ni configuración de proveedor. | Los secretos permanecen en vault/backend, nunca en el ledger. |
| No se publica en Realtime una tabla de movimientos crudos por defecto. | Minimiza superficie y recargas; solo se publica salida autorizada tras RLS probada. |

---

## 8. Migración SQL propuesta, no aplicada

> **Importante:** este bloque es una especificación para una migración revisada en staging. No se ha ejecutado mediante Supabase, no modifica la base remota y no debe aplicarse sin aprobar el modelo, las políticas, las pruebas RLS y la retención de datos.

```sql
-- 0) Prerrequisito de integridad compuesta en tablas existentes.
-- Validar antes que no existan duplicados. Esta restricción permite FKs
-- que conectan cartera y organización en la misma fila.
alter table public.portfolios
  add constraint portfolios_organization_id_id_key unique (organization_id, id);

alter table public.transactions
  add constraint transactions_organization_id_id_key unique (organization_id, id);

alter table public.portfolio_snapshots
  add constraint portfolio_snapshots_organization_id_id_key unique (organization_id, id);

-- 1) Tipos cerrados: no aceptar textos de categoría arbitrarios.
do $$ begin
  create type public.return_scope as enum (
    'portfolio', 'account', 'instrument', 'platform'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.return_quality_state as enum (
    'complete', 'partial', 'review_required', 'blocked', 'not_calculable'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.return_boundary as enum ('external', 'internal');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.return_flow_kind as enum (
    'external_contribution', 'external_withdrawal',
    'trade_buy', 'trade_sell',
    'income_dividend', 'income_interest',
    'fee', 'tax_withholding', 'fx_conversion',
    'corporate_action', 'valuation_adjustment'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.return_reconciliation_state as enum (
    'reconciled', 'unreconciled', 'review_required'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.return_calculation_status as enum (
    'queued', 'running', 'ready', 'failed', 'review_required', 'superseded'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.return_method as enum (
    'true_twr', 'modified_dietz', 'xirr_brent', 'not_calculable'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.attribution_component as enum (
    'start_value', 'external_contributions', 'external_withdrawals',
    'market_local', 'income', 'fx', 'fx_interaction',
    'fees', 'reported_taxes', 'corporate_actions',
    'valuation_adjustments', 'residual', 'end_value'
  );
exception when duplicate_object then null; end $$;

-- 2) Política inmutable por versión.
create table public.return_policies (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  portfolio_id uuid not null,
  version text not null check (char_length(trim(version)) between 1 and 80),
  base_currency char(3) not null check (base_currency ~ '^[A-Z]{3}$'),
  include_fees boolean not null default true,
  include_reported_taxes boolean not null default true,
  valuation_frequency text not null check (valuation_frequency in ('event', 'daily', 'periodic')),
  external_flow_cut_rule text not null check (external_flow_cut_rule in ('before_flow', 'after_flow')),
  allow_modified_dietz_fallback boolean not null default false,
  xirr_day_count smallint not null default 365 check (xirr_day_count = 365),
  residual_tolerance_abs numeric(24, 6) not null check (residual_tolerance_abs >= 0),
  residual_tolerance_rel numeric(18, 12) not null check (residual_tolerance_rel >= 0 and residual_tolerance_rel < 1),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  retired_at timestamptz,
  unique (organization_id, portfolio_id, version),
  foreign key (organization_id, portfolio_id)
    references public.portfolios(organization_id, id) on delete cascade
);

-- 3) FX trazable, sin secretos ni configuración de proveedor.
create table public.fx_rate_observations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  base_currency char(3) not null check (base_currency ~ '^[A-Z]{3}$'),
  quote_currency char(3) not null check (quote_currency ~ '^[A-Z]{3}$'),
  rate_to_base numeric(28, 14) not null check (rate_to_base > 0),
  provider text not null check (char_length(trim(provider)) between 1 and 80),
  provider_at timestamptz not null,
  observed_at timestamptz not null default now(),
  quality public.return_quality_state not null default 'complete',
  source_version text not null,
  data_source_id uuid references public.data_sources(id) on delete set null,
  check (base_currency <> quote_currency),
  unique (organization_id, base_currency, quote_currency, provider, provider_at)
);

-- 4) Valoraciones normalizadas por cartera y corte.
create table public.portfolio_valuations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  portfolio_id uuid not null,
  as_of timestamptz not null,
  base_currency char(3) not null check (base_currency ~ '^[A-Z]{3}$'),
  market_value_base numeric(24, 6),
  cash_value_base numeric(24, 6),
  total_value_base numeric(24, 6),
  priced_weight_pct numeric(7, 4) not null check (priced_weight_pct between 0 and 100),
  fx_coverage_pct numeric(7, 4) not null check (fx_coverage_pct between 0 and 100),
  valuation_coverage_pct numeric(7, 4) not null check (valuation_coverage_pct between 0 and 100),
  quality public.return_quality_state not null,
  source_snapshot_id bigint,
  source_version text not null,
  data_source_id uuid references public.data_sources(id) on delete set null,
  sync_run_id uuid references public.sync_runs(id) on delete set null,
  reconciled_at timestamptz,
  reconciliation_state public.return_reconciliation_state not null default 'unreconciled',
  created_at timestamptz not null default now(),
  foreign key (organization_id, portfolio_id)
    references public.portfolios(organization_id, id) on delete cascade,
  foreign key (organization_id, source_snapshot_id)
    references public.portfolio_snapshots(organization_id, id) on delete set null,
  check (total_value_base is null or market_value_base is null or cash_value_base is null
    or total_value_base = market_value_base + cash_value_base),
  unique (organization_id, portfolio_id, as_of, source_version)
);

-- 5) Libro mayor normalizado: derivado, trazable y reversible.
create table public.return_ledger_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  portfolio_id uuid not null,
  account_id uuid,
  instrument_id uuid references public.instruments(id) on delete set null,
  raw_transaction_id uuid,
  data_source_id uuid references public.data_sources(id) on delete set null,
  sync_run_id uuid references public.sync_runs(id) on delete set null,
  occurred_at timestamptz not null,
  effective_at timestamptz not null,
  sequence_instant integer not null default 0 check (sequence_instant >= 0),
  kind public.return_flow_kind not null,
  boundary public.return_boundary not null,
  gross_amount numeric(24, 6) not null,
  currency char(3) not null check (currency ~ '^[A-Z]{3}$'),
  amount_base numeric(24, 6),
  base_currency char(3) not null check (base_currency ~ '^[A-Z]{3}$'),
  fx_rate_id uuid references public.fx_rate_observations(id) on delete set null,
  quantity numeric(24, 10),
  linked_event_id uuid references public.return_ledger_events(id) on delete set null,
  reverses_event_id uuid references public.return_ledger_events(id) on delete restrict,
  quality public.return_quality_state not null,
  reconciliation_state public.return_reconciliation_state not null default 'unreconciled',
  calculation_warnings jsonb not null default '[]'::jsonb,
  normalizer_version text not null,
  source_version text not null,
  imported_at timestamptz not null default now(),
  foreign key (organization_id, portfolio_id)
    references public.portfolios(organization_id, id) on delete cascade,
  foreign key (organization_id, raw_transaction_id)
    references public.transactions(organization_id, id) on delete set null,
  check ((currency = base_currency and amount_base is not null)
         or (currency <> base_currency and fx_rate_id is not null)
         or quality in ('partial', 'review_required', 'blocked', 'not_calculable')),
  check (jsonb_typeof(calculation_warnings) = 'array'),
  unique (organization_id, raw_transaction_id, kind, normalizer_version)
);

-- 6) Cabecera inmutable de ejecución de cálculo.
create table public.return_calculation_runs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  portfolio_id uuid not null,
  scope public.return_scope not null,
  scope_ref_id uuid,
  policy_id uuid not null references public.return_policies(id) on delete restrict,
  policy_version text not null,
  period_start date not null,
  period_end date not null check (period_end >= period_start),
  input_fingerprint char(64) not null check (input_fingerprint ~ '^[a-f0-9]{64}$'),
  algorithm_version text not null,
  status public.return_calculation_status not null default 'queued',
  quality public.return_quality_state not null default 'not_calculable',
  twr_method public.return_method not null default 'not_calculable',
  twr_return_pct numeric(20, 12),
  twr_annualized_return_pct numeric(20, 12),
  xirr_method public.return_method not null default 'not_calculable',
  xirr_annualized_return_pct numeric(20, 12),
  xirr_npv_residual numeric(24, 12),
  xirr_iterations integer check (xirr_iterations is null or xirr_iterations >= 0),
  warnings jsonb not null default '[]'::jsonb,
  started_at timestamptz,
  completed_at timestamptz,
  superseded_by uuid references public.return_calculation_runs(id) on delete set null,
  created_at timestamptz not null default now(),
  foreign key (organization_id, portfolio_id)
    references public.portfolios(organization_id, id) on delete cascade,
  check (jsonb_typeof(warnings) = 'array'),
  unique (organization_id, portfolio_id, scope, scope_ref_id, period_start, period_end,
          policy_version, algorithm_version, input_fingerprint)
);

-- 7) Evidencia de tramos TWR y flujos agrupados XIRR.
create table public.return_twr_periods (
  id uuid primary key default gen_random_uuid(),
  calculation_run_id uuid not null references public.return_calculation_runs(id) on delete cascade,
  ordinal integer not null check (ordinal > 0),
  start_as_of timestamptz not null,
  end_as_of timestamptz not null check (end_as_of >= start_as_of),
  start_valuation_id uuid references public.portfolio_valuations(id) on delete restrict,
  end_valuation_id uuid references public.portfolio_valuations(id) on delete restrict,
  external_flow_event_id uuid references public.return_ledger_events(id) on delete set null,
  start_value_base numeric(24, 6),
  end_value_pre_flow_base numeric(24, 6),
  subperiod_return_pct numeric(20, 12),
  quality public.return_quality_state not null,
  warnings jsonb not null default '[]'::jsonb,
  check (jsonb_typeof(warnings) = 'array'),
  unique (calculation_run_id, ordinal)
);

create table public.return_xirr_cash_flows (
  id uuid primary key default gen_random_uuid(),
  calculation_run_id uuid not null references public.return_calculation_runs(id) on delete cascade,
  flow_date date not null,
  amount_base numeric(24, 6) not null,
  event_ids uuid[] not null default '{}',
  flow_role text not null check (flow_role in ('opening_value', 'external_flow', 'closing_value')),
  ordinal integer not null check (ordinal > 0),
  unique (calculation_run_id, ordinal),
  unique (calculation_run_id, flow_date, flow_role)
);

-- 8) Puente y líneas que deben cuadrar al valor final observado.
create table public.return_attribution_bridges (
  id uuid primary key default gen_random_uuid(),
  calculation_run_id uuid not null unique references public.return_calculation_runs(id) on delete cascade,
  base_currency char(3) not null check (base_currency ~ '^[A-Z]{3}$'),
  observed_end_value_base numeric(24, 6),
  calculated_end_value_base numeric(24, 6),
  residual_base numeric(24, 6),
  is_tied_out boolean not null default false,
  quality public.return_quality_state not null,
  warnings jsonb not null default '[]'::jsonb,
  check (jsonb_typeof(warnings) = 'array')
);

create table public.return_attribution_lines (
  id uuid primary key default gen_random_uuid(),
  bridge_id uuid not null references public.return_attribution_bridges(id) on delete cascade,
  ordinal integer not null check (ordinal > 0),
  component public.attribution_component not null,
  amount_base numeric(24, 6) not null,
  coverage_pct numeric(7, 4) not null check (coverage_pct between 0 and 100),
  source_event_ids uuid[] not null default '{}',
  source_valuation_ids uuid[] not null default '{}',
  source_fx_rate_ids uuid[] not null default '{}',
  warnings jsonb not null default '[]'::jsonb,
  check (jsonb_typeof(warnings) = 'array'),
  unique (bridge_id, ordinal),
  unique (bridge_id, component)
);

-- 9) Índices de lectura por cartera, tiempo y estado.
create index return_ledger_events_portfolio_effective_idx
  on public.return_ledger_events (organization_id, portfolio_id, effective_at, sequence_instant, id);
create index portfolio_valuations_portfolio_as_of_idx
  on public.portfolio_valuations (organization_id, portfolio_id, as_of desc);
create index return_calculation_runs_portfolio_period_idx
  on public.return_calculation_runs (organization_id, portfolio_id, period_end desc, created_at desc);
create index return_twr_periods_run_idx
  on public.return_twr_periods (calculation_run_id, ordinal);
create index return_xirr_cash_flows_run_idx
  on public.return_xirr_cash_flows (calculation_run_id, ordinal);
create index return_attribution_lines_bridge_idx
  on public.return_attribution_lines (bridge_id, ordinal);
```

### 8.1. Comentarios y puntos de revisión SQL

1. La FK compuesta impide un `portfolio_id` de otra organización, pero los `instrument_id`, `data_source_id`, `sync_run_id` y `fx_rate_id` también requieren validación de pertenencia por proceso servidor o triggers de integridad antes de habilitar escrituras. Una FK simple no verifica que dos FKs pertenezcan a la misma organización.
2. `jsonb` se limita a listas de advertencias sin secretos; si el producto necesita objetos ricos de auditoría, se recomienda una tabla tipada o esquema JSON estricto, no `metadata` libre.
3. `return_xirr_cash_flows.event_ids` es evidencia de lectura derivada. Si se requieren consultas por evento a gran escala, puede normalizarse en una tabla puente `return_xirr_cash_flow_events`.
4. La captura de `source_version`, huellas y versiones de algoritmo permite recrear el cálculo sin almacenar el CSV/XLSX original ni su configuración de conexión.
5. La retención, cifrado de backups y borrado de derivados deben seguir el marco de datos de la organización; no se resuelven con una FK.

---

## 9. RLS, privilegios y Realtime

### 9.1. Política de mínimo privilegio propuesta

No aplicar estas políticas hasta que las pruebas de staging confirmen que los helpers privados y los grants efectivos son correctos. La estrategia divide lectura de resultados y escritura de entradas/derivados.

| Recurso | `viewer` miembro | `editor` miembro | Proceso de cálculo controlado |
| --- | --- | --- | --- |
| `return_policies` | Lectura. | Alta de nueva versión; no mutación silenciosa de una versión usada. | Lectura. |
| `portfolio_valuations` | Lectura autorizada. | Sin DML directo por navegador. | Inserta desde ingesta validada. |
| `return_ledger_events` | Lectura autorizada para auditoría. | Sin DML directo por navegador. | Inserta/actualiza por normalizador idempotente. |
| `return_calculation_runs` y detalles | Lectura autorizada. | Puede solicitar recálculo mediante endpoint/RPC validado, no insertar resultado. | Crea ejecución y derivados. |
| `return_attribution_*` | Lectura autorizada. | No editar líneas calculadas. | Crea resultado al cerrar cálculo. |

El navegador nunca recibe una `service_role`. Si se utiliza un proceso backend privilegiado, éste debe validar la identidad y pertenencia del actor antes de ejecutar; si se expone una función SQL, debe operar con `security invoker` siempre que sea viable o revisar estrictamente `security definer`, `search_path`, grants y parámetros.

### 9.2. Esqueleto de RLS propuesto

El repositorio ya declara helpers privados `private.is_organization_member(uuid)` y `private.is_organization_editor(uuid)`. La migración real debe comprobar que existen, que su `search_path` es seguro y que los grants no crean una vía de enumeración. El patrón para una tabla de lectura de miembros y escritura exclusiva de proceso es:

```sql
alter table public.return_calculation_runs enable row level security;

create policy return_runs_member_read
  on public.return_calculation_runs
  for select to authenticated
  using (private.is_organization_member(organization_id));

-- No crear una policy INSERT/UPDATE/DELETE para authenticated.
-- La escritura procede de backend/RPC revisado, nunca de la clave pública del navegador.

alter table public.return_attribution_bridges enable row level security;
create policy attribution_bridge_member_read
  on public.return_attribution_bridges
  for select to authenticated
  using (
    exists (
      select 1
      from public.return_calculation_runs r
      where r.id = return_attribution_bridges.calculation_run_id
        and private.is_organization_member(r.organization_id)
    )
  );
```

Los `viewer` no deben iniciar escrituras. Para `return_policies`, una política de `insert` puede permitir solo a `private.is_organization_editor(organization_id)` y bloquear actualización/destrucción de una versión en uso; los cambios se modelan como versiones nuevas. Las policies de todas las tablas se prueban como roles autenticados distintos, no solo con Service Role.

### 9.3. Realtime de mínimo alcance

1. No añadir `return_ledger_events` ni `return_xirr_cash_flows` a Realtime de inicio. Son detallados y no se necesitan para pintar una tarjeta.
2. Tras verificar RLS en la base remota, publicar solo `return_calculation_runs` y, si hace falta, `return_attribution_bridges`.
3. Filtrar por `organization_id` cuando la tabla lo contiene y suscribirse solo al `portfolio_id` visible, si la política y el filtro lo permiten.
4. Agrupar eventos de una misma ejecución durante una ventana breve y solicitar una sola lectura del dominio `returns`.
5. Llevar `requestId`, `input_fingerprint` o versión del run; ignorar respuestas que no correspondan al último request activo.
6. En reconexión, refetch de la instantánea autorizada antes de mostrar estado actualizado. No asumir que una secuencia de eventos perdida se recuperó sola.

---

## 10. Orden de implementación y criterios de aceptación

| Prioridad | Entrega | Dependencias | Criterio de cierre |
| --- | --- | --- | --- |
| **P0** | Cerrar RLS remota y Realtime actual. | Staging, políticas/grants revisados, pruebas dos organizaciones y coalescencia. | No hay acceso ni eventos cruzados; una ráfaga no recarga todo el workspace. |
| **P0** | Política de rendimiento y esquema revisados. | Acuerdo de producto sobre frontera, costes, impuestos/retenciones, FX y tolerancias. | Tipos, signos y tratamiento de cada flujo están aprobados y versionados. |
| **P1** | Normalizador con fixtures y validación. | P0 anterior. | Cada flujo se clasifica o bloquea de forma explicable; sin DML directo del cliente. |
| **P1** | Puente neto con pie. | Valoraciones y FX con procedencia. | Todos los fixtures BRG cuadran o declaran residual/estado. |
| **P1** | TWR exacto + fallback declarado. | Cortes de valoración. | TWR no cambia al añadir flujos neutralizados y nunca se confunde con Dietz. |
| **P1** | XIRR por raíces acotadas. | Flujos normalizados. | Cubre raíz única, ninguna, múltiple, límite de dominio y no convergencia. |
| **P2** | Pantalla, informe y exportación. | Motores con pruebas. | Cada KPI muestra política, versión, cobertura, entradas y advertencias. |
| **P2** | Riesgo/concentración e informe reproducible. | Serie de valor y taxonomía con cobertura. | Riesgo, datos sin valoración y concentración son visibles junto al rendimiento. |
| **P3** | Primer conector real voluntario. | Seguridad, secretos, RLS, reversión, tasa/retención y consentimiento. | Previsualiza, deduplica, registra lote y permite revertir sin exponer secretos. |

### 10.1. Gate de salida para los motores

No se considera terminado el motor hasta que se cumplan **todas** las condiciones siguientes:

1. Todas las pruebas TWR/XIRR/bridge de esta especificación pasan con fixtures sintéticos versionados.
2. `npm run lint` y `npm run build` pasan en el proyecto.
3. Los informes y exportaciones incluyen período, moneda, política, versión de algoritmo, cobertura, estado y advertencias.
4. Una prueba independiente reconcilia los importes del puente antes de formato/redondeo.
5. No se publica una tasa cuando XIRR no tiene una raíz única o TWR no tiene valoraciones suficientes.
6. RLS se valida efectivamente en staging/remoto para cada tabla nueva y el canal Realtime se prueba con dos organizaciones ficticias.
7. No existen secretos, archivos de entrada ni textos peligrosos en exportaciones, logs o payloads de Realtime.

---

## 11. Referencias

[1]: https://help.sharesight.com/us/performance_calculation_method/ "Sharesight Help — Return calculation"

[2]: https://help.portfolio-performance.info/en/concepts/performance/money-weighted/ "Portfolio Performance Manual — Money weighted rate of return"

[3]: https://www.gipsstandards.org/standards/gips-standards-for-firms/gips-standards-handbook-for-firms/ "GIPS Standards Handbook for Firms"

[4]: https://www.cfainstitute.org/insights/professional-learning/refresher-readings/2026/rates-and-returns "CFA Institute — Rates and Returns"

[5]: ./DISENO_PUENTE_ATRIBUCION_TWR_XIRR_2026-08-27.md "Diseño de puente de atribución neto, TWR y XIRR"

[6]: ./HOJA_DE_RUTA_CIERRE_SEGURIDAD_Y_PRODUCTO.md "Hoja de ruta de cierre de seguridad y producto"

---

**Divulgación de método.** La especificación usa TWR por subperíodos, XIRR con año de 365 días, importes en moneda base y una política explícita de comisiones/impuestos. La fecha de diseño es 27 de agosto de 2026. Las referencias externas fundamentan definiciones y comparabilidad; el esquema y tests son una propuesta de ingeniería. No se han consultado ni utilizado datos de ninguna cartera real. Este documento es investigación y análisis de producto, no asesoramiento financiero personalizado.
