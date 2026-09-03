# Estado del proyecto — Gestor financiero / Portafolio Intel

**Actualizado:** 26 de agosto de 2026  
**Responsable del registro:** Manus AI  
**Objetivo de este archivo:** conservar las decisiones de implementación, sus motivos, las validaciones realizadas y el estado real de publicación. No sustituye el historial Git; la copia de trabajo actual no conserva `.git`.

> **Estado resumido:** la aplicación compila y supera las validaciones locales disponibles. El dashboard autenticado, el Canvas local, la comparación de plataformas, el módulo de Criptomonedas/FIFO y la documentación están implementados en el directorio de trabajo. La subida de estas ampliaciones a GitHub sigue bloqueada por autenticación inválida del conector y por la ausencia de metadatos Git en la copia restaurada.

## 1. Principios que gobiernan el proyecto

El producto separa explícitamente dos contextos. El espacio autenticado utiliza Supabase para organizaciones, carteras, alertas y datos persistentes bajo políticas RLS. El Canvas local y el módulo de Criptomonedas procesan los archivos elegidos por el usuario únicamente en memoria del navegador. La diferencia es deliberada: ninguna promesa de «solo en memoria» se extiende al modo autenticado.

También se mantiene una frontera de responsabilidad fiscal y financiera. El producto ofrece cálculos reproducibles, borradores revisables y advertencias, pero no realiza operaciones de inversión, no presenta declaraciones ante la AEAT y no habilita un XML fiscal oficial sin un diseño de registro validado, datos completos y revisión profesional.

| Decisión transversal | Motivo | Aplicación actual |
|---|---|---|
| Datos reales fuera de demos | Minimizar exposición de información financiera. | La hoja de Google Sheets creada para demostración contiene solo datos ficticios; los casos FIFO de HTML también son ficticios. |
| Persistencia con consentimiento | Evitar importaciones implícitas. | La configuración de fuentes se registra como pendiente y las vistas previas no escriben movimientos. |
| Cálculos deterministas | Hacer resultados auditables. | FIFO, comparación de plataformas, análisis local y conclusiones no dependen de IA ni de precios inventados. |
| Seguridad por organización | Aislar carteras y fuentes de cada grupo. | Esquema versionado con RLS y políticas de miembro/editor; el entorno remoto debe verificarse de nuevo antes de un despliegue. |
| Rendimiento seguro por defecto | No bloquear el navegador ni hacer cargas masivas innecesarias. | Workers, límites de archivos, límites de filas y planes de remediación Realtime documentados. |

## 2. Arquitectura y módulos implementados

| Módulo | Archivos principales | Estado | Decisión y motivo |
|---|---|---|---|
| Dashboard autenticado | `src/components/RealtimePortfolioApp.tsx`, `src/lib/supabase.ts` | Implementado | Consolida cartera, posiciones, alertas, fuentes, análisis e informes sobre datos persistentes. Las consultas están limitadas y la suscripción se filtra por organización. |
| Navegación lateral | `RealtimePortfolioApp.tsx`, `src/app/globals.css` | Implementado | Barra lateral persistente para cambiar entre resumen, cartera, plataformas, criptomonedas, alertas, informes, fuentes, análisis y Canvas. Se eligió porque reduce pasos de navegación en una herramienta interna. |
| Canvas local | `LocalCanvasWorkspace.tsx`, `local-analytics.ts`, `local-analysis.worker.ts` | Implementado y endurecido | Importa CSV/XLSX, mapea columnas, aplica filtros cruzados, KPIs, gráficos, mapa relativo, tabla, conclusiones y exportación. Se ejecuta localmente para preservar privacidad. |
| Comparación de plataformas | `platform-comparison.ts`, `RealtimePortfolioApp.tsx` | Implementado y corregido | Agrupa resultado realizado por fuente mediante lotes FIFO. No recomienda mover capital y marca ventas sin coste conocido. |
| Criptomonedas y FIFO | `CryptoTaxWorkspace.tsx`, `crypto-tax.ts` | Implementado y corregido | Lee CSV local, calcula compras, ventas y permutas FIFO, conserva advertencias y genera un CSV de borrador revisable. |
| Flujo Google Sheets | `RealtimePortfolioApp.tsx`, `sample-google-sheet.ts` | Implementado como configuración/previsualización | Pide URL/ID, pestaña, rango y mapeo; no abre ni importa datos reales antes de autorización y validación. |
| Informes | `RealtimePortfolioApp.tsx` | Parcial | Genera PDF de cartera con instantánea disponible. Tax Tracker y calendario de dividendos permanecen bloqueados hasta tener datos conciliados. |
| Análisis financiero | `financial-analysis.ts` y vista Análisis | Implementado con limitaciones | Incluye scoring, DCF, técnico y riesgo solo con entradas trazables; no publica recomendación de compra/venta. |
| Power BI | Canvas local | Preparación implementada | Exporta CSV filtrado y manifiesto local. No existe iframe, token ni publicación web; un Embedded futuro exige backend, token temporal y RLS/OLS. |

