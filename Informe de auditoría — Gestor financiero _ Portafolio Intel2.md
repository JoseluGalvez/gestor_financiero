# Informe de auditoría — Gestor financiero / Portafolio Intel

**Fecha:** 26 de agosto de 2026  
**Alcance revisado:** aplicación Next.js, Canvas local, Criptomonedas/FIFO, comparación de plataformas, Supabase versionado, dependencias y vista previa HTML.  
**Método:** análisis del vídeo adjunto, revisión estática dirigida, pruebas deterministas, compilación, auditoría de dependencias y comprobación visual local.

> **Conclusión ejecutiva:** no se encontraron vulnerabilidades de dependencias de producción en la auditoría ejecutada ni exposición de una clave de servicio de Supabase en el código cliente revisado. Se confirmaron y corrigieron dos errores de lógica que podían sesgar resultados financieros, y se añadieron controles de capacidad y coherencia para los flujos locales. Quedan mejoras de rendimiento y endurecimiento preventivo recomendadas antes de una publicación con mayor volumen de datos.

## 1. Origen de la metodología

El vídeo adjunto presenta un enfoque de auditoría de aplicaciones React orientado a diagnóstico por archivo/línea, pruebas de estado, rendimiento, seguridad, accesibilidad y revisión diferencial de cambios. También destaca el uso de una comprobación local inicial, evidencias de navegador y una priorización de hallazgos. La skill creada para este proyecto adopta esos principios, pero no instala ni ejecuta herramientas remotas de terceros sin autorización.

| Elemento extraído del vídeo | Adaptación aplicada a Portafolio Intel |
|---|---|
| Escaneo local antes de corregir | Lint, pruebas deterministas, build y `npm audit` como línea base. |
| Errores de estado y carreras | Revisión de inventario FIFO, fechas locales y resultados de Worker obsoletos. |
| Rendimiento y renderizado | Revisión de recargas Realtime, límites de archivos y análisis local en Worker. |
| Seguridad y accesibilidad | Inspección de RLS versionado, claves públicas, archivos locales, controles de sesión y etiquetas de interfaz. |
| Informe con evidencia | Cada hallazgo incluye archivos, comportamiento, corrección y prueba de regresión. |

## 2. Línea base y evidencia

La copia de trabajo auditada usa Next.js 16.3.1, React 19 y TypeScript estricto. La copia restaurada no conserva `.git`; por ello no se pudo asociar la auditoría a un hash local ni evaluar cambios diferenciales contra `main`. Tampoco se volvió a consultar el proyecto Supabase remoto, por lo que las políticas se verificaron contra el esquema versionado disponible, no contra el estado operativo actual.

| Verificación | Resultado | Evidencia |
|---|---|---|
| Prueba de regresión de auditoría | Correcta | `tests/verify-audit-regressions.mts`: inventario de plataforma atómico y filtro europeo de fechas. |
| Prueba de Criptomonedas/FIFO | Correcta | `tests/verify-crypto-tax.mts`: venta FIFO, permuta, inventario insuficiente y cadena de permutas. |
| Lint | Correcto | `npm run lint` sin errores ni advertencias. |
| Compilación | Correcta | `npm run build` con Next.js 16.3.1 y TypeScript estricto. |
| Dependencias de producción | Correcto | `npm audit --omit=dev --audit-level=high`: 0 vulnerabilidades. |
| Vista HTML | Correcta | `preview-criptomonedas.html`: casos de venta FIFO, permutas encadenadas y exportación revisable. |

Las ejecuciones de pruebas con `node --experimental-strip-types` emiten una advertencia de módulo por no declarar `type: module` en `package.json`. La advertencia no impidió las pruebas ni la compilación Next.js; se registra como mejora de ergonomía de pruebas, no como fallo de producción.

## 3. Hallazgos confirmados y corregidos

