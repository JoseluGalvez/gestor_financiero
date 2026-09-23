# Especificación de producción — Vídeo 04: Alertas y cierre

**Proyecto:** Portafolio Intel  
**Segmento:** `04_alertas_cierre_40s.mp4`  
**Posición en el vídeo maestro:** 00:30–00:40  
**Duración objetivo:** aproximadamente 10 segundos; duración operativa recomendada: `10,000 s` exactos en el montaje final  
**Formato:** vertical 9:16  
**Idioma del texto añadido posteriormente:** español  
**Audio generado por la IA de vídeo:** no; el audio se incorpora en la edición maestra  
**Estado:** especificación lista para generación; la generación puede depender de la disponibilidad de la cuenta.

---

## 1. Objetivo narrativo

El clip 04 cierra la demostración mostrando que el sistema no abruma al usuario con todos los eventos, sino que filtra señales y deja visibles únicamente unas pocas excepciones priorizadas. La escena debe comunicar **eficiencia, trazabilidad y control operativo**.

El cierre debe continuar de forma natural desde la previsualización y validación del clip 03. La base de datos abstracta permanece protegida, una señal azul atraviesa un símbolo organizativo seguro y una curva se actualiza en el mismo lugar sin recargar toda la pantalla. El plano termina estable y despejado para añadir durante la edición la llamada a la acción:

> **Eficiencia · Trazabilidad · Control**  
> **Solicite una demostración**

El vídeo no debe parecer una campaña de inversión, una recomendación financiera ni una demostración de operaciones bursátiles. Solo debe presentar una interfaz abstracta de gestión y validación de información financiera.

## 2. Storyboard temporal del clip

| Tiempo aproximado | Acción visual | Intención | Texto que se añadirá en edición |
|---:|---|---|---|
| 00:00–00:02 | El estado final del clip 03 —previsualización con filas abstractas y advertencias ámbar— permanece visible. Las señales de validación se agrupan suavemente. | Confirmar que la información ya ha sido revisada. | Sin texto nuevo o inicio de subtítulo. |
| 00:02–00:04 | La interfaz filtra muchas señales difusas y deja solo dos o tres tarjetas de excepción abstractas, sin etiquetas legibles. | Priorizar lo importante y reducir ruido operativo. | **Eficiencia** puede aparecer en edición si corresponde al SRT. |
| 00:04–00:07 | Un pulso azul protegido recorre una ruta de datos hacia un glifo abstracto de organización segura. Una curva sin etiquetas se actualiza en el mismo panel, sin transición de recarga completa. | Mostrar trazabilidad, actualización local y control de acceso. | **Trazabilidad** puede aparecer en edición si corresponde al SRT. |
| 00:07–00:10 | Las tarjetas se estabilizan junto al símbolo de seguridad y la curva actualizada. La cámara termina con una composición limpia, calmada y con espacio negativo central e inferior. | Preparar el cierre y la llamada a la acción. | **Control** y **Solicite una demostración**. |

La animación debe ser lenta, precisa y empresarial. No se necesitan personas, manos, teléfonos reales, logotipos ni escenas de negociación.

## 3. Prompt listo para una IA de vídeo

Utilizar la siguiente descripción como prompt principal. Mantener el prompt en inglés si el proveedor genera mejor continuidad visual con instrucciones anglófonas.

```text
Continue directly from the supplied vertical reference frame. Preserve the same centered smartphone-like fintech interface, deep navy 3D space, rounded translucent panels, electric-blue data paths, restrained green status accents, and controlled premium enterprise motion-graphics language.

Create a ten-second corporate product-demo closing scene. At the beginning, the abstract source-validation preview from the previous shot is still visible: neutral preview rows, a very small number of amber warning signals, and a locked abstract database icon in the background. Gradually filter the diffuse signals into only two or three calm, prioritized exception cards with no readable labels. The cards should feel organized and actionable, not alarming.

Then animate one protected electric-blue data pulse through an abstract secure organization glyph. The pulse updates an unlabeled performance curve in place inside the same interface, with no full-page reload and no abrupt scene change. Keep the motion controlled, stable, and easy to follow. The secure organization glyph, the few exception cards, and the updated curve should settle into one elegant final composition.

Leave broad empty safe areas at the top and bottom, and keep the center and lower-center area visually calm for Spanish call-to-action text added later in an editor. The overall tone is enterprise software: efficiency, traceability, and operational control. It must never look like investment advertising or a trading recommendation.

Do not show people, hands, brands, logos, third-party platform identities, readable text, numbers, percentages, prices, dates, URLs, spreadsheet names, account values, client data, credentials, API keys, transaction buttons, buy or sell controls, financial guarantees, or claims of profitability. Use only abstract UI glyphs and non-readable lines. Do not depict a real import or a completed financial transaction. No audio.
```

