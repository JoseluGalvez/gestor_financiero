# Inventario de entregables — Portafolio Intel

> **Propósito:** identificar los archivos que se han entregado de forma directa o que acompañan al repositorio `JoseluGalvez/gestor_financiero`.  
> **Criterio de organización:** primero se indican los archivos que se ofrecieron como descarga directa durante la conversación; después, la documentación y los archivos principales que se obtienen al clonar el repositorio.  
> **Nota importante:** no se han entregado archivos `.pdf`, `.docx`, `.js` ni `.sh` como entregables independientes. El manual se distribuyó en HTML para preservar su diseño; la aplicación utiliza principalmente TypeScript (`.ts` y `.tsx`).

## 1. Entregables ofrecidos para descarga directa

| Archivo | Tipo | Descripción y contenido | Motivo de creación | Funcionalidad / uso | Estado y observaciones |
|---|---|---|---|---|---|
| `MANUAL_DESPLIEGUE_PORTAFOLIO_INTEL.html` | HTML | Manual visual con portada, índice navegable, requisitos, instalación, configuración de Supabase, RLS, Google Sheets, Vercel, pruebas, seguridad, incidencias, glosario y enlaces oficiales. | Facilitar un despliegue rápido y ordenado desde GitHub. | Se abre en cualquier navegador; conserva colores y jerarquía visual de Portafolio Intel y puede imprimirse desde el navegador. | **Finalizado y publicado** en GitHub, commit `e050d5d`. No contiene secretos. |
| `page_2026-08-22_13-24-44_7595.webp` | WEBP | Captura de comprobación de la portada del manual HTML. | Verificar la apariencia visual del manual antes de entregarlo. | Referencia visual; no es necesaria para instalar ni ejecutar la aplicación. | **Complementario**; representa el diseño del manual, no la interfaz funcional de la app. |
| `GUION_DEMO_VERTICAL_CORPORATIVA_120S.md` | Markdown | Guion corporativo de dos minutos con escaleta, locución, textos en pantalla, dirección de producción, activos y controles de publicación. | Preparar la demo vertical de Portafolio Intel para clientes corporativos. | Documento maestro para locución, rodaje/renderizado y edición de una pieza 9:16. | **Finalizado y publicado**; versión actual enfatiza eficiencia operativa sin prometer ahorros cuantificados. Commit `d01733e`. |
| `01_datos_dispersos.mp4` | MP4 | Clip vertical de apertura de 10 segundos: paneles de datos dispersos convergen en un dashboard abstracto. | Crear el primer plano de la demo durante la disponibilidad de generación de vídeo. | Teaser de apertura para el montaje final de 120 segundos. | **Generado** a 720 × 1280. Los 11 clips restantes están pendientes de cupo de vídeo. No contiene audio ni texto de marca. |
| `portafolio-intel-mezcla-master-120s.wav` | WAV | Mezcla final de 119,98 segundos: locución corporativa en español y música original atenuada. | Dejar preparada la banda sonora del vídeo completo. | Pista de audio maestra que se sincroniza con 12 clips de 10 segundos. | **Finalizado**. La voz prevalece sobre la música y no incorpora promesas financieras. |
| `portafolio-intel-locucion.wav` | WAV | Locución aislada de la demo, en español de España y con tono ejecutivo. | Permitir una edición independiente de voz, volumen o reemplazo por locutor humano. | Pista de voz sin música. | **Incluida en el paquete ZIP**. Tiene una duración original aproximada de 124 segundos; la mezcla maestra la ajusta a 120 segundos. |
| `portafolio-intel-musica-fondo.wav` | WAV | Música electrónica corporativa instrumental original, con progresión de fricción operativa a claridad y control. | Proporcionar cama musical libre de locución para la demo. | Pista de fondo para montaje, con volumen ya reducido en la mezcla maestra. | **Incluida en el paquete ZIP**. No contiene voces ni melodías reconocibles. |
| `portafolio-intel-demo-es.srt` | SRT | Doce bloques de subtítulos sincronizados, uno por cada tramo de diez segundos. | Hacer el vídeo accesible y apto para consumo sin sonido en formato móvil. | Se importa en editores de vídeo o plataformas compatibles con SRT. | **Finalizado**; su temporización está diseñada para el audio maestro de 120 segundos. |
| `STORYBOARD_RENDER_DEMO_VERTICAL_120S.md` | Markdown | Storyboard técnico de 12 planos: código de clip, timecode, objetivo, prompt de generación en inglés, texto de apoyo, especificaciones y checklist. | Permitir renderizar de forma consistente los 11 clips pendientes y montar la pieza final. | Guía de producción para vídeo vertical 9:16, 25 fps, 1080 × 1920. | **Finalizado**. Incluye salvaguardas: datos sintéticos, sin secretos, sin promesas de rendimiento ni ahorro garantizado. |
| `portafolio-intel-video-reference.png` | PNG | Imagen de referencia vertical con estética fintech: interfaz navy, azul eléctrico y verde para estados positivos. | Mantener consistencia visual entre los clips generados. | Debe usarse como referencia estética en la generación de los planos restantes. | **Finalizado**. Imagen conceptual sin datos reales, texto legible ni logotipos de terceros. |
| `PORTAFOLIO_INTEL_DEMO_VERTICAL_PAQUETE_PRODUCCION.zip` | ZIP | Paquete comprimido que reúne guion, audio de voz, música, mezcla maestra, subtítulos, storyboard, referencia visual y teaser. | Evitar descargas dispersas y preparar una entrega única para edición futura. | Archivo recomendado para archivar y descomprimir antes de renderizar/montar el vídeo. | **Paquete principal de vídeo**. No contiene los 11 clips todavía no generados. |

