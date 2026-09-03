# Guion de presentación — FIFO y normativa de criptoactivos

**Diapositiva de referencia:** «FIFO conserva la historia de cada activo»  
**Duración sugerida:** 90–120 segundos  
**Audiencia:** usuario final, responsable de producto o asesor que revisa el borrador.  
**Objetivo:** explicar por qué el motor utiliza FIFO, qué datos necesita y cómo se comporta ante información incompleta.

> **Aviso para el presentador:** el contenido es informativo y describe el alcance de producto. No debe presentarse como asesoramiento fiscal individual ni como confirmación de una obligación de declarar.

## Apertura — 15 segundos

> «El cálculo de una venta de criptoactivos no puede partir solo del precio de salida. Para saber si existe ganancia o pérdida debemos reconstruir qué unidades se vendieron y cuánto costaron cuando se adquirieron. Por eso el módulo no trata el saldo como un número agregado: conserva una historia de lotes.»

Mientras se pronuncia esta frase, señale la columna de lotes del lado derecho de la diapositiva y destaque que el **lote 1** es el más antiguo.

## Explicación de la regla FIFO — 30 segundos

> «Cuando existen compras del mismo activo realizadas en fechas y precios distintos, la AEAT indica que las ventas parciales de monedas homogéneas se identifican siguiendo el criterio FIFO: primero se consideran transmitidas las unidades adquiridas antes. En la aplicación, cada compra crea un lote con cantidad y coste, incluidas las comisiones que el usuario ha documentado. Cuando llega una venta, el motor consume los lotes disponibles por orden cronológico.»

Señale visualmente los bloques «Lote 1», «Lote 2» y «Lote 3». Explique que la primera venta se descuenta primero del lote más antiguo y solo continúa con el siguiente si la cantidad transmitida lo exige. Esta regla impide seleccionar arbitrariamente el coste más favorable.

## Fórmula y trazabilidad — 25 segundos

> «El resultado no se inventa ni se calcula contra un precio medio opaco. La fórmula es sencilla y se conserva por operación: valor neto de transmisión menos coste FIFO transmitido. El valor neto de transmisión descuenta las comisiones documentadas de la venta, y el coste FIFO recoge el coste de los lotes que realmente se han consumido.»

Señale la franja inferior de fórmula. Aclare que el resultado es un **resultado de transmisión**, no la cuota final de IRPF: la cuota depende de otras circunstancias y no se calcula en este módulo.

## Control de calidad — 20 segundos

> «La parte crítica es lo que ocurre cuando falta información. Si el CSV contiene una venta pero no contiene suficientes compras previas —o saldo inicial histórico— la aplicación no completa el cálculo con una estimación. La operación queda marcada para revisión. Del mismo modo, se requieren fecha, activo, cantidad, valor en euros y comisiones para que el detalle sea defendible.»

Señale el bloque verde de «Bloqueo por falta de datos». Esta es la garantía principal: **es preferible un borrador incompleto y explícito a una cifra aparentemente exacta pero no trazable**.

## Cierre y transición — 15 segundos

> «En resumen: FIFO convierte el historial de operaciones en una cadena verificable de lotes, ventas y costes. El siguiente paso es aplicar la misma lógica a las permutas, porque intercambiar una criptomoneda por otra también puede generar una ganancia o pérdida y, además, crea un nuevo lote para el futuro.»

Esta transición enlaza directamente con la diapositiva «La permuta crea un nuevo lote trazable».

## Anclas normativas para preguntas

| Pregunta habitual | Respuesta de alcance de producto |
|---|---|
| ¿Por qué FIFO? | La AEAT indica FIFO para ventas parciales de monedas homogéneas adquiridas en fechas y precios distintos. [1] |
| ¿Qué ocurre con una permuta? | Puede generar ganancia o pérdida; el valor aplicable se usa como adquisición de la moneda recibida. [1] [2] |
| ¿Este resultado es mi impuesto a pagar? | No. Es un detalle de ganancias o pérdidas por transmisión; no calcula la cuota personal ni presenta el Modelo 100. |
| ¿Qué sucede sin compras previas? | El sistema marca la venta para revisión y solicita completar lotes históricos o saldo inicial documentado. |

## Referencias

[1] [AEAT — Compra y venta de monedas virtuales: tributación en el IRPF del inversor](https://sede.agenciatributaria.gob.es/Sede/ayuda/manuales-videos-folletos/manuales-practicos/irpf-2025/c11-ganancias-perdidas-patrimoniales/monedas-virtuales/compra-venta-monedas-virtuales-tributacion-inversor.html)

[2] [AEAT — Ganancias y pérdidas patrimoniales derivadas de la transmisión o permuta de monedas virtuales](https://sede.agenciatributaria.gob.es/Sede/Ayuda/24Presentacion/100/7_6_6_2/ganancias_perdidas_monedas_virtuales.html)