## 3. Registro cronológico de cambios y decisiones

### 3.1 Base de datos, acceso y datos persistentes

Se creó una base de datos Supabase con organizaciones, membresías, carteras, instrumentos, fuentes, sincronizaciones, transacciones, posiciones, cotizaciones, snapshots, reglas de alertas, alertas, informes, auditoría y análisis. El esquema versionado habilita RLS y diferencia lectura de miembros de escritura de owners/editors. La razón fue evitar que la interfaz o un filtro de cliente se conviertan en la barrera de seguridad.

Se construyó el dashboard con consultas a snapshots, posiciones, alertas, fuentes, transacciones, análisis y reglas. Se añadió una suscripción Realtime por `organization_id` para actualizar la interfaz. Esta arquitectura ofrece una experiencia reactiva, pero su carga integral ante cada evento necesita la optimización detallada en el informe de auditoría.

### 3.2 Configuración de fuentes y demostración ficticia

Se añadió un formulario para URL/ID de Google Sheets, pestaña, rango y seis columnas obligatorias: fecha, instrumento, tipo, cantidad, precio y divisa. Se decidió almacenar únicamente una configuración pendiente porque la conexión a una hoja real debe requerir consentimiento OAuth y una previsualización previa.

Se creó una hoja de ejemplo titulada `Portafolio Intel — Datos ficticios de importación`, con filas ficticias, para validar el mapeo y la experiencia. No hay constancia de importaciones reales de usuarios desde Google Sheets.

### 3.3 Canvas local inspirado en dashboards de vídeo

A partir del análisis de los vídeos aportados, se implementó un workspace local con carga de archivos, filtros, KPIs, gráficos de área/donut/barras, mapa de exposición relativo, tabla, lectura ejecutiva determinista y exportación. Se usó un Web Worker para no bloquear la interfaz durante el análisis cuando el navegador lo permite.

La decisión esencial fue no llamar a Supabase, IA ni almacenamiento persistente desde este modo. Se añadió un acceso sin cuenta y un aviso visible que explica que los datos se destruyen al recargar o cerrar. Este módulo no afirma ofrecer la privacidad de un producto cloud externo: la privacidad procede de que la implementación propia no transmite el dataset.

### 3.4 Integración preparatoria con Power BI

El Canvas puede descargar el subconjunto filtrado como CSV y un manifiesto JSON con mapeo y filtros. Se eligió esta interoperabilidad porque permite al usuario llevar datos a Power BI Desktop sin enviar tokens al navegador. Power BI Embedded queda explícitamente fuera del frontend actual: debería construirse con backend, token de corta duración, RLS/OLS, capacidad adecuada y sin `Publish to Web` para datos privados.

### 3.5 Comparación de plataformas

Se añadió la vista **Plataformas**, que calcula ingresos, coste dispuesto, resultado y rentabilidad realizados por fuente usando compras y ventas compatibles por divisa e instrumento. La interfaz descarta una conclusión automática cuando faltan lotes. Se eligió resultado realizado, en vez de una rentabilidad no realizada, para no mezclar precios de mercado externos no licenciados con datos de transacciones.

Durante la auditoría se detectó que una venta superior al inventario consumía parcialmente lotes antes de quedar marcada como incompleta. Se corrigió `platform-comparison.ts` para verificar la cantidad disponible antes de mutar inventario; la prueba de regresión confirma que una venta válida posterior conserva un coste correcto.

### 3.6 Módulo de Criptomonedas y cálculo FIFO

Se añadió una vista de Criptomonedas que acepta CSV local con fecha, tipo, activos y cantidades entregadas/recibidas, valores EUR, comisiones y plataforma. El motor reconstruye lotes FIFO por activo; las ventas calculan transmisión neta menos coste FIFO. Las permutas se tratan como una transmisión del activo entregado y, si la operación es válida, crean un lote del activo recibido con el valor de referencia documentado.

