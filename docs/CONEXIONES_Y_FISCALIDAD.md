# Conectores de datos y borrador fiscal anual

**Autor:** Manus AI  
**Fecha:** 22 de agosto de 2026  
**Estado:** diseño para la siguiente iteración de Portafolio Intel

> **Aviso fiscal.** No soy profesional tributario. El módulo propuesto debe generar un **borrador de revisión**, no una declaración oficial ni un envío a la Agencia Tributaria. Cualquier cifra que vaya a incorporarse a una autoliquidación debe contrastarse con los datos fiscales, la documentación de las entidades y un asesor fiscal antes de presentar la declaración.

## 1. Decisión de producto

La aplicación actual es un MVP de interfaz estático: lee archivos localmente y no conserva credenciales ni datos al recargar. Esta limitación es deliberada y debe mantenerse hasta incorporar autenticación, persistencia y controles de acceso del lado servidor. La siguiente versión debe separar el panel visual de un servicio de sincronización privado, de modo que el navegador nunca reciba secretos de Google ni cadenas de conexión SQL.

Las referencias visuales aportadas se traducen en una interfaz de inversión orientada a lectura rápida: cartera por clases de activo con gráfico de anillo, listado de posiciones con rentabilidad visible, detalle de instrumento con evolución y riesgo, cuadrícula de análisis por distribución y tabla filtrable de operaciones. La aplicación no copia la identidad visual de terceros; adopta esos **patrones funcionales** con la identidad propia de Portafolio Intel.

| Decisión | Implementación recomendada | Razón |
|---|---|---|
| Datos de Google Sheets | OAuth 2.0 en servidor, acceso de lectura y sincronización por hoja registrada | Evita contraseñas compartidas y permite revocar autorización. |
| Datos SQL | Adaptador de lectura en servidor, usuario de base de datos con permisos mínimos y consultas predefinidas | Evita exponer la red o credenciales al navegador. |
| Latencia | Notificación de cambio cuando esté disponible, más reconciliación programada | Ofrece actualización cercana al tiempo real sin depender de que una notificación sea perfecta. |
| Datos tributarios | Libro de transacciones inmutable, validaciones y borrador exportable para revisión | Aporta trazabilidad sin fingir una presentación oficial. |
| Estado actual | UI demostrativa con conectores pendientes de autorización | Prioriza seguridad y velocidad sin bloquear la exploración de producto. |

## 2. Alternativas para las sincronizaciones

La sincronización es determinista, necesita gestión desde la interfaz y puede crecer a múltiples fuentes. Por ello debe vivir en un servicio web persistente con trabajos de fondo, no en el navegador ni en una tarea manual de corta duración.

| Enfoque | Cómo funciona | Ventajas | Límites | Complejidad |
|---|---|---|---|---|
| **Actualización bajo demanda y periódica** | El usuario pulsa «Actualizar» y un trabajo periódico consulta cada fuente autorizada. | Menor superficie de ataque, operación simple y fácil de auditar. | No refleja una edición de la hoja de forma inmediata. | Baja. |
| **Notificaciones de cambio más reconciliación** | Google Drive avisa al endpoint privado cuando cambia un recurso observado; el servicio vuelve a leer la hoja. Un trabajo periódico corrige eventos perdidos. | Experiencia cercana al tiempo real y menor número de lecturas innecesarias. | Exige endpoint HTTPS, renovación de canales y deduplicación de eventos. | Media. |
| **Proceso de sondeo continuo** | Un proceso consulta cada fuente cada pocos minutos. | Compatible con orígenes que no notifican cambios. | Consume recursos, aumenta límites de API y no es tiempo real genuino. | Media/alta. |

Se recomienda empezar por **actualización bajo demanda más sincronización periódica** durante la puesta en producción, y evolucionar a **notificaciones de Google Drive más reconciliación** una vez que la autenticación, los registros de auditoría y el manejo de errores estén operativos. Google Drive documenta canales de notificación para recursos observados; esos eventos deben considerarse disparadores de una lectura posterior, no datos definitivos.[1]

## 3. Google Sheets: pasos de integración

