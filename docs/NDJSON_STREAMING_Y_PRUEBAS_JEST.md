# Importación NDJSON incremental y pruebas Jest de límites

**Estado:** ejemplo de referencia; no activa por sí mismo un modo de importación masiva en el Canvas actual.  
**Objetivo:** evitar que un archivo JSON convencional obligue al navegador a mantener simultáneamente el texto completo, el objeto resultante de `JSON.parse`, las filas normalizadas y copias para el Worker.

## Decisión de formato

El JSON convencional representa todas las filas dentro de una única matriz `rows`. Para contar o validar las filas se debe interpretar el documento completo. En cambio, **NDJSON** usa una línea JSON independiente por elemento: una cabecera, cada fila y un cierre. Esto permite leer, validar y entregar una fila por vez.

> La reducción de memoria solo se mantiene si el consumidor procesa el lote y lo descarta. Si la aplicación guarda de nuevo todas las filas en un gran array de React, el pico se desplaza pero no desaparece.

El ejemplo adopta este contrato explícito:

| Posición | `kind` | Contenido | Regla |
|---:|---|---|---|
| Primera línea | `session-header` | Formato, versión, encabezados, mapeo y filtros. | Debe ser la primera línea y ser compatible con `portafolio-intel-local-canvas-ndjson`, versión `1`. |
| Líneas intermedias | `row` | Un objeto `data` con las columnas de una fila. | Cada fila se normaliza y valida antes de emitirse. |
| Última línea | `end` | El número total de filas transmitidas. | Debe ser única y declarar exactamente el número de filas recibidas. |

El archivo [`canvas-local-session-ejemplo.ndjson`](../examples/canvas-local-session-ejemplo.ndjson) contiene una sesión ficticia completa con este formato.

## Flujo incremental de memoria acotada

El parser [`ndjson-session-stream.mjs`](../examples/ndjson-session-stream.mjs) primero compara `file.size` con el límite de bytes. Si el archivo cabe dentro de esa política, utiliza `File.stream()`, un `ReadableStreamDefaultReader` y `TextDecoder` para transformar fragmentos de bytes en líneas de texto. La API Streams permite procesar contenido por fragmentos sin crear necesariamente un único buffer o cadena para todo el recurso, y está disponible también en Web Workers. [1]

| Fase | Memoria retenida por el parser | Control aplicado |
|---|---|---|
| Prevuelo | Solo metadatos de `File`. | Rechazo inmediato por `maxFileBytes`. |
| Lectura | Fragmento actual más una línea parcial. | `maxLineChars` evita una línea NDJSON anómalamente grande. |
| Cabecera | Encabezados, mapeo y filtros. | Valida formato, versión y encabezados únicos. |
| Fila | Un objeto de línea y su versión normalizada. | Valida tipo, fecha, importe y texto antes de emitir. |
| Lote | Hasta `batchSize` filas, 500 por defecto. | `await onBatch(...)` entrega el lote; después se reinicia la referencia a `[]`. |
| Cierre | Contadores y metadatos. | Rechaza totales incongruentes, ausencia de cierre o datos posteriores al cierre. |

El límite de filas se aplica **durante** la lectura: al recibir la fila `maxRows + 1` se aborta el recorrido sin seguir creando más filas. Esto es distinto del respaldo JSON de versión 1, que necesita ejecutar `JSON.parse` antes de conocer la longitud de `rows`.

## Uso desde una interfaz

El siguiente patrón no actualiza la tabla de React con todas las filas. Entrega lotes al consumidor y espera a que cada lote haya sido aceptado antes de leer el siguiente.

```js
import { importNdjsonInBatches } from "./ndjson-session-stream.mjs";

const summary = { rows: 0, total: 0, preview: [] };

await importNdjsonInBatches(selectedFile, {
  maxFileBytes: 15 * 1024 * 1024,
  maxRows: 100_000,
  maxLineChars: 1_000_000,
  batchSize: 500,
  onHeader: async (header) => {
    // Mostrar metadatos; no mutar aún el Canvas principal.
    console.info("Sesión:", header);
  },
  onBatch: async (batch) => {
    for (const row of batch) {
      summary.rows += 1;
      summary.total += Number(row.Precio.replace(",", "."));
      if (summary.preview.length < 200) summary.preview.push(row);
    }

    // Alternativa: enviar el lote a un Worker y esperar su acuse de recibo.
    // await postBatchAndWaitForAck(worker, batch);
  },
  onComplete: async ({ rows }) => {
    console.info(`Importación incremental terminada: ${rows} filas.`);
  },
});
```

