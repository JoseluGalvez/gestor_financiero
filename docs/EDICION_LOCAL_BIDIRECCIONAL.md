# Tabla vinculada y dashboard local bidireccional

**Fecha:** 26 de agosto de 2026  
**Estado:** implementado y validado en el Canvas local sin cuenta.

## Objetivo y alcance

El Canvas local abre un CSV o Excel en el navegador, permite modificar filas en una tabla y actualiza KPIs, gráficos, mapa relativo, filtros y conclusiones a partir de esas mismas filas. La vinculación no utiliza Google Sheets, Supabase, servicios de IA ni almacenamiento residente del navegador.

> La tabla y el dashboard no son dos copias del conjunto. Ambos derivan de `records`, el único estado analítico mantenido en la memoria de la pestaña.

## Flujo local de datos

| Acción | Tratamiento local | Resultado visible |
|---|---|---|
| Editar una celda con un valor válido | Se actualiza `raw`, se reconstruye el `LocalRecord` mediante `recordFromRaw` y se conserva la identidad de la fila. | KPIs, serie temporal, donut, barras, mapa, tabla y conclusiones se recalculan en el Web Worker cuando está disponible. |
| Escribir un valor no válido | El texto se mantiene como borrador visual en `cellDrafts`, se marca el control y no se modifica `records`. | Aparece un mensaje accesible; el dashboard conserva su resultado previo y no recibe una nueva solicitud de análisis. |
| Cambiar filtros o seleccionar un segmento | Se modifica `filters` en memoria. | El dashboard y la tabla reflejan la misma selección. |
| Aplicar una edición masiva válida | Se actualizan las filas visibles incluidas por los filtros actuales. | Los indicadores y gráficos se ajustan sin recargar la página. |
| Guardar estado JSON | Se descarga una instantánea versionada con encabezados, mapeo, filtros y filas válidas. | Se pueden conservar varios archivos bajo elección de la persona usuaria. |
| Cargar estado JSON | Se valida el formato, versión, encabezados, mapeo, número de filas y tipos antes de cambiar el estado. | Solo una sesión compatible sustituye la copia que existe en memoria. |

## Contrato de validación de celdas

La validación sucede antes de actualizar `records`. Los campos de **fecha** e **importe/valor** no aceptan el vaciado transitorio mientras se escribe: esto evita que un `onChange` intermedio borre una fecha o convierta un total en cero antes de que el usuario termine la corrección. Los campos de texto admiten contenido normalizado, limitado y libre de caracteres de control.

| Campo asignado | Regla aplicada | Efecto de un error |
|---|---|---|
| Fecha | Debe existir y usar `YYYY-MM-DD` o `DD/MM/AAAA`; se comprueba que la fecha exista en el calendario. | No se cambia la serie temporal, los filtros ni la fila analítica. |
| Valor | Debe existir y ser un número finito; acepta separadores españoles, por ejemplo `1.234,50`. | No se cambia el total, la media, los gráficos ni las conclusiones. |
| Categoría, plataforma, geografía y estado | Máximo de 160 caracteres y sin caracteres de control. | No se actualiza la dimensión de agrupación ni sus filtros. |

La barrera se aplica tanto en la interacción de la celda como en `updateRecord`, de modo que un valor inválido no puede alcanzar el modelo analítico por una secuencia rápida de eventos de interfaz.

## Sesiones JSON explícitas

El formato de sesión es `portafolio-intel-local-canvas`, versión `1`. Incluye `savedAt`, `headers`, `mapping`, `filters` y `rows`. Las sesiones son archivos elegidos manualmente: no existe historial residente, sincronización automática ni escritura en `localStorage`, `sessionStorage` o IndexedDB.

El cargador rechaza formatos o versiones desconocidos, encabezados vacíos o duplicados, más de 100.000 filas, mapeos incoherentes y celdas mapeadas que no superen su validación de tipo. Si hay un error, la sesión previamente abierta permanece intacta.

## Privacidad y límites operativos

El modo local no ejecuta consultas a Supabase, llamadas a IA, Google Sheets ni sincronización remota. Los archivos se leen mediante APIs del navegador y se procesan con un Web Worker cuando el entorno lo admite. La memoria se destruye al recargar, cerrar la pestaña o pulsar **Eliminar de memoria**; guardar o exportar siempre requiere una acción explícita de descarga.

La importación se limita a 15 MB y 100.000 filas para proteger la capacidad de respuesta del navegador. Para mantener la interacción fluida, la tabla permite editar las primeras 200 filas visibles, mientras que el análisis considera todas las filas incluidas por los filtros.

## Validación realizada

| Prueba | Resultado |
|---|---|
| Compilación y revisión estática | `npm run build` y `npm run lint` finalizaron correctamente tras los ajustes de validación y JSON. |
| Regresión determinista | `tests/verify-local-cell-validation.mts` verificó fechas ISO y europeas, fechas inexistentes, importes españoles, vaciados transitorios y controles de texto. |
| Regresiones existentes | `verify-audit-regressions.mts` y `verify-crypto-tax.mts` continuaron correctas. |
| Edición válida | En el ejemplo ficticio, cambiar 104,20 por 204,20 elevó el total de 741 € a 841 € y actualizó las visualizaciones locales. |
| Importe inválido | Escribir `abc` preservó el borrador y el mensaje de corrección; el total se mantuvo en 841 €. |
| Fecha inválida | Escribir `99/99/2026` mantuvo el total de 741 €, la serie `2026-01/2026-02/2026-03` y la variación previa. |
| Guardar y restaurar | Tras eliminar la copia en memoria, un JSON válido restauró seis filas, el mapeo y los filtros, sin envío ni almacenamiento automático. |
| Rechazo seguro | Un JSON con una fecha inválida fue rechazado identificando fila y campo, conservando las seis filas y el total de 741 € que ya estaban abiertos. |

## Archivos relevantes

| Archivo | Responsabilidad |
|---|---|
| `src/components/LocalCanvasWorkspace.tsx` | Estado único, borradores y errores de celda, editor masivo y guardado/carga JSON explícitos. |
| `src/lib/local-analytics.ts` | Normalización calendarizada de fechas, validadores, `recordFromRaw` y cálculo local. |
| `src/workers/local-analysis.worker.ts` | Análisis local con `requestId` para ignorar respuestas obsoletas. |
| `tests/verify-local-cell-validation.mts` | Prueba determinista de los validadores introducidos. |
| `src/app/globals.css` | Estados visibles y accesibles para controles inválidos y mensajes de error. |

## Límite de responsabilidad

Los datos procesados por el Canvas siguen siendo material local y revisable. La edición no constituye conciliación bancaria, asesoramiento financiero, recomendación de inversión ni preparación o presentación fiscal oficial. Cualquier modo futuro de colaboración o persistencia deberá ser independiente, consentido, versionado y protegido con RLS, auditoría y control de conflictos; no debe reutilizar silenciosamente este modo privado.
