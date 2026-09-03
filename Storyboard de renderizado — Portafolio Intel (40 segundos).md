# Storyboard de renderizado — Portafolio Intel (40 segundos)

> **Formato maestro:** 1080 × 1920, vertical 9:16, 25 fps, Rec.709.  
> **Estructura:** cuatro clips de diez segundos.  
> **Audio maestro:** `../audio/portafolio-intel-mezcla-master-40s.wav`.  
> **Subtítulos:** `../subtitles/portafolio-intel-demo-40s-es.srt`.  
> **Referencia visual:** `../../portafolio-intel-video-reference.png`.  
> **Clip existente reutilizable:** `01_datos_dispersos.mp4` de la producción anterior, recortado o usado como apertura de 00:00 a 00:10.

## Dirección creativa

La pieza debe tener la apariencia de una demo corporativa fintech de alta confianza, no de una campaña de inversión. Use un fondo navy `#12203B`, interacción azul `#2F67DF`, confirmaciones limitadas en verde `#148765`, tarjetas claras y movimiento de cámara controlado. Mantenga libre la franja superior e inferior para subtítulos y controles nativos de plataformas móviles.

Se prohíbe mostrar texto legible generado, marcas de terceros, importes, posiciones, correos, datos de clientes, credenciales, rendimiento garantizado o botones de compra/venta. Las frases exactas se incorporan después en edición; los elementos UI generados deben utilizar glifos y líneas abstractas.

| Clip | TC | Objetivo | Prompt de renderización en inglés | Texto añadido en edición | Estado |
|---|---:|---|---|---|---|
| `01_datos_dispersos.mp4` | 00:00–00:10 | Evidenciar el coste de consolidar información dispersa. | `Corporate fintech product-demo opening. Abstract spreadsheet grids, generic platform panels and email-like cards drift separately in a dark navy portrait workspace, then smoothly converge into one clean blue financial dashboard hub. Visualize less manual consolidation effort. Premium enterprise motion, electric blue and restrained green accents, no people, brands, readable text, numbers or client data; safe areas for captions.` | **Menos consolidación manual.** | **Ya generado**; 720 × 1280, sin audio. |
| `02_panel_unificado_40s.mp4` | 00:10–00:20 | Mostrar una vista única segura de cartera. | `Portrait corporate fintech dashboard. Abstract portfolio cards, a performance curve and alert indicators arrange themselves into one clean command center inside a smartphone-like interface. A gentle push-in communicates a single secure view and less time spent searching for context. Deep navy, electric blue and restrained green. No people, brands, readable text, numbers or client data; leave clear safe areas for captions.` | **Una vista segura. Más contexto.** | **Pendiente de renderizar** cuando vuelva el cupo. |
| `03_fuentes_preview_40s.mp4` | 00:20–00:30 | Mostrar configuración y validación antes de escritura. | `Portrait fintech product-demo interface. A clean abstract source configuration panel shows selectable sheet, tab, authorized range and column-mapping glyphs. It transitions into a preview table that separates valid abstract rows from a small number of restrained warning rows while a locked database remains unchanged. Communicate validation before writing and less rework. Dark navy, white cards, electric blue, restrained green and amber. No readable text, spreadsheet brands, real URLs, values or client data.` | **Configure. Previsualice. Valide.** | **Pendiente de renderizar** cuando vuelva el cupo. |
| `04_alertas_cierre_40s.mp4` | 00:30–00:40 | Priorizar excepciones y cerrar con control operativo. | `Portrait enterprise fintech closing scene. A dashboard filters abstract signals into a few calm prioritized exception cards, then one protected blue data pulse updates a chart in place without reload. The cards, a secure organization symbol and subtle data pathways settle into one elegant end-card composition on deep navy, leaving center and lower space for a manual call to action. No readable text, brands, numbers, people or client data.` | **Eficiencia · Trazabilidad · Control**<br>**Solicite una demostración** | **Pendiente de renderizar** cuando vuelva el cupo. |

## Montaje y exportación

1. Use el clip ya generado como primera toma. Cuando se restablezca el cupo, genere los clips 02–04 a 720p vertical como mínimo, usando la referencia visual común.
2. Una las cuatro tomas en el orden de la tabla. Cada una debe durar exactamente diez segundos. Si se aplican transiciones, use fundidos de seis fotogramas dentro de cada bloque sin cambiar la duración global.
3. Añada `portafolio-intel-mezcla-master-40s.wav`. La locución concluye antes del segundo 40 para dejar una breve respiración musical para la llamada a la acción.
4. Importe el archivo SRT. Use blanco al 92 %, sombra navy suave y máximo dos líneas, respetando la zona segura inferior.
5. Exporte un MP4 H.264, 1080 × 1920, 25 fps, duración total de 40 segundos. Añada texto y CTA mediante el editor, no mediante la generación de vídeo.

## Comprobación de salida

| Control | Criterio |
|---|---|
| Duración | 00:00:40 exactos. |
| Imagen | 9:16 sin bandas laterales y con identidad navy/azul/verde coherente. |
| Audio | Voz inteligible sobre música atenuada; tres segundos finales útiles para el cierre. |
| Subtítulos | Sincronizados, máximo dos líneas y dentro de la zona segura. |
| Seguridad | Solo datos sintéticos/abstractos; ausencia de secretos y de referencias a rendimientos garantizados. |
| Exactitud | Google Sheets se muestra como configuración/previsualización; no como importación real ya disponible. |
