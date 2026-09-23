# Modelos tributarios adicionales a considerar para criptoactivos

**Ámbito:** diseño de producto para residentes y entidades con conexión fiscal española.  
**Fecha de revisión de fuentes:** 26 de agosto de 2026.  
**Principio:** la aplicación debe generar datos trazables y alertas de revisión, no determinar automáticamente obligaciones personales ni presentar declaraciones.

> **Advertencia:** la relevancia de cada modelo depende de la residencia fiscal, la condición de persona física, profesional, sociedad o proveedor, los umbrales aplicables y la normativa del ejercicio. Este documento no sustituye la revisión de un asesor tributario.

## Panorama de prioridades

Los modelos **172** y **173** son los otros formularios específicamente dedicados a monedas virtuales, pero su sujeto obligado habitual no es el inversor particular: son los proveedores de custodia, cambio, intermediación y, en ciertos casos, emisores de nuevas monedas virtuales. Para un gestor de cartera personal, el valor inmediato está en adoptar su nivel de detalle de datos, no en ofrecer su presentación. [1] [2]

| Prioridad de producto | Modelo | Cuándo valorar el módulo | Función prudente en la aplicación |
|---|---|---|---|
| Alta, como capa de datos | 714 — Impuesto sobre el Patrimonio | Cuando el contribuyente deba revisar patrimonio a 31 de diciembre. | Instantánea patrimonial fechada, valor EUR, fuente de valoración, titularidad y evidencia; sin decidir umbrales ni cuota. [3] |
| Alta, como reutilización de datos | 718 — Impuesto Temporal de Solidaridad de las Grandes Fortunas | Solo si el perfil patrimonial y la normativa aplicable hacen pertinente revisarlo. | Reutilizar la instantánea patrimonial, avisar de revisión profesional y no calcular obligación ni importe. [4] |
| Media, exclusiva B2B/proveedor | 172 — Saldos en monedas virtuales | Si la aplicación evoluciona a software para custodios o plataformas establecidas en España. | Exportador técnico separado para datos de titulares, saldos a 31 de diciembre, valoración EUR y origen del valor. [1] |
| Media, exclusiva B2B/proveedor | 173 — Operaciones con monedas virtuales | Si el producto presta intercambio, custodia, intermediación o participa en ICOs en el ámbito de la obligación. | Registro individualizado de operación, fecha, activo, unidades, valor EUR, comisiones y contraprestación. [2] |
| Condicional | 130 — Pago fraccionado de IRPF | Si la operativa se encuadra en una actividad económica en estimación directa. | Separar libro de ingresos/gastos de actividad del cálculo de inversiones; activar solo después de clasificación profesional. [5] |
| Condicional | 303 — IVA | Si existe una actividad sujeta a IVA; no se debe inferir la sujeción desde una operación cripto aislada. | Libro de operaciones de actividad y revisión de tratamiento IVA; no generar autoliquidación automática. [6] |
| Condicional | 200 y, en su caso, 202 — Impuesto sobre Sociedades | Si el titular es una sociedad o entidad sujeta al Impuesto sobre Sociedades. | Perfil de titularidad corporativa, exportación contable y coordinación con asesoría; no reutilizar el borrador de IRPF. [7] |
| Condicional | 210 — IRNR | Si la renta corresponde a un no residente sin establecimiento permanente. | Perfil de residencia y ruta de revisión separada; no mezclar con el flujo de Renta de residentes. [8] |
| Complementario de cartera global | 720 — Bienes y derechos en el extranjero | Solo para categorías ajenas a monedas virtuales que entren en su ámbito. | Mantenerlo como módulo de cartera internacional separado; la propia AEAT enumera los modelos 720 y 721 como declaraciones diferenciadas. [9] |

## Qué deberían aportar los datos del producto

La implementación actual ya cubre una base útil: operaciones por fecha, activo entregado y recibido, unidades, valor en EUR, comisiones, plataforma y lotes FIFO. Para ampliar el producto de forma prudente, la siguiente capa debería añadir **titularidad**, **tipo de titular**, **residencia fiscal**, **naturaleza de la operativa**, **custodio**, **país/situación de custodia**, **saldo a 31 de diciembre**, **origen de la cotización** y evidencia documental. Esos campos sirven tanto para la revisión patrimonial como para distinguir una cartera personal de una actividad o de un servicio a terceros.