| ID | Severidad original | Área | Estado | Evidencia y corrección |
|---|---|---|---|---|
| AUD-001 | Alto | Exactitud financiera | Corregido y probado | `src/lib/platform-comparison.ts` consumía parcialmente lotes cuando una venta superaba el inventario y después la marcaba incompleta. Se introdujo una comprobación de cantidad disponible antes de mutar lotes. La prueba confirma que una venta posterior válida conserva coste y resultado correctos. |
| AUD-002 | Alto | Estado / datos locales | Corregido y probado | `src/lib/local-analytics.ts` comparaba filtros con la fecha original, aunque la serie temporal normalizaba fechas europeas. Se normalizan ahora a `AAAA-MM-DD` para filtrar y a `AAAA-MM` para agrupar. La prueba cubre `DD/MM/AAAA`. |
| AUD-003 | Alto | FIFO de Criptomonedas | Corregido y probado | `src/lib/crypto-tax.ts` se reforzó para bloquear una permuta sin inventario suficiente sin consumir el activo entregado ni crear un lote ficticio del activo recibido. La prueba incluye inventario BTC insuficiente y permutas encadenadas BTC→ETH→SOL. |
| AUD-004 | Medio | Rendimiento / carrera local | Corregido y probado por compilación | `LocalCanvasWorkspace` no limitaba tamaño/filas y podía aceptar una respuesta de Worker anterior después de cambiar datos o filtros. Se añadieron límites de 15 MB y 100.000 filas, junto con identificadores de solicitud para descartar respuestas obsoletas. |
| AUD-005 | Medio | Rendimiento de importación fiscal | Corregido y probado por compilación | `CryptoTaxWorkspace` podía leer CSV locales sin un límite explícito. Se añadieron límites de 15 MB y 50.000 operaciones, con mensajes de división local del archivo. |

## 4. Controles de seguridad y privacidad verificados

El cliente de Supabase usa únicamente `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` en el código revisado. No se localizaron referencias a una clave `service_role` en `src`. El esquema recuperado habilita RLS en perfiles, organizaciones, membresías, carteras, fuentes, transacciones, posiciones, alertas, informes y tablas relacionadas; las políticas versionadas se basan en pertenencia a organización y rol editor para escrituras. Esta observación no equivale a una comprobación del entorno remoto actual.

El Canvas local y Criptomonedas realizan el parsing y cálculo en memoria del navegador. La revisión estática no localizó uso de `localStorage`, `sessionStorage`, llamadas a Supabase o servicios de IA dentro de esos espacios locales. El Canvas usa un Web Worker cuando el navegador lo admite; el área autenticada, en cambio, mantiene sesión de Supabase por diseño y no debe compartir la promesa de «solo en memoria».

Los borradores fiscales están etiquetados como revisables, no presentan Modelos 100 o 721 y no habilitan XML de declaración hasta una integración validada del diseño de registro. Es coherente con la documentación de la AEAT: las ganancias y pérdidas por transmisión o permuta se incluyen individualmente en el Modelo 100 y las permutas usan el mayor valor de mercado entre bien entregado y recibido como valor de transmisión, que pasa a ser adquisición del activo recibido. [1]

## 5. Recomendaciones abiertas

| Prioridad | Recomendación | Justificación y prueba de cierre |
|---|---|---|
| P1 | Debounce y solicitudes cancelables para Realtime. | Una actualización de cualquiera de seis tablas ejecuta `loadWorkspace`, que vuelve a solicitar hasta 5.000 transacciones. Añadir agrupación temporal, deduplicación de peticiones y recargas selectivas; demostrar que una ráfaga de eventos no dispara cargas concurrentes. |
| P1 | Reducir `connection_config` en consultas cliente. | El dashboard selecciona el JSON completo de configuración de fuentes para todos los miembros de organización. Hoy contiene una referencia de hoja; antes de añadir conectores con secretos, proyectar solo campos de visualización o resolver detalles sensibles en backend. |
| P2 | Añadir pruebas de interfaz y accesibilidad. | La navegación y las etiquetas se revisaron visualmente, pero no existe una suite E2E con teclado, contraste, lector de pantalla, estados de error y móvil. Añadir pruebas Playwright y una auditoría automatizada de accesibilidad. |
| P2 | Hacer el parsing fiscal en Worker. | El CSV de Criptomonedas ya tiene límites, pero se interpreta en el hilo principal. Reutilizar el patrón del Canvas para preservar la respuesta al abrir archivos próximos al límite. |
| P3 | Configurar explícitamente el modo de módulos de los tests. | El runner de pruebas emite una advertencia de reparsing ESM. Ajustar una configuración de pruebas dedicada sin modificar de forma indiscriminada el empaquetado de Next.js. |