Se decidió bloquear y marcar para revisión cualquier fila sin inventario suficiente, activo recibido, cantidad recibida o valor EUR justificable. En vez de estimar datos faltantes, el motor conserva el inventario previo y no crea un lote ficticio. Se validó una cadena didáctica BTC→ETH→SOL→EUR y una permuta bloqueada.

La aplicación descarga un CSV de borrador revisable, no una declaración. El XML del Modelo 100 sigue deshabilitado hasta implementar y validar el formato oficial vigente, la identidad del declarante, el resto de rentas y las reglas del ejercicio. La documentación de la AEAT indica que las pérdidas patrimoniales de transmisiones se integran en la base del ahorro con otras ganancias/pérdidas de transmisiones y, si queda saldo negativo, se compensan en los términos legales con rendimientos positivos del capital mobiliario y arrastres de ejercicios posteriores. [1]

### 3.7 Simulaciones y presentación

Se creó `preview-criptomonedas.html` como vista HTML autocontenida de la barra lateral, carga local, caso FIFO de dos compras/una venta, cadena de permutas y preparación de borrador para Renta. Todo el contenido se identifica como didáctico y no usa datos reales.

También se generó una presentación sobre Criptomonedas, FIFO y borrador fiscal, con notas de orador. El URI presentado más recientemente es `manus-slides://xa9AwALd2I3zs0gDEsKevy`.

### 3.8 Auditoría de aplicación y endurecimiento

Se analizó un vídeo sobre auditoría React y se creó la skill `auditoria-aplicaciones-react`. La skill incluye alcance, checklist de seguridad/estado/rendimiento/accesibilidad, plantilla de informe y la norma de no instalar ni ejecutar herramientas de terceros sin autorización.

La auditoría confirmó y corrigió los siguientes puntos:

| ID | Cambio realizado | Por qué se tomó la decisión | Evidencia |
|---|---|---|---|
| AUD-001 | Consumo atómico de lotes en plataformas. | Impedir que una venta no trazable distorsione ventas posteriores. | `tests/verify-audit-regressions.mts`. |
| AUD-002 | Normalización de fechas europeas e ISO antes de filtrar. | Evitar que `DD/MM/AAAA` se agrupe bien y se filtre mal por comparación textual. | `tests/verify-audit-regressions.mts`. |
| AUD-003 | Permutas cripto atómicas. | No eliminar BTC ni crear ETH cuando falta inventario FIFO. | `tests/verify-crypto-tax.mts`. |
| AUD-004 | Límite de 15 MB/100.000 filas y `requestId` en Canvas/Worker. | Prevenir bloqueos locales y resultados obsoletos al cambiar rápido de archivo o filtros. | Lint y build correctos; validación de Canvas documentada. |
| AUD-005 | Límite de 15 MB/50.000 operaciones en CSV cripto. | Reducir riesgo de bloqueo del hilo principal antes de migrar su parsing a Worker. | Lint y build correctos. |
| AUD-006 | Informe de plan Realtime y secretos. | Dejar una ruta verificable antes de activar más conectores y cargas de producción. | `docs/INFORME_AUDITORIA_GESTOR_FINANCIERO_2026-08-26.md`. |

### 3.9 Estudio de agente IA financiero

Se evaluó una integración de asistente IA para responder consultas sobre datos propios autorizados e información financiera externa actualizada. El alcance se amplió para incluir análisis técnico y fundamental de una empresa indicada por el usuario, diferenciando dato reportado, cálculo determinista y supuesto declarado. Se decidió que cualquier agente debe ejecutarse en backend, con herramientas de solo lectura permitidas, salida JSON validada, citas, fecha de corte, cobertura, consentimiento de ámbito y auditoría. No se activaron modelos, conectores ni proveedores de mercado; `docs/ESTUDIO_AGENTE_IA_FINANCIERO.md` y `docs/AGENTE_IA_HERRAMIENTAS_Y_RLS.md` contienen el diseño y requieren una decisión explícita de alcance.

La razón es preservar la frontera existente entre datos locales, datos persistentes y fuentes externas. El agente no tendrá SQL libre, acceso a secretos, capacidad de escritura, ejecución de operaciones, presentación fiscal ni recomendaciones personalizadas. Para técnico necesita OHLCV normalizado/ajustado y serie suficiente; para fundamental requiere filing, período fiscal, unidad, moneda y fuente. El acceso privado se limita por JWT, RLS, organización, cartera seleccionada y consentimiento vigente. SEC/ECB se consideran candidatos para un piloto público citado; FMP, CoinGecko u otros proveedores comerciales requerirán licencia, cuota y credencial de servidor.