## 2. Documentación versionada dentro del repositorio

Estos archivos son documentos Markdown que se obtienen al clonar el repositorio. Ayudan a comprender el producto, pero no son necesarios todos para el arranque mínimo.

| Archivo | Tipo | Descripción y contenido | Motivo de creación | Funcionalidad / uso | Estado y observaciones |
|---|---|---|---|---|---|
| `README.md` | Markdown | Punto de entrada del proyecto: alcance, arranque local, variables de entorno, capacidades y límites. | Documentar el uso básico del repositorio. | Primera referencia al descargar el código. | **Activo**. Complementa al manual HTML. |
| `docs/ALCANCE_ARQUITECTURA.md` | Markdown | Investigación inicial, alcance funcional priorizado y arquitectura técnica propuesta. | Traducir necesidades de negocio en una hoja de ruta de producto. | Referencia para entender decisiones de diseño y prioridades. | **Documentación estratégica**. |
| `docs/ARQUITECTURA_DATOS_REACTIVOS.md` | Markdown | Arquitectura de Supabase, Realtime, proveedores, alertas, informes y despliegue. | Describir cómo fluye y se actualiza la información persistida. | Guía técnica para evolución de datos y tiempo real. | **Documentación de arquitectura**. |
| `docs/CONEXIONES_Y_FISCALIDAD.md` | Markdown | Plan de conectores Google Sheets/SQL, OAuth, RLS, modelo fiscal y salvaguardas. | Definir cómo integrar fuentes sin debilitar la seguridad. | Referencia antes de implementar una importación real o ampliar fiscalidad. | **Plan y límites**: no equivale a una presentación fiscal ante Hacienda. |
| `docs/DEMO_IMPORTACION_GOOGLE_SHEETS.md` | Markdown | Explica la hoja ficticia, mapeo de columnas, previsualización y estado de la integración. | Mostrar el flujo actual sin usar datos financieros reales. | Ayuda para validar el formulario de fuentes. | **Demo controlada**: no realiza importación OAuth real todavía. |
| `docs/INVESTIGACION_DATOS_MERCADO.md` | Markdown | Comparativa de fuentes de cotizaciones, criterios de licencia y decisión de persistencia. | Evaluar proveedores sin cuotas y sus restricciones. | Material de decisión para futuras conexiones de mercado. | **Investigación**, no es un conector operativo. |
| `docs/MODULO_ANALISIS_FINANCIERO.md` | Markdown | Métricas de score, DCF, técnico, riesgo y límites del módulo extra. | Documentar cálculos explicables implementados. | Referencia para interpretar las tarjetas de análisis. | **Apoyo informativo**: no es asesoramiento ni recomendación personalizada. |
| `docs/PRUEBAS_Y_SEGURIDAD_PRODUCCION.md` | Markdown | Pruebas unitarias/integración, CI, RLS, secretos, auditoría y hallazgos de seguridad. | Preparar una salida controlada a producción. | Checklist de calidad y seguridad antes de desplegar. | **Activo**. Prioriza no exponer `service_role`, OAuth o secretos. |
| `docs/VALIDACION_VISUAL.md` | Markdown | Historial de comprobaciones de interfaz, responsive e interacción de las iteraciones. | Registrar la validación visual realizada durante el desarrollo. | Contexto de QA visual. | **Histórico de validación**. |
| `docs/MANUAL_DESPLIEGUE_PORTAFOLIO_INTEL.html` | HTML | Copia versionada del manual visual descrito en la primera tabla. | Mantener el manual con el código. | Puede abrirse desde el repositorio o descargarse individualmente. | **Entregable directo y documentación versionada**. |
| `docs/GUION_DEMO_VERTICAL_CORPORATIVA_120S.md` | Markdown | Copia versionada del guion de la demo descrito en la primera tabla. | Mantener el contenido audiovisual bajo control de versiones. | Fuente editable del audio, subtítulos y storyboard. | **Entregable directo y documentación versionada**. |