## 4. Referencias visuales y continuidad

La referencia principal debe ser el último fotograma del clip 03, porque contiene la composición que el clip 04 debe continuar sin salto visual:

| Recurso | Ruta esperada | Uso |
|---|---|---|
| Fotograma final del clip 03 | `/home/ubuntu/portafolio_intel_video/03_end_reference.png` | Imagen de referencia o primer fotograma de continuidad. |
| Clip anterior | `/home/ubuntu/portafolio_intel_video/03_fuentes_preview_40s.mp4` | Comprobar que el inicio del clip 04 recoge el estado de previsualización. |
| Storyboard maestro | `/home/ubuntu/upload/Storyboardderenderizado—PortafolioIntel(40segundos).md` | Fuente de tiempos, estética, texto y controles de salida. |
| Estado de producción | `/home/ubuntu/portafolio_intel_video/ESTADO_PRODUCCION.md` | Inventario y estado de los segmentos. |

La referencia visual debe conservar la relación de aspecto 9:16. No añadir bandas laterales, marcos blancos ni fondos que cambien la proporción. Si la IA exige una imagen inicial, usar `03_end_reference.png` como primer fotograma o imagen de referencia; no usar imágenes de vídeos ajenos ni capturas con datos reales.

## 5. Inventario de los cuatro segmentos

| Segmento | Código temporal | Archivo esperado | Estado conocido | Uso en el montaje |
|---|---:|---|---|---|
| 01 — Datos dispersos | 00:00–00:10 | `01_datos_dispersos.mp4` | Generado o recibido como material de apertura. | Evidenciar información separada que converge en un panel. |
| 02 — Panel unificado | 00:10–00:20 | `02_panel_unificado_40s.mp4` | Debe estar generado antes del montaje final. | Mostrar una vista única y segura de cartera. |
| 03 — Fuentes y previsualización | 00:20–00:30 | `03_fuentes_preview_40s.mp4` | Generado y verificado; referencia final en `03_end_reference.png`. | Mostrar configuración y validación antes de escribir. |
| 04 — Alertas y cierre | 00:30–00:40 | `04_alertas_cierre_40s.mp4` | Pendiente de generar con este documento. | Priorizar excepciones, actualizar sin recarga y cerrar la demo. |

Rutas de trabajo recomendadas:

```text
/home/ubuntu/portafolio_intel_video/01_datos_dispersos.mp4
/home/ubuntu/portafolio_intel_video/02_panel_unificado_40s.mp4
/home/ubuntu/portafolio_intel_video/03_fuentes_preview_40s.mp4
/home/ubuntu/portafolio_intel_video/04_alertas_cierre_40s.mp4
```

Si uno de los cuatro clips no está presente, el montaje no debe sustituirlo por imágenes inventadas ni por datos financieros reales. El proceso debe detenerse y marcar el segmento como pendiente.

## 6. Especificaciones de generación del clip 04

| Parámetro | Valor requerido |
|---|---|
| Duración solicitada | 10 segundos; aceptar una diferencia mínima solo antes del conformado final. |
| Relación de aspecto | 9:16, vertical. |
| Resolución mínima | 720 × 1280 durante generación. |
| Resolución maestra de exportación | 1080 × 1920. |
| Frecuencia del clip generado | 24 o 25 fps; conformar todo el montaje a 25 fps. |
| Códec de vídeo | H.264, perfil compatible con reproducción móvil. |
| Audio | Desactivado en la generación del clip. |
| Color | Fondo navy profundo, azul eléctrico, verde limitado y ámbar solo para excepciones. |
| Texto generado | Ninguno legible. El texto se añadirá posteriormente en edición. |
| Datos | Solo interfaces abstractas y sintéticas. |
| Movimiento | Cámara lenta, push-in suave y transiciones sin cortes agresivos. |

## 7. Comprobación del bloque de aproximadamente diez segundos

Después de generar el clip, comprobar técnicamente el archivo. En un terminal con `ffprobe` disponible:

```bash
ffprobe -v error \
  -show_entries format=duration:stream=codec_name,width,height,avg_frame_rate \
  -of default=noprint_wrappers=1 \
  /home/ubuntu/portafolio_intel_video/04_alertas_cierre_40s.mp4
```

Criterios de aceptación del clip 04:

