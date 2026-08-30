# Alcance fiscal de Criptomonedas — España

**Fecha de consulta:** 25 de agosto de 2026  
**Estado:** especificación de producto para un borrador revisable; no prepara ni presenta declaraciones ante la AEAT.

> **Aviso:** el módulo es una ayuda de cálculo y trazabilidad. La normativa y el resultado del contribuyente deben ser revisados por un asesor fiscal antes de presentar cualquier declaración.

## Hechos oficiales que condicionan el diseño

La AEAT indica que una venta de monedas virtuales por dinero fiduciario puede producir una ganancia o pérdida patrimonial por la diferencia entre valor de transmisión y adquisición; los gastos directamente relacionados y satisfechos por el contribuyente pueden formar parte del cálculo. En ventas parciales de monedas homogéneas adquiridas en fechas y precios distintos, la identificación se realiza con criterio FIFO. La ganancia o pérdida se imputa al ejercicio de entrega de la moneda y se integra, en el supuesto descrito de inversor fuera de actividad económica, en la renta del ahorro [1].

El intercambio de una moneda virtual por otra diferente es una permuta y también puede producir ganancia o pérdida patrimonial. La AEAT describe como valor de transmisión el mayor entre el valor de mercado del activo entregado y el del recibido; dicho valor pasa a ser el valor de adquisición de la moneda recibida para una transmisión posterior. El módulo debe exigir un valor de mercado en euros para las permutas y señalizar las operaciones que no lo contengan, en lugar de inventarlo [1] [2].

La ayuda de Renta exige informar separadamente cada operación de venta de cada tipo de moneda virtual y contempla la denominación del activo, la contraprestación recibida, valor de adquisición, valor de transmisión y gastos aplicables [2]. Por tanto, el resultado de la aplicación será un detalle verificable por transmisión, no una cuota íntegra estimada ni la simulación global de la declaración personal.

| Área del módulo | Decisión de implementación | Motivo |
|---|---|---|
| Operaciones incluidas | Compras, ventas y permutas con fecha, activo, cantidad, contrapartida, valor EUR y comisiones. | El FIFO necesita lotes de adquisición; ventas y permutas son transmisiones que generan el detalle fiscal. |
| Método de inventario | FIFO por activo y contribuyente, sobre la secuencia cronológica local. | Es el criterio indicado para monedas homogéneas en ventas parciales. [1] [2] |
| Permutas | Baja el activo entregado, calcula la ganancia/pérdida y crea un lote del activo recibido al valor de transmisión aplicable. | La AEAT califica la permuta y determina la base de la adquisición posterior. [1] |
| Datos insuficientes | Se marcan advertencias y no se totaliza como cálculo confirmado. | El valor de mercado, la fecha, las cantidades y las comisiones son materialmente relevantes. |
| Resultado | Borrador exportable y revisable, con trazabilidad de lotes, advertencias y fuentes. | No sustituye la declaración del Modelo 100 ni un asesoramiento profesional. |

## Separación respecto al modelo 721

El Modelo 721 es una declaración informativa distinta del IRPF. Puede afectar a residentes que tengan determinadas monedas virtuales situadas en el extranjero, custodiadas por terceros, y requiere información individualizada por moneda virtual, entidad de custodia, unidades y valoración en euros [3] [4]. La obligación no aplica cuando el saldo conjunto en el extranjero a 31 de diciembre no supera 50.000 euros; si se supera, se informa sobre todas las monedas virtuales afectadas. La AEAT fija, con carácter general, un plazo entre el 1 de enero y el 31 de marzo del año siguiente, sujeto a las condiciones de la obligación [5] [6].

La aplicación incorporará una **lista de revisión potencial del modelo 721**, no un formulario de presentación ni una afirmación automática de obligación. El CSV de ventas y permutas no basta para determinar custodia, residencia del custodio, saldos de cierre ni obligaciones anteriores. Por ello el módulo solicitará y verificará esos campos de forma explícita antes de mostrar una alerta de revisión.

## Fuera del alcance inicial

No se calcula minería, staking, lending, airdrops, NFT, rendimientos de actividad económica, cambios de residencia, operaciones de margen, derivados, pérdidas por insolvencia o compensaciones con otras rentas. Tampoco se calcula la cuota final de IRPF, pues depende de datos personales, base imponible, compensaciones y normativa aplicable al ejercicio.

## Referencias

[1] [AEAT — Compra y venta de monedas virtuales: tributación en el IRPF del inversor](https://sede.agenciatributaria.gob.es/Sede/ayuda/manuales-videos-folletos/manuales-practicos/irpf-2025/c11-ganancias-perdidas-patrimoniales/monedas-virtuales/compra-venta-monedas-virtuales-tributacion-inversor.html)  
[2] [AEAT — Ganancias y pérdidas patrimoniales derivadas de la transmisión o permuta de monedas virtuales](https://sede.agenciatributaria.gob.es/Sede/Ayuda/24Presentacion/100/7_6_6_2/ganancias_perdidas_monedas_virtuales.html)  
[3] [AEAT — Preguntas frecuentes del modelo 721: obligados](https://sede.agenciatributaria.gob.es/Sede/todas-gestiones/impuestos-tasas/declaraciones-informativas/modelo-721-decla-sobre-monedas-extranjero/preguntas-frecuentes-sobre-modelo-721.html)  
[4] [AEAT — Preguntas frecuentes del modelo 721: información requerida](https://sede.agenciatributaria.gob.es/Sede/todas-gestiones/impuestos-tasas/declaraciones-informativas/modelo-721-decla-sobre-monedas-extranjero/preguntas-frecuentes-sobre-modelo-721/que-informacion-debe-suministrarse-modelo-721.html)  
[5] [AEAT — Preguntas frecuentes del modelo 721: supuestos no incluidos](https://sede.agenciatributaria.gob.es/Sede/todas-gestiones/impuestos-tasas/declaraciones-informativas/modelo-721-decla-sobre-monedas-extranjero/preguntas-frecuentes-sobre-modelo-721/respecto-que-monedas-virtuales-no-informacion.html)  
[6] [AEAT — Preguntas frecuentes del modelo 721: plazo de presentación](https://sede.agenciatributaria.gob.es/Sede/todas-gestiones/impuestos-tasas/declaraciones-informativas/modelo-721-decla-sobre-monedas-extranjero/preguntas-frecuentes-sobre-modelo-721/plazo-presentacion-modelo-721.html)
