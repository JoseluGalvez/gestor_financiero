# Sesiones JSON locales: respaldo y restauración del Canvas

**Versión del formato:** 1  
**Identificador de formato:** `portafolio-intel-local-canvas`  
**Ámbito:** Canvas local sin cuenta de Portafolio Intel

## Finalidad y modelo de privacidad

Una sesión JSON es una instantánea explícita del trabajo que existe en la memoria de una pestaña del Canvas. Permite guardar varios puntos de trabajo y restaurar el que la persona usuaria elija después, sin enviar las filas a Supabase, servicios de IA, Google Sheets ni otro servicio remoto.

> El archivo JSON no es una copia automática ni un historial residente. Solo se crea al pulsar **Guardar estado JSON** y solo se lee al pulsar **Cargar estado JSON** y elegir un archivo.

El archivo se descarga con un nombre basado en la fecha, como `canvas-local-2026-08-26.json`. Si el sistema operativo detecta un nombre repetido, puede añadir un sufijo, por ejemplo `(1)`. Esos archivos son estados independientes que se conservan donde decida la persona usuaria.

## Estructura de alto nivel

El esquema actual es el siguiente. Los datos del ejemplo son enteramente ficticios.

```json
{
  "format": "portafolio-intel-local-canvas",
  "version": 1,
  "savedAt": "2026-08-26T07:15:00.000Z",
  "headers": ["Fecha", "Instrumento", "Precio", "Divisa"],
  "mapping": {
    "date": "Fecha",
    "value": "Precio",
    "category": "Instrumento",
    "platform": "",
    "geography": "",
    "status": ""
  },
  "filters": {
    "from": "2026-01-01",
    "to": "2026-12-31",
    "category": "Fondo Atlas Simulado",
    "platform": "",
    "geography": ""
  },
  "rows": [
    {
      "Fecha": "2026-01-03",
      "Instrumento": "Fondo Atlas Simulado",
      "Precio": "204,20",
      "Divisa": "EUR"
    }
  ]
}
```

| Propiedad | Tipo | Obligatoria al cargar | Finalidad |
|---|---|---:|---|
| `format` | Cadena | Sí | Identifica inequívocamente el formato. Debe ser `portafolio-intel-local-canvas`. |
| `version` | Número | Sí | Declara la versión de contrato. La aplicación actual acepta únicamente `1`. |
| `savedAt` | Cadena ISO al guardar | No se usa para decidir la restauración | Referencia informativa del momento de descarga. Se genera con `new Date().toISOString()`. |
| `headers` | Matriz de cadenas | Sí | Define las columnas originales y el orden de exportación. Debe tener al menos dos encabezados no vacíos y sin duplicados. |
| `mapping` | Objeto | Sí | Explica qué encabezado alimenta cada dimensión analítica. |
| `filters` | Objeto | Sí | Conserva la segmentación visible en el momento de guardar. |
| `rows` | Matriz de objetos | Sí | Guarda las filas originales mediante pares `encabezado: valor`. |

## `mapping`: conexión entre columnas y análisis

`mapping` no transforma ni elimina columnas. Solo declara qué encabezado del archivo corresponde a cada campo que el Canvas necesita para construir los indicadores y los gráficos.

| Clave | Qué representa | Ejemplo | Regla de restauración |
|---|---|---|---|
| `date` | Fecha para la serie temporal y filtros de período. | `"Fecha"` | Debe nombrar un encabezado existente o quedar vacío. |
| `value` | Importe o valor numérico para KPIs y agrupaciones. | `"Precio"` | Debe nombrar un encabezado existente o quedar vacío. |
| `category` | Instrumento, activo o categoría para donut y filtro. | `"Instrumento"` | Debe nombrar un encabezado existente o quedar vacío. |
| `platform` | Plataforma, broker o fuente. | `"Broker"` | Opcional. Un valor vacío se presenta como `Sin clasificar`. |
| `geography` | País, región o zona. | `"País"` | Opcional. Un valor vacío se presenta como `Sin clasificar`. |
| `status` | Estado operativo de la fila. | `"Estado"` | Opcional. |

Durante la carga, una referencia de `mapping` que no sea una cadena o que no exista en `headers` se normaliza a una cadena vacía. Esto evita apuntar a una columna inexistente, pero puede dejar una dimensión sin clasificar hasta que se reasigne desde la interfaz.

## `filters`: estado de segmentación

El objeto `filters` guarda los filtros del Canvas. Una cadena vacía significa que el filtro no está activo.

```json
{
  "from": "2026-01-01",
  "to": "2026-12-31",
  "category": "Fondo Atlas Simulado",
  "platform": "",
  "geography": ""
}
```

