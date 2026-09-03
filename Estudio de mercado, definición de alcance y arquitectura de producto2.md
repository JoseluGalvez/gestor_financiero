# Estudio de mercado, definición de alcance y arquitectura de producto

## 2p3 Seguridad PWA

**Autor:** Manus AI  
**Fecha:** 21 de agosto de 2026  
**Estado:** Documento de decisión previo al desarrollo

> **Propósito.** Este documento consolida el contexto de `INFO_PROYECTO.md`, una investigación exploratoria de competidores y tendencias, una auditoría del repositorio `JoseluGalvez/2p3-Seguridad` y una propuesta de alcance y arquitectura para la PWA. Su objetivo es fijar decisiones de producto antes de escribir nuevo código.

## 1. Resumen ejecutivo

`2p3 Seguridad` debe posicionarse como una **PWA operativa offline-first para técnicos de seguridad e instalaciones**, no como una suite generalista de gestión de vigilantes. Su ventaja diferencial es la combinación de **registro de campo resistente a la pérdida de conectividad, evidencia V/X, resolución de grabaciones y averías, revisiones instalativas y trazabilidad auditable**. El producto ya dispone de una base técnica considerable: React, PocketBase, Dexie/IndexedDB, RBAC, cola de sincronización, compresión de imágenes, eliminación de EXIF, auditoría, mapas, CI y pruebas de integración.

La investigación muestra que las soluciones maduras del sector compiten alrededor de cinco capacidades: formularios guiados y configurables, evidencias multimedia verificables, seguimiento de operaciones y SLA, informes destinados al cliente e historial de activos o ubicaciones. Trackforce/TrackTik destaca las rutas, el seguimiento de progreso, las rondas obligatorias y los informes de cumplimiento; su módulo de incidentes añade evidencia de tiempo, GPS, fotografía, vídeo, audio y texto.[1] Silvertrac/TrackTik enfatiza el registro guiado en campo, los informes programados, las notificaciones, las copias de seguridad y los registros preparados para litigios.[2] Microsoft Field Service confirma que las inspecciones digitales deben soportar offline, sincronización posterior, asociación a activos, validación, adjuntos y versionado de plantillas.[3]

La recomendación es **no ampliar todavía hacia planificación avanzada de turnos, dispatch en tiempo real, facturación, IA predictiva o una plataforma integral de guardias**. Primero debe cerrarse la confiabilidad operacional del núcleo existente y convertirlo en un producto coherente: sincronización observable, estados y conflictos explícitos, plantillas/versionado de revisiones, catálogo de activos, informes cliente-ready, política de retención y accesibilidad táctil. El alcance inicial recomendado es un **MVP operativo endurecido** con tres superficies: técnico móvil, administrador/operaciones y cliente interno mediante informes exportables.

| Decisión | Recomendación |
|---|---|
| Posicionamiento | Operaciones de campo y trazabilidad para empresas de seguridad e instalaciones |
| Prioridad inmediata | Confiabilidad offline, resolución V/X, auditoría, informes y validación de producción |
| Modelo de usuario | `admin`, `tecnico`; añadir perfiles solo cuando exista una necesidad operativa demostrada |
| Arquitectura | Mantener DDD modular, PocketBase como backend ligero y Dexie como caché/cola local |
| Diferenciación | Evidencia verificable y trazabilidad integral en ubicaciones con cobertura deficiente |
| Fuera del MVP | Nómina, facturación, dispatch complejo, optimización avanzada de rutas, IA y multiempresa |

## 2. Contexto del producto y problema a resolver

El contexto de `INFO_PROYECTO.md` define una PWA mobile-first y offline-first para seguridad privada. Sus objetos principales son clientes, grabaciones, averías y revisiones instalativas. El flujo V permite resolver con evidencia; el flujo X permite resolver sin evidencia, pero exige una justificación. El sistema necesita roles de administrador y técnico, reglas server-side en PocketBase, una auditoría completa y sincronización cuando se recupera la conexión.

