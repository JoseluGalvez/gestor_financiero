# Contenido de presentación — Rendimiento explicable y seguro

**Audiencia:** dirección de producto, responsables de tecnología y usuarios avanzados.  
**Propósito:** acordar la secuencia de cierre para convertir la variación patrimonial en un rendimiento y una atribución auditables.  
**Base:** propuesta de diseño; no se utilizan datos financieros reales ni se activa ningún conector.

## Cover

**Rendimiento explicable y seguro**

TWR, XIRR y puente de atribución neto para Gestor financiero

Diseño ejecutivo · 27 de agosto de 2026

## Slide 1

**La variación de valor no explica el resultado**

- El dashboard ya muestra valor, costes y movimientos; hoy no separa de forma completa flujos externos, mercado, FX, comisiones e impuestos informados.
- Una cifra agregada sin cobertura, fecha, fuente y método puede inducir comparaciones erróneas.
- La primera prioridad de producto es la cadena: dato → calidad → cálculo → explicación → revisión humana.

## Slide 2

**Dos métricas responden a dos preguntas distintas**

- TWR mide cómo evolucionan los activos, neutralizando aportaciones y retiradas externas.
- XIRR/MWR mide la experiencia del titular, incorporando fecha e importe de sus decisiones de aportación/retiro.
- Deben convivir con período, moneda, política de costes y estado de cobertura; ninguna sustituye a la otra.

## Slide 3

**El puente neto hace verificable cada variación**

- Ancla: valor inicial → aportaciones/retiros → mercado, ingresos, FX e interacción → costes/impuestos → valor final.
- El puente trabaja en importe de moneda base, no intenta sumar porcentajes de TIR.
- El residual de conciliación queda visible; si excede tolerancia, el resultado se marca para revisión.

## Slide 4

**Un libro mayor normalizado protege la trazabilidad**

- Transacciones, valoraciones, FX y calidad entran en un libro derivado e idempotente.
- Cada evento conserva frontera, signo, procedencia, versión, conciliación y vínculos de reversión.
- TWR, XIRR y bridge generan resultados versionados con detalle auditable, sin guardar secretos ni archivos completos.

## Slide 5

**La arquitectura bloquea precisión falsa antes de calcular**

- Sin valoraciones/FX completos en los cortes, no se etiqueta el resultado como TWR exacto.
- Sin flujos de signos opuestos o raíz única, XIRR queda como no calculable o revisión requerida.
- Fechas, importes y moneda se validan antes del motor; los huecos producen avisos, no ceros ficticios.

## Slide 6

**Las pruebas deterministas cubren flujos realmente complejos**

- TWR: aportaciones/retiros irregulares, cortes simultáneos, divisa, costes, corporativas y datos incompletos.
- XIRR: flujos agrupados por fecha, raíz única/múltiple/inexistente, límites de dominio, reversos e idempotencia.
- Puente: mercado, ingresos, FX, interacción, comisión, impuesto informado, residual y ausencia de doble conteo.

## Slide 7

**El mercado confirma la necesidad, no un atajo**

- Portfolio Performance aporta rigor de flujos, importación y medición por alcance.
- Sharesight comunica retorno monetario y su diferencia frente a TWR; getquin y Kubera destacan agregación multiactivo.
- Ghostfolio refuerza la expectativa de privacidad; CoinTracking/Koinly muestran la profundidad operativa que exige el dominio cripto.

## Slide 8

**El diferencial debe ser control verificable, no más conectores**

- Canvas local sin envío automático, cálculos explicables y exportaciones explícitas son una base diferenciadora.
- Procedencia, cobertura, conciliación y metodología visible deben preceder a IA, cotizaciones y sincronización masiva.
- El modo conectado se diseña por consentimiento, mínimo privilegio, reversión y observabilidad; no por automatización silenciosa.

## Slide 9

**Cinco prioridades convierten el diseño en producto confiable**

- P0: cerrar RLS remota y Realtime mediante pruebas multiorganización, filtros y coalescencia por dominio.
- P0: aprobar política de rendimiento y libro mayor con procedencia/conciliación.
- P1: implementar puente neto, TWR exacto/XIRR acotado y fixtures deterministas.
- P2: visualizar riesgo/concentración e informes reproducibles antes de conectar fuentes reales.
- P3: habilitar conectores reversibles, permisos por cartera e IA solo lectura tras los controles anteriores.

## Slide 10

**La decisión: medir, conciliar y explicar antes de escalar**

Rendimiento confiable significa datos trazables, una metodología declarada y controles que impiden publicar resultados ambiguos.

Siguiente gate: aprobar la política de rendimiento y cerrar RLS/Realtime en staging con datos ficticios.
