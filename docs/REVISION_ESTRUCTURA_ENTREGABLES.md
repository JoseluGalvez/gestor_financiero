# Revisión de la estructura de entregables

> **Conclusión:** la estructura propuesta cubre la documentación, el código, la investigación y el paquete audiovisual. Para que sea realmente operable y recuperable, conviene añadir tres áreas críticas: un registro de entrega, una carpeta de operación/recuperación sin secretos y un manifiesto de estado de la demo de vídeo. No se recomienda guardar claves, exportaciones financieras reales ni tokens dentro de esta estructura.

## Evaluación ejecutiva

| Área propuesta | Cobertura actual | Evaluación | Ajuste necesario |
|---|---|---|---|
| `01_manual_y_despliegue` | Manual HTML, README, arquitectura y seguridad. | Adecuada para una primera instalación. | Añadir una ficha de versión y un registro de entrega. |
| `02_codigo_portafolio_intel` | Repositorio, frontend, migraciones, Edge Function y pruebas. | Adecuada si se conserva como clon Git. | Añadir una referencia al commit desplegado y no sustituir Git por copias manuales. |
| `03_video_demo_120s` | Guion, audio, SRT, storyboard, referencia y teaser. | Parcialmente completa. | Añadir manifiesto de renderizado: los clips 02–12 siguen pendientes y no existe aún el MP4 final de 120 segundos. |
| `04_investigacion_y_producto` | Alcance, mercado, conectores, fiscalidad y análisis. | Completa como carpeta de consulta. | Marcar documentos históricos para no confundirlos con el estado actual. |
| Operación, recuperación y evidencias | Dispersas entre documentación y servicios externos. | **Hueco crítico.** | Crear carpeta separada sin secretos para despliegue, rollback, backups y responsables. |

## Entregables críticos que faltan o requieren una carpeta explícita

| Prioridad | Entregable / carpeta | Contenido mínimo | Por qué es crítico | Regla de seguridad |
|---|---|---|---|---|
| Alta | `00_LEEME_Y_REGISTRO/ENTREGA_Y_VERSIONES.md` | Fecha, repositorio, rama, commit, URL de producción, responsable, lista de paquetes y estado. | Permite saber qué versión es la fuente de verdad y evitar mezclar descargas antiguas. | Solo nombres de variables y URL públicas; nunca valores de claves. |
| Alta | `05_OPERACION_Y_RECUPERACION/GUIA_DEPLOY_ROLLBACK.md` | Pasos de despliegue, comprobaciones, reversión a commit previo y contactos responsables. | Sin esta guía, un error en producción puede convertirse en una interrupción prolongada. | No incluir credenciales de Vercel, Supabase ni GitHub. |
| Alta | `05_OPERACION_Y_RECUPERACION/REGISTRO_BACKUPS.md` | Método, frecuencia, ubicación segura, última prueba de restauración y responsable. | La base de datos contiene información financiera; una copia no probada no es una recuperación garantizada. | Guardar solamente metadatos; no adjuntar dumps de producción en la carpeta compartida. |
| Alta | `03_VIDEO_DEMO_120S/ESTADO_RENDERIZADO.md` | Lista de clips 01–12, duración, referencia, fecha y estado de aprobación. | Evita confundir el teaser de 10 segundos con el vídeo final de 120 segundos. | Usar únicamente activos sintéticos o aprobados. |
| Media | `05_OPERACION_Y_RECUPERACION/MANIFIESTO_ENTORNOS.md` | Tabla de local, preview, staging y producción; URL, proyecto Supabase y variables requeridas por nombre. | Separa correctamente los entornos y reduce el riesgo de desplegar contra producción por error. | No copiar valores de `.env.local`, OAuth ni `service_role`. |
| Media | `02_CODIGO_PORTAFOLIO_INTEL/RELEASE_MANIFEST.md` | Commit de cada release, versión Node, comandos de validación y resultado. | Hace reproducible la compilación y facilita auditorías o rollback. | No incluir logs con datos personales. |
| Media | `04_INVESTIGACION_Y_PRODUCTO/ESTADO_CAPACIDADES.md` | Matriz de implementado, en preparación y bloqueado, incluyendo Google Sheets OAuth, fiscalidad y vídeo. | Impide comunicar capacidades futuras como si estuvieran activas. | Debe conservar los límites de asesoramiento y fiscalidad. |
| Media | `06_DATOS_DEMO_Y_QA/` | Hoja ficticia, ejemplos CSV/XLSX sintéticos y resultados de pruebas no sensibles. | Separa claramente la validación del uso de datos reales. | Prohibido copiar extractos reales, ISIN de clientes o informes fiscales. |
| Baja | `00_LEEME_Y_REGISTRO/CHECKSUMS.sha256` | Huellas de los ZIP, vídeo y audio maestros. | Facilita detectar copias dañadas o modificadas. | Se generan tras congelar la entrega final. |