El problema de negocio no es simplemente “digitalizar formularios”. Es evitar que una actuación de campo quede incompleta, sea imposible de justificar o requiera reconstrucción manual posterior. El producto debe garantizar que cada registro pueda responder, con el mínimo dato necesario, a las preguntas **quién actuó, sobre qué cliente o instalación, qué encontró, cuándo lo registró, qué evidencia aportó, qué resolución adoptó y cuándo quedó sincronizado**.

El usuario técnico trabaja en condiciones que penalizan la complejidad: pantalla pequeña, movilidad, cobertura irregular, necesidad de capturar fotografías y necesidad de completar una acción rápidamente. El administrador necesita otra experiencia: supervisar pendientes, revisar excepciones, consultar auditoría, detectar fallos de sincronización y producir informes con valor contractual.

## 3. Investigación de competidores y tendencias

### 3.1 Método y límites

Se analizaron de forma independiente cuatro líneas de evidencia: plataformas de operaciones de seguridad, plataformas de field service e inspecciones, estándares técnicos de PWA offline y referencias normativas de accesibilidad y protección de datos. La investigación es estratégica, no un estudio cuantitativo de cuota de mercado. Las páginas comerciales describen capacidades declaradas por cada proveedor y deben interpretarse como señales de mercado, no como validación independiente de rendimiento.

### 3.2 Patrones competitivos observados

| Patrón de mercado | Evidencia | Implicación para 2p3 |
|---|---|---|
| Registro guiado y estructurado | TrackTik presenta informes paso a paso para que no se omitan detalles.[2] | El asistente V/X debe guiar, validar y explicar campos obligatorios; no conviene depender de formularios libres. |
| Evidencia multimedia verificable | TrackTik combina texto con fotografía, vídeo, audio, GPS y marcas temporales.[2] | Mantener la fotografía como núcleo y diseñar el modelo para ampliar a otros medios sin romper auditoría. |
| Cumplimiento de SLA y operaciones visibles | TrackTik ofrece rutas configurables, rondas obligatorias, progreso en vivo e informes por cliente.[1] | Añadir primero indicadores de antigüedad, pendientes, tiempo de resolución y sincronización; dejar el seguimiento en vivo para una fase posterior. |
| Informes preparados para clientes | TrackTik convierte datos operativos en informes detallados y personalizados.[1] | Evolucionar `InformesPage` desde CSV básico hacia informes filtrables, exportables y con evidencia. |
| Inspecciones como plantillas versionadas | Microsoft describe plantillas publicadas, ejecución vinculada a una orden, resultados almacenados, validación, imágenes y versionado.[3] | Introducir `inspection_templates` y `inspection_runs` antes de multiplicar campos específicos por tipo de instalación. |
| Operación offline con sincronización | Microsoft indica que el técnico puede completar inspecciones sin internet y sincronizarlas al recuperar conectividad.[3] Web.dev recomienda IndexedDB para datos estructurados y Cache Storage para recursos de red.[4] | La arquitectura local actual es correcta, pero necesita estados visibles, reintentos, conflictos y persistencia gestionada. |
| Accesibilidad táctil | WCAG 2.2 fija 24x24 CSS px como mínimo AA para objetivos táctiles y recomienda considerar 44x44 para controles importantes.[5] | Adoptar 44x44 como regla de diseño para V/X, guardar, cámara, navegación y acciones destructivas. |
| Privacidad por diseño | El EDPB destaca minimización, integridad, confidencialidad y protección de datos por diseño y por defecto.[6] | Mantener EXIF strip, reducir datos locales, definir retención y documentar qué evidencia se almacena y por cuánto tiempo. |

### 3.3 Tendencias relevantes

La tendencia más importante no es añadir inteligencia artificial, sino **hacer confiable el dato capturado en el borde**. Las plataformas líderes empaquetan captura guiada, evidencia, cumplimiento, historial e informes. Para 2p3, esto se traduce en una experiencia donde el técnico siempre sabe si un registro está guardado localmente, pendiente de sincronizar, sincronizado o bloqueado por un conflicto.