Se añadió `preview-asistente-ia.html`, una vista estática del piloto mixto con la entrada activa «Asistente» en la barra lateral, elección de ámbito, fuentes visibles, contrato de herramientas, salida estructurada y salvaguardas. Se comprobó visualmente en navegador. No contiene datos reales ni activa llamadas, modelos, conectores, análisis, escritura o acciones externas.

El diseño se amplió en `docs/ADAPTADOR_SERVIDOR_SEC_Y_MERCADO.md` con Redis para caché de datos externos, coalescencia de solicitudes, locks efímeros con token, límites por fuente y degradación a snapshots durables. Las propuestas no aplicadas `docs/MIGRACION_RLS_AGENTE_IA_PROPUESTA.sql` y `docs/MIGRACION_RLS_CARTERA_ACCESO_PROPUESTA.sql` definen consentimiento revocable, RPC agregados y, opcionalmente, aislamiento más estricto por cartera. El proyecto Supabase activo se revisó en modo lectura: carteras y transacciones tienen RLS habilitado y, a la fecha de consulta, las políticas `portfolios_member_read`, `portfolios_editor_write` y `transactions_member_read` mantienen el perímetro actual de organización. No se aplicó DDL ni se modificó producción.

La presentación `presentacion_arquitectura_agente` se actualizó con guion de orador completo y se presentó de nuevo. Esta ampliación continúa como diseño y documentación: falta crear una rama, probar los casos multiusuario ficticios, revisar licencias/proveedores y obtener aprobación explícita antes de desplegar funciones, secretos, Redis o migraciones.

Se implementó la tabla vinculada del Canvas local en `src/components/LocalCanvasWorkspace.tsx`. El estado único `records` se actualiza al editar una celda o aplicar una edición por selección, y el Web Worker vuelve a calcular KPIs, área temporal, donut, barras, mapa relativo, tabla y conclusiones desde esa misma copia en memoria. También se añadió una exportación explícita del dataset editado y el constructor `recordFromRaw` en `src/lib/local-analytics.ts` para recalcular campos analíticos sin cambiar la identidad de fila.

La edición se endureció con borradores (`cellDrafts`) y errores (`cellErrors`): una fecha, importe o texto inválido permanece visible para ser corregido, pero no reemplaza `records` ni dispara un nuevo análisis. Las fechas aceptan ISO o formato europeo solo cuando existen en calendario; los importes aceptan separadores españoles y deben ser finitos. Fecha e importe no aceptan vaciado transitorio, lo que evita que una sustitución rápida borre la serie o altere temporalmente el total. Existe además una defensa adicional en `updateRecord`.

Se incorporó el guardado y la carga explícitos de sesiones JSON locales versionadas. El archivo contiene encabezados, mapeo, filtros y filas; puede conservarse como varios archivos manuales, pero no crea historial residente ni usa `localStorage`, `sessionStorage` o IndexedDB. Antes de restaurar se comprueban formato, versión, encabezados, límite de filas, mapeos y valores tipados. Una carga inválida se rechaza sin sustituir el estado abierto. Se mantiene el modo local: sin Google Sheets, Supabase, IA ni persistencia automática. La compilación, lint, pruebas deterministas y pruebas visuales de edición/filtro/edición masiva, validación y JSON resultaron correctas; el detalle queda en `docs/EDICION_LOCAL_BIDIRECCIONAL.md`.

## 4. Validaciones ejecutadas

| Validación | Resultado conocido |
|---|---|
| `node --experimental-strip-types tests/verify-crypto-tax.mts` | Correcta: FIFO, permuta, inventario insuficiente y cadena de permutas. |
| `node --experimental-strip-types tests/verify-audit-regressions.mts` | Correcta: comparación de plataformas atómica y filtro de fecha europeo. |
| `node --experimental-strip-types tests/verify-local-cell-validation.mts` | Correcta: fechas ISO/europeas y de calendario, importes, vaciados transitorios y texto de celdas. |
| `npm run lint` | Correcto. |
| `npm run build` | Correcto con Next.js 16.3.1 y TypeScript. |
| `npm audit --omit=dev --audit-level=high` | 0 vulnerabilidades de producción. |
| Validación visual Canvas y HTML cripto | Correcta para acceso local, ejemplo ficticio, filtros, gráficos, tabla, cadena FIFO y exportación revisable. |
| Validación visual de edición tipada y JSON local | Correcta: edición válida sincronizada, borradores `abc`/`99/99/2026` bloqueados sin recálculo, descarga/restauración de seis filas y rechazo sin sustitución de JSON inválido. |
| Validación visual Asistente IA | Correcta: barra lateral, ámbito por defecto sin cartera, fuentes del piloto, herramientas R/O y salvaguardas visibles. |
| Validación de skill | `auditoria-aplicaciones-react` validada por el comprobador oficial. |