## 3. Archivos principales de aplicación y configuración incluidos al clonar GitHub

No se ofrecieron como descargas individuales; forman parte del código fuente de `https://github.com/JoseluGalvez/gestor_financiero`. Se incluyen aquí para que pueda identificarlos si se mezclaron con otros archivos.

| Archivo | Tipo | Descripción y contenido | Motivo de creación | Funcionalidad / uso | Estado y observaciones |
|---|---|---|---|---|---|
| `package.json` | JSON | Dependencias y scripts de Next.js, React, Supabase, Recharts, Vitest y utilidades. | Gestionar el entorno Node.js. | Ejecutar `npm run dev`, `build`, `lint`, `test:unit` y auditorías. | **Esencial** para instalar con `npm ci`. |
| `.env.example` | Archivo de entorno | Plantilla con `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. | Evitar distribuir credenciales de producción. | Se copia a `.env.local` y se completan valores del entorno propio. | **Seguro para versionar**; no contiene secretos de servidor. |
| `next.config.ts` | TypeScript | Configuración de Next.js. | Centralizar comportamiento del framework. | Ajustes de compilación y futura política de cabeceras. | **Configuración técnica**. Aún se recomienda añadir cabeceras de seguridad de producción. |
| `vitest.config.mts` | TypeScript | Patrón y entorno de Vitest para las pruebas unitarias. | Ejecutar tests repetibles. | Localiza `tests/unit/**/*.test.ts`. | **Configuración de pruebas**. |
| `src/app/layout.tsx` | TSX | Layout global de la aplicación Next.js. | Definir estructura base y metadatos de la interfaz. | Contenedor visual de las rutas. | **Código de frontend**. |
| `src/app/page.tsx` | TSX | Punto de entrada de la página principal. | Renderizar el dashboard de la aplicación. | Carga `RealtimePortfolioApp`. | **Código de frontend**. |
| `src/components/RealtimePortfolioApp.tsx` | TSX | Interfaz principal: acceso por magic link, organización, cartera, fuentes, alertas, informes y paneles. | Implementar el flujo de usuario y consultas/suscripciones. | Dashboard cliente conectado con Supabase. | **Componente central**. No debe exponer claves secretas. |
| `src/lib/supabase.ts` | TypeScript | Cliente Supabase público y tipos del dashboard. | Encapsular la conexión del frontend. | Conecta con URL y clave publicable bajo RLS. | **Código de datos**. |
| `src/lib/sample-google-sheet.ts` | TypeScript | Dataset ficticio y previsualización pura de Google Sheets. | Demostrar mapeo sin escritura en base de datos. | Valida encabezados y construye un preview seguro. | **Demo local**; no lee una hoja real. |
| `src/lib/financial-analysis.ts` | TypeScript | Motor explicable para scoring, DCF, indicadores técnicos y métricas de riesgo. | Añadir análisis financiero de apoyo. | Calcula resultados a partir de datos trazables. | **Informativo**; no ejecuta operaciones ni genera recomendaciones personalizadas. |
| `tests/unit/sample-google-sheet.test.ts` | TypeScript | Dos pruebas de mapeo válido y bloqueo por encabezado ausente. | Proteger el comportamiento de la previsualización ficticia. | Se ejecuta con `npm run test:unit`. | **Prueba actual**; faltan integración real y E2E. |

## 4. Migraciones, auditoría y función de servidor de Supabase

| Archivo | Tipo | Descripción y contenido | Motivo de creación | Funcionalidad / uso | Estado y observaciones |
|---|---|---|---|---|---|
| `supabase/create_portfolio_intel_core.json` | JSON | Esquema principal multi-tenant: organizaciones, miembros, cartera, posiciones, transacciones, fuentes, alertas, informes, auditoría y RLS. | Crear la base de datos central. | Migración de referencia para un proyecto Supabase propio. | **Infraestructura crítica**. Revíselo antes de aplicarlo en otro proyecto. |
| `supabase/move_rls_helpers_private.json` | JSON | Traslada helpers de RLS a un esquema privado y actualiza políticas. | Reducir exposición de funciones auxiliares. | Endurecimiento de políticas RLS. | **Migración de seguridad**. |
| `supabase/harden_helper_functions.json` | JSON | Ajustes adicionales de endurecimiento para funciones auxiliares. | Mejorar la defensa de las políticas. | Complementa la configuración RLS. | **Migración de seguridad**. |
| `supabase/add_google_sheets_connection_config.json` | JSON | Añade configuración de conexión y requisitos de mapeo para fuentes Google Sheets. | Persistir configuración sin guardar credenciales de usuario en el cliente. | Soporta la pantalla de fuentes. | **Preparación de conector**; no habilita OAuth/importación real por sí sola. |
| `supabase/add_analysis_runs.json` | JSON | Persistencia para ejecuciones de análisis financiero. | Guardar resultados explicables y trazables. | Da soporte al módulo de análisis. | **Migración funcional**. |
| `supabase/audit_rls_policies.json` | JSON | Consulta de auditoría de políticas RLS. | Revisar protección de tablas. | Diagnóstico de políticas y acceso. | **Solo lectura / auditoría**. |
| `supabase/production_rls_audit.json` | JSON | Consulta versionada para auditar RLS en producción. | Repetir una revisión de seguridad antes de liberaciones. | Checklist técnico de producción. | **Solo lectura / auditoría**. |
| `supabase/functions/bootstrap-organization/index.ts` | TypeScript | Edge Function autenticada para crear perfil, organización, miembro owner, cartera y evento auditoría. | Mantener el aprovisionamiento sensible en servidor. | Se invoca tras el primer acceso autenticado. | **Función de servidor**. Requiere `APP_ORIGIN` HTTPS y conviene añadir rate limit/idempotencia. |
| `supabase/functions/bootstrap-organization/deploy.json` | JSON | Configuración de despliegue de la Edge Function. | Declarar cómo se publica la función. | Soporte de infraestructura. | **Configuración de servidor**. |

## 5. Documentos auxiliares de las primeras fases

Estos archivos se conservaron en el área de trabajo de intercambio durante la investigación inicial. Se incluyen para que pueda identificarlos si los descargó, pero no son necesarios para instalar, ejecutar ni desplegar la versión actual.

| Archivo | Tipo | Descripción y contenido | Motivo de creación | Funcionalidad / uso | Estado y observaciones |
|---|---|---|---|---|---|
| `ACTUALIZACION.md` | Markdown | Registro de cambios de un plan de ejecución temprano. | Dar seguimiento a una iteración inicial del proyecto. | Contexto histórico de planificación. | **Histórico**; no sustituye la documentación actual. |
| `DESCRIPCION.md` | Markdown | Descripción inicial de Portafolio Intel como dashboard de inversión all-in-one. | Consolidar el planteamiento de producto de partida. | Contexto de presentación del producto. | **Histórico**; puede contener alcance anterior al MVP actual. |
| `PLAN_4.md` | Markdown | Plan de ejecución detallado de Portafolio Intel. | Organizar tareas técnicas y de producto durante una fase anterior. | Referencia de planificación. | **Histórico**; el código y los documentos del repositorio reflejan el estado vigente. |
| `RESUMEN.md` | Markdown | Resumen ejecutivo del dashboard de inversión. | Comunicar de forma breve el propósito inicial. | Lectura de contexto no técnico. | **Histórico**. |
| `developers.google.com_identity_protocols_oauth2_web-server_1787369173404.md` | Markdown | Copia de consulta de la documentación de OAuth 2.0 de Google. | Sustentar la investigación del futuro conector de Google Sheets. | Referencia de investigación, no configuración ejecutable. | **Fuente auxiliar**; use la documentación oficial actualizada antes de implementar OAuth. |
| `finnhub.io_docs_api_rate-limit_1787375977203.md` | Markdown | Captura de consulta sobre límites de API de Finnhub. | Comparar fuentes de cotizaciones. | Material de análisis de proveedores. | **Fuente auxiliar**, no es código ni credencial. |
| `help.portfolio-performance.info_en_reference_file_import_csv-import__1787364512620.md` | Markdown | Captura de consulta sobre importación CSV. | Investigar patrones de importación de movimientos. | Material comparativo. | **Fuente auxiliar**. |
| `supabase.com_pricing_1787375988366.md` | Markdown | Captura de consulta de precios de Supabase. | Evaluar alternativas de infraestructura. | Contexto de investigación. | **Fuente auxiliar**; las condiciones pueden haber cambiado. |
| `twelvedata.com_pricing_1787375952911.md` | Markdown | Captura de consulta de precios de Twelve Data. | Comparar proveedores de mercado. | Contexto de investigación. | **Fuente auxiliar**; no representa una integración configurada. |
| `www.alphavantage.co_documentation__1787375972951.md` | Markdown | Captura de consulta de documentación de Alpha Vantage. | Evaluar fuentes de datos de mercado. | Material comparativo. | **Fuente auxiliar**; no incluye una clave utilizable. |

## 6. Cómo ordenar su carpeta local

| Carpeta sugerida | Archivos que conviene guardar | Uso recomendado |
|---|---|---|
| `01_manual_y_despliegue` | Manual HTML, `README.md`, arquitectura, pruebas y seguridad. | Instalación, configuración y operación de la aplicación. |
| `02_codigo_portafolio_intel` | Repositorio clonado completo, incluido `src/`, `supabase/`, `tests/`, `package.json`. | Desarrollo, mantenimiento y despliegue. |
| `03_video_demo_120s` | Archivo ZIP, guion, mezcla maestra, SRT, storyboard, PNG de referencia y teaser MP4. | Producción y futura edición del vídeo corporativo. |
| `04_investigacion_y_producto` | Alcance/arquitectura, investigación de mercado, conexiones/fiscalidad y módulo de análisis. | Contexto estratégico, decisiones de producto y evolución. |

## 7. Recomendación práctica

Para evitar más mezclas, conserve el archivo `PORTAFOLIO_INTEL_DEMO_VERTICAL_PAQUETE_PRODUCCION.zip` sin modificar como copia maestra audiovisual y trabaje sobre una carpeta descomprimida. Para el software, conserve una copia limpia del repositorio Git y evite copiar dentro de él los archivos `.env.local`, tokens OAuth, claves secretas, extractos financieros o documentos fiscales reales.
