# Proceso exacto de validación y restauración de una sesión JSON local

Este documento describe el recorrido que sigue el Canvas local cuando la persona usuaria pulsa **Cargar estado JSON** y elige un archivo. El proceso sucede en el navegador; no solicita datos a Supabase, Google Sheets, un proveedor de IA ni otro servicio remoto.

> La regla de seguridad es «validar antes de mutar». Hasta que el archivo completo no supera los controles, los encabezados, filtros y filas de la sesión que ya está abierta no cambian.

## Recorrido de restauración

| Paso | Operación exacta | Resultado o condición |
|---:|---|---|
| 1 | La persona pulsa **Cargar estado JSON** y selecciona un archivo `.json`. | El navegador entrega un objeto `File` al Canvas. |
| 2 | Se compara `file.size` con el máximo local de **15 MB**. | Si lo supera, se informa del límite y se detiene la restauración. |
| 3 | Se lee el contenido con `await file.text()`. | La lectura ocurre en memoria del navegador. |
| 4 | Se ejecuta `JSON.parse(...)`. | Si la sintaxis JSON es incorrecta, se captura el error y la sesión ya abierta permanece intacta. |
| 5 | Se valida el objeto raíz. | Debe ser un objeto, tener `format: "portafolio-intel-local-canvas"` y `version: 1`. |
| 6 | Se valida la estructura mínima. | `headers` y `rows` deben ser matrices; `mapping` y `filters`, objetos. |
| 7 | Se normalizan los encabezados con `cleanText`. | Deben quedar al menos dos encabezados no vacíos y no puede haber duplicados. |
| 8 | Se comprueba la capacidad. | `rows` no puede superar **100.000** elementos. |
| 9 | Se normaliza `mapping`. | Cada clave solo se acepta si referencia un encabezado presente; una referencia ausente o desconocida se convierte en cadena vacía. |
| 10 | Se normaliza `filters`. | Se conservan únicamente las cadenas limpias de `from`, `to`, `category`, `platform` y `geography`; lo demás se convierte en vacío. |
| 11 | Se valida cada fila. | Cada elemento debe ser un objeto. Para cada encabezado se toma el valor, se convierte a texto y se elimina espacio sobrante. |
| 12 | Se valida cada campo que esté mapeado. | Fecha, valor y dimensiones asignadas deben superar sus validaciones de tipo y contenido. |
| 13 | Se construyen los registros internos. | Se reconstruye cada fila con `recordFromRaw("session-<índice>", raw, mapping)`. |
| 14 | Se sustituye el estado. | Se actualizan `headers`, `mapping`, `filters` y `records`; se limpian borradores de celdas, errores y edición masiva pendiente. |
| 15 | Se recalcula el Canvas. | El efecto local envía las filas y filtros restaurados al Web Worker, o usa el cálculo local de reserva si el Worker no está disponible. |

## Validación por campo mapeado

La validación de una fila solo se aplica a los campos cuyo encabezado esté declarado en `mapping`. Por ejemplo, si `platform` es una cadena vacía, ninguna columna se valida como plataforma y la interfaz mostrará esa dimensión como `Sin clasificar`.

| Campo de `mapping` | Control exacto | Ejemplos aceptados | Ejemplos rechazados |
|---|---|---|---|
| `date` | Obligatorio; `YYYY-MM-DD` o `DD/MM/AAAA`; se verifica que exista realmente en el calendario. | `2026-08-26`, `26/08/2026`. | `99/99/2026`, `2026-02-31`, vacío. |
| `value` | Obligatorio; número finito; admite punto/espacio de miles y coma o punto decimal. | `204,20`, `1.234,50`, `500`. | `abc`, `1e3`, vacío. |
| `category`, `platform`, `geography`, `status` | Máximo 160 caracteres y sin caracteres de control. | `Fondo Atlas Simulado`, `ES`, `Activo`. | Texto de 161 caracteres, texto con `NUL` u otro carácter de control. |

Los valores de las filas se normalizan con `String(valor ?? "").trim()`. Por ello, una cantidad codificada como número JSON se convierte internamente a texto antes de validar; aun así, el archivo generado por el Canvas guarda los valores como cadenas para conservar el dato original de la celda.

## Qué sucede si hay un error

