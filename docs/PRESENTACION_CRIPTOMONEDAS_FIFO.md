## Cover

Portafolio Intel

**Criptomonedas: trazabilidad FIFO y borrador fiscal revisable**

Implementación local, segura y preparada para revisión profesional

## Slide 1

### Una transmisión debe dejar rastro

- Las ventas de monedas virtuales pueden originar una ganancia o pérdida patrimonial.
- El cálculo se centra en valor de transmisión, valor de adquisición y gastos directamente vinculados.
- La aplicación entrega un detalle por transmisión; no calcula una cuota personal de IRPF.

**Mensaje clave:** se ha priorizado la trazabilidad sobre la automatización opaca.

Fuente: AEAT [1]

## Slide 2

### El flujo convierte un CSV en un borrador revisable

1. El usuario adjunta un CSV local con compras, ventas y permutas.
2. El motor valida fecha, activo, cantidad, valor EUR y comisiones.
3. El resultado identifica cada transmisión calculada y cada fila pendiente de revisar.

**Privacidad:** el archivo permanece en memoria, no se guarda en Supabase y no se envía a la AEAT.

## Slide 3

### FIFO conserva la historia de cada activo

- Las compras crean lotes con cantidad y coste, incluidos los gastos informados.
- Una venta consume los lotes más antiguos del mismo activo.
- Si falta un lote histórico, el resultado se bloquea y queda marcado para revisión.

**Fórmula:** resultado realizado = valor neto de transmisión − coste FIFO transmitido.

Fuente: AEAT [1]

## Slide 4

### La permuta se trata como una doble decisión fiscal

- Entregar un criptoactivo y recibir otro puede generar una ganancia o pérdida.
- Se usa el mayor valor de mercado entre activo entregado y recibido cuando el CSV aporta valores EUR verificables.
- Ese valor se convierte en el coste del nuevo lote recibido para su futura transmisión.

**Control:** sin valor EUR, cantidades o activo recibido, la operación no se totaliza como confirmada.

Fuente: AEAT [1] [2]

## Slide 5

### La interfaz convierte incertidumbre en revisión explícita

- KPIs separan ganancias, pérdidas, resultado neto y transmisiones confirmadas.
- La tabla muestra fecha, activo, valor de transmisión, coste FIFO, resultado y estado.
- Un checklist exige comprobar lotes históricos, comisiones y valores EUR antes de descargar.

**Salida:** CSV de borrador con detalle, advertencias y aviso de no presentación automática.

## Slide 6

### La comparación de plataformas evita conclusiones engañosas

- Resume compras y ventas trazables por fuente usando FIFO e importes en divisa base.
- Mide ingresos netos, coste transmitido, resultado realizado y rentabilidad realizada.
- Excluye o avisa sobre divisas distintas, transferencias, posiciones abiertas y ventas sin lotes previos.

**Mensaje clave:** «más rentable» solo significa mejor resultado realizado comparable, no recomendación de inversión.

## Slide 7

### Modelo 721: una revisión distinta del IRPF

- El modelo 721 es una declaración informativa separada para determinadas monedas virtuales en el extranjero.
- Las ventas y permutas no permiten determinar por sí solas custodia, saldos de cierre ni obligación.
- La aplicación muestra una alerta de revisión potencial y no rellena ni presenta el modelo.

Fuente: AEAT [3] [4] [5]

## Slide 8

### Validación y límites que preservan la seguridad

- Prueba determinista: venta FIFO, permuta, venta del activo recibido y un caso bloqueado por falta de lotes.
- Calidad técnica: lint, compilación de producción y auditoría de dependencias correctos; 0 vulnerabilidades de producción detectadas.
- Fuera del alcance: cuota final de IRPF, staking, airdrops, NFT, derivados, actividad económica y presentación ante Hacienda.

> La salida es un borrador de trabajo. La revisión de un profesional tributario es obligatoria antes de incorporar datos a Renta.

## Slide 9

### Próximo uso seguro

**Adjuntar → validar → revisar advertencias → descargar borrador → contrastar con documentación → revisar con asesor**

La automatización reduce el trabajo manual sin sustituir la responsabilidad ni la revisión fiscal.

## Slide 10

### Referencias oficiales

[1] AEAT — Compra y venta de monedas virtuales: tributación en el IRPF del inversor

[2] AEAT — Ganancias y pérdidas patrimoniales derivadas de transmisión o permuta de monedas virtuales

[3] AEAT — Modelo 721: preguntas frecuentes y personas obligadas

[4] AEAT — Modelo 721: información requerida

[5] AEAT — Modelo 721: supuestos no incluidos y plazo de presentación

Documentación de implementación: `docs/ALCANCE_FISCAL_CRIPTOMONEDAS.md` y `docs/VALIDACION_CRIPTOMONEDAS_Y_PLATAFORMAS.md`