## 6. Plan detallado: recargas Realtime ante ráfagas

El dashboard autenticado se suscribe a seis tablas y ejecuta una carga integral para cada evento. En el estado actual, una ráfaga de inserciones o actualizaciones puede lanzar consultas repetidas que incluyen hasta 5.000 transacciones. Supabase recomienda suscripciones específicas por tabla, evento y filtro, porque los eventos filtrados no abandonan la base de datos; además, sus informes permiten revisar volumen de cambios, latencia, tamaño de mensajes y errores de Realtime. [3] [4]

| Paso | Decisión técnica | Resultado esperado | Criterio de aceptación |
|---|---|---|---|
| 1. Clasificar eventos | Mantener filtros `organization_id`, cambiar `event: "*"` por `INSERT`, `UPDATE` o `DELETE` solo cuando el panel lo necesite y asignar cada tabla a un actualizador específico. | Menos eventos y menor trabajo en cliente. | Una actualización de `alerts` no vuelve a pedir transacciones, posiciones ni análisis. |
| 2. Agrupar ráfagas | Introducir una cola de invalidaciones por dominio (`snapshot`, `positions`, `alerts`, `sources`, `analysis`) con debounce de 250–500 ms y una única recarga por dominio pendiente. | Una ráfaga se consolida en un refresco coherente. | 50 eventos de la misma tabla en un segundo generan como máximo una recarga del dominio. |
| 3. Evitar carreras | Asociar cada carga a `requestId` y `AbortController`; ignorar o abortar la respuesta anterior cuando llega una invalidación más nueva o se desmonta la vista. | Nunca se pinta una respuesta obsoleta sobre datos recientes. | Dos recargas solapadas terminan con el estado de la solicitud más reciente. |
| 4. Dividir consultas | Separar `loadWorkspace` en consultas por panel y conservar en memoria los dominios que no han sido invalidados. Usar paginación de transacciones para vistas históricas y calcular agregados de comparación en backend cuando excedan el umbral acordado. | Menor carga de red, memoria y renderizado. | El resumen inicial no descarga el histórico completo si la pantalla activa no lo necesita. |
| 5. Medir y ajustar | Revisar los informes de Realtime: Postgres Changes Events, tamaño de mensaje, errores, conexiones y lag. Definir presupuesto de carga, por ejemplo p95 de actualización visual inferior a 1 s para eventos de cartera. | Rendimiento operable y trazable. | Registro de métricas antes/después y prueba de carga controlada documentada. |
| 6. Escalar cuando proceda | Evaluar Broadcast desde trigger de base de datos para actualizaciones agregadas de alto volumen, manteniendo RLS y mensajes mínimos. | Evitar que el cliente procese cambios masivos crudos. | Prueba de autorización por organización y payload sin datos no necesarios. |

La implementación debe mantener la limpieza actual de canales al desmontar. No se recomienda publicar una tabla completa ni sustituir filtros RLS por filtrado de interfaz.

## 7. Plan detallado: secretos de conexión y configuración de fuentes

La configuración actual de Google Sheets solo almacena referencia, pestaña, rango y mapeo; no se han detectado tokens OAuth en el cliente. Aun así, `connection_config` se selecciona completo para todos los miembros de la organización. Esta decisión deja una superficie futura innecesaria si se añaden credenciales de SQL, APIs de mercado, Power BI o proveedores de custodia. Las claves secretas de Supabase omiten RLS y su documentación indica expresamente que nunca deben llegar al navegador; deben residir en secretos de Edge Functions o en un almacén de secretos equivalente. [5]

