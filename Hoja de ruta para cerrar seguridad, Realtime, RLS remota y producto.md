# Hoja de ruta para cerrar seguridad, Realtime, RLS remota y producto

**Proyecto:** Gestor financiero · Portafolio Intel  
**Fecha:** 27 de agosto de 2026  
**Naturaleza:** guía técnica y de decisión. No ejecuta cambios remotos, no contiene secretos y no autoriza por sí misma migraciones, conectores, IA, sincronización de mercado ni publicación.

> **Conclusión ejecutiva.** Los dos hallazgos altos de CSV/FIFO están corregidos y validados en la copia local. Para declarar la aplicación lista para producción aún hay que cerrar primero los hallazgos de Realtime y RLS remota, completar los flujos que hoy son solo preparación o diseño, y superar una validación de despliegue con datos ficticios. No debe confundirse una vista previa, un formulario de configuración o una propuesta arquitectónica con una función operativa en producción.

---

## Índice

1. [Estado actual comprobado](#1-estado-actual-comprobado)
2. [Parche TypeScript aplicado: CSV seguro](#2-parche-typescript-aplicado-csv-seguro)
3. [Parche TypeScript aplicado: fechas FIFO](#3-parche-typescript-aplicado-fechas-fifo)
4. [Cerrar el hallazgo Realtime](#4-cerrar-el-hallazgo-realtime)
5. [Cerrar el hallazgo de RLS remota](#5-cerrar-el-hallazgo-de-rls-remota)
6. [Orden de implementación y criterios de aceptación](#6-orden-de-implementación-y-criterios-de-aceptación)
7. [Qué falta para considerar la app terminada](#7-qué-falta-para-considerar-la-app-terminada)
8. [Lista de decisiones que requieren autorización explícita](#8-lista-de-decisiones-que-requieren-autorización-explícita)
9. [Referencias](#9-referencias)

---

## 1. Estado actual comprobado

La aplicación tiene dos fronteras de datos. El **Canvas local** y el cálculo de **Criptomonedas** son rutas de análisis local: los archivos seleccionados se procesan en memoria y las descargas son una acción explícita. El dashboard autenticado, en cambio, utiliza Supabase y se apoya en RLS organizativo para los datos persistentes. Esta diferencia debe mantenerse clara en la interfaz, la documentación y las pruebas.

| Área | Estado local actual | Evidencia | Pendiente de cierre |
| --- | --- | --- | --- |
| CSV Canvas y Criptomonedas | **Corregido.** Los exportadores usan una utilidad compartida que neutraliza texto potencialmente formulable. | `src/lib/csv-security.ts`; regresión `verify-csv-and-fifo-hardening.mts`. | Ninguno para el hallazgo alto; mantener prueba en CI. |
| Fechas FIFO | **Corregido.** Solo se aceptan días reales `AAAA-MM-DD`; una compra inválida no crea lote. | `normalizeCryptoIsoDate`; regresiones FIFO. | Ninguno para el hallazgo alto; ampliar casos si se añaden formatos. |
| Realtime | **Pendiente.** Seis suscripciones invocan la carga integral del workspace ante cada evento. | `RealtimePortfolioApp.tsx`, líneas aproximadas 242–248. | Refactor por dominios, coalescencia, control de respuestas obsoletas y prueba de ráfagas. |
| RLS remota | **Pendiente de comprobación en vivo.** Las políticas declaradas se revisaron localmente y el proyecto remoto se consultó en modo lectura en una revisión previa. | `ESTADO.md`; informe de auditoría. | Comparar configuración real con migraciones, probar aislamiento con identidades ficticias y revisar grants, vistas y Security Advisor. |
| Conectores y datos de mercado | **No activados.** Solo existen diseño, formularios o vistas preparatorias. | Documentación y vistas previas. | Autorización, secretos en backend, licencia, control de alcance y pruebas. |
| GitHub | **No disponible en este entorno.** | El conector devolvió autenticación inválida y la copia restaurada no contiene `.git`. | Reautorizar, reconstruir historial local de trabajo y publicar mediante proceso revisable. |

El build y lint ejecutados tras el parche terminaron correctamente. Las regresiones de CSV/FIFO, Criptomonedas, Canvas, Salud empresa y auditoría pasaron. La ejecución directa con Node emite advertencias conocidas sobre *type stripping* experimental y modo ESM; no son fallos de las aserciones, pero justifican mover las pruebas a un runner/CI estable.

---

## 2. Parche TypeScript aplicado: CSV seguro

### Riesgo que resuelve

Un CSV no ejecuta código por sí mismo, pero un programa de hojas de cálculo puede interpretar el contenido de una celda como fórmula al abrirlo. El riesgo aparece cuando un dato no confiable empieza por caracteres como `=`, `+`, `-` o `@`. Entrecomillar una celda no es suficiente por sí solo. OWASP documenta esta familia de problemas como **CSV/Formula Injection** y aconseja forzar el tratamiento textual cuando el archivo se destina a apertura humana.[1]

La solución aplicada no pretende ser un formato universal de intercambio. Está diseñada para CSV que una persona abre y revisa en Excel, LibreOffice u otra hoja similar. Para cualquier reimportación automática se debe crear un formato distinto, documentado y validado de extremo a extremo.

### Utilidad compartida exacta

Archivo: `src/lib/csv-security.ts`.

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

### Cómo funciona, paso a paso

1. Se convierte `null` o `undefined` en una cadena vacía para que la exportación sea determinista.
2. La expresión regular ignora de forma preventiva un BOM y espacios iniciales.
3. Si el valor **es texto** y comienza por `=`, `+`, `-`, `@` o sus equivalentes de ancho completo, se añade una tabulación inicial dentro de la celda CSV.
4. Se duplican las comillas internas, que es el escape estándar del formato CSV.
5. Se rodea toda celda de comillas y se unen filas y columnas.
6. Un valor pasado como `number`, por ejemplo `-125.4`, no recibe tabulación; se conserva como dato numérico.

| Entrada | Tipo de entrada | Salida lógica de celda | Resultado esperado al abrir visualmente |
| --- | --- | --- | --- |
| `=1+1` | `string` | `"\t=1+1"` | Texto visible; no debe evaluarse como fórmula. |
| `  @SUM(A1:A2)` | `string` | `"\t  @SUM(A1:A2)"` | Texto visible incluso tras espacios. |
| `－texto` | `string` | `"\t－texto"` | Texto visible para variante de ancho completo. |
| `-125.4` | `number` | `"-125.4"` | Número negativo conservado. |
| `A "B", C` | `string` | `"A ""B"", C"` | Contenido CSV correctamente escapado. |

### Dónde se usa

| Ruta | Uso de la utilidad | Protección conseguida |
| --- | --- | --- |
| `src/lib/local-analytics.ts` | `csvFromRecords()` genera la vista filtrada, incluida la exportación local para Power BI. | Campos de texto del Canvas protegidos. |
| `src/components/LocalCanvasWorkspace.tsx` | La tabla editable llama a `csvFromRows(matrix)`. | Cambios manuales en tabla no pueden crear una fórmula exportada sin neutralizar. |
| `src/lib/crypto-tax.ts` | `cryptoTemplateCsv()` y `cryptoDraftCsv()` usan `csvFromRows`. | Plantilla y borrador fiscal local protegidos. |
| `src/lib/company-fundamentals-export.ts` | El CSV de Salud empresa usa la misma utilidad. | Nombre, fuente, advertencias y textos de análisis siguen la misma política. |

Ejemplo del Canvas que delega en la utilidad:

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

> **Límite explícito.** OWASP señala que las mitigaciones dependen de cómo un programa trata CSV, separadores, valores y re-guardados. Por eso esta protección mejora la apertura humana, pero no autoriza a usar el mismo archivo para reimportar datos sin un contrato específico y pruebas de compatibilidad.[1]

---

## 3. Parche TypeScript aplicado: fechas FIFO

### Riesgo que resuelve

El patrón `AAAA-MM-DD` por sí solo no prueba que exista el día indicado. Por ejemplo, `2026-99-99` y `2026-02-30` cumplen visualmente el patrón, pero son fechas imposibles. JavaScript puede normalizar internamente componentes fuera de rango; si se ordenaran esas operaciones, un FIFO podría consumir lotes en un orden incorrecto. La validación debe comprobar tanto forma como significado antes de calcular.[2]

### Función exacta de validación

Archivo: `src/lib/crypto-tax.ts`.

```ts
/** Devuelve la fecha ISO solo si representa un día real del calendario gregoriano. */
export function normalizeCryptoIsoDate(value: string) {
  const match = clean(value).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return "";
  const [, year, month, day] = match;
  const normalized = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  if (normalized.getUTCFullYear() !== Number(year) || normalized.getUTCMonth() !== Number(month) - 1 || normalized.getUTCDate() !== Number(day)) return "";
  return `${year}-${month}-${day}`;
}
```

La función usa UTC para que la validación de un día no dependa de la zona horaria del navegador. Primero comprueba el formato exacto y luego crea la fecha. Si JavaScript desplazara un día imposible a otro mes, la comparación final no coincidiría y la función devolvería una cadena vacía.

| Valor de entrada | Resultado | Interpretación |
| --- | --- | --- |
| `2024-02-29` | `2024-02-29` | Válido: año bisiesto. |
| `2026-02-28` | `2026-02-28` | Válido. |
| `2026-02-30` | Cadena vacía | Día inexistente; se bloquea. |
| `2026-99-99` | Cadena vacía | Mes y día inexistentes; se bloquea. |
| `26-02-28` | Cadena vacía | Formato no permitido. |

### Integración en la importación del CSV

```ts
const sourceDate = clean(csvValue(row, headers, mapping.date));
const normalizedDate = normalizeCryptoIsoDate(sourceDate);
const date = normalizedDate || sourceDate;
const rowWarnings: string[] = [];

if (!normalizedDate) {
  rowWarnings.push("La fecha debe usar AAAA-MM-DD y representar un día real del calendario.");
}
```

### Barreras antes de afectar al inventario FIFO

```ts
const ordered = [...operations].sort(
  (left, right) => left.date.localeCompare(right.date) || left.rowNumber - right.rowNumber,
);

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
    lots.push({ quantity: operation.quantity, cost: operation.eurValue + operation.fees });
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
    lines.push({ /* resto del detalle de transmisión */, result, warning: lineWarning });

    if (operation.action === "swap" && !lineWarning) {
      receivedLots.push({ quantity: operation.receivedQuantity, cost: referenceValue });
    }
  }
});
```

La consecuencia funcional es concreta: una compra con fecha imposible se contabiliza como fila no soportada y retorna antes de `lots.push`, por lo que no crea tenencia. Una venta o permuta inválida se muestra como incidencia de revisión sin resultado confirmado. Una permuta solo crea el lote del activo recibido si no existe advertencia.

### Pruebas que acreditan la corrección

| Prueba | Casos cubiertos |
| --- | --- |
| `tests/verify-csv-and-fifo-hardening.mts` | Prefijos de fórmula del Canvas y borrador cripto; negativos numéricos; fechas `2026-99-99` y `2026-02-30` rechazadas; `2024-02-29` aceptada; compra inválida sin holdings. |
| `tests/verify-crypto-tax.mts` | Ventas, inventario insuficiente, permutas bloqueadas y cadenas de permutas. |
| `tests/verify-local-cell-validation.mts` | Fechas y valores del Canvas. |
| `tests/verify-company-fundamentals.mts` | Política CSV común añadida al exportador de Salud empresa. |

---

## 4. Cerrar el hallazgo Realtime

### Diagnóstico actual

El componente autenticado abre un único canal y registra seis manejadores `postgres_changes`: `portfolio_snapshots`, `market_quotes`, `alerts`, `data_sources`, `analysis_runs` y `alert_rules`. Todos invocan `loadWorkspace()`. Esta función vuelve a solicitar el conjunto del workspace, incluidas instantáneas, posiciones, alertas, fuentes, transacciones, análisis y reglas. Una ráfaga de cambios puede provocar recargas repetidas, respuestas que llegan en distinto orden y una percepción de datos que “saltan”.

En la configuración declarada localmente, la publicación Realtime incluye `market_quotes`, `portfolio_snapshots` y `alerts`; el componente también escucha cuatro tablas adicionales. Antes de añadir más tablas a la publicación, debe decidirse si cada cambio realmente requiere una notificación o puede actualizarse localmente tras una mutación controlada. Abrir más tablas a cambios no es la corrección por defecto: puede ampliar coste y superficie operativa.

Supabase indica que en **Postgres Changes** los registros se envían únicamente a clientes que los pueden leer de acuerdo con las políticas RLS. Eso protege el acceso, pero no evita por sí solo recargas redundantes ni respuestas obsoletas.[3]

### Objetivo de diseño

La carga completa debe reservarse para el arranque del workspace, cambio de organización, recuperación de un error o actualización manual. Los eventos Realtime deben invalidar únicamente el dominio afectado y agruparse durante una ventana corta configurable. El estado solo debe aceptar una respuesta si corresponde a la versión vigente de la solicitud.

| Dominio de interfaz | Tabla que lo invalida | Carga que debe ejecutarse | Acción a evitar |
| --- | --- | --- | --- |
| Instantánea / resumen | `portfolio_snapshots` | Solo snapshot, serie y KPIs derivados. | Recargar alertas, fuentes y reglas. |
| Cotizaciones | `market_quotes` | Solo widget/serie que use cotizaciones, si está habilitado. | Recargar transacciones o análisis. |
| Alertas | `alerts` | Solo lista y contador de alertas. | Recargar cartera completa. |
| Fuentes | `data_sources` | Solo lista y estado de fuentes. | Forzar reconstrucción de toda la cartera. |
| Análisis | `analysis_runs` | Solo último análisis o lista visible. | Reconsultar fuentes y alertas. |
| Reglas | `alert_rules` | Solo reglas y estado asociado. | Recargar transacciones. |

### Pasos detallados de corrección

#### Paso 1. Establecer una línea base sin datos reales

1. Cree un entorno de desarrollo o staging con dos organizaciones y datos ficticios reproducibles.
2. Instrumente el componente para contar, por pantalla, número de eventos recibidos, dominios invalidados, solicitudes emitidas, solicitudes descartadas y duración de cada carga.
3. Dispare una ráfaga controlada de cambios sobre una sola tabla y una ráfaga mixta sobre varias tablas.
4. Registre la situación inicial. No fije una cifra de rendimiento inventada: acuerde un presupuesto de latencia, solicitudes y coste después de esta medición.

**Criterio de aceptación:** existe una evidencia antes/después que permite demostrar que una ráfaga de N eventos no genera N cargas completas.

#### Paso 2. Separar `loadWorkspace` en cargadores por dominio

1. Mantenga `loadWorkspace()` solo para la carga inicial, cambio de organización y botón de actualización manual.
2. Extraiga funciones independientes, por ejemplo `loadSnapshots`, `loadAlerts`, `loadSources`, `loadAnalysis` y `loadAlertRules`.
3. Haga que cada función seleccione solo columnas y filas necesarias para su área visible.
4. Mantenga límites y paginación para transacciones. No solicite 5.000 movimientos tras cada cambio de una alerta.
5. Actualice exclusivamente el fragmento de estado correspondiente. Para datos derivados, calcule solo los selectores que dependen de ese fragmento.

**Criterio de aceptación:** un evento de `alerts` no genera consultas a snapshots, fuentes, transacciones, análisis ni reglas.

#### Paso 3. Introducir un planificador de invalidaciones

Cree un hook o módulo, por ejemplo `useWorkspaceRealtimeScheduler`, que guarde los dominios pendientes en un `Set`. Cada callback de Realtime añade un dominio y programa un único *flush* tras una ventana breve configurable. La duración inicial es una decisión de producto a medir; no debe codificarse como una constante inamovible.

```ts
// Esquema de comportamiento; debe completarse con tipos y pruebas antes de usarlo.
type Domain = "snapshots" | "quotes" | "alerts" | "sources" | "analysis" | "rules";

const dirtyDomains = new Set<Domain>();
let flushTimer: ReturnType<typeof setTimeout> | undefined;

function invalidate(domain: Domain) {
  dirtyDomains.add(domain);
  if (flushTimer) return;

  flushTimer = setTimeout(() => {
    const domains = new Set(dirtyDomains);
    dirtyDomains.clear();
    flushTimer = undefined;
    void refreshDomains(domains);
  }, REALTIME_COALESCE_MS);
}
```

1. Mapée cada tabla al dominio correspondiente.
2. Al recibir varios eventos del mismo dominio durante la ventana, mantenga un único dominio pendiente.
3. Al recibir eventos de varios dominios, ejecute una recarga por dominio o una consulta combinada explícita, pero nunca una carga total implícita.
4. Limpie el temporizador y el `Set` al desmontar el componente, cambiar de organización o cerrar sesión.
5. Si el canal se desconecta, muestre el estado sin ocultar los datos ya cargados y permita una actualización manual segura.

**Criterio de aceptación:** diez eventos consecutivos de `portfolio_snapshots` dentro de la ventana generan una sola actualización de ese dominio.

#### Paso 4. Evitar respuestas obsoletas

Una respuesta iniciada antes puede llegar después de otra más reciente. Añada una versión monótona por dominio y acepte el resultado únicamente si sigue siendo la versión actual.

```ts
const requestVersion: Record<Domain, number> = {
  snapshots: 0,
  quotes: 0,
  alerts: 0,
  sources: 0,
  analysis: 0,
  rules: 0,
};

async function refreshDomain(domain: Domain) {
  const currentVersion = ++requestVersion[domain];
  const data = await loadDomain(domain);

  if (currentVersion !== requestVersion[domain]) return;
  applyDomainState(domain, data);
}
```

1. Mantenga un contador para cada dominio, no un contador global que descarte actualizaciones válidas de otra área.
2. Incremente la versión antes de iniciar la consulta.
3. Compare la versión al resolver o rechazar la consulta.
4. No actualice el estado ni el mensaje de error si la respuesta ya está obsoleta.
5. Utilice cancelación física de solicitud solo si la biblioteca cliente y la cadena de consulta elegidas la soportan y se prueba; la versión monótona es la barrera obligatoria de consistencia.

**Criterio de aceptación:** una respuesta antigua simulada no puede reemplazar en pantalla el resultado más reciente.

#### Paso 5. Elegir conscientemente las tablas publicadas y los canales

1. Liste las tablas presentes en la publicación Realtime real.
2. Compare esa lista con los seis manejadores del componente.
3. Para cada tabla, elija una opción: publicar y escuchar; no publicar y actualizar por mutación local; o eliminar el manejador si no existe una vista funcional que lo necesite.
4. Documente la decisión en una migración y en el contrato de datos, no solo en el código React.
5. Si se incorporan Broadcast o Presence, use canales privados y políticas para `realtime.messages`; Supabase requiere marcar el canal como privado y deshabilitar el acceso público para esa modalidad.[3]

**Criterio de aceptación:** no hay suscripciones huérfanas a tablas no publicadas ni tablas publicadas sin motivo documentado.

#### Paso 6. Probar y observar

1. Prueba unitaria del planificador: mismo dominio, dominios distintos, desmontaje, error y reconexión.
2. Prueba de integración con eventos sintéticos: ráfaga, respuestas en orden inverso y cambio de organización durante una carga.
3. Prueba E2E con dos organizaciones ficticias: cada cliente recibe solo eventos/datos que RLS le permite leer.
4. Métricas de staging: recargas por minuto, consultas por evento, latencia por dominio, errores, reconexiones y respuestas descartadas.
5. Revise los resultados antes de activar cotizaciones, alertas push o fuentes externas.

**Criterio de cierre de AUD-2026-03:** prueba de ráfaga aprobada, carga segmentada, coalescencia, protección ante respuestas obsoletas, limpieza de canal y telemetría mínima sin datos financieros sensibles.

---

## 5. Cerrar el hallazgo de RLS remota

### Qué se conoce y qué no se puede dar por supuesto

Las declaraciones locales contienen RLS para las entidades de organización, cartera, instrumentos, fuentes, transacciones, posiciones, snapshots, alertas, informes y análisis. En una revisión anterior en modo lectura se observó RLS activo y las políticas `portfolios_member_read`, `portfolios_editor_write` y `transactions_member_read`. Eso es una señal positiva, pero **no demuestra** que el proyecto remoto, los grants, las vistas, funciones, publicaciones Realtime y el esquema efectivo coincidan con lo declarado localmente hoy.

RLS es una barrera de base de datos: se ejecuta para cada acceso a una tabla y complementa la autenticación. Supabase recuerda que tanto los grants como las policies determinan el acceso; añadir una policy no revoca por sí solo privilegios preexistentes.[4]

### Política de seguridad que debe aprobarse antes de tocar producción

Antes de escribir una migración hay que firmar una matriz de permisos. Es una decisión de negocio y seguridad: no debe deducirse de los nombres de roles.

| Recurso | `anon` | Miembro autenticado de la organización | Editor | Owner | Servicio de backend |
| --- | --- | --- | --- | --- | --- |
| Organizaciones y membresías | Sin acceso, salvo endpoint público explícito. | Solo la organización/membresía autorizada. | Igual que miembro, salvo acciones expresas. | Gestión limitada y auditada. | Solo operaciones servidor necesarias. |
| Carteras, instrumentos, transacciones, posiciones, snapshots | Sin lectura ni escritura. | Lectura solo de su organización y, si se adopta, de carteras asignadas. | Escritura solo sobre recursos autorizados. | Acciones de administración definidas, nunca implícitas. | Escritura de ingesta mediante función controlada. |
| Fuentes y `connection_config` | Sin acceso. | Solo metadatos no sensibles que necesite la interfaz. | Modificación de metadatos no sensibles. | Administración de metadatos. | Acceso a secretos mediante vault/variables, nunca desde `connection_config`. |
| Alertas, reglas, informes, análisis | Sin acceso. | Lectura solo de su organización. | Escritura únicamente donde el producto lo requiera. | Administración limitada. | Generación por servicios internos auditados. |
| `realtime.messages` si se usa Broadcast/Presence | Sin acceso público. | Solo tema privado autorizado. | Igual o según permisos de escritura. | Igual o según permisos de escritura. | No aplicable como alternativa a RLS de tablas. |

> **Decisión pendiente importante:** el esquema actual separa miembros y editores a nivel de organización. Si una organización necesita aislar carteras entre sus propios miembros, hay que incorporar una tabla de asignación por cartera y cambiar las policies. No se debe afirmar aislamiento por cartera mientras RLS solo compruebe pertenencia a organización.

### Pasos detallados de comprobación y corrección

#### Paso 1. Crear un staging aislado y hacer inventario solo de lectura

1. Use un proyecto de staging distinto de producción o una rama/entorno de base de datos que contenga únicamente datos ficticios.
2. No reutilice datos de clientes, tokens ni fuentes reales.
3. Extraiga un inventario de tablas expuestas, RLS, policies, grants, vistas, funciones `SECURITY DEFINER` y publicación Realtime.
4. Guarde el resultado como evidencia de auditoría con fecha, proyecto/entorno y hash de migración, sin almacenar secretos.

Consultas de ejemplo que un administrador puede ejecutar en el editor SQL de staging. **No se han ejecutado en esta tarea.**

```sql
-- Tablas del esquema público y si RLS está activo.
select schemaname, tablename, rowsecurity, forcerowsecurity
from pg_tables
where schemaname = 'public'
order by tablename;

-- Policies efectivas, por tabla y operación.
select schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
from pg_policies
where schemaname = 'public'
order by tablename, policyname;

-- Privilegios otorgados a roles de cliente.
select table_schema, table_name, grantee, privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and grantee in ('anon', 'authenticated')
order by table_name, grantee, privilege_type;

-- Vistas expuestas que requieren evaluación específica de RLS.
select table_schema, table_name, view_definition
from information_schema.views
where table_schema = 'public'
order by table_name;
```

**Criterio de aceptación:** existe una tabla de diferencias entre configuración declarada y configuración efectiva, revisada por una persona responsable.

#### Paso 2. Corregir RLS y grants en una migración reproducible

1. Cree una migración versionada; no aplique cambios manuales solo en el panel remoto.
2. Para cada tabla expuesta, habilite RLS, revoque primero privilegios de `anon` y `authenticated`, y conceda únicamente las operaciones requeridas.
3. Escriba policies separadas para `select`, `insert`, `update` y `delete`, salvo que una justificación concreta documente otra estructura.
4. En `update`, utilice tanto `using` para la fila existente como `with check` para impedir que el usuario cambie `organization_id` o reasigne la fila a otro perímetro.
5. Haga explícito el rol `to authenticated`; no deje acceso implícito a `anon`.
6. Mantenga las funciones auxiliares `SECURITY DEFINER` en esquema privado o no expuesto, con `search_path` fijo y permisos mínimos. Revise quién puede ejecutarlas.
7. Revise vistas y materialized views: una vista no debe exponer filas que la tabla subyacente reserva. En PostgreSQL 15+, una vista pública que deba respetar RLS debe evaluarse con `security_invoker = true` o mantenerse no expuesta.[4]
8. Añada índices para las columnas utilizadas por las policies, especialmente las claves de pertenencia y organización. Las propias guías recomiendan indexar esas columnas y envolver ayudas como `auth.uid()` en un `select` cuando el resultado es estable por consulta.[4]

Ejemplo de patrón para una tabla organizativa, a adaptar a nombres, roles y operaciones aprobados:

```sql
alter table public.transactions enable row level security;

revoke all on table public.transactions from anon, authenticated;
grant select on table public.transactions to authenticated;

create policy transactions_member_read
on public.transactions
for select
to authenticated
using (
  public.is_organization_member(organization_id)
);
```

La política anterior ilustra la lectura. Antes de conceder escritura a editores, la migración debe definir qué columnas pueden modificar, cómo se impide cambiar el perímetro y si las transacciones deben ser solo de ingesta de backend. No use una policy `for all` genérica sin pruebas por operación.

**Criterio de aceptación:** toda modificación se puede reconstruir desde migraciones y no deja a `anon` o `authenticated` más permisos de los estrictamente necesarios.

#### Paso 3. Impedir que `connection_config` se convierta en almacén de secretos

1. Defina un esquema allowlist para `connection_config`: URL/ID, pestaña, rango, mapeo y metadatos no sensibles.
2. Rechace claves de secretos como `token`, `secret`, `password`, `refresh_token`, `api_key` y `connection_string` antes de insertar o actualizar.
3. Mueva cualquier credencial de conector a variables de entorno o vault del backend y guarde en tabla solo un identificador opaco de conexión.
4. Haga que las sincronizaciones se ejecuten en backend con un rol limitado; el navegador nunca debe recibir credenciales ni una clave de servicio.
5. Añada una prueba negativa que intenta insertar cada clave prohibida y confirme que fracasa.

**Criterio de aceptación:** una consulta del cliente a `data_sources` nunca devuelve un secreto, aun para un owner.

#### Paso 4. Crear pruebas de RLS con dos organizaciones ficticias

Supabase recomienda crear una prueba por tabla que cubra permisos y denegaciones de `select`, `insert`, `update` y `delete`, con roles `anon` y `authenticated`, y ejecutar la suite de base de datos.[4] [5]

Prepare al menos estas identidades falsas:

| Identidad de prueba | Organización A | Organización B | Rol | Propósito |
| --- | --- | --- | --- | --- |
| `owner_a` | Sí | No | Owner | Control positivo de administración aprobada. |
| `editor_a` | Sí | No | Editor | Escrituras permitidas específicas. |
| `member_a` | Sí | No | Miembro | Lectura permitida sin escritura indebida. |
| `owner_b` | No | Sí | Owner | Comprobar aislamiento entre organizaciones. |
| `outsider` | No | No | Autenticado | Denegar toda lectura/escritura privada. |
| `anon` | No | No | No autenticado | Denegar toda operación privada. |

Esqueleto pgTAP para verificar aislamiento de lectura. Los UUID son de ejemplo y deben sustituirse por fixtures de prueba, no por usuarios reales.

```sql
begin;
select plan(4);

-- Los fixtures se insertan mediante rol administrador dentro de la transacción.
-- Deben existir dos organizaciones y una transacción ficticia en cada una.

set local role authenticated;
set local request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111'; -- member_a

select results_eq(
  $$ select count(*) from public.transactions
     where organization_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' $$,
  array[1::bigint],
  'el miembro A ve la transacción ficticia de su organización'
);

select is_empty(
  $$ select id from public.transactions
     where organization_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb' $$,
  'el miembro A no ve filas de la organización B'
);

set local request.jwt.claim.sub = '33333333-3333-3333-3333-333333333333'; -- outsider

select is_empty(
  $$ select id from public.transactions $$,
  'un autenticado ajeno no ve transacciones'
);

set local role anon;
select throws_ok(
  $$ select id from public.transactions $$,
  '42501',
  null,
  'anon no tiene grant de lectura'
);

select * from finish();
rollback;
```

Para cada escritura denegada, no basta con comprobar ausencia de error: una policy `using` puede convertir la operación en una modificación de cero filas. Use `returning` y una lectura posterior que confirme que el registro objetivo no cambió.[4]

**Criterio de aceptación:** todas las tablas del esquema público con datos privados tienen casos positivos y negativos para los roles anteriores, ejecutables en una suite automática.

#### Paso 5. Comprobar Realtime bajo RLS

1. Mantenga RLS de las tablas como fuente de autorización para Postgres Changes. Supabase indica que un cliente solo recibe registros que puede leer conforme a RLS.[3]
2. Abra dos sesiones de prueba de organizaciones distintas y provoque un cambio ficticio en cada organización.
3. Verifique que solo la sesión autorizada recibe la actualización y que la interfaz no revela metadatos de la otra organización.
4. Si se habilitan Broadcast o Presence, cree políticas sobre `realtime.messages`, desactive el acceso público de Realtime y construya el canal con `config: { private: true }`.[3]
5. Fuerce expiración o renovación de JWT y compruebe que un usuario al que se le retira la membresía no continúa con acceso más allá de la ventana de token aceptada. La autorización de canal se calcula al conectar o al enviar un JWT nuevo, no en cada mensaje.[3]

**Criterio de aceptación:** las pruebas de dos organizaciones confirman que ni consultas REST ni actualizaciones Realtime cruzan el límite organizativo.

#### Paso 6. Security Advisor, revisión humana y evidencia de producción

1. Ejecute Security Advisor y Performance Advisor en **staging** tras aplicar la migración. Estos asesores identifican, entre otros, RLS mal configurado e índices ausentes.[6]
2. Clasifique cada alerta como corregida, aceptada con justificación o falso positivo documentado.
3. Repita la matriz de pruebas contra staging sin datos personales.
4. Prepare una ventana de despliegue, respaldo verificable y plan de reversión de migración.
5. Tras la aprobación explícita, aplique la misma migración a producción.
6. Repita en producción solo pruebas no destructivas con cuentas y registros ficticios autorizados; archive evidencias y registre la versión aplicada.

**Criterio de cierre de RLS remota:** inventario efectivo revisado, migración reproducible, suite pgTAP aprobada, prueba de dos organizaciones aprobada, Security Advisor sin hallazgos críticos abiertos y evidencia de producción archivada.

---

## 6. Orden de implementación y criterios de aceptación

La secuencia prioriza reducción de riesgo antes de habilitar nuevas fuentes, automatizaciones o análisis externos.

| Fase | Entrega | Dependencias | Criterio de salida |
| --- | --- | --- | --- |
| **0. Congelación y respaldo** | Inventario de versión local, documentos, cambios no publicados y plan de reversión. | Acceso de responsable técnico. | Ningún cambio remoto sin rama/migración/revisión. |
| **1. RLS en staging** | Matriz de permisos, migraciones reproducibles, pruebas pgTAP y Security Advisor. | Entorno staging ficticio y autorización para el trabajo de base de datos. | Aislamiento de dos organizaciones demostrado. |
| **2. Realtime por dominios** | Cargadores segmentados, planificador, control de versión, pruebas de ráfaga. | Contrato de estado del dashboard y fase 1. | Sin cargas completas por eventos aislados ni estados obsoletos. |
| **3. Datos y procedencia** | Contrato común de fuente, fecha de corte, divisa, cobertura, versión de cálculo y conciliación. | RLS y límites de secretos. | Todo KPI crítico se identifica como completo, parcial o no disponible. |
| **4. Flujos funcionales reales** | Importación explícita autorizada, previsualización, validación, escritura segura y trazabilidad. | Aprobación de fuente, backend y secretos. | Una importación ficticia E2E es reversible y auditada. |
| **5. Informes y fiscalidad** | Informes PDF/CSV con disclaimers, revisión y trazabilidad. | Datos conciliados y pruebas de salida. | Archivo exportado no contiene secretos ni ejecuta fórmulas; revisión humana obligatoria. |
| **6. Calidad de producto** | CI, E2E, pruebas de accesibilidad, cabeceras de despliegue y observabilidad proporcional. | Ramas/CI y staging. | Matriz de calidad aprobada en navegador objetivo. |
| **7. Publicación controlada** | Recuperación de GitHub, revisión de código, despliegue y monitorización. | Reautorización GitHub y cierre de P1. | Commit, tags, migraciones y evidencia de despliegue trazables. |

---

## 7. Qué falta para considerar la app terminada

“Terminada” debe definirse por un conjunto verificable de criterios, no por el número de pantallas. Conviene separar una **versión local útil** de una **versión protegida y operativa con datos autorizados**.

### 7.1. Funciones actualmente utilizables de manera local

| Funcionalidad | Estado | Condición de uso responsable |
| --- | --- | --- |
| Canvas local con CSV/XLSX/JSON, filtros, KPIs, gráficos y tabla editable | Implementado. | Usar archivos propios bajo control del usuario; no hay persistencia automática. |
| Guardar/cargar sesiones JSON locales | Implementado. | Conservar archivos en ubicación privada; restauración validada. |
| CSV local y preparación de datos para Power BI | Implementado. | Tratar el CSV como exportación visual; revisar antes de compartir/reimportar. |
| Criptomonedas FIFO y borrador CSV | Implementado con salvaguardas. | Revisar justificantes y no considerar el resultado una declaración o asesoramiento fiscal. |
| Salud empresa, ratios, PDF/CSV y criterio conservador de oportunidad | Implementado con valores manuales. | Añadir fuente, fecha y cobertura; no interpretarlo como recomendación. |

### 7.2. Funciones que no deben darse por terminadas todavía

| Funcionalidad esperada | Estado real | Trabajo necesario para declararla operativa |
| --- | --- | --- |
| Dashboard autenticado multiusuario | Base implementada, pero RLS remota pendiente de cierre. | Matriz de permisos, tests de dos organizaciones y despliegue validado. |
| Actualización Realtime eficiente | Suscripción básica implementada, pero no coalescida ni segmentada. | Fase Realtime completa y prueba de ráfagas. |
| Importación real desde Google Sheets / SQL | Formulario y previsualización preparatorios; no se autorizó ni activó conexión real. | OAuth/credenciales de backend, consentimiento de alcance, importación reversible y pruebas. |
| Cotizaciones en vivo y sparklines | No activados. | Fuente con licencia, backend, caché, límites y contrato de calidad. |
| Alertas push automáticas | No activadas de extremo a extremo. | Regla, fuente, scheduler/backend, consentimiento, caducidad y pruebas de entrega. |
| Tax Tracker / calendario de dividendos completo | Parcial o bloqueado por datos conciliados. | Datos de origen, conciliación, reglas de cálculo y pruebas. |
| XML o presentación oficial ante AEAT | Deliberadamente no implementado. | Formato vigente, datos completos, revisión profesional, firma/presentación fuera del alcance actual. |
| Power BI Embedded | No implementado. | Backend, token efímero, RLS/OLS y política de privacidad; nunca token en navegador. |
| Asistente IA financiero | Solo diseño y vista previa. | Aprobación, backend de solo lectura, RLS, fuentes licenciadas, citas, pruebas, límites y auditoría. |
| Rendimiento TWR/MWR/XIRR y atribución | Diseño técnico documentado, no motor de producción. | Contrato de flujos, datos conciliados, pruebas de casos financieros y trazabilidad. |

### 7.3. Definición de terminado propuesta

La aplicación puede considerarse **terminada para un primer lanzamiento controlado** cuando se cumplan todos los puntos siguientes:

1. Los hallazgos altos y P1 aprobados para el lanzamiento están cerrados con prueba automatizada y evidencia de staging/producción.
2. RLS remoto y Realtime han superado los criterios de cierre de las secciones anteriores.
3. Todo flujo anunciado como funcional tiene una prueba E2E con datos ficticios, éxito, error y reversión cuando existe escritura.
4. El contrato de datos expone fuente, fecha de corte, divisa, cobertura, versión de cálculo y estado de conciliación de cualquier KPI crítico.
5. Los conectores, fuentes de mercado, IA y secretos se activan solo si cada uno cuenta con aprobación, backend, mínimo privilegio, licencia/contrato y controles propios.
6. Las exportaciones incluyen privacidad, revisión humana y delimitación clara: no son órdenes, asesoramiento ni declaraciones presentadas.
7. Las cabeceras y configuración de producción están verificadas, incluida la protección de rutas autenticadas, TLS/HSTS en el borde y una CSP diseñada/probada para los orígenes estrictamente necesarios.
8. Existen pruebas de accesibilidad de navegación por teclado, foco, mensajes de error, contraste, tabla editable, móvil y lector de pantalla en las pantallas críticas.
9. El repositorio remoto se ha recuperado, el código actual está revisado, no contiene secretos y existe CI que bloquea regresiones de seguridad prioritarias.
10. Se ha definido soporte operativo: responsables, procedimiento de incidentes, retención de logs, reversión de migraciones y registro de cambios.

> **Lanzamiento controlado no equivale a “sin riesgo”.** Significa que las funciones activadas, sus límites y la evidencia de seguridad son conocidos, se pueden revisar y cuentan con una ruta de respuesta si falla un control.

---

## 8. Lista de decisiones que requieren autorización explícita

| Decisión | Por qué necesita aprobación | Estado actual |
| --- | --- | --- |
| Aplicar migraciones o modificar RLS remoto | Puede afectar a accesos y datos persistentes. | No autorizado ni ejecutado en esta tarea. |
| Crear cuentas de prueba/remotas | Cambia identidad y datos del proyecto Supabase. | Pendiente de entorno staging y autorización. |
| Configurar OAuth Google Sheets o conexión SQL | Implica credenciales, alcance y tratamiento de datos. | Pendiente. |
| Activar fuente de cotizaciones | Puede implicar licencia, cuota, claves y tratamiento de datos. | Pendiente. |
| Habilitar Redis, cron, Edge Functions o procesos de fondo | Introduce infraestructura persistente y secretos. | Pendiente. |
| Habilitar agente IA o enviar datos a un modelo | Cambia la frontera de datos y el riesgo de acceso. | Pendiente. |
| Publicar/push a GitHub | Es una acción externa irreversible o visible. | Bloqueada por autenticación; requiere reautorización. |
| Publicar Power BI Embedded o fiscalidad oficial | Implica seguridad, identidades, responsabilidad y alcance regulatorio. | Fuera de alcance actual. |

---

## 9. Referencias

[1]: https://owasp.org/www-community/attacks/CSV_Injection "OWASP — CSV Injection"

[2]: https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html "OWASP Cheat Sheet Series — Input Validation"

[3]: https://supabase.com/docs/guides/realtime/authorization "Supabase Docs — Realtime Authorization"

[4]: https://supabase.com/docs/guides/database/postgres/row-level-security "Supabase Docs — Row Level Security"

[5]: https://supabase.com/docs/guides/local-development/testing/overview "Supabase Docs — Testing Overview"

[6]: https://supabase.com/docs/guides/database/database-advisors "Supabase Docs — Performance and Security Advisors"

[7]: ./INFORME_AUDITORIA_EXHAUSTIVA_2026-08-26.md "Auditoría exhaustiva y addendum de remediación"

[8]: ./PARCHE_CSV_Y_FECHAS_FIFO.md "Parche de seguridad: exportaciones CSV y fechas FIFO"

---

**Siguiente hito recomendado:** aprobar la creación de un entorno de staging ficticio y el alcance de las migraciones de RLS. Solo después se deben crear los tests de aislamiento, comparar el estado remoto efectivo y preparar una migración revisable. En paralelo, el refactor Realtime debe desarrollarse y validarse exclusivamente contra datos ficticios y el mismo contrato de permisos.