Las pruebas TypeScript ejecutadas directamente muestran una advertencia experimental de Node sobre type stripping y un aviso de módulo ESM. No se considera una incidencia de la compilación productiva; queda como mejora de configuración de pruebas.

## 5. Pendientes priorizados

| Prioridad | Pendiente | Motivo y condición de cierre |
|---|---|---|
| P1 | Optimizar Realtime por dominios, debounce, cancelación y paginación. | Evitar recargas completas por ráfagas y lecturas repetidas de hasta 5.000 transacciones. Cierre: pruebas de ráfaga, métricas de p95 y no pintar respuestas obsoletas. |
| P1 | Segregar configuración pública y secretos de conectores. | `connection_config` no debe albergar secretos accesibles al cliente. Cierre: Edge Functions/vault, rol `connector_admin`, rotación y logs sin valores secretos. |
| P1 | Recuperar GitHub y publicar. | La copia local no tiene `.git` y el conector devolvió `Connector token is invalid`. Cierre: reautorización y `git init`/remoto/commit/push sin `.env*`. |
| P2 | Parsing de Criptomonedas en Worker. | Los límites mitigan carga; el Worker preservará mejor la respuesta con archivos grandes permitidos. |
| P2 | Pruebas E2E y accesibilidad. | Faltan recorridos automatizados de teclado, contraste, móvil, errores y permisos. |
| P2 | Validar RLS en Supabase remoto. | El esquema versionado se revisó; falta confirmar políticas y Security Advisor en el proyecto vivo antes de desplegar. |
| P3 | Datos de mercado con licencia y backend sincronizador. | Sparklines/cotizaciones no deben usar proveedores sin permiso ni claves expuestas. |
| P3 | Exportación fiscal oficial. | Requiere formato vigente, datos completos y revisión profesional; no debe habilitarse por aproximación. |

## 6. Estado actual del proyecto

**Código local:** funcional y validado en `/home/ubuntu/gestor_financiero`.  
**Repositorio remoto publicado previamente:** `https://github.com/JoseluGalvez/gestor_financiero`, rama `main`, último commit confirmado antes de estas ampliaciones: `f43c2f5` (`feat: add Google Sheets import preview demo`).  
**Cambios recientes no publicados:** Canvas local con edición tipada, estados JSON explícitos y validaciones asociadas, integración preparatoria Power BI, navegación lateral, plataformas, Criptomonedas/FIFO, simulaciones HTML, presentación, skill de auditoría, correcciones de auditoría, estudio y contrato RLS del agente IA, documentación y este registro.  
**Acceso GitHub:** bloqueado en el entorno; el navegador mostró 404 sin sesión y el conector autenticado devolvió `Connector token is invalid`. No se ha afirmado ni realizado un push de los cambios recientes.  
**Datos reales:** no incluidos en las demos ni en las pruebas documentadas.  
**Producción:** no debe considerarse lista para integrar conectores con secretos, cotizaciones en vivo, agente IA con datos privados/externos, presentación fiscal oficial ni Embedded Power BI hasta cerrar los pendientes P1 y seleccionar el alcance del piloto de IA.

## Referencias

[1] [AEAT — Integración y compensación de rentas en la base imponible del ahorro](https://sede.agenciatributaria.gob.es/Sede/ayuda/manuales-videos-folletos/manuales-practicos/irpf-2025/c12-integracion-compensacion-rentas/reglas-integracion-compensacion-rentas/integracion-compensacion-rentas-base-imponible-ahorro.html)

[2] [Supabase Docs — Postgres Changes](https://supabase.com/docs/guides/realtime/postgres-changes)

[3] [Supabase Docs — Environment Variables and Secrets](https://supabase.com/docs/guides/functions/secrets)