Google recomienda el flujo OAuth 2.0 de aplicación de servidor cuando la aplicación puede custodiar información confidencial y necesita mantener estado. El flujo intercambia un código de autorización por tokens; el acceso sin presencia del usuario requiere el modo `offline`, y el estado protege la petición frente a CSRF.[2]

| Paso | Acción concreta | Criterio de aceptación |
|---|---|---|
| 1. Proyecto Google Cloud | Crear proyecto, habilitar Google Sheets API y Google Drive API, definir pantalla de consentimiento y cliente OAuth de tipo aplicación web. | No se añade ningún secreto al repositorio ni a variables de cliente. |
| 2. Redirect URI | Registrar exactamente `https://<dominio>/api/integrations/google/callback` y el entorno local de desarrollo. | Las URLs coinciden de forma exacta con la configuración de Google. |
| 3. Permiso mínimo | Solicitar inicialmente `spreadsheets.readonly` si se leerán hojas elegidas por URL. Si el flujo permite trabajar solo con archivos abiertos/creados mediante la aplicación, evaluar `drive.file`, que Google clasifica como ámbito recomendado y no sensible. | El usuario ve una explicación clara de por qué se pide cada permiso. |
| 4. Consentimiento | Generar `state` criptográficamente aleatorio, solicitar acceso `offline` y almacenar el token de refresco únicamente cifrado en servidor. | No aparecen tokens en URL, logs, tablas de negocio ni navegador. |
| 5. Registro de hoja | Guardar `spreadsheet_id`, pestaña/rango permitido, mapeo de columnas y propietario; validar que la URL sea HTTPS y pertenezca a Google Sheets. | Un origen queda ligado a una plataforma y organización. |
| 6. Lectura y normalización | Leer el rango permitido, validar esquema, normalizar a transacciones/posiciones y crear un lote inmutable. | Cada sincronización informa filas aceptadas, rechazadas y duplicadas. |
| 7. Actualización rápida | Crear una observación de cambios de Drive por recurso y renovar el canal antes de su expiración; al recibir un aviso, encolar una sincronización idempotente. | Los avisos duplicados no crean transacciones duplicadas. |
| 8. Reconciliación | Ejecutar sincronización programada diaria o con la frecuencia definida por el usuario. | La salud de la fuente muestra última ejecución correcta y desfase. |

La API de Sheets advierte que los permisos se aplican al archivo de hoja de cálculo, no a una pestaña individual; la aplicación debe limitar por su cuenta el rango de lectura configurado. Google recomienda elegir el alcance más estrecho y avisa que `spreadsheets.readonly` es sensible, mientras que `drive.file` está recomendado y se limita a archivos utilizados por la aplicación.[3]

### Endpoints privados propuestos

| Endpoint | Método | Finalidad | Controles |
|---|---|---|---|
| `/api/integrations/google/authorize` | `POST` | Inicia el consentimiento OAuth para un origen. | Sesión, CSRF, organización, rate limit. |
| `/api/integrations/google/callback` | `GET` | Valida `state`, intercambia código y guarda credencial cifrada. | Verificación de estado, redirect URI exacta, auditoría. |
| `/api/data-sources/:id/sync` | `POST` | Encola una sincronización manual autorizada. | Rol editor/administrador, límite por fuente, idempotencia. |
| `/api/webhooks/google-drive` | `POST` | Recibe el aviso de cambio y encola una lectura posterior. | Validación de canal, expiración, deduplicación y respuesta rápida. |
| `/api/data-sources/:id/disconnect` | `POST` | Revoca o invalida el origen y elimina la credencial cifrada. | Reautenticación del usuario y registro de auditoría. |

## 4. Conector SQL: pasos de integración

No debe existir un campo para pegar una cadena de conexión en la interfaz. La opción segura es un **agente de lectura** o gateway controlado por el propietario de los datos. El servidor de Portafolio Intel intercambia un identificador de conexión con ese agente; el agente ejecuta exclusivamente una consulta validada sobre una vista publicada para la integración.