El código no actualiza el estado del Canvas hasta terminar `parseLocalSession`. Un archivo con una fila inválida, por tanto, no deja una restauración a medias. El mensaje explica el motivo y, cuando procede, identifica la posición de la fila y el campo.

| Ejemplo de problema | Mensaje o resultado esperado | Estado anterior |
|---|---|---|
| JSON mal formado | Error de interpretación de JSON local. | Se conserva. |
| `format` distinto o `version` diferente de `1` | Estado local incompatible. | Se conserva. |
| Encabezado repetido | Encabezados inválidos o duplicados. | Se conserva. |
| Más de 100.000 filas | Estado superior al límite local. | Se conserva. |
| Fila no objeto | Se identifica la fila inválida. | Se conserva. |
| Fecha `99/99/2026` en la columna mapeada `date` | Se identifica la fila y el campo `date`. | Se conserva. |
| Valor `abc` en la columna mapeada `value` | Se identifica la fila y el campo `value`. | Se conserva. |

## Ejemplo válido completo

El archivo adjunto `canvas-local-session-ejemplo-valido.json` es una sesión **válida** de versión 1 con seis filas completamente ficticias. En el siguiente bloque se reproduce íntegramente para facilitar su revisión.

```json
{
  "format": "portafolio-intel-local-canvas",
  "version": 1,
  "savedAt": "2026-08-26T07:30:00.000Z",
  "headers": ["Fecha", "Instrumento", "Tipo", "Cantidad", "Precio", "Divisa", "ISIN", "Comisiones", "Notas"],
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
    "category": "",
    "platform": "",
    "geography": ""
  },
  "rows": [
    {"Fecha": "2026-01-03", "Instrumento": "Fondo Atlas Simulado", "Tipo": "buy", "Cantidad": "12.5", "Precio": "204,20", "Divisa": "EUR", "ISIN": "DEMO00000001", "Comisiones": "1,50", "Notas": "DATO FICTICIO"},
    {"Fecha": "2026-01-17", "Instrumento": "Empresa Boreal Demo", "Tipo": "buy", "Cantidad": "8", "Precio": "57,35", "Divisa": "EUR", "ISIN": "DEMO00000002", "Comisiones": "0,80", "Notas": "DATO FICTICIO"},
    {"Fecha": "2026-02-01", "Instrumento": "Fondo Atlas Simulado", "Tipo": "dividend", "Cantidad": "0", "Precio": "1,24", "Divisa": "EUR", "ISIN": "DEMO00000001", "Comisiones": "0", "Notas": "DATO FICTICIO"},
    {"Fecha": "2026-02-12", "Instrumento": "Préstamo Cobalto Demo", "Tipo": "interest", "Cantidad": "0", "Precio": "16,75", "Divisa": "EUR", "ISIN": "DEMO00000003", "Comisiones": "0", "Notas": "DATO FICTICIO"},
    {"Fecha": "2026-03-02", "Instrumento": "Empresa Boreal Demo", "Tipo": "sell", "Cantidad": "3", "Precio": "61,10", "Divisa": "EUR", "ISIN": "DEMO00000002", "Comisiones": "0,50", "Notas": "DATO FICTICIO"},
    {"Fecha": "2026-03-15", "Instrumento": "Efectivo de prueba", "Tipo": "deposit", "Cantidad": "0", "Precio": "500", "Divisa": "EUR", "ISIN": "DEMO00000004", "Comisiones": "0", "Notas": "DATO FICTICIO"}
  ]
}
```

Este ejemplo restaura la dimensión temporal desde `Fecha`, el valor desde `Precio` y la categoría desde `Instrumento`. Las dimensiones plataforma, geografía y estado quedan intencionadamente sin asignar; por tanto, su resultado visible será `Sin clasificar` hasta que se asigne una columna en el Canvas.

## Nota sobre `savedAt`

El Canvas genera `savedAt` como fecha ISO por trazabilidad humana, pero la versión actual no la utiliza para calcular ni decidir si restaura la sesión. Lo que gobierna la compatibilidad es la pareja `format` y `version`, junto con la validación completa de las filas y el mapeo.

## Límite de seguridad del formato

El archivo no contiene secretos, tokens, credenciales ni identificadores de organización. Sin embargo, sí contiene las filas guardadas, por lo que debe tratarse como una exportación local potencialmente sensible. La validación actual comprueba formato y tipos, pero no añade cifrado, firma digital ni garantía criptográfica de autoría.
