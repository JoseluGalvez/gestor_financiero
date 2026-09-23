# Validación visual del Canvas local

## Prueba realizada

Se abrió la aplicación sin sesión y se seleccionó **«Abrir Canvas local sin cuenta»**. La interfaz mostró el aviso de procesamiento en memoria, la prohibición de consultas a Supabase y la zona de carga para CSV/XLSX.

Se pulsó **«Cargar ejemplo ficticio»**. El workspace mostró seis filas, el mapeo editable de columnas, filtros temporales y categóricos, cuatro KPIs, gráfico de área, donut, barras, representación relativa de geografía, lectura ejecutiva, tabla de detalle y las opciones de exportación CSV/manifiesto Power BI.

## Observaciones de privacidad y mapeo

La prueba confirma que el workspace es accesible sin autenticación y no requiere una organización ni una consulta persistente. La representación geográfica deja claro que es relativa y que necesita una columna geográfica para aportar señal útil. El detector de esquema prioriza `Instrumento` sobre `Tipo` como categoría por defecto.

Tras recargar el modo local y volver a cargar el conjunto ficticio, los filtros listaron los cuatro instrumentos disponibles y la tabla, donut, conclusión de concentración y KPI se actualizaron con esa dimensión. La interfaz incorpora selección cruzada: un clic sobre segmentos de categoría, barras de plataforma o burbujas geográficas alterna el filtro correspondiente.

La fuente ficticia no dispone de plataforma ni geografía, por lo que ambas visualizaciones muestran `Sin clasificar`; este comportamiento esperado comunica que el usuario debe asignar una columna adecuada para obtener una desagregación útil. La carga de archivos reales y la exportación no escriben en Supabase; las filas sólo existen en memoria durante la pestaña abierta.

## Filtro cruzado

Se filtró la categoría `Empresa Boreal Demo` en el selector local. Sin recargar la página, el workspace pasó de seis a dos filas y recalculó el valor filtrado a **118 €**, la media a **59 €**, la variación a **+6,5 %**, la serie temporal, el donut, el mapa relativo, la tabla y la lectura ejecutiva. La operación se ejecutó en la pestaña y no creó registros en Supabase.

## Calidad de código y dependencias

| Comprobación | Resultado |
|---|---|
| `npm run lint` | Correcto, sin errores ni advertencias. |
| `npm run build` | Correcto con Next.js 16.3.1 y TypeScript estricto. |
| `npm audit --omit=dev --audit-level=high` | Correcto: 0 vulnerabilidades encontradas. |

La compilación y la auditoría se ejecutaron después de corregir el mapeo de `Instrumento`, restaurar la configuración de lint e incorporar la selección cruzada de donut, barras y mapa relativo.

## Regresión tras nuevas vistas

El 25 de agosto de 2026 se comprobó de nuevo el acceso sin sesión. La pantalla de autenticación cargó correctamente y el acceso **«Abrir Canvas local sin cuenta»** abrió el workspace con el aviso de procesamiento local, las garantías de no usar Supabase/IA/almacenamiento persistente y la opción de carga CSV/XLSX. Las nuevas vistas autenticadas no afectan a esta ruta privada.

## Validación final de edición tipada y sesiones JSON

El 26 de agosto de 2026 se volvió a abrir el Canvas sin cuenta y se cargó exclusivamente el ejemplo ficticio. La edición del primer importe de `104,20` a `204,20` actualizó el total de **741 €** a **841 €**, junto con la media, la distribución, el mapa relativo y las conclusiones, sin recargar la página.

| Caso ejercitado | Comportamiento observado | Estado del análisis local |
|---|---|---|
| Importe `abc` tras una edición válida | La celda retuvo el borrador, quedó marcada con un mensaje accesible y comunicó que debía corregirse antes de recalcular. | El total permaneció en **841 €**. |
| Fecha `99/99/2026` | La celda mostró el formato aceptado y mantuvo el borrador inválido. | El total siguió en **741 €** y la serie conservó `2026-01`, `2026-02` y `2026-03`. |
| Guardar estado JSON | Se descargó un archivo local versionado desde la copia analítica válida. | La interfaz explicó que se pueden guardar varios archivos bajo decisión manual. |
| Borrar y restaurar JSON | Tras eliminar la memoria de la pestaña, se cargó el archivo descargado. | Se restauraron seis filas, mapeo y filtros; el total volvió a **741 €**. |
| JSON inválido | Se intentó cargar una sesión con fecha imposible. | Se rechazó indicando fila y campo; las seis filas y el total existente no cambiaron. |

La prueba confirma que los borradores inválidos no se serializan ni se entregan al Worker, y que las sesiones JSON no se envían ni se almacenan automáticamente. Las comprobaciones finales `npm run build`, `npm run lint`, `verify-local-cell-validation.mts`, `verify-audit-regressions.mts` y `verify-crypto-tax.mts` finalizaron correctamente.