Las fechas de filtro usan el valor normalizado que acepta el control nativo de fecha, normalmente `YYYY-MM-DD`. Al restaurar, los filtros se limpian y normalizan como texto; el análisis se recalcula después contra las filas restauradas.

## `rows`: datos que se conservan

Cada elemento de `rows` es un objeto con una propiedad por encabezado. Los valores se guardan como texto normalizado. Se conserva la fila original, no el resultado de un gráfico ni una copia de los KPIs.

```json
{
  "Fecha": "26/08/2026",
  "Instrumento": "Empresa Boreal Demo",
  "Precio": "1.234,50",
  "Divisa": "EUR",
  "Notas": "DATO FICTICIO"
}
```

La aplicación reconstruye los campos derivados durante la carga. Por ejemplo, `recordFromRaw` interpreta el importe para los cálculos, normaliza la fecha cuando es necesario y crea identificadores de sesión con el patrón `session-<posición>`. Por esa razón, **no** se guardan identificadores internos de React, resultados de análisis, series temporales, KPIs, gráficos ni conclusiones: todos se vuelven a calcular localmente.

## Validación antes de sustituir la sesión abierta

La restauración es transaccional desde la perspectiva del estado visible: primero se verifica el archivo completo; solo después se sustituyen encabezados, mapeo, filtros y filas. Si alguna condición falla, la sesión abierta se conserva.

| Etapa | Control aplicado | Consecuencia si falla |
|---|---|---|
| Tamaño del archivo | Máximo de 15 MB. | Se rechaza sin leer/restaurar la sesión. |
| Sintaxis | El contenido debe poder interpretarse como JSON. | Se muestra un error de interpretación y no cambia el Canvas. |
| Identidad de formato | `format` y `version` deben coincidir exactamente con el contrato actual. | Se rechaza como estado incompatible. |
| Forma del documento | `headers` y `rows` deben ser matrices; `mapping` y `filters`, objetos. | Se rechaza por esquema incompleto. |
| Encabezados | Mínimo dos, no vacíos ni repetidos. | Se rechaza por encabezados inválidos. |
| Capacidad | Máximo de 100.000 filas. | Se rechaza por límite local. |
| Filas | Cada fila debe ser un objeto. | Se identifica la posición de la fila inválida. |
| Tipos de campos mapeados | Fecha obligatoria ISO/europea existente; valor obligatorio numérico y finito; texto de dimensión máximo 160 caracteres y sin controles. | Se identifica fila, campo y motivo; el estado previo no se sustituye. |

El control de calendario impide aceptar fechas que parezcan tener el formato correcto pero no existan, como `2026-02-31` o `99/99/2026`. Los importes aceptan formatos como `204,20` y `1.234,50`, pero no texto como `abc` ni valores vacíos en una columna mapeada como valor.

## Qué se restaura y qué no

| Se restaura desde el archivo | No se guarda ni se restaura |
|---|---|
| Encabezados, filas originales y mapeo de columnas. | Credenciales, secretos, organización, cuenta de Supabase o permisos. |
| Filtros de fecha, categoría, plataforma y geografía. | KPIs, gráficos, series, conclusiones y agrupaciones derivadas. |
| Estado de datos válido que ya formaba parte de `records`. | Borradores de celdas inválidos, errores temporales por celda y edición masiva aún sin aplicar. |
| Fecha informativa de descarga en `savedAt`. | Cualquier historial automático, sincronización entre dispositivos o almacenamiento persistente del navegador. |

Al completar una carga válida, la interfaz limpia los borradores, errores de celda y edición por selección. Esto evita mezclar textos pendientes de una sesión anterior con las filas restauradas.

## Uso recomendado para varios respaldos

Para guardar varios momentos de trabajo, conviene descargar un JSON tras cambios relevantes y renombrarlo fuera de la aplicación con un criterio claro, por ejemplo `cartera-simulada-antes-rebalanceo.json` o `cartera-simulada-2026-08-26-v2.json`. Para recuperar un punto concreto, se abre el Canvas local, se pulsa **Cargar estado JSON** y se elige el archivo deseado.

Como el archivo contiene las filas que se guardaron, debe protegerse con las mismas precauciones que cualquier exportación financiera local: almacenamiento cifrado del dispositivo cuando proceda, carpetas con acceso restringido y evitar adjuntarlo a servicios de terceros sin revisar su contenido. El Canvas no cifra ni firma los archivos JSON; la validación comprueba la compatibilidad y los tipos, no la autoría ni la integridad criptográfica.

## Compatibilidad futura

La versión `1` sirve para rechazar de forma segura un esquema que la aplicación todavía no entiende. Si el formato evoluciona, una versión futura debe conservar o documentar migraciones explícitas, en vez de interpretar silenciosamente un archivo con otra estructura. Hasta entonces, un archivo con otra versión debe considerarse incompatible y no debe sustituir el estado abierto.