| Capa | Decisión de seguridad | Implementación propuesta | Prueba de aceptación |
|---|---|---|---|
| Esquema público | Sustituir la lectura de `connection_config` por una proyección pública mínima: tipo, etiqueta, estado, última sincronización y metadatos no sensibles. | Nueva vista o columnas `display_config` saneadas; denegar `SELECT` de configuración privada a miembros sin rol de administración de conectores. | La respuesta del cliente no contiene URI con contraseña, token, clave ni secreto. |
| Secretos privados | Guardar OAuth refresh tokens, contraseñas de SQL, claves de API y credenciales Power BI exclusivamente en secretos de Edge Function o vault cifrado. | Tabla privada/función de backend con RLS restrictivo; la función obtiene el secreto por referencia, no por valor enviado desde navegador. | Búsqueda en cliente, exportaciones y logs sin coincidencias de secretos; rotación probada. |
| Autorización de conectores | Introducir permisos específicos `connector_admin` y un flujo de consentimiento para crear, renovar o revocar conexiones. | RPC/Edge Function que comprueba usuario, organización, rol y fuente antes de tocar configuración privada. | Un miembro lector puede ver estado; no puede crear, leer ni modificar configuración privada. |
| Flujo OAuth y SQL | Intercambiar códigos OAuth y probar conexiones solo en backend, con allowlist de dominios, TLS obligatorio y timeout. | Callback controlado, estado anti-CSRF, URI permitidas y credenciales cifradas. | Peticiones con redirección no permitida, host no permitido o certificado inválido se rechazan sin registrar el secreto. |
| Observabilidad y rotación | Auditar el identificador de secreto, usuario, acción y resultado; nunca el valor. Permitir revocación inmediata y rotación por proveedor. | Eventos de auditoría estructurados y alertas de fallo de renovación. | Una revocación invalida la siguiente sincronización y deja evidencia sin información sensible. |

## 8. Matriz de regresión recomendada

| Flujo | Caso mínimo de regresión |
|---|---|
| Canvas local | CSV con fecha `DD/MM/AAAA`, fecha ISO y fecha ausente; filtros desde/hasta; cambio rápido de archivo; archivo fuera de límite. |
| Comparativa de plataformas | Compra, venta superior al inventario y venta posterior válida del mismo activo. |
| Criptomonedas | Venta parcial FIFO, permuta válida, permuta sin lotes suficientes, BTC→ETH→SOL→EUR, comisiones y fila sin valor EUR. |
| Sesión y organización | Usuario sin sesión, miembro solo lectura, editor, cambio de organización y cierre de sesión durante una carga. |
| Exportación fiscal | Borrador completo, borrador con advertencias y confirmación de que XML/presentación siguen bloqueados. |

## 9. Skill entregada

La skill **`auditoria-aplicaciones-react`** quedó validada con el comprobador oficial de skills. Contiene el flujo reutilizable, un checklist operativo y una plantilla de informe. Su diseño evita instalar herramientas no autorizadas y exige separar hechos verificados de recomendaciones.

## Referencias

[1] [AEAT — Ganancias y pérdidas patrimoniales derivadas de la transmisión o permuta de monedas virtuales](https://sede.agenciatributaria.gob.es/Sede/Ayuda/24Presentacion/100/7_6_6_2/ganancias_perdidas_monedas_virtuales.html)

[2] Fuente interna: análisis del vídeo adjunto `lluisjimenez.ugc__2026-08-25T113206.000Z.mp4`, realizado el 26 de agosto de 2026.

[3] [Supabase Docs — Postgres Changes](https://supabase.com/docs/guides/realtime/postgres-changes)

[4] [Supabase Docs — Realtime Reports](https://supabase.com/docs/guides/realtime/reports)

[5] [Supabase Docs — Environment Variables and Secrets](https://supabase.com/docs/guides/functions/secrets)