## Estructura recomendada

```text
Portafolio-Intel-Entrega/
├── 00_LEEME_Y_REGISTRO/
│   ├── ENTREGA_Y_VERSIONES.md
│   ├── CHECKSUMS.sha256
│   └── INVENTARIO_ENTREGABLES_PORTAFOLIO_INTEL.md
├── 01_MANUAL_Y_DESPLIEGUE/
│   ├── MANUAL_DESPLIEGUE_PORTAFOLIO_INTEL.html
│   ├── README.md
│   ├── ARQUITECTURA_DATOS_REACTIVOS.md
│   └── PRUEBAS_Y_SEGURIDAD_PRODUCCION.md
├── 02_CODIGO_PORTAFOLIO_INTEL/
│   ├── gestor_financiero/                 # clon Git, incluida carpeta .git
│   └── RELEASE_MANIFEST.md
├── 03_VIDEO_DEMO_120S/
│   ├── PORTAFOLIO_INTEL_DEMO_VERTICAL_PAQUETE_PRODUCCION.zip
│   ├── GUION_DEMO_VERTICAL_CORPORATIVA_120S.md
│   ├── audio/
│   ├── subtitles/
│   ├── storyboard/
│   ├── reference/
│   ├── clips/
│   └── ESTADO_RENDERIZADO.md
├── 04_INVESTIGACION_Y_PRODUCTO/
│   ├── ALCANCE_ARQUITECTURA.md
│   ├── INVESTIGACION_DATOS_MERCADO.md
│   ├── CONEXIONES_Y_FISCALIDAD.md
│   ├── MODULO_ANALISIS_FINANCIERO.md
│   └── ESTADO_CAPACIDADES.md
├── 05_OPERACION_Y_RECUPERACION/
│   ├── GUIA_DEPLOY_ROLLBACK.md
│   ├── MANIFIESTO_ENTORNOS.md
│   └── REGISTRO_BACKUPS.md
└── 06_DATOS_DEMO_Y_QA/
    ├── Google-Sheets-ficticia.url
    ├── ejemplos-csv-xlsx-sinteticos/
    └── resultados-pruebas-no-sensibles/
```

## Situación específica de la demo de vídeo

El paquete audiovisual sí contiene los elementos de producción principales: guion, locución, música, mezcla de 120 segundos, subtítulos, storyboard, imagen de referencia y el clip de apertura. Sin embargo, **no contiene aún el vídeo final de dos minutos**. El límite diario de generación permitió producir solamente `01_datos_dispersos.mp4`; el storyboard define los clips 02–12 que deben generarse y ensamblarse cuando se restablezca el cupo.

## Salvaguarda decisiva

> La estructura de entrega no debe convertirse en un almacén de secretos o datos reales. Mantenga `.env.local`, claves Supabase, tokens OAuth, exportaciones SQL, extractos de cartera, documentos fiscales y copias de seguridad productivas fuera de estas carpetas compartidas, protegidos en un gestor de secretos, almacenamiento cifrado o el servicio administrado correspondiente.

## Próximo paso recomendado

El ajuste más útil es crear primero `00_LEEME_Y_REGISTRO/ENTREGA_Y_VERSIONES.md`, `03_VIDEO_DEMO_120S/ESTADO_RENDERIZADO.md` y `05_OPERACION_Y_RECUPERACION/GUIA_DEPLOY_ROLLBACK.md`. Con estos tres archivos, la estructura pasa de ser una organización de archivos a una entrega que puede mantenerse, recuperarse y completar sin ambigüedad.