| Paso | Acción concreta | Control obligatorio |
|---|---|---|
| 1. Alcance técnico | Elegir motor y versión: PostgreSQL, MySQL/MariaDB o SQL Server; definir una vista de solo lectura por fuente. | Sin acceso a tablas de negocio fuera de la vista acordada. |
| 2. Red | Usar TLS con validación de certificado y permitir únicamente la salida/entrada necesaria mediante lista de IP o túnel privado. | No exponer el puerto SQL a Internet de forma abierta. |
| 3. Identidad | Crear un usuario por organización con privilegio `SELECT` sobre la vista, sin DDL, DML ni permisos administrativos. | Rotación de credencial y revocación documentadas. |
| 4. Secreto | Cifrar la credencial con una clave gestionada por el servidor o, preferiblemente, dejarla en el agente/gateway del cliente. | El navegador y los logs nunca ven el secreto. |
| 5. Contrato de datos | Acordar columnas `external_id`, `occurred_at`, `kind`, `instrument`, `quantity`, `gross_amount`, `fees`, `currency` y fecha de modificación. | Esquema versionado y test de compatibilidad. |
| 6. Consulta incremental | Limitar la consulta a parámetros de corte (`updated_at`, `external_id`) y tamaño máximo de lote. | Sentencias parametrizadas, tiempo máximo y máximo de filas. |
| 7. Aplicación | Encolar el lote, validar con Zod, deduplicar por fuente/identificador externo y guardar auditoría. | Operación idempotente y reversible por lote. |

La ruta inicial de menor riesgo es que la fuente SQL exporte una vista o archivo a una ubicación controlada y el usuario solicite actualización. La ruta con mayor automatización se activa únicamente después de desplegar el gateway de lectura, validar TLS, lista de red, privilegios y trazabilidad.

## 5. Modelo de datos adicional

| Entidad | Campos mínimos | Uso |
|---|---|---|
| `connector_credentials` | `data_source_id`, `provider`, `ciphertext`, `key_version`, `rotated_at` | Credenciales cifradas, aisladas de las tablas de negocio. |
| `sync_runs` | `id`, `data_source_id`, `trigger`, `started_at`, `finished_at`, `cursor`, `status`, `safe_error` | Estado de cada intento de sincronización. |
| `sync_checkpoints` | `data_source_id`, `cursor_type`, `cursor_value`, `updated_at` | Lectura incremental e idempotente. |
| `instruments` | `id`, `isin`, `ticker`, `name`, `asset_class`, `currency` | Normalización de posiciones y operaciones. |
| `tax_lots` | `instrument_id`, `acquired_at`, `quantity_open`, `cost_basis`, `source_transaction_id` | Soporte para cálculo revisable de transmisiones. |
| `tax_reports` | `organization_id`, `tax_year`, `status`, `generated_at`, `source_snapshot`, `reviewed_at` | Borrador anual inmutable y su estado de revisión. |
| `tax_report_lines` | `report_id`, `category`, `transaction_id`, `amount`, `currency`, `warning_code` | Detalle rastreable del borrador. |

## 6. Alcance del borrador fiscal anual

La AEAT ofrece el servicio «Cartera de Valores» como ayuda complementaria de Renta WEB y exige consistencia de operaciones antes de trasladar resultados. El servicio informa que sus datos proceden de modelos informativos y permite al contribuyente corregir información; por tanto, Portafolio Intel debe tratar cualquier informe propio como un apoyo de conciliación, no como sustituto de Renta WEB.[4]

| Bloque del borrador | Contenido | Estado del MVP ampliado |
|---|---|---|
| Identificación | Ejercicio, organización, periodo de cierre, fuentes incluidas y fecha de generación. | Disponible en interfaz de demostración. |
| Cobertura y calidad | Fuentes conectadas, última sincronización, filas rechazadas, duplicados y datos pendientes. | Disponible en interfaz de demostración. |
| Transmisiones | Compras, ventas, fechas, ISIN/ticker, importes brutos, gastos, resultado calculado y avisos. | Preparado para datos normalizados; cálculo real requiere histórico completo. |
| Rendimientos | Dividendos, intereses, retenciones españolas/extranjeras y comisiones asociadas. | Preparado para datos normalizados. |
| Revisión | Alertas de operaciones incompletas, moneda sin tipo de cambio, identificador ausente, valores homogéneos y fuentes sin conciliar. | Disponible como estado de revisión. |
| Exportación | PDF/CSV marcado «Borrador para revisión — no presentar directamente». | Acción de demostración; exportación oficial se habilita tras persistencia y revisión. |

