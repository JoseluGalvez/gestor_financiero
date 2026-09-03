# Parche de seguridad: exportaciones CSV y fechas FIFO

**Proyecto:** Gestor financiero · Portafolio Intel  
**Fecha:** agosto de 2026  
**Estado:** aplicado localmente y sujeto a las validaciones registradas al final de este documento.

> Este documento muestra el parche TypeScript solicitado para dos hallazgos de auditoría: la posible interpretación de fórmulas al abrir CSV exportados y la aceptación de fechas de calendario imposibles en el flujo FIFO de Criptomonedas. El alcance no incluye presentación ante la AEAT, recomendaciones de inversión ni envío de datos locales a servicios remotos.

---

## 1. Resumen de los hallazgos y su corrección

| Identificador | Riesgo anterior | Corrección aplicada | Resultado esperado |
| --- | --- | --- | --- |
| **AUD-2026-01** | Una celda de texto de un CSV podía empezar por un prefijo que ciertos programas interpretan como fórmula. | Utilidad central `csv-security.ts` que fuerza esos textos a abrirse como texto y escapa comillas. | Las exportaciones revisadas no entregan texto potencialmente formulable sin neutralizar. |
| **AUD-2026-02** | Una fecha con forma ISO pero imposible, como `2026-99-99` o `2026-02-30`, podía avanzar al flujo FIFO. | Validación de forma y de día real con `Date.UTC`, más bloqueo de lotes y resultados confirmados. | Una compra inválida no crea tenencias; una venta o permuta inválida queda para revisión. |

La defensa CSV sigue la recomendación general de OWASP de tratar con especial cuidado los valores que pueden interpretarse como fórmulas al abrir un archivo en una hoja de cálculo. OWASP también avisa de que no hay una solución universal idéntica para todos los programas y flujos de datos; por esta razón, estos CSV se destinan a **apertura y revisión humana**, no a reimportación automática.[1]

---

## 2. Utilidad compartida de exportación segura

Se creó `src/lib/csv-security.ts` para evitar que cada exportador implementara una regla distinta. La expresión regular detecta símbolos de fórmula directos, tras espacios o BOM, e incluye variantes de ancho completo. Solo se aplica la tabulación protectora cuando la entrada es de tipo `string`; un valor numérico finito que llega como `number`, incluido un número negativo, conserva su naturaleza numérica.

```ts
/**
 * Protege CSV destinados a apertura humana en Excel, LibreOffice y hojas similares.
 * Los números finitos se preservan como números; el texto que puede interpretarse como
 * fórmula se fuerza a texto con una tabulación dentro de la celda entrecomillada.
 * No debe reutilizarse para formatos de reimportación automática: esos formatos deben
 * usar un contrato de datos separado y no abrirse como hoja de cálculo.
 */
const SPREADSHEET_FORMULA_PREFIX = /^[\uFEFF\s]*[=+\-@＝＋－＠]/u;

export function escapeSpreadsheetCell(value: string | number | null | undefined) {
  const source = String(value ?? "");
  const safe = typeof value === "string" && SPREADSHEET_FORMULA_PREFIX.test(source)
    ? `\t${source}`
    : source;
  return `"${safe.replaceAll('"', '""')}"`;
}

export function csvFromRows(rows: ReadonlyArray<ReadonlyArray<string | number | null | undefined>>) {
  return rows.map((row) => row.map(escapeSpreadsheetCell).join(",")).join("\n");
}
```

### Efecto sobre una celda

| Valor de entrada | Tipo | Contenido que se exporta dentro de la celda | Motivo |
| --- | --- | --- | --- |
| `=HYPERLINK("https://ejemplo.invalid","abrir")` | Texto | Tabulación seguida del texto, entre comillas CSV | Se impide que se trate como fórmula al abrirlo visualmente. |
| `  @SUM(1,1)` | Texto | Tabulación seguida del texto original, entre comillas CSV | Se cubre el prefijo tras espacios. |
| `－texto` | Texto | Tabulación seguida del texto original, entre comillas CSV | Se cubre la variante de ancho completo. |
| `-125.4` | Número | `-125.4` entre comillas CSV, sin tabulación protectora | Es un importe numérico legítimo, no un texto de fórmula. |
| `Texto con "comillas"` | Texto | Las comillas internas se duplican según CSV | La celda mantiene su contenido legible. |

> La tabulación forma parte del contenido de la celda entrecomillada. Es una elección deliberada para que los programas habituales de hojas de cálculo muestren el contenido como texto. No se debe retirar ni reutilizar este CSV como si fuera una interfaz de carga de datos universal.[1]

---

## 3. Aplicación al Canvas local

El motor del Canvas reemplazó la composición manual de líneas por la utilidad común. Así, tanto la exportación del conjunto filtrado —incluida la preparación local para Power BI— como la descarga de la tabla editada pasan por el mismo escape de celdas.

```ts
// src/lib/local-analytics.ts
import { csvFromRows } from "./csv-security.ts";