| Control | Criterio de aceptación |
|---|---|
| Archivo | Existe, se puede abrir y no está vacío. |
| Duración | Idealmente `10,000 s`; si la IA produce `10,005 s`, recortar o conformar antes del montaje. |
| Imagen | Vertical 9:16, sin bandas laterales y sin deformación. |
| Resolución | Como mínimo 720 × 1280 en el intermedio. |
| Vídeo | H.264, reproducción correcta y sin fotogramas corruptos. |
| Audio | Ausente o eliminado; el audio se incorpora una sola vez en el vídeo maestro. |
| Continuidad | El primer instante parte del estado de previsualización del clip 03. |
| Seguridad | No contiene texto legible, marcas, credenciales, datos reales, importes ni promesas de rentabilidad. |
| Cierre | Deja zonas seguras libres para subtítulos y CTA en edición. |

Si la duración es `10,005 s`, puede conformarse a diez segundos con un recorte determinista. No aplicar una velocidad que produzca movimientos artificiales si basta con cortar el exceso de milisegundos.

## 8. Montaje de los cuatro clips

El montaje final debe respetar este orden:

```text
01_datos_dispersos.mp4
02_panel_unificado_40s.mp4
03_fuentes_preview_40s.mp4
04_alertas_cierre_40s.mp4
```

Cada bloque ocupa diez segundos. Las transiciones, si se utilizan, deben permanecer dentro de los límites de cada bloque y no aumentar la duración total. El formato maestro es 1080 × 1920, 25 fps, Rec.709, H.264.

El audio maestro y el archivo de subtítulos son recursos externos al clip 04 y deben añadirse solo en la etapa de conformado:

```text
../audio/portafolio-intel-mezcla-master-40s.wav
../subtitles/portafolio-intel-demo-40s-es.srt
```

El audio no debe duplicarse si algún clip contiene una pista accidental. Las frases finales se incorporan en edición, con blanco al 92 %, sombra navy suave, máximo dos líneas y respetando la zona segura inferior.

## 9. Validación del vídeo maestro

El resultado final debe llamarse, por ejemplo:

```text
/home/ubuntu/portafolio_intel_video/portafolio_intel_demo_vertical_40s_final.mp4
```

La validación mínima es:

```bash
ffprobe -v error \
  -show_entries format=duration:stream=codec_name,width,height,avg_frame_rate \
  -of default=noprint_wrappers=1 \
  /home/ubuntu/portafolio_intel_video/portafolio_intel_demo_vertical_40s_final.mp4
```

Debe comprobarse lo siguiente:

| Control final | Resultado requerido |
|---|---|
| Duración total | 40,000 segundos, con tolerancia de conformado inferior a un fotograma. |
| Resolución | 1080 × 1920. |
| Aspecto | 9:16, sin bandas laterales. |
| Frecuencia | 25 fps. |
| Códec | H.264 para vídeo; audio compatible con reproducción móvil. |
| Audio | Voz inteligible sobre música atenuada y aproximadamente tres segundos útiles para el cierre. |
| Subtítulos | Sincronizados, máximo dos líneas y dentro de la zona segura. |
| Continuidad | Sin saltos evidentes entre los estados de interfaz, el color navy y el tratamiento azul/verde. |
| Privacidad | Sin datos reales, secretos, credenciales, marcas de terceros ni identificadores de clientes. |
| Exactitud | Google Sheets aparece solo como configuración/previsualización abstracta; no se presenta una importación real. |

## 10. Checklist de entrega

- [ ] El archivo `04_alertas_cierre_40s.mp4` se ha generado usando `03_end_reference.png`.
- [ ] El clip 04 dura aproximadamente diez segundos y cumple 9:16.
- [ ] El clip 04 no contiene audio, texto legible ni datos financieros reales.
- [ ] La primera imagen es compatible con el final del clip 03.
- [ ] Los cuatro archivos existen antes de comenzar el montaje.
- [ ] Cada segmento ocupa su bloque temporal de diez segundos.
- [ ] El audio maestro se añade una sola vez.
- [ ] El SRT se añade en la zona segura y no se incrusta texto generado por la IA.
- [ ] El vídeo maestro dura 40 segundos y está codificado en H.264, 1080 × 1920 y 25 fps.
- [ ] Se ha comprobado el archivo final con `ffprobe` y una reproducción completa.
- [ ] La producción se etiqueta como demo corporativa con datos sintéticos/didácticos.

## Referencia de origen

Este documento deriva del storyboard maestro `Storyboardderenderizado—PortafolioIntel(40segundos).md`, especialmente de su definición del bloque 00:30–00:40, dirección creativa, restricciones de privacidad y criterios de exportación.

> La IA debe generar únicamente una representación abstracta de una interfaz corporativa. No debe producir recomendaciones de inversión, resultados financieros, datos de mercado reales ni afirmaciones de rentabilidad.

**Estado actual:** `video04.md` está listo para ser entregado a una IA de vídeo o a un operador de edición. El clip 04 y el montaje maestro requieren que estén disponibles la función de generación y los cuatro segmentos de vídeo, además del audio y el SRT indicados.