La opción de mayor valor inmediato es un **panel de “fotografía patrimonial al 31 de diciembre”** reutilizable por el usuario y su asesor: mostraría unidades, valoración en euros, proveedor de precio y fecha/hora de la referencia. Debe etiquetarse como información para revisión y no como cálculo del modelo 714 o 718. La AEAT describe, para el modelo 172 de proveedores, datos muy similares de saldo, valoración en euros y origen de la cotización, lo que refuerza la conveniencia de conservar la fuente de valoración. [1]

## Modelos 172 y 173: separar usuario y proveedor

El modelo 172 tiene carácter anual y la AEAT lo asocia a personas y entidades residentes, así como establecimientos permanentes, que salvaguardan claves criptográficas privadas en nombre de terceros para mantener, almacenar o transferir monedas virtuales. Incluye identificación de los titulares y saldos a 31 de diciembre por moneda virtual. [1]

El modelo 173 también es anual y está dirigido, entre otros, a servicios de cambio, intermediación, custodia y determinadas ICO. Exige detalle individualizado de adquisiciones, transmisiones, permutas y transferencias, con fecha, unidades, valor en euros, comisiones y, cuando corresponda, contraprestación. [2]

Por tanto, una persona que solo utiliza exchanges no debería recibir en la aplicación un botón de «Presentar 172/173». En cambio, si el producto se abre a proveedores regulados, sería necesario un dominio separado de cumplimiento B2B, revisión legal, trazabilidad de datos de terceros, controles de acceso reforzados y ficheros técnicos específicos.

## Decisión de producto recomendada

| Horizonte | Entregable prudente | Exclusión deliberada |
|---|---|---|
| Próxima iteración | Snapshot de patrimonio a 31 de diciembre y checklist 714/718. | Determinación automática de umbrales, exenciones o cuotas. |
| Después | Perfil fiscal por tipo de titular: persona física inversora, actividad económica, sociedad, no residente y proveedor. | Mezclar en un único borrador IRPF datos de actividad, sociedades o no residentes. |
| B2B opcional | Diseño de exportador 172/173 tras evaluación jurídica y de seguridad. | Presentación directa, gestión de certificados o datos de terceros desde el navegador. |

## Referencias

[1] [AEAT — Preguntas frecuentes del modelo 172: sujetos obligados, contenido y plazo](https://sede.agenciatributaria.gob.es/Sede/todas-gestiones/impuestos-tasas/declaraciones-informativas/modelo-172-declaracion-informativa-sobre-virtuales/preguntas-frecuentes.html)

[2] [AEAT — Preguntas frecuentes del modelo 173: sujetos obligados y operaciones](https://sede.agenciatributaria.gob.es/Sede/todas-gestiones/impuestos-tasas/declaraciones-informativas/modelo-172-declaracion-informativa-sobre-virtuales/preguntas-frecuentes/preguntas-frecuentes-sobre-modelo-173.html)

[3] [AEAT — Modelo 714: Impuesto sobre el Patrimonio](https://sede.agenciatributaria.gob.es/Sede/procedimientoini/G611.shtml)

[4] [AEAT — Modelo 718: Impuesto Temporal de Solidaridad de las Grandes Fortunas](https://sede.agenciatributaria.gob.es/Sede/procedimientoini/GC62.shtml)

[5] [AEAT — Modelo 130: empresarios y profesionales en estimación directa](https://sede.agenciatributaria.gob.es/Sede/procedimientoini/G601.shtml)

[6] [AEAT — Modelo 303: IVA, autoliquidación](https://sede.agenciatributaria.gob.es/Sede/procedimientoini/G414.shtml)

[7] [AEAT — Modelo 200: Impuesto sobre Sociedades](https://sede.agenciatributaria.gob.es/Sede/procedimientoini/GE04.shtml)

[8] [AEAT — Modelo 210: Impuesto sobre la Renta de no Residentes](https://sede.agenciatributaria.gob.es/Sede/procedimientoini/GF00.shtml)

[9] [AEAT — Modelo 721: declaración informativa sobre monedas virtuales situadas en el extranjero](https://sede.agenciatributaria.gob.es/Sede/procedimientoini/GI55.shtml)