export function csvFromRecords(records: LocalRecord[]) {
  const headers = ["Fecha", "Instrumento/Categoría", "Plataforma", "Geografía", "Estado", "Valor"];
  return csvFromRows([
    headers,
    ...records.map((record) => [
      record.date,
      record.category,
      record.platform,
      record.geography,
      record.status,
      record.value,
    ]),
  ]);
}
```

```tsx
// src/components/LocalCanvasWorkspace.tsx
import { csvFromRows } from "@/lib/csv-security";

// La tabla editable también usa la utilidad compartida.
download(csvFromRows(matrix), "canvas-local-editado.csv", "text/csv;charset=utf-8");

// La vista filtrada para Power BI llama a csvFromRecords(active),
// que usa csvFromRows internamente.
download(csvFromRecords(active), "power-bi-local-selection.csv", "text/csv;charset=utf-8");
```

El Canvas permanece local: el uso de `csvFromRows` no incorpora llamadas a Supabase, IA, Google Sheets, `localStorage`, `sessionStorage` ni `IndexedDB`.

---

## 4. Aplicación a Criptomonedas

El módulo `src/lib/crypto-tax.ts` importa la misma utilidad. Se usa tanto en la plantilla CSV como en el borrador CSV local que contiene transmisiones, coste FIFO, comisiones, resultados y avisos.

```ts
// src/lib/crypto-tax.ts
import { csvFromRows } from "./csv-security.ts";

export function cryptoTemplateCsv() {
  return csvFromRows([[
    "Fecha", "Tipo", "Activo entregado", "Cantidad entregada",
    "Activo recibido", "Cantidad recibida", "Valor EUR entregado",
    "Valor EUR recibido", "Comisiones EUR", "Plataforma",
  ]]);
}