Para transmisiones de acciones negociadas, la documentación de la AEAT requiere identificar la entidad emisora y datos de adquisiciones/transmisiones; además, advierte reglas específicas cuando existen valores homogéneos readquiridos o circunstancias de exención.[5] El módulo no debe aplicar automáticamente reglas complejas sin el conjunto completo de operaciones y una configuración fiscal aprobada para el ejercicio.

## 7. Salvaguardas fiscales y de seguridad

| Riesgo | Salvaguarda de producto |
|---|---|
| Confundir el documento con una declaración | Título y marca visible «Borrador fiscal — revisión obligatoria»; no incluir botón de presentación ante AEAT. |
| Datos incompletos | Bloquear la etiqueta «listo para revisión» si hay fuentes sin sincronizar, operaciones erróneas o conversiones pendientes. |
| Cálculo no explicable | Cada total enlaza a sus transacciones, tipo de cambio, comisiones y regla de cálculo aplicada. |
| Errores en valores homogéneos o lotes | Señalizar alerta y requerir confirmación/revisión humana; no ocultar el supuesto. |
| Modificación posterior | Conservar una instantánea de las fuentes y los lotes incluidos al generar el borrador. |
| Exposición de datos tributarios | RLS, cifrado, almacenamiento privado, logs sin importes detallados y exportaciones con URL firmada de corta duración. |
| Uso de credenciales | OAuth o secretos cifrados exclusivamente del lado servidor; cero secretos en cliente o repositorio. |

## 8. Próximos pasos de ejecución

1. Migrar el proyecto de demostración a una aplicación con autenticación, base de datos y almacenamiento privado; crear roles de administrador, editor y lector.
2. Implementar las tablas `data_sources`, `sync_runs`, `transactions`, `tax_lots` y `tax_reports` con políticas de acceso por organización.
3. Configurar Google Cloud, consentimiento OAuth y el flujo de autorización con acceso de lectura; realizar pruebas con una hoja de prueba, no con cartera real.
4. Añadir primero sincronización manual y lote auditable; después activar periodicidad y, cuando se establezca el endpoint seguro, observación de cambios de Drive.
5. Definir el motor SQL, red, usuario de lectura y vista de datos con el propietario de cada base; desplegar el agente de lectura antes de guardar cualquier conexión.
6. Normalizar transacciones e introducir controles de deduplicación, conciliación y moneda antes de habilitar resultados tributarios.
7. Publicar el generador de borrador fiscal con reglas versionadas por ejercicio, alertas de cobertura y revisión humana obligatoria.

Para activar los conectores reales faltarán dos decisiones del propietario: **qué proyecto de Google Cloud administrará el consentimiento OAuth** y **qué motor/red SQL se conectará primero**. La interfaz puede estar lista antes de disponer de esas credenciales, pero la sincronización no se activará hasta que esos datos estén configurados de manera segura.

## Referencias

[1] [Google Drive API — Notifications for resource changes](https://developers.google.com/workspace/drive/api/guides/push)  
[2] [Google Identity — Using OAuth 2.0 for Web Server Applications](https://developers.google.com/identity/protocols/oauth2/web-server)  
[3] [Google Sheets API — Choose Google Sheets API scopes](https://developers.google.com/workspace/sheets/api/scopes)  
[4] [Agencia Tributaria — Cartera de Valores: funcionamiento del servicio de ayuda](https://sede.agenciatributaria.gob.es/Sede/ayuda/consultas-informaticas/renta-ayuda-tecnica/cartera-valores.html)  
[5] [Agencia Tributaria — Ganancias y pérdidas patrimoniales de acciones admitidas a negociación](https://sede.agenciatributaria.gob.es/Sede/Ayuda/21Presentacion/100/8_2_7_2_Acciones.html)
