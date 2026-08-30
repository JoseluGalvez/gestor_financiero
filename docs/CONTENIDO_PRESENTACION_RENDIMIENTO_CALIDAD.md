# Presentación ejecutiva — Contenido

## Cover

**Rendimiento confiable para Portafolio Intel**

**TWR, MWR/XIRR y calidad de datos para decisiones revisables**

Propuesta de arquitectura · 26 de agosto de 2026

## Slide 1

**El dato hoy no explica la decisión**

- El dashboard ya muestra valor, resultado, posiciones, alertas y análisis.
- Falta separar flujos externos, mercado, FX, costes e impuestos informados.
- Una cifra sin periodo, fuente y cobertura puede ser correcta pero no comparable.

## Slide 2

**La prioridad es confianza, no más gráficos**

- Cada métrica debe declarar periodo, método, divisa, cobertura y procedencia.
- La cadena objetivo es: dato validado → calidad → métrica → contexto → revisión humana.
- El Canvas privado conserva su aislamiento local; el nuevo motor aplica a cartera autenticada.

## Slide 3

**Dos retornos responden a preguntas distintas**

- TWR aísla el efecto de aportaciones y retiradas para observar el comportamiento de la cartera.
- MWR/XIRR incorpora fechas e importes de los flujos y refleja la experiencia monetaria del inversor.
- Ambos se muestran juntos, con el mismo periodo y advertencias de cobertura.

## Slide 4

**El motor convierte datos conciliados en métricas reproducibles**

- Entradas: transacciones clasificadas, valoraciones, FX, costes y lotes de fuente validados.
- Proceso: validación de calidad, cálculo TWR/MWR y puente de atribución determinista.
- Salidas: ejecuciones inmutables, componentes, huella de entradas y vínculos de procedencia.

## Slide 5

**TWR: subperiodos antes y después de cada flujo**

- Calcula el retorno entre puntos de valoración consecutivos separados por flujos externos.
- Compone los subperiodos; no anualiza periodos inferiores a un año.
- Si falta una valoración de corte o un flujo es material y desconocido, no publica un valor definitivo.

## Slide 6

**MWR/XIRR: la solución es numérica y auditable**

- Convención explícita: aportaciones negativas; retiros y valor final positivos.
- Solucionador híbrido con detección de raíces múltiples, intervalo y residuo documentados.
- Estados seguros: listo, parcial o no disponible; nunca una raíz arbitraria ni una tasa inventada.

## Slide 7

**La calidad es parte de cada KPI**

- Cobertura independiente de valoración, FX, costes, flujos y clasificación.
- Sellos visibles: fecha de referencia, frescura, fuente, versión de método y advertencias.
- Una métrica parcial no se utiliza para ranking, comparación ni informe definitivo.

## Slide 8

**El dashboard consume envolventes, no números aislados**

- El módulo financiero expone funciones puras: TWR, XIRR y puente de atribución.
- El servidor guarda `metric_runs`, componentes, calidad y linaje bajo RLS.
- React muestra tarjetas con valor, estado y «Ver método» sin recalcular desde datos truncados.

## Slide 9

**La hoja de ruta reduce riesgo antes de automatizar**

- Ola 0: contrato de calidad y procedencia.
- Ola 1: rendimiento neto y atribución; Ola 2: exposición y riesgo.
- Después: alertas fiables, decisiones documentadas, informes reproducibles y piloto IA de solo lectura.

## Slide 10

**Decisión solicitada: aprobar una primera iteración acotada**

- Acordar moneda base, política de flujos, costes, FX, cobertura y convención XIRR.
- Implementar con datos ficticios y pruebas deterministas antes de conectores reales.
- No se activan operaciones, datos de mercado, automatizaciones ni IA en esta fase.