export function cryptoDraftCsv(result: CryptoTaxResult, year: string) {
  const rows: Array<Array<string | number | null>> = [
    ["Borrador de revisión fiscal de criptoactivos", "Ejercicio", year],
    ["Estado", result.summary.reviewLines ? "REVISAR" : "CÁLCULO LOCAL COMPLETO"],
    ["Ganancias confirmadas EUR", result.summary.gains],
    ["Pérdidas confirmadas EUR", result.summary.losses],
    ["Resultado neto confirmado EUR", result.summary.netResult],
    [],
    ["Fecha", "Operación", "Activo entregado", "Cantidad", "Activo recibido", "Valor transmisión EUR", "Valor adquisición FIFO EUR", "Comisiones EUR", "Ganancia/Pérdida EUR", "Advertencia"],
    ...result.lines.map((line) => [
      line.date,
      line.action === "sell" ? "Venta" : "Permuta",
      line.asset,
      line.quantity,
      line.receivedAsset,
      line.transmissionValue,
      line.acquisitionValue,
      line.fees,
      line.result,
      line.warning,
    ]),
    [],
    ["AVISO", "Borrador de trabajo local. No constituye una declaración Modelo 100 ni se presenta ante la AEAT. Revise valores de mercado, comisiones, lotes FIFO y el resto de circunstancias fiscales antes de usarlo."],
  ];

  return csvFromRows(rows);
}
```

Como mejora de coherencia, el exportador autenticado de **Salud empresa** (`src/lib/company-fundamentals-export.ts`) también utiliza `csvFromRows`. Esta ampliación no cambia el alcance funcional del análisis: solo evita que el nombre de compañía, la fuente declarada, advertencias o textos similares eludan la misma política de exportación.

---

## 5. Validación estricta de fechas ISO para FIFO

### Problema que se corrige

Una comprobación basada solo en una expresión regular puede aceptar cualquier cadena con el aspecto `AAAA-MM-DD`. Por ejemplo, `2026-99-99` y `2026-02-30` tienen esa forma pero no identifican ningún día del calendario. Los constructores de fecha de JavaScript pueden normalizar silenciosamente valores fuera de rango, desplazándolos a otro mes o año. En un motor FIFO, una fecha desplazada puede cambiar el orden de lotes y producir tenencias incorrectas.

### Función de normalización aplicada

La función exige primero el patrón ISO y después reconstruye la fecha con UTC. A continuación compara año, mes y día del objeto resultante con los valores originales. Si alguno no coincide, devuelve una cadena vacía y la fila no se considera válida.

```ts
// src/lib/crypto-tax.ts
/** Devuelve la fecha ISO solo si representa un día real del calendario gregoriano. */
export function normalizeCryptoIsoDate(value: string) {
  const match = clean(value).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return "";

  const [, year, month, day] = match;
  const normalized = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));

  if (
    normalized.getUTCFullYear() !== Number(year)
    || normalized.getUTCMonth() !== Number(month) - 1
    || normalized.getUTCDate() !== Number(day)
  ) return "";

  return `${year}-${month}-${day}`;
}
```

| Entrada | Resultado de `normalizeCryptoIsoDate` | Tratamiento posterior |
| --- | --- | --- |
| `2024-02-29` | `2024-02-29` | Se acepta: 2024 es bisiesto. |
| `2026-02-28` | `2026-02-28` | Se acepta. |
| `2026-02-30` | Cadena vacía | Se marca como incidencia; no puede crear lote. |
| `2026-99-99` | Cadena vacía | Se marca como incidencia; no puede crear lote. |
| `26-02-28` | Cadena vacía | Se marca por no cumplir el formato ISO de cuatro dígitos. |

### Integración con la lectura del CSV

Durante la construcción de cada operación se conserva el valor de fecha original para poder mostrarlo al usuario, pero se usa la fecha normalizada para decidir si la fila puede avanzar.

```ts
const sourceDate = clean(csvValue(row, headers, mapping.date));
const normalizedDate = normalizeCryptoIsoDate(sourceDate);
const date = normalizedDate || sourceDate;
const rowWarnings: string[] = [];

if (!normalizedDate) {
  rowWarnings.push("La fecha debe usar AAAA-MM-DD y representar un día real del calendario.");
}
```

### Bloqueo antes de crear lotes o confirmar resultados

El motor cuenta las filas con advertencias como no soportadas. Una **compra** con advertencias retorna antes de `lots.push`, por lo que no puede crear una tenencia. Una **venta** o **permuta** con advertencias aparece como línea de revisión con resultado `null`; una permuta solo crea el lote recibido si la línea no tiene advertencia.

```ts
let unsupportedRows = 0;