Para que exista una retro-presión efectiva con un Worker, `onBatch` debe esperar una confirmación antes de resolver. Llamar repetidamente a `worker.postMessage` sin esperar puede volver a acumular copias de lotes en la cola del navegador. El diseño recomendado es enviar un lote, esperar el mensaje `ack` del Worker y solo entonces solicitar el siguiente lote al parser.

```js
function postBatchAndWaitForAck(worker, batch) {
  return new Promise((resolve, reject) => {
    const requestId = crypto.randomUUID();
    const timeout = setTimeout(() => reject(new Error("El Worker no confirmó el lote a tiempo.")), 30_000);

    const onMessage = (event) => {
      if (event.data?.requestId !== requestId) return;
      worker.removeEventListener("message", onMessage);
      clearTimeout(timeout);
      event.data.type === "ack" ? resolve() : reject(new Error(event.data.message ?? "El Worker rechazó el lote."));
    };

    worker.addEventListener("message", onMessage);
    worker.postMessage({ type: "batch", requestId, batch });
  });
}
```

## Implicaciones para el Canvas privado

El Canvas actual conserva todas las filas de una sesión en `records` para admitir tabla editable, filtros y exportación local. Por eso, un parser incremental no debe reemplazar silenciosamente el flujo actual: si se guardan de nuevo las 100.000 filas en `records`, la memoria terminará creciendo de forma similar.

| Objetivo de producto | Estrategia compatible | Consecuencia |
|---|---|---|
| Resumen y gráficos de archivos enormes | Analizar lotes en un Worker y conservar solo agregados y una vista previa de 200 filas. | Memoria controlada, pero no existe edición de todas las filas en memoria. |
| Tabla editable completa | Almacén local por lotes en un modo separado y expresamente consentido, por ejemplo OPFS o IndexedDB. | Permite paginación, pero deja de ser el Canvas efímero actual y requiere una política de privacidad específica. |
| Restauración transaccional de la sesión completa | Escribir los lotes en un área de preparación, validar el cierre y promoverla al terminar. | Requiere almacenamiento temporal explícito; un array único no es apropiado para archivos gigantescos. |

La propuesta no usa red ni envía datos a servicios externos. El nombre de modo, el consentimiento y la política de borrado deben dejar claro si se activa un almacenamiento local temporal o persistente.

## Pruebas unitarias con Jest

El archivo [`ndjson-session-stream.test.mjs`](../examples/ndjson-session-stream.test.mjs) cubre tamaño, límite de filas, límite de línea, cierre incongruente y comportamiento de lotes. Usa `Blob`, de modo que el parser se prueba contra `size` y `stream()` sin necesitar archivos físicos.

| Prueba | Garantía |
|---|---|
| Tamaño excedido | Rechaza antes de llamar a `stream()`. |
| Tamaño en el límite | Acepta el archivo cuando `size === maxFileBytes`. |
| Filas excedidas | Rechaza al llegar a la fila posterior a `maxRows`. |
| Línea excedida | Rechaza un registro NDJSON que supera `maxLineChars`. |
| Lotes | Emite grupos completos y el último lote parcial. |
| Cierre | Rechaza un `end.rows` distinto del número real de filas. |

El proyecto actual no incorpora Jest como dependencia, por lo que el archivo es una **plantilla de pruebas** y no se ha añadido ni ejecutado Jest. Si se decide adoptar Jest para módulos `.mjs`, su documentación oficial indica configurar ESM y ejecutar Node con `--experimental-vm-modules`; también recomienda importar `jest` desde `@jest/globals` cuando se necesitan sus utilidades en módulos ESM. [2]

Una configuración mínima de referencia sería:

```js
// jest.config.mjs
export default {
  testEnvironment: "node",
  transform: {},
  testMatch: ["**/*.test.mjs"],
};
```

Tras aprobar la incorporación de Jest como dependencia de desarrollo, un script de `package.json` puede invocarlo mediante Node con soporte de módulos VM experimentales. Debe evaluarse esta incorporación como cambio independiente, dado que el soporte ESM de Jest continúa marcado como experimental en su documentación. [2]

## Verificación realizada

Sin instalar Jest ni modificar las dependencias del proyecto, se ejecutó el comprobador [`verify-ndjson-session-stream.mjs`](../examples/verify-ndjson-session-stream.mjs) con Node. Verificó el ejemplo ficticio completo y confirmó la secuencia `header`, seis eventos `row`, `end`, así como tres lotes de dos filas.

## Referencias

[1] [MDN — Streams API](https://developer.mozilla.org/en-US/docs/Web/API/Streams_API)

[2] [Jest — ECMAScript Modules](https://jestjs.io/docs/ecmascript-modules)