La segunda tendencia es la **configurabilidad operativa**. Los competidores permiten adaptar formularios, rutas, periodicidades y reportes a contratos diferentes.[1] [2] Microsoft confirma que una inspección versionada es más escalable que crear entidades y formularios independientes para cada variante.[3] Por ello, el producto debe separar el núcleo estable —cliente, instalación, actuación, evidencia, resolución y auditoría— de la configuración variable —plantilla, preguntas, opciones, obligatoriedad y reglas—.

La tercera tendencia es la **prueba de servicio frente al cliente**. No basta con que la empresa tenga un registro interno; debe poder demostrar que una actuación se realizó y explicar sus resultados. Este patrón justifica una futura capa de informe cliente-ready, pero no justifica aún construir un portal externo completo.

La cuarta tendencia es el **diseño privacy-by-default**. El proyecto ya elimina EXIF/GPS de fotografías y evita persistir el JWT en `localStorage`. La siguiente decisión debe ser una política explícita de minimización: conservar localmente solo lo que permite trabajar offline, cifrar o evitar datos especialmente sensibles y eliminar datos locales al cerrar sesión o tras una política de caducidad.

## 4. Auditoría del repositorio de referencia

La auditoría se realizó sobre el repositorio [JoseluGalvez/2p3-Seguridad](https://github.com/JoseluGalvez/2p3-Seguridad), en la rama `main`, con `HEAD` en el commit `02a2a64` (`docs: actualizar handoff 2026-08-21`). El repositorio confirma que el proyecto ya ha pasado la fase de ideación: contiene dominios, páginas, backend PocketBase, infraestructura Docker/Nginx, Service Worker, pruebas unitarias e integración y workflows de GitHub Actions.[8]

### 4.1 Capacidades ya implementadas o claramente presentes

| Área | Evidencia observada en el repositorio | Evaluación |
|---|---|---|
| Dominio | `src/domains/auth`, `clientes`, `grabaciones`, `averias`, `revisiones`, `informes` y `shared` | Base DDD adecuada y extensible. |
| Datos locales | `src/db/dexie.ts`, seis tablas y `syncQueue` | Alineado con el enfoque offline-first. |
| Sincronización | `src/lib/connection.ts` con cola, reintentos y `FormData` para archivos | Buen fundamento; falta convertir estados y errores en una experiencia operativa visible. |
| Evidencia | `src/lib/media.ts`, compresión y eliminación de EXIF; campos de fotos iniciales/resueltas | Diferenciador fuerte frente a un CRUD genérico. |
| Resolución | `useCrudList.resolve`, fecha de resolución y técnico que resuelve | Núcleo V/X funcional; requiere métricas y UX de excepción. |
| Auditoría | `audit_logs`, `datos_anteriores`, `datos_nuevos`, hook M1 y tests | Base sólida; la validación en instancia real sigue siendo prioritaria. |
| Seguridad | Políticas centralizadas, reglas PocketBase por rol, JWT en memoria, CSP/Nginx, MIME whitelist | Postura prudente, con trade-offs documentados. |
| Geolocalización | Leaflet, Nominatim con rate limit, caché y deduplicación | Útil para clientes e instalaciones; conviene desacoplarla de la operación crítica offline. |
| Calidad | 134 tests unitarios declarados, 17 de integración declarados, build y schema validation | Buena disciplina; el histórico de CI rojo impide considerar cerrada la entrega operacional. |
| Push | `public/sw.js` tiene handler push y existe `usePushNotifications.ts` | Parcial: falta sender server-side y almacenamiento de suscripciones coherente con la política de sesión. |

### 4.2 Discrepancias y riesgos a corregir antes de ampliar alcance

La documentación de `INFO_PROYECTO.md` declara 134/134 tests unitarios y 16/17 de integración, mientras que el README contiene cifras históricas inferiores. La fuente de verdad para el estado debe ser un único documento operativo generado o actualizado junto con cada release. Esta discrepancia no es un fallo funcional, pero sí un riesgo de gobernanza y de comunicación del estado real.

El repositorio muestra **19 ejecuciones rojas de GitHub Actions** hasta el commit auditado. Aunque el contexto atribuye parte del problema a la separación de puertos 8090/8091 y a la investigación del hook M1, un producto de campo no debe declarar disponibilidad operacional hasta distinguir de forma reproducible los fallos de unit, integración, infraestructura y entorno. La recomendación es convertir el CI en una puerta de release con diagnóstico por job y artefactos de logs.

La sincronización local conserva metadatos y transporta archivos mediante multipart en la cola. Esta elección reduce el footprint, pero significa que el diseño debe manejar explícitamente un registro con metadatos sincronizados y evidencia todavía pendiente. El usuario debe poder ver esa diferencia; de lo contrario, la interfaz puede comunicar falsamente que una resolución está completa.

El JWT en memoria reduce la persistencia de credenciales, pero provoca logout al recargar. Debe mantenerse como decisión del MVP si el entorno de uso acepta la reautenticación. Antes de introducir cookies `httpOnly`, conviene medir el impacto real de la pérdida de sesión y verificar si el backend intermedio necesario aporta más seguridad que complejidad.

IndexedDB no está cifrada de forma nativa en la solución actual. `db.clear()` en logout mitiga exposición posterior, pero no protege un dispositivo desbloqueado o un perfil de navegador comprometido. Debe documentarse como límite de seguridad, añadirse una política de expiración/limpieza y evaluar cifrado de campos sensibles solo si una evaluación de riesgo lo exige.

### 4.3 Comparación estratégica

| Capacidad frente a competidores | Estado en 2p3 | Brecha | Decisión |
|---|---|---|---|
| Incidencias guiadas | V/X y `ResolveWizard` | Faltan plantillas configurables y reglas de validación por tipo | P0/P1: formalizar el flujo y después parametrizarlo. |
| Evidencia con fecha y ubicación | Fotos y EXIF strip; auditoría | Falta un modelo visible de integridad/procedencia y otros medios | P1: evidencia como entidad y metadatos mínimos. |
| Offline | Dexie, cola y pruebas | Falta UX completa de estado, reintento y conflicto | P0: estado de sincronización observable. |
| Inspecciones | Revisiones instalativas | Falta plantilla versionada e historial por activo | P1: plantillas y ejecuciones. |
| SLA/operaciones en vivo | Dashboard e informes básicos | No hay dispatch, rutas optimizadas ni progreso en vivo | P2; no incluir en MVP. |
| Informes cliente-ready | Exportación e informes internos | Falta informe configurable con anexos y trazabilidad | P1. |
| Auditoría | `audit_logs` y datos previos/nuevos | Validación real M1 y retención aún pendientes | P0: cerrar producción y política de retención. |
| Push | Service Worker y VAPID parcial | Falta sender server-side y suscripciones robustas | P2 con trigger explícito. |
| Accesibilidad | shadcn/Radix como base | Falta auditoría sistemática móvil | P1: WCAG 2.2 AA y objetivos críticos de 44 px. |

## 5. Definición de alcance del producto

### 5.1 Visión

La PWA será el sistema operativo ligero de las actuaciones de campo de una empresa de seguridad: permitirá registrar, revisar, resolver y demostrar intervenciones incluso sin conectividad. El éxito no se medirá por el número de pantallas, sino por la proporción de actuaciones completas, sincronizadas y auditables sin intervención administrativa manual.

### 5.2 Personas y permisos

El **técnico** consulta clientes e instalaciones autorizadas, crea grabaciones y averías, ejecuta revisiones, adjunta evidencias, resuelve mediante V/X y consulta el estado de sus sincronizaciones. El **administrador** gestiona clientes, configura plantillas, revisa auditoría, supervisa excepciones, genera informes y administra usuarios. Un futuro **supervisor/dispatcher** solo deberá añadirse cuando se confirme la necesidad de asignar trabajos y vigilar operaciones en vivo; no debe introducirse ahora por anticipación.

### 5.3 Entidades de negocio propuestas

| Entidad | Propósito | Relaciones principales |
|---|---|---|
| Cliente | Organización o ubicación contratante | Tiene instalaciones y actuaciones |
| Instalación/activo | Sistema o emplazamiento técnico revisable | Pertenece a cliente; tiene historial |
| Actuación | Unidad común de trabajo de campo | Puede ser grabación, avería o revisión |
| Grabación | Registro de suceso observado | Cliente, técnico creador, evidencias, resolución |
| Avería | Incidencia técnica con importancia y diagnóstico | Cliente/activo, evidencias, resolución |
| Plantilla de revisión | Definición versionada de preguntas y reglas | Tipo de instalación o actuación |
| Ejecución de revisión | Respuestas concretas de una plantilla publicada | Instalación, técnico, evidencias, resultado |
| Evidencia | Foto, documento o futuro audio/vídeo con metadatos | Actuación o ejecución; estado de sync |
| Resolución | Resultado V/X, justificación, fecha y técnico | Actuación |
| Audit log | Registro inmutable de cambio y contexto | Usuario, colección, registro, valores previo/nuevo |
| Sync item | Operación local pendiente o fallida | Entidad, acción, error, reintentos |

La entidad `Actuación` es una recomendación de modelo conceptual, no una instrucción inmediata de refactor. En el corto plazo puede mantenerse la separación de colecciones existentes, pero las reglas compartidas de estado, evidencia, resolución, sincronización y auditoría deben diseñarse como capacidades transversales para evitar duplicación.

### 5.4 Alcance incluido en el MVP operativo endurecido

El MVP debe permitir autenticación segura, navegación por rol, alta y consulta de clientes, registro de grabaciones y averías, ejecución de revisiones, flujo V/X, captura y compresión de evidencias, trabajo offline, sincronización idempotente, gestión de errores, auditoría, búsqueda operativa e informes internos exportables. Debe incluir un panel de sincronización con conteo de pendientes, último intento, error legible y acción de reintento.

El MVP debe tener también una política clara de ciclo de vida: qué datos se precargan offline, cuánto tiempo permanecen localmente, cuándo se eliminan, qué sucede al cerrar sesión, cómo se preserva la auditoría y qué ocurre si dos usuarios modifican el mismo registro. La documentación de límites de IndexedDB y la solicitud de almacenamiento persistente son decisiones de arquitectura, no detalles cosméticos.[4]

### 5.5 Fuera de alcance inicial

Quedan fuera del MVP la nómina, control horario, facturación, CRM comercial, portal de cliente autenticado, despacho multi-equipo en tiempo real, optimización avanzada de rutas, rondas de vigilantes con checkpoints, IA generativa o predictiva, integraciones profundas con centrales receptoras y multi-tenancy empresarial. Estas áreas pueden ser válidas en otro producto, pero diluirían la propuesta actual y aumentarían la superficie de seguridad.

## 6. Lista priorizada de funcionalidades

La prioridad combina valor para el usuario, reducción de riesgo y dependencia arquitectónica. P0 significa imprescindible antes de considerar el producto operativo; P1 aporta una ventaja competitiva clara y debe seguir al endurecimiento; P2 requiere evidencia de demanda o infraestructura adicional.

| Prioridad | Funcionalidad | Resultado esperado | Dependencias | Criterio de aceptación de producto |
|---|---|---|---|---|
| P0 | Centro de sincronización offline | El técnico entiende qué está guardado, pendiente, reintentando, sincronizado o en conflicto | Dexie, syncQueue, API | Una prueba offline/reconexión deja cero operaciones silenciosamente perdidas y cada error es accionable. |
| P0 | Cierre de CI y validación PocketBase real | El equipo sabe si el release es desplegable | GitHub Actions, PB, hook M1 | Unit e integración separan fallos; el flujo M1 y MIME pasa en una instancia reproducible. |
| P0 | Flujo V/X con validación de negocio | Cada resolución tiene evidencia o justificación válida | ResolveWizard, media, audit | No se puede completar V sin evidencia ni X sin motivo; fecha y técnico se registran automáticamente. |
| P0 | Auditoría y retención | Cada cambio crítico es reconstruible sin registrar datos innecesarios | audit_logs, políticas PB | Admin puede consultar actor, acción, registro, previo/nuevo y fecha; existe política de retención documentada. |
| P0 | Seguridad de sesión y limpieza local | Reducir exposición en dispositivos compartidos | AuthProvider, Dexie | Logout invalida sesión, limpia datos definidos y no deja JWT persistido. |
| P1 | Plantillas de revisiones versionadas | Adaptar inspecciones sin crear campos por cada variante | Nuevo modelo de plantilla/ejecución | Una plantilla publicada no cambia retroactivamente ejecuciones históricas; la revisión guarda su versión. |
| P1 | Historial por instalación/activo | Ver evolución de un sistema o emplazamiento | Clientes, revisiones, averías | Desde una instalación se consultan actuaciones, incidencias, resoluciones y evidencias. |
| P1 | Informe cliente-ready | Probar prestación y calidad del servicio | Informes, auditoría, evidencias | Admin genera un informe filtrado por cliente/periodo con estado, fechas, resolución y anexos. |
| P1 | Búsqueda y filtros operativos | Encontrar pendientes y excepciones rápidamente | Índices locales/API | Técnico filtra por cliente, estado, fecha y tipo offline; admin identifica antigüedad y errores de sync. |
| P1 | Accesibilidad y usabilidad de campo | Reducir errores de toque y carga cognitiva | UI, testing | Controles críticos alcanzan 44x44 px; navegación y formularios son utilizables con teclado y lector. |
| P1 | Observabilidad funcional | Medir pérdida, latencia y fallos de sincronización | Eventos, dashboard admin | Se registran métricas de cola, edad máxima, tasa de error y resolución sin exponer PII innecesaria. |
| P2 | Notificaciones push server-side | Avisar de asignaciones, incidencias y fallos | Sender, suscripciones, backend | Solo se activa con backend seguro, consentimiento y pruebas de entrega. |
| P2 | Asignación y dispatch | Distribuir actuaciones a técnicos | Usuario supervisor, estados y tiempo real | Un supervisor asigna una actuación y ve aceptación/avance sin ambigüedad. |
| P2 | Rutas y checkpoints | Gestionar rondas o visitas secuenciadas | GIS, GPS, reglas SLA | Solo se prioriza tras validar que el negocio necesita patrullas, no solo instalaciones. |
| P2 | Cifrado local selectivo | Proteger datos sensibles en reposo | Web Crypto, gestión de claves | Se define amenaza, clave por sesión y recuperación antes de cifrar producción. |

## 7. Arquitectura de producto propuesta

### 7.1 Principios

La arquitectura debe conservar **DDD por dominios**, pero añadir una separación explícita entre dominio, aplicación, infraestructura y presentación. El dominio no debe conocer PocketBase, Dexie ni `FormData`. La aplicación debe expresar casos de uso —crear actuación, resolver V, resolver X, ejecutar revisión, sincronizar cola—. La infraestructura debe implementar repositorios remotos y locales. La presentación debe orquestar estados y accesibilidad.

Debe existir una única máquina de estados para una actuación y otra para un elemento de sincronización. Los estados no deben derivarse solo de si hay conexión. Una actuación puede estar `draft`, `local_pending`, `syncing`, `synced`, `conflict` o `failed`; su evidencia puede tener un estado diferente. Esta precisión evita confundir “la pantalla se guardó” con “el servidor recibió y auditó el registro”.

### 7.2 Capas y componentes

| Capa | Responsabilidad | Componentes existentes o recomendados |
|---|---|---|
| UI móvil | Captura rápida, validación, accesibilidad, feedback de sync | Pages, shadcn/Radix, ResolveWizard, FileUploader, SyncCenter |
| Aplicación | Casos de uso y coordinación transaccional | `createRecording`, `resolveFault`, `completeInspection`, `replaySyncQueue` |
| Dominio | Entidades, estados, reglas y políticas | Actuación, resolución, evidencia, plantilla, conflictos, RBAC |
| Repositorios | Contrato común remoto/local | `RemoteRepository`, `LocalRepository`, `SyncRepository` |
| Persistencia local | Caché, borradores y cola | Dexie, índices, versiones, limpieza, persistencia solicitada |
| API | Auth, CRUD, multipart, auditoría y reglas | PocketBase REST, hooks JSVM, MIME whitelist |
| Operación | Seguridad, despliegue y observabilidad | Nginx, Docker, Cloudflare Tunnel, CI, logs y métricas |

### 7.3 Flujo offline y sincronización

El flujo recomendado es: validar localmente; escribir de forma atómica el registro y su operación en `syncQueue`; mostrar confirmación local; intentar sincronizar si hay red; enviar metadatos y archivos con idempotency key; confirmar respuesta remota; actualizar el estado local; y conservar un error accionable si falla. Las operaciones deben ser idempotentes para que un reintento no duplique una grabación ni un audit log.

Los conflictos deben tener estrategia explícita por tipo de operación. Un cambio local nuevo normalmente puede reintentarse; una actualización sobre un registro eliminado debe marcarse como descartada o requerir revisión; dos actualizaciones concurrentes deben conservar el servidor como fuente de verdad cuando el riesgo sea alto y mostrar al usuario el resultado. El patrón `client-wins` no debe ser global por defecto.

### 7.4 Seguridad y privacidad

La seguridad debe mantenerse server-side para autorización y validación. El cliente puede ocultar acciones por UX, pero PocketBase debe rechazar operaciones no autorizadas. La auditoría debe ser inmutable para el usuario técnico, con reglas que impidan IDOR y con una revisión de los datos que se escriben en `datos_anteriores` y `datos_nuevos`.

La política de evidencia debe limitar resolución, tamaño, tipos MIME, número de archivos y metadatos. El EXIF strip es correcto como reducción de exposición. Deben documentarse retención, exportación, borrado y copia de seguridad. La protección de datos por diseño exige que la arquitectura defina estas reglas antes de añadir GPS, audio o vídeo.[6]

### 7.5 Arquitectura de información mobile-first

La navegación principal debe mostrar primero la acción y el estado: **Nueva actuación**, **Pendientes**, **Mis actuaciones**, **Clientes**, **Revisiones** y **Sincronización**. El dashboard administrativo debe privilegiar excepciones: actuaciones vencidas, X sin justificación válida, evidencias pendientes, errores de sincronización y registros sin resolver.

Los formularios deben ser progresivos: identificar cliente/instalación, describir suceso, adjuntar evidencia, resolver V/X y confirmar. La aplicación debe evitar formularios largos y mostrar el modo offline persistentemente. Los objetivos táctiles críticos deben ser de 44x44 px como decisión de usabilidad, superando el mínimo AA de 24x24 px de WCAG 2.2.[5]

## 8. Roadmap recomendado

| Fase | Objetivo | Entregables de decisión |
|---|---|---|
| Fase 0 — Cierre operativo | Convertir el estado técnico en estado confiable | CI diagnosticado, PB real validado, M1/MIME comprobados, checklist de producción cerrado |
| Fase 1 — Núcleo de campo | Garantizar que ningún registro se pierde o queda ambiguo | Centro de sync, estados, conflictos, V/X endurecido, limpieza local y métricas básicas |
| Fase 2 — Modelo operativo | Hacer que clientes e instalaciones tengan contexto histórico | Activos/instalaciones, historial, filtros, pendientes y navegación por contexto |
| Fase 3 — Configuración | Evitar formularios rígidos por cada cliente | Plantillas de revisión, versionado, reglas, publicación y ejecuciones históricas |
| Fase 4 — Evidencia e informes | Convertir datos en prueba de servicio | Informe cliente-ready, anexos, exportación, auditoría legible y retención |
| Fase 5 — Escalado selectivo | Ampliar solo si existe demanda confirmada | Push server-side, supervisor/dispatch, rutas, integraciones, cifrado selectivo |

Cada fase debe tener una Definition of Done funcional y operacional. No debe considerarse terminada una funcionalidad que “funciona online” si su comportamiento offline, su auditoría, su accesibilidad y su recuperación tras error no están definidos.

## 9. KPIs y criterios de validación del producto

Los indicadores deben medir confiabilidad y utilidad, no volumen de código. El primer objetivo es **cero operaciones críticas perdidas** en una batería reproducible de desconexión, cierre de pestaña, reconexión, reintento y conflicto. El segundo es reducir el tiempo que tarda un técnico en registrar y resolver una actuación. El tercero es que el administrador pueda producir un informe defendible sin reconstrucción manual.

| Dimensión | KPI recomendado | Señal de aceptación inicial |
|---|---|---|
| Integridad | Operaciones críticas perdidas | 0 en pruebas de red controladas |
| Sincronización | Edad máxima de cola pendiente | Visible y con alarma cuando supera el umbral definido |
| Resolución | Porcentaje de V con evidencia y X con justificación válida | 100% de registros cerrados cumplen la regla |
| Auditoría | Cambios críticos reconstruibles | 100% en tests de creación, actualización, resolución y borrado |
| Usabilidad | Tiempo de alta/resolución en móvil | Medido con técnicos reales antes de fijar objetivo definitivo |
| Informes | Tiempo para generar informe por cliente/periodo | Sin exportación manual de varias fuentes |
| Accesibilidad | Controles críticos conformes | 100% de controles críticos revisados en móvil y teclado |
| Operación | CI y despliegue | Jobs unit/integration trazables y release reproducible |

## 10. Decisiones que deben tomarse antes de programar la siguiente fase

La primera decisión pendiente es si “grabación”, “avería” y “revisión” seguirán siendo colecciones independientes a largo plazo o si se introducirá una abstracción conceptual de actuación con subtipos. La recomendación es **mantener las colecciones actuales durante el endurecimiento P0**, pero diseñar contratos comunes para resolución, evidencia, sincronización y auditoría.

La segunda decisión es qué significa exactamente “evidencia suficiente”. Debe fijarse el número mínimo de fotografías, los tipos MIME permitidos, el tamaño máximo, si una fotografía puede reutilizarse en varios registros y si la ubicación GPS es obligatoria, opcional o prohibida según el tipo de actuación.

La tercera decisión es la política de conflicto. Debe decidirse por operación y por riesgo, no como una regla genérica. La cuarta es el periodo de retención de audit logs, fotografías y datos locales. La quinta es el perfil de despliegue: dispositivo corporativo o BYOD, navegador mínimo, conectividad prevista y procedimiento de recuperación si un dispositivo se pierde.

## 11. Conclusión

El repositorio no necesita una reescritura ni una expansión indiscriminada. Necesita pasar de una **base técnica funcional** a un **producto operacionalmente confiable y demostrable**. La dirección correcta es profundizar en el núcleo que ya diferencia a 2p3: registrar actuaciones en campo sin conectividad, resolverlas con evidencia o justificación, sincronizarlas de manera explícita y conservar una auditoría que permita explicar cada cambio.

La arquitectura recomendada conserva React, PocketBase, Dexie, DDD, RBAC y Nginx/Docker. Las nuevas decisiones se concentran en contratos de casos de uso, estados de sincronización, plantillas versionadas, historial por instalación, informes cliente-ready, retención y accesibilidad. El producto debe evitar competir frontalmente con suites de seguridad empresarial en dispatch, rondas, nómina o facturación; debe ganar por **simplicidad, resiliencia offline, trazabilidad y adecuación al flujo real de instalaciones y averías**.

## Referencias

[1]: https://www.trackforce.com/products/tracktik/mobile-patrol/ "Trackforce/TrackTik — Mobile Patrol"

[2]: https://www.silvertracsoftware.com/security-incident-reporting-software "Trackforce/TrackTik — Security Incident Reporting"

[3]: https://learn.microsoft.com/en-us/dynamics365/field-service/inspections-overview "Microsoft Learn — Inspections overview, Dynamics 365 Field Service"

[4]: https://web.dev/learn/pwa/offline-data "web.dev — Offline data"

[5]: https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html "W3C WAI — WCAG 2.2, Target Size (Minimum)"

[6]: https://www.edpb.europa.eu/sme/be-compliant/secure-personal-data_en "European Data Protection Board — Secure personal data"

[7]: https://www.w3.org/TR/wcag2mobile-22/ "W3C — Guidance on Applying WCAG 2.2 to Mobile Applications"

[8]: https://github.com/JoseluGalvez/2p3-Seguridad "GitHub — JoseluGalvez/2p3-Seguridad"
