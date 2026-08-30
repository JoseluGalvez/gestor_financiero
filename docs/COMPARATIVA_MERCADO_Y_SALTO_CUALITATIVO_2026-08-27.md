# Comparativa de mercado y mejoras para un salto cualitativo

**Proyecto:** Gestor financiero · Portafolio Intel  
**Fecha de referencia:** 27 de agosto de 2026  
**Objeto:** comparación de producto, no recomendación de inversión ni auditoría de los proveedores citados.

> **Resumen.** Gestor financiero puede diferenciarse de los rastreadores comerciales por ofrecer un **Canvas local sin cuenta**, cálculo local revisable para CSV y Criptomonedas, edición bidireccional de datos y una frontera explícita entre privacidad local y datos persistentes. Sin embargo, las alternativas consolidadas son hoy más completas en agregación automática, soporte de entidades, datos de mercado, fiscalidad industrializada, informes y experiencias móviles. El salto cualitativo no consiste en copiar todas sus funciones: consiste en cerrar primero RLS/Realtime y construir una plataforma de datos trazable, conciliada y controlada por el usuario.

---

## Índice

1. [Alcance y método](#1-alcance-y-método)
2. [Posicionamiento actual de Gestor financiero](#2-posicionamiento-actual-de-gestor-financiero)
3. [Comparación por alternativa](#3-comparación-por-alternativa)
4. [Qué enseñan las alternativas](#4-qué-enseñan-las-alternativas)
5. [Brechas y ventajas diferenciales](#5-brechas-y-ventajas-diferenciales)
6. [Mejoras que producirían un salto cualitativo](#6-mejoras-que-producirían-un-salto-cualitativo)
7. [Secuencia de ejecución segura](#7-secuencia-de-ejecución-segura)
8. [Límites y referencias](#8-límites-y-referencias)

---

## 1. Alcance y método

La comparación emplea exclusivamente páginas y centros de ayuda oficiales consultados el 27 de agosto de 2026. Las prestaciones se presentan como **declaraciones de cada proveedor**, no como garantía independiente de disponibilidad, privacidad, precisión, tratamiento fiscal, cobertura geográfica ni precio. La aplicación propia se evalúa frente a su estado local documentado y no frente a funcionalidades previstas pero aún sin activar.

Los criterios comparados son: privacidad y control de datos, importación, cobertura de activos, cálculo de rendimiento, fiscalidad cripto, colaboración, movilidad, trazabilidad y coste/operación tecnológica. No se incluyen rentabilidades, valoraciones de activos ni recomendaciones personalizadas.

| Criterio | Pregunta de evaluación |
| --- | --- |
| Privacidad y control | ¿Puede el usuario trabajar sin entregar su dataset a un servicio externo? ¿Qué frontera de datos se declara? |
| Entrada y reconciliación | ¿Admite CSV/manual/API? ¿Hay previsualización, validación, deduplicación y reversión? |
| Visión de cartera | ¿Cubre varios activos, divisas, entidades y plataformas? |
| Rendimiento | ¿Distingue resultado, flujos, TWR/MWR, comisiones, FX e impuestos? |
| Fiscalidad cripto | ¿Clasifica operaciones complejas y genera borradores revisables con procedencia? |
| Colaboración y seguridad | ¿Existen permisos, aislamiento organizativo, auditoría y mínimo privilegio? |
| Operación | ¿Depende de conectores, datos licenciados, infraestructura propia o un proveedor cloud? |

---

## 2. Posicionamiento actual de Gestor financiero

La propuesta actual combina un espacio autenticado con Supabase y un espacio de uso local. En el **Canvas local** y **Criptomonedas**, el fichero elegido se trata en memoria del navegador; las descargas requieren acción explícita y no existe guardado automático local residente. El Canvas permite carga de CSV/XLSX/JSON, mapeo, filtros, KPIs, gráficos, tabla editable, cálculos mediante Worker y exportación local. Criptomonedas procesa CSV local para FIFO y genera un borrador revisable, no una declaración.

El sistema también dispone de comparación de plataformas basada en resultado realizado, módulo manual de Salud empresa, PDF/CSV de análisis y vistas preparatorias para fuentes, asistente y Power BI. No obstante, la integración real de Google Sheets/SQL, cotizaciones en vivo, IA, Power BI Embedded, presentación fiscal oficial y cálculo TWR/MWR de producción siguen fuera de la función operativa. Realtime necesita coalescencia y segmentación; RLS remota requiere verificación efectiva antes de tratar el dashboard persistente como listo para producción.

| Fortaleza actual | Valor para el usuario | Límite que debe comunicarse |
| --- | --- | --- |
| Canvas local sin cuenta | Análisis visual de archivos sin envío intencional del dataset por la aplicación. | El usuario sigue siendo responsable del fichero y de las descargas en su dispositivo. |
| Editar, filtrar y recalcular desde un estado único | Reduce pasos entre tabla y dashboard y permite corrección visible antes del recálculo. | No sustituye una conciliación con broker o fuente externa. |
| CSV protegido para apertura humana | Mitiga texto que una hoja de cálculo pueda interpretar como fórmula. | No es un contrato para reimportación automática. |
| FIFO local con fechas de calendario real | Evita crear lotes por compras imposibles y conserva incidencias revisables. | Sigue siendo un borrador fiscal; requiere justificantes y revisión profesional. |
| Diseño de permisos organizativos | La aplicación no delega la seguridad en filtros de interfaz. | Debe probarse RLS efectiva, grants, vistas y Realtime remoto. |

---

## 3. Comparación por alternativa

### 3.1. Matriz resumida

| Alternativa | Qué declara resolver | Ventajas frente al estado actual | Contras o límites frente a Gestor financiero | Implicación estratégica |
| --- | --- | --- | --- | --- |
| **Portfolio Performance** | Importación CSV guiada con mapeo/vista previa, taxonomías, informes de rendimiento y conceptos TWR/MWR. [1] | Madurez del flujo de importación, variedad de tipos de operación y configuración reutilizable. | No se presenta como un Canvas web local de edición visual inmediata ni como una plataforma organizativa con RLS. Su modelo de uso puede requerir aprendizaje y operación de escritorio. | Adoptar su rigor de importación: tipo de archivo, delimitador, codificación, mapeo, previsualización, errores por fila y configuración guardable. |
| **Ghostfolio** | Panel de patrimonio personal de código abierto orientado a privacidad, con acciones, ETF y cripto; declara uso anónimo y propiedad de los datos. [2] | Referencia clara en privacidad, sencillez y filosofía de código abierto. | No sustituye por sí solo una política de RLS multiusuario ni una fiscalidad española revisable. La instalación/operación propia sigue siendo responsabilidad del usuario o administrador. | Reforzar el mensaje de privacidad verificable y ofrecer exportación/portabilidad sin convertir la aplicación en un servicio opaco. |
| **Sharesight** | Alta de histórico mediante broker, hoja de cálculo o entrada manual; cálculo de rendimiento, ganancias/pérdidas y dividendos asociado a residencia fiscal. [3] | Proceso orientado a datos transaccionales y reporting de rendimiento/fiscalidad. | Es una propuesta cloud con un marco funcional propio; su cobertura y reglas no deben extrapolarse automáticamente al caso español ni al cálculo FIFO cripto local. | Priorizar rendimiento neto conciliado, calendario de dividendos con procedencia y estados de cobertura antes de automatizar conectores. |
| **getquin** | Agregación de cartera, importación API/manual/CSV, seguimiento en tiempo real, datos de mercado, dividendos, métricas de retorno y comunidad. [4] | Referencia de experiencia multiactivo, móvil, benchmarking, datos en vivo y visualización de composición. | La agregación y comunidad aumentan dependencias y superficie de datos; no encajan de forma automática con una promesa de procesamiento estrictamente local. | Separar claramente un modo local privado de un modo conectado con consentimiento granular, calidad de datos y control de permisos. |
| **Kubera** | Agregación de acciones, cripto, inmobiliario, activos privados y otros; múltiples entidades, control granular compartido, informes dinámicos y conectividad a instituciones. [5] | Cobertura de patrimonio complejo, entidades anidadas y colaboración granular. | Requiere conectividad/proveedores externos para gran parte del valor; incorpora IA e integraciones que amplían la frontera de tratamiento de datos. | Si se habilita multi-entidad, diseñar primero aislamiento por cartera/entidad y una matriz de permisos; no añadir conectores por defecto. |
| **CoinTracking** | Importación API/CSV de exchanges y wallets, informes de cartera, informes fiscales y soporte de operaciones cripto complejas. [6] | Profundidad de taxonomía cripto, automatización de muchas fuentes y reporting especializado. | La automatización con APIs y capacidades de IA requiere revisar secretos, jurisdicción, procedencia y tratamiento de datos; no equivale a presentación ante la AEAT. | Fortalecer la pista de auditoría: evento original, normalización, regla aplicada, lote consumido, advertencia y exportación revisable. |
| **Koinly** | Consolidación de historial cripto y cálculos de ganancia/pérdida e ingresos, con conectividad a exchanges y wallets. [7] | Referencia para cubrir staking, derivados y operaciones complejas de cripto. | La fuente consultada describe un marco fiscal estadounidense; no es base para reglas españolas. El uso de datos en cloud no es equivalente al procesamiento local. | Extender cripto solo por categorías bien documentadas, con reglas por jurisdicción separadas y aprobación previa. |

### 3.2. Portfolio Performance: referencia de importación controlada

Portfolio Performance explica un asistente de importación CSV en tres fases: selección de archivo, definición de tipo/delimitador/codificación/mapeo y finalización con revisión de información adicional. Admite configuraciones de mapeo guardables y expone errores cuando faltan campos esenciales.[1] Esta pauta es especialmente valiosa para Gestor financiero porque el Canvas ya ofrece mapeo y filtros, pero el modo autenticado aún no tiene una importación real con previsualización, conciliación y reversión.

**Ventaja competitiva de Gestor financiero:** puede combinar ese rigor con una experiencia de dashboard local más directa y con validación de celdas antes de recalcular. **Brecha prioritaria:** debe incorporar una capa de ingestión con identificador de lote, filas válidas/inválidas, deduplicación, simulación antes de escritura, confirmación explícita y registro de reversión.

### 3.3. Ghostfolio: referencia de privacidad y portabilidad

Ghostfolio se define como un dashboard de finanzas personales de código abierto orientado a privacidad; declara seguimiento de acciones, ETF y criptomonedas, foco en asignación/patrimonio y uso anónimo.[2] La lección no es copiar una marca de “privacy-first”, sino volver la privacidad **demostrable**: explicar qué permanece en el navegador, qué cruza al backend, por qué, durante cuánto tiempo y cómo se exporta o elimina.

**Ventaja competitiva de Gestor financiero:** el Canvas local ya articula una frontera clara. **Brecha prioritaria:** añadir pruebas y señales visibles de “modo local” frente a “modo conectado”, portabilidad completa de datos del usuario autenticado y un inventario de recursos/red en pruebas E2E para asegurar que el modo local no empieza a transmitir datos al evolucionar.

### 3.4. Sharesight: referencia de rendimiento y reporting transaccional

Sharesight indica que puede importar compras/ventas desde brokers o hojas de cálculo y calcular rendimiento, ganancias/pérdidas e ingresos por dividendos; también vincula configuración y reporting con residencia fiscal.[3] La propuesta revela que el valor no está solo en mostrar un gráfico: está en poder explicar cómo se ha construido el rendimiento a partir de movimientos, costes, dividendos, impuestos, divisas y fechas.

**Ventaja competitiva de Gestor financiero:** puede priorizar trazabilidad y no declarar resultados cuando falta coste FIFO. **Brecha prioritaria:** implementar TWR y MWR/XIRR como motor determinista, con flujos externos explícitos, reglas de redondeo, divisa base, histórico de FX, cobertura y pruebas de conciliación entre valor inicial/final y flujos.

### 3.5. getquin: referencia de experiencia conectada y móvil

getquin declara importación API, manual y CSV, agregación de patrimonio, precios/actualizaciones en tiempo real, calendario de dividendos, distribución por geografía/industria/tipo de activo y métricas como retorno simple y ponderado por tiempo.[4] Esto es una referencia de experiencia conectada, pero también de complejidad: datos en vivo, cuentas conectadas, comunidad y analítica requieren autorización, tratamiento de datos, dependencias, calidad y observabilidad.

**Ventaja competitiva de Gestor financiero:** mantener el modo local como opción real y no como marketing. **Brecha prioritaria:** solo tras cerrar RLS/Realtime, introducir un modo conectado voluntario con conectores delegados, consentimiento por fuente/alcance, caché de backend, licencia de datos, estado de frescura y posibilidad de desconexión/revocación.

### 3.6. Kubera: referencia de patrimonio multi-entidad

Kubera declara una visión de acciones, cripto, inmuebles, private equity y otros activos, conexión con instituciones, entidades anidadas, acceso compartido granular y reportes dinámicos.[5] Es un benchmark útil si el producto pretende servir a patrimonios con varias cuentas, propietarios o entidades jurídicas.

**Ventaja competitiva de Gestor financiero:** puede diseñar un modelo de datos con procedencia, privacidad y permisos desde el inicio. **Brecha prioritaria:** si se decide multi-entidad, añadir antes `entity`, `ownership`, `portfolio_access` y permiso a nivel cartera. La policy actual basada solo en organización no debe venderse como aislamiento por cartera. Todo acceso nuevo debe validarse con pruebas de owner/editor/member/outsider y dos organizaciones ficticias.

### 3.7. CoinTracking y Koinly: referencias de fiscalidad cripto industrializada

CoinTracking declara importación por CSV o API, seguimiento de cartera y reportes fiscales para múltiples países, además de categorías cripto amplias.[6] Koinly declara conectividad a exchanges/wallets y cálculo de ganancias, pérdidas e ingresos; la página revisada se refiere al contexto fiscal de EE. UU., por lo que no debe trasladarse a España sin análisis específico.[7]

**Ventaja competitiva de Gestor financiero:** el flujo actual es explícitamente local, FIFO revisable y no promete presentación oficial. **Brecha prioritaria:** ampliar gradualmente la taxonomía de operaciones —staking, airdrops, préstamos, derivados, NFTs y DeFi— solo cuando cada categoría tenga: definición funcional, regla para la jurisdicción objetivo, datos de entrada mínimos, ejemplo ficticio, advertencias, pruebas y rastro de cálculo. Un borrador no sustituye revisión fiscal profesional ni presentación ante la AEAT.

---

## 4. Qué enseñan las alternativas

Las alternativas analizadas no tienen una única fortaleza común: resuelven problemas diferentes. Portfolio Performance prioriza importación parametrizable; Ghostfolio, control y privacidad; Sharesight, rendimiento/reporting; getquin, experiencia de cartera conectada; Kubera, patrimonio multi-entidad; CoinTracking/Koinly, automatización fiscal cripto. El posicionamiento ganador de Gestor financiero no consiste en competir simultáneamente con todas, sino en elegir un núcleo fiable y ampliarlo sin perder control sobre los datos.

| Aprendizaje | Cómo incorporarlo sin copiar un riesgo |
| --- | --- |
| Importación guiada y repetible | Plantillas por fuente, detector de esquema, vista previa, errores por fila, deduplicación y reversión. Nunca escritura automática desde un conector no aprobado. |
| Rendimiento explicable | TWR/MWR, puente de variación y rendimientos netos con coste, FX, impuestos/comisiones y fecha de corte. Nunca mezclar series con distinta procedencia. |
| Agregación multiactivo | Modelo de activos/entidades flexible y normalización de divisa. Nunca declarar “tiempo real” si la frescura o cobertura son desconocidas. |
| Privacidad verificable | Modo local con controles de red y test de no persistencia; modo conectado con consentimiento, mínimo privilegio y revocación. Nunca una única promesa ambigua para ambos modos. |
| Fiscalidad utilizable | Libro mayor de eventos, lotes, advertencias y exportación de borrador. Nunca presentación oficial o conclusiones fiscales sin requisitos y revisión especializados. |
| Colaboración | Roles y acceso por organización/cartera, auditoría de cambios y enlaces de solo lectura opcionales con expiración. Nunca compartir por defecto ni exponer secretos en configuración de fuente. |

---

## 5. Brechas y ventajas diferenciales

### 5.1. Brechas que bloquean una versión conectada de producción

| Prioridad | Brecha | Por qué bloquea producto | Hito verificable |
| --- | --- | --- | --- |
| **P0** | RLS remota efectiva no comprobada | Sin ella no puede garantizarse aislamiento de datos persistentes entre organizaciones. | Inventario de producción/staging, migraciones, tests pgTAP, Security Advisor y prueba de dos organizaciones aprobados. |
| **P0** | Realtime no coalescido ni versionado | Una ráfaga puede generar carga excesiva y estado visualmente inconsistente. | Actualización por dominio, debounce/coalescencia, versión por dominio y E2E de ráfagas. |
| **P0** | Cabeceras y configuración de producción no verificadas | La postura real de despliegue no se puede inferir desde localhost. | CSP probada, `frame-ancestors`, HSTS/TLS en borde, políticas de referrer, MIME y permisos verificadas en URL de staging/producción. |
| **P1** | Procedencia y conciliación incompletas | Un KPI sin fuente, corte, cobertura o divisa puede parecer más fiable de lo que es. | Contrato de calidad visible en cada KPI y reconciliación de importaciones. |
| **P1** | TWR/MWR/XIRR y atribución no están en producción | Impide comparar rendimiento de forma sólida cuando existen flujos de caja. | Motor determinista con pruebas y puente de variación. |
| **P1** | Importación conectada no es un flujo E2E | Formularios/previews no bastan para escribir datos reales de forma segura. | Staging con fuente ficticia, confirmación, idempotencia, reversión y auditoría. |
| **P1** | CI, E2E y accesibilidad incompletos | Las correcciones dependen de ejecución manual y algunas regresiones podrían volver. | CI por pull request, matriz E2E, teclado/lector de pantalla/contraste y móvil. |

### 5.2. Ventajas que conviene preservar

| Diferencial | Riesgo de perderlo | Regla de producto |
| --- | --- | --- |
| Procesamiento local sin cuenta | Convertir toda tarea en llamada a nube/IA por comodidad. | Canvas y FIFO locales no envían ni persisten datos sin acción explícita del usuario. |
| Cálculo revisable | Sustituir un resultado explicable por una puntuación opaca. | Cada resultado tiene entradas, reglas, advertencias y versión. |
| Exportación consciente | Automatizar envíos a terceros sin confirmación. | Las descargas, comparticiones, sincronizaciones y guardados son explícitos. |
| No asesoramiento ni ejecución | Convertir alertas/análisis en instrucciones personalizadas. | Se muestran datos, supuestos y riesgos; no órdenes ni recomendaciones personalizadas. |
| Demos sin datos reales | Mezclar ejemplos con información del usuario o fuentes externas sin licencia. | Todas las demostraciones y capturas emplean datos ficticios identificados. |

---

## 6. Mejoras que producirían un salto cualitativo

### 6.1. Salto 1 — Plataforma de datos con confianza visible

El mayor salto no es añadir otro gráfico, sino que cada número importante responda a cinco preguntas: **origen, fecha de corte, cobertura, divisa y versión de cálculo**. La interfaz debe mostrar una insignia de calidad —completo, parcial, obsoleto, no conciliado o no disponible— en KPIs, informes y alertas.

| Capacidad | Entrega concreta | Beneficio | Salvaguarda |
| --- | --- | --- | --- |
| Contrato de procedencia | `source_id`, `as_of`, moneda, cobertura, versión de motor, estado de conciliación y timestamp de importación. | Evita apariencia de precisión cuando el dato no está completo. | No mezclar datos locales y conectados sin etiquetado. |
| Centro de conciliación | Diferencias entre fuente, transacciones normalizadas, posiciones y snapshots. | Detecta duplicados, huecos, precios/FX faltantes y saldos incompatibles. | Ninguna corrección automática destructiva; propuesta y confirmación. |
| Explicación de KPI | Desglose “ver datos y fórmula” con valores de entrada. | Hace el análisis revisable por usuarios noveles y expertos. | Bloquear/etiquetar resultados si falta cobertura. |

### 6.2. Salto 2 — Rendimiento neto y atribución realmente comparables

Implementar TWR y MWR/XIRR con pruebas es una mejora superior a multiplicar indicadores. El usuario necesita separar aportaciones/retiros de resultado de inversión, y entender la variación por mercado, flujos, divisa, ingresos, comisiones e impuestos informados.

1. Definir el contrato de cada flujo externo y cada valoración de corte.
2. Implementar motor TWR por subperíodos y MWR/XIRR con convergencia, controles de signo y avisos de no convergencia.
3. Crear un puente de variación que reconcilie valor inicial, flujos, rendimiento, FX, ingresos, comisiones, impuestos y valor final.
4. Probar casos con aportaciones, retiros, series incompletas, divisas y fechas límite.
5. Mostrar “no calculable” en lugar de aproximar cuando la calidad no alcanza el mínimo definido.

> **Resultado esperado:** la comparación de plataformas deja de ser solo resultado realizado y evoluciona hacia una lectura de rendimiento neto explicable, sin vender una rentabilidad inexistente ni una recomendación.

### 6.3. Salto 3 — Ingestión conectada reversible y de mínimo privilegio

El paso desde CSV local hacia Google Sheets/SQL/API debe ser una cadena controlada, no un botón de “sincronizar”.

| Paso | Entrega | Condición de seguridad |
| --- | --- | --- |
| Autorizar | Conector de alcance limitado y consentimiento explícito por fuente. | Secreto solo en backend/vault; nunca en `connection_config` ni navegador. |
| Descubrir | Lectura de encabezados y muestra limitada. | No escribir ni importar sin previsualización. |
| Mapear | Mapeo versionado con formato de fecha, divisa y columnas requeridas. | Validación de esquema y de valores por fila. |
| Simular | Resumen de altas, cambios, duplicados, errores y efecto estimado. | No mutar datos persistentes. |
| Confirmar | Aprobación explícita de usuario autorizado. | RBAC/RLS y transacción o idempotencia. |
| Ejecutar | Lote con identificador, auditoría y resultados por fila. | Reintentos seguros y control de tasa. |
| Revertir | Reversión de un lote sin afectar movimientos posteriores no relacionados. | Registro inmutable de antes/después. |

### 6.4. Salto 4 — Privacidad como capacidad, no como eslogan

El modo local ya es un activo. Para convertirlo en ventaja sostenible, debe medir y comprobar sus límites.

1. Añadir prueba E2E que vigile que el Canvas local y Criptomonedas no generan solicitudes a Supabase, IA, Google Sheets, almacenamiento residente ni dominios de análisis.
2. Proporcionar botón de “Borrar sesión local” que libere estados/Workers y explique que recargar también elimina la memoria de la aplicación.
3. Mostrar antes de cada exportación un mensaje claro sobre dónde queda el archivo: dispositivo del usuario, sin envío automático.
4. Para modo conectado, publicar un panel de permisos por fuente, última sincronización, alcance y opción de revocar/desconectar.
5. No activar telemetría de contenido financiero. Si se desea medir uso, hacerlo agregado, opt-in, minimizado y documentado.

### 6.5. Salto 5 — Libro mayor cripto auditado y extensible

El motor FIFO es una base correcta, especialmente tras bloquear fechas imposibles y lotes corruptos. El siguiente salto es convertir cada fila en una evidencia revisable de extremo a extremo.

| Elemento | Mejora |
| --- | --- |
| Evento original | Conservar hash/fila de origen, fuente, fecha de importación y mapeo aplicado. |
| Normalización | Mostrar cómo se interpretó tipo, activo, cantidad, EUR, comisiones y fecha. |
| Regla | Identificar FIFO, criterios de valoración y versión de motor. |
| Consumo de lotes | Permitir inspeccionar los lotes consumidos por transmisión. |
| Incidencias | Separar advertencias bloqueantes, incompletas e informativas. |
| Categorías futuras | Staking, airdrops, préstamos, derivados, NFT y DeFi se añaden una a una, con pruebas/jurisdicción. |
| Fiscalidad | Mantener exportación como borrador para revisión, sin presentar XML/Modelo 100/721 automáticamente. |

### 6.6. Salto 6 — Colaboración segura por entidad y cartera

Si el producto va a ser utilizado por familia, asesoría o equipo, el salto debe empezar en control de acceso y auditoría, no en comentarios sociales.

1. Definir entidades, propietarios, carteras y asignaciones por cartera.
2. Aprobar una matriz de roles: lectura, edición, administración, exportación y conexión de fuentes.
3. Aplicar RLS a cada tabla, vista, función y canal Realtime; revocar grants por defecto no necesarios.
4. Registrar cambios sensibles: quién, cuándo, qué fuente, lote o permiso se modificó.
5. Incorporar enlaces de lectura con expiración solo si existe caso de uso, auditoría y revocación.
6. Probar en staging la revocación y una sesión con token que expira; nunca asumir que los permisos nuevos se aplican instantáneamente a un canal ya conectado.

### 6.7. Salto 7 — Asistente explicable, solo después de asegurar los datos

El asistente IA puede mejorar navegación y explicación, pero no debe ser el siguiente paso si RLS, calidad de datos y fuentes siguen abiertos. El piloto apropiado es **solo lectura**, con herramientas permitidas, resultados estructurados, fuentes/corte visibles, exclusión de secretos y sin ejecución de operaciones.

| Requisito antes de un piloto | Razón |
| --- | --- |
| RLS remota y permisos por alcance aprobados | Evita que una herramienta lea carteras no autorizadas. |
| Datos con procedencia y cobertura | Impide que una respuesta presente un dato parcial como hecho. |
| Backend con allowlist de herramientas | Niega SQL libre, URLs arbitrarias, escritura y secretos. |
| Registro de solicitudes con minimización | Permite auditoría sin conservar contenido financiero innecesario. |
| Fuentes externas autorizadas/licenciadas | Impide dependencia de scraping o datos sin licencia. |
| Salida con incertidumbre y citas | Mantiene separación entre dato, cálculo y supuesto. |

---

## 7. Secuencia de ejecución segura

La aplicación debe terminar por etapas verificables. Añadir funciones de mercado o IA antes de cerrar la seguridad base aumentaría el número de superficies a probar.

| Horizonte | Objetivo | Trabajo principal | Criterio de salida |
| --- | --- | --- | --- |
| **0–1. Integridad de producción** | Cerrar bloqueadores P0. | RLS en staging, inventario remoto, Realtime por dominio, cabeceras de despliegue, DCF no finito. | Auditoría actualizada con evidencia de pruebas y producción controlada. |
| **2. Calidad de datos** | Hacer confiables las cifras existentes. | Procedencia, cobertura, conciliación, importación reversible y límites de archivos. | Cada KPI crítico indica calidad y una importación ficticia completa se puede revertir. |
| **3. Rendimiento y reporting** | Hacer útil la toma de decisiones sin prescribir decisiones. | TWR/MWR, puente de atribución, dividendos y reportes con trazabilidad. | Resultados reconciliados y casos financieros deterministas aprobados. |
| **4. Conectividad opt-in** | Conectar fuentes sin exponer datos o secretos. | OAuth/backend/vault, permisos, caché, expiración y observabilidad. | Fuente ficticia conectada de extremo a extremo con revocación. |
| **5. Experiencia y colaboración** | Hacer el producto accesible y multiusuario. | PWA/móvil, accesibilidad, permisos por cartera, auditoría y soporte de entidades. | E2E de teclado/móvil/roles y aprobación de privacidad. |
| **6. Inteligencia asistida** | Añadir explicación e investigación con límites. | Agente R/O, fuentes permitidas, citas y control de coste/retención. | Piloto aislado sin secretos, escritura ni recomendaciones personalizadas. |

### Condición de “app terminada” para lanzamiento controlado

La primera versión conectada puede considerarse terminada cuando: RLS y Realtime cumplan sus criterios de cierre; las funciones anunciadas tengan recorrido E2E con datos ficticios; cada KPI tenga procedencia/calidad; las integraciones activas estén autorizadas y operen por backend; las exportaciones y borradores estén delimitados; accesibilidad, seguridad de despliegue y CI estén demostrados; y el repositorio remoto contenga el código, migraciones y pruebas revisadas.

Una vez cumplido lo anterior, nuevas capacidades —IA, cotizaciones en vivo, Embedded BI, fiscalidad oficial o conectores de terceros— deberían tratarse como versiones posteriores y no como requisito para declarar terminado el núcleo fiable de cartera local/conectada.

---

## 8. Límites y referencias

Los pros y contras reflejan diferencias de enfoque producto/operación. No constituyen auditoría de seguridad, revisión contractual, dictamen fiscal ni recomendación sobre qué herramienta contratar. Las jurisdicciones fiscales, integraciones soportadas y condiciones de los proveedores cambian; deben verificarse de nuevo antes de elegir o activar una solución.

El desarrollo propuesto prioriza privacidad, seguridad y respuesta rápida. Cualquier migración remota, conector OAuth/SQL, fuente de precios, secreto, proceso de fondo, agente IA o publicación requiere una autorización separada y una prueba en entorno aislado.

### Referencias

[1]: https://help.portfolio-performance.info/en/reference/file/import/csv-import/ "Portfolio Performance Manual — Importing a CSV file"

[2]: https://ghostfol.io/ "Ghostfolio — Privacy-first open-source wealth management"

[3]: https://help.sharesight.com/adding-your-investments-into-sharesight/ "Sharesight Help — Add your investments"

[4]: https://www.getquin.com/portfolio-tracker/ "getquin — Portfolio tracker"

[5]: https://www.kubera.com/portfolio-tracker "Kubera — Portfolio tracker"

[6]: https://cointracking.info/ "CoinTracking — Crypto Tax Calculator & Portfolio Tracker"

[7]: https://koinly.io/features/ "Koinly — Crypto Tax Calculator"

[8]: https://supabase.com/docs/guides/database/postgres/row-level-security "Supabase Docs — Row Level Security"

[9]: https://supabase.com/docs/guides/realtime/authorization "Supabase Docs — Realtime Authorization"

[10]: https://owasp.org/www-community/attacks/CSV_Injection "OWASP — CSV Injection"

[11]: https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html "OWASP Cheat Sheet Series — Input Validation"

---

**Divulgación de base y límites.** La comparación se basa en funciones declaradas por fuentes oficiales consultadas el 27 de agosto de 2026 y en el estado local documentado de Gestor financiero. No se han utilizado precios, resultados de inversión, datos de usuarios ni métricas financieras externas para formular una decisión. Las mejoras son propuestas técnicas de producto, sujetas a validación, autorización y pruebas. Este documento es investigación y análisis de producto, no asesoramiento financiero personalizado.