ordered.forEach((operation) => {
  const operationWarning = operation.warnings[0] ?? null;

  if (operation.warnings.length) {
    unsupportedRows += 1;
    if (operation.action !== "buy" && operation.action !== "sell" && operation.action !== "swap") return;
  }

  const lots = lotsByAsset.get(operation.asset) ?? [];
  lotsByAsset.set(operation.asset, lots);

  if (operation.action === "buy") {
    if (operation.warnings.length) return;
    lots.push({
      quantity: operation.quantity,
      cost: operation.eurValue + operation.fees,
    });
    return;
  }

  if (operation.action === "sell" || operation.action === "swap") {
    const consumed = operationWarning
      ? { cost: 0, missing: operation.quantity }
      : consumeLots(lots, operation.quantity);

    const lineWarning = operationWarning ?? (
      consumed.missing > 1e-10
        ? `Faltan lotes FIFO por ${consumed.missing.toFixed(10)} ${operation.asset}. Añade las compras o el saldo inicial histórico.`
        : null
    );

    const result = lineWarning ? null : transmissionValue - consumed.cost;
    lines.push({ /* ...detalle de transmisión..., */ result, warning: lineWarning });

    if (operation.action === "swap" && !lineWarning) {
      receivedLots.push({ quantity: operation.receivedQuantity, cost: referenceValue });
    }
  }
});
```

> **Propiedad de seguridad buscada.** Una fecha imposible no puede contaminar el orden cronológico FIFO, crear un lote de compra ni originar la tenencia de una permuta. La fila se conserva visible como incidencia para que la persona pueda corregir el CSV de origen.

---

## 6. Evidencia de regresión

La prueba `tests/verify-csv-and-fifo-hardening.mts` añade comprobaciones deterministas para los dos hallazgos. Además, las pruebas existentes de Criptomonedas, Canvas y Salud empresa cubren que las funcionalidades previas no se han degradado.

| Prueba | Evidencia que aporta |
| --- | --- |
| `verify-csv-and-fifo-hardening.mts` | El Canvas y el borrador cripto neutralizan inicios de fórmula; los negativos numéricos se conservan; se rechazan `2026-99-99` y `2026-02-30`; se acepta `2024-02-29`; una compra inválida no deja tenencias. |
| `verify-crypto-tax.mts` | Ventas, permutas, inventario insuficiente y permutas encadenadas conservan su comportamiento FIFO. |
| `verify-local-cell-validation.mts` | Validaciones de fecha, valores y texto del Canvas. |
| `verify-company-fundamentals.mts` | Fórmulas financieras, casos no significativos, reglas conservadoras de oportunidad y la adopción de la protección común de CSV. |
| `verify-audit-regressions.mts` | Regresiones de auditoría que siguen siendo aplicables en el proyecto. |

Las pruebas se lanzan con el soporte experimental de eliminación de tipos de Node. Los avisos de Node relativos al modo ESM o a esta característica son conocidos y no cambian el resultado de las aserciones, que debe ser `OK`.

---

## 7. Alcance y límites

| Dentro del parche | Fuera del parche |
| --- | --- |
| Exportaciones CSV del Canvas local, Criptomonedas y Salud empresa. | Un formato universal para reimportar CSV en cualquier herramienta. |
| Detección de prefijos de fórmula directos, tras espacios/BOM y en variantes de ancho completo. | Inspección de fórmulas que se construyan por una transformación externa posterior. |
| Rechazo de días de calendario imposibles antes de calcular FIFO. | Validación fiscal integral de todos los tipos de operación y circunstancias tributarias. |
| Bloqueo de lotes corruptos por compras con errores. | Presentación, firma o envío del Modelo 100 o de otros modelos ante la AEAT. |
| Borradores locales revisables. | Asesoramiento fiscal o financiero personalizado. |

La remediación de estos dos hallazgos no implica que el resto de la aplicación sea completamente segura. Permanecen otras líneas de mejora separadas, por ejemplo la coalescencia de ráfagas Realtime, el bootstrap organizativo transaccional, validaciones adicionales del DCF, cabeceras de producción, límites de lectura de archivos muy grandes, protección de secretos de conexión y cobertura E2E, accesibilidad y RLS remota.

---

## Referencias

[1]: https://owasp.org/www-community/attacks/CSV_Injection "OWASP — CSV Injection"

[2]: https://sede.agenciatributaria.gob.es/Sede/ayuda/manuales-videos-folletos/manuales-practicos/irpf-2025/c11-ganancias-perdidas-patrimoniales/monedas-virtuales/compra-venta-monedas-virtuales-tributacion-inversor.html "Agencia Tributaria — Compra y venta de monedas virtuales: tributación en el IRPF del inversor"

[3]: https://sede.agenciatributaria.gob.es/Sede/Ayuda/24Presentacion/100/7_6_6_2/ganancias_perdidas_monedas_virtuales.html "Agencia Tributaria — Ganancias y pérdidas patrimoniales derivadas de la transmisión o permuta de monedas virtuales"

---

**Conclusión.** Los valores de texto potencialmente interpretables como fórmulas se neutralizan en la exportación de revisión, mientras que las fechas imposibles se convierten en incidencias explícitas antes de afectar a los lotes FIFO. El diseño conserva la revisión humana y el procesamiento local como principios centrales.
