# Validación — Plataformas y Criptomonedas

**Fecha:** 25 de agosto de 2026  
**Ámbito:** navegación autenticada, comparación de fuentes y borrador local de operaciones con criptoactivos.

## Navegación y comparación

La barra lateral autenticada incorpora las entradas **Plataformas** y **Criptomonedas** junto a las vistas existentes. En escritorio permanece disponible a la izquierda; en pantallas estrechas se reorganiza en una cuadrícula navegable para mantener las rutas accesibles.

La vista Plataformas consulta solo transacciones ya autorizadas para la organización mediante las políticas RLS existentes. El agregado limita el análisis a compras y ventas con instrumento, cantidad y divisa base identificados; ordena cada fuente de forma cronológica y consume lotes FIFO. Un movimiento en divisa distinta, sin identificación de activo o una venta sin lotes anteriores no se presenta como resultado fiable y se explica mediante una advertencia de cobertura.

| Indicador | Definición aplicada |
|---|---|
| Ingresos netos | Importe bruto de ventas menos comisiones registradas. |
| Coste transmitido | Coste de los lotes FIFO que se consumen para las ventas trazables. |
| Resultado realizado | Ingresos netos menos coste transmitido. |
| Rentabilidad realizada | Resultado realizado dividido entre coste transmitido, cuando el coste es positivo. |

## Motor de Criptomonedas

El archivo CSV se abre mediante la interfaz del navegador, se transforma en memoria y se elimina al pulsar **«Eliminar de memoria»**, al recargar o al cerrar la pestaña. El componente no usa `localStorage`, no envía el contenido a Supabase y no genera una solicitud a la AEAT.

La prueba determinista `tests/verify-crypto-tax.mts` comprobó una secuencia de compras de BTC, una venta parcial, una permuta BTC→ETH, la venta posterior de ETH y una venta de SOL sin lotes previos. El resultado fue correcto: la venta consumió el primer lote FIFO, la permuta creó el coste del lote ETH recibido y la venta sin inventario quedó sin resultado confirmado y marcada para revisión.

| Comprobación | Resultado |
|---|---|
| Prueba FIFO, venta, permuta y lote faltante | Correcta: 4 transmisiones, 1 pendiente de revisión. |
| `npm run lint` | Correcto, sin errores ni advertencias. |
| `npm run build` | Correcto con Next.js 16.3.1 y TypeScript estricto. |
| `npm audit --omit=dev --audit-level=high` | Correcto: 0 vulnerabilidades de producción. |

## Límites confirmados

El módulo no presenta el Modelo 100 ni el modelo 721, no calcula la cuota final de IRPF y no suplanta la revisión de valores EUR, comisiones y documentación del usuario. La pantalla del modelo 721 es deliberadamente una señal de revisión: los datos de ventas y permutas no bastan para verificar custodia, residencia del custodio ni saldos de cierre.

## Ampliación: permutas y exportación para Renta

**Fecha:** 26 de agosto de 2026.

Se reforzó el consumo FIFO para que una venta o permuta sin lotes suficientes no consuma parcialmente el inventario conocido ni cree un lote del activo recibido. La prueba determinista incorpora una permuta de 0,50 BTC contra un inventario previo de 0,25 BTC: el resultado queda bloqueado para revisión, el lote original de 0,25 BTC con coste de 5.000 EUR permanece intacto y no se genera un lote ETH.

La prueba `node --experimental-strip-types tests/verify-crypto-tax.mts`, `npm run lint` y `npm run build` finalizaron correctamente. El resultado de prueba registra `blockedSwapPreservesInventory: true`.

La vista previa `preview-criptomonedas.html` se comprobó visualmente. La nueva sección **Modelo 100 · preparación de borrador** diferencia el CSV de revisión local del eventual XML oficial: este último permanece deshabilitado hasta que exista una implementación validada del diseño de registro vigente y el usuario complete los datos necesarios. La interfaz no presenta, firma ni transmite datos a la AEAT.

## Ampliación: cadena de permutas FIFO

**Fecha:** 26 de agosto de 2026.

La vista previa incorporó un caso didáctico BTC→ETH→SOL→EUR. El escenario conserva el coste de 7.500 EUR del lote ETH creado en la primera permuta, consume proporcionalmente 5.000 EUR al permutar 2 de 3 ETH por SOL, crea el lote SOL por 5.400 EUR y calcula una venta neta de SOL de 5.880 EUR. El resultado ilustrativo acumulado es 2.380 EUR y permanece 1 ETH con coste FIFO de 2.500 EUR.

La prueba determinista verifica estos resultados exactos: BTC→ETH = 1.500 EUR, ETH→SOL = 400 EUR, venta de SOL = 480 EUR, coste residual de ETH = 2.500 EUR. La ejecución completó con `chainedSwapsPreserveCost: true`; `npm run lint` y `npm run build` finalizaron correctamente. La comprobación visual del HTML confirmó que el caso encadenado y los controles de exportación se leen de forma diferenciada y que el XML oficial permanece deshabilitado.
