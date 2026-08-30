# Hoja de ruta priorizada: análisis financiero y decisiones revisables

## Principio de secuenciación

La prioridad no se basa en añadir indicadores, sino en reducir primero el riesgo de que una métrica válida se interprete de forma incorrecta. Por eso el orden recomendado es **calidad y método**, después **rendimiento y riesgo**, y solo entonces **alertas, simulación e IA**.

| Ola | Resultado de producto | Valor | Riesgo que reduce | Complejidad relativa |
|---|---|---|---|---|
| 0 | Contrato de calidad y procedencia | Muy alto | Cifras sin fecha, fuente o cobertura. | Baja-media |
| 1 | Rendimiento neto y puente de atribución | Muy alto | Confusión entre rentabilidad y flujos externos. | Media |
| 2 | Exposición y riesgo de cartera | Alto | Concentraciones invisibles y comparaciones parciales. | Media |
| 3 | Alertas y actualización coalescida | Alto | Estados de alerta ambiguos o recargas repetidas. | Media |
| 4 | Decisiones documentadas e informes reproducibles | Alto | Pérdida de contexto y decisiones no auditables. | Media |
| 5 | Piloto de IA de solo lectura | Condicional | Respuestas sin procedencia o alcance autorizado. | Alta |

## Ola 0 — Contrato de calidad y procedencia

Este es el siguiente paso recomendado. Debe crear un modelo explícito de `data_quality` y `calculation_context` para posiciones, instantáneas y métricas. No requiere cotizaciones nuevas ni automatización externa.

| Entregable | Contenido mínimo | Criterio de aceptación |
|---|---|---|
| Sello de métrica | `as_of`, fuente, divisa, cobertura, versión de cálculo y advertencias. | Todo KPI principal indica estos seis atributos o se muestra como parcial/no disponible. |
| Estado de valoración | `fresh`, `stale`, `missing`, `manual_review`. | Una posición sin precio o FX no forma parte silenciosamente de un total definitivo. |
| Estado de conciliación | `pending`, `reconciled`, `excluded`, motivo. | El usuario puede filtrar y cuantificar qué parte del patrimonio no está conciliada. |
| Contrato de flujo | Aportación, retiro, dividendo, interés, comisión, retención, impuesto y ajuste corporativo. | Las importaciones rechazan o marcan operaciones ambiguas antes de calcular rendimiento. |

La aceptación se comprobará con datos ficticios: una posición sin precio, una transacción sin divisa y una instantánea desactualizada deben degradar visiblemente la cobertura, no generar una cifra silenciosamente completa.

## Ola 1 — Motor de rendimiento neto y atribución

El motor debe calcular y exponer dos perspectivas: rendimiento ponderado por tiempo y rendimiento ponderado por dinero. Cada resultado incluirá período, moneda base, flujos incluidos, comisiones, tratamiento de impuestos y cobertura.

| Entregable | Método | Prueba determinista necesaria |
|---|---|---|
| TWR | Subperíodos delimitados por flujos externos; composición de retornos. | Una aportación intermedia no modifica el rendimiento de mercado equivalente. |
| MWR/XIRR | Flujos fechados y valor final; resultado condicionado a convergencia. | Aportaciones de distinta fecha producen una diferencia explicable frente a TWR. |
| Puente de valor | Valor inicial + flujos + mercado + dividendos/intereses − costes − impuestos ± FX = valor final. | La conciliación cuadra o enumera el componente pendiente. |
| Coste total | Comisiones de negociación, coste de producto si se importa, retenciones e impuestos informados. | No se mezclan costes conocidos con estimaciones sin etiqueta. |

No debe afirmarse que el rendimiento es neto si faltan costes o retenciones. En ese caso el estado será «parcial» y el informe explicará los campos ausentes.

## Ola 2 — Exposición, concentración y riesgo

Esta ola debe usar únicamente clasificaciones verificadas o declaradas por la persona usuaria. Cuando no exista clasificación, la interfaz mostrará `Sin clasificar` y la excluirá de una conclusión categórica.

| Vista | Métricas iniciales | Decisión que facilita |
|---|---|---|
| Exposición | Peso por activo, emisor, sector, país, divisa y plataforma. | Identificar concentración antes de evaluar rendimiento. |
| Calidad | Porcentaje de posiciones valoradas, con coste conocido y clasificadas. | Priorizar conciliación o enriquecimiento de datos. |
| Riesgo histórico | Volatilidad, drawdown máximo, retorno anualizado y Sharpe solo con serie suficiente. | Distinguir retorno de perfil de riesgo. |
| Escenarios | Choques deterministas y explícitos de precio/FX por categoría. | Revisar sensibilidad, no predecir mercado. |

La interfaz debe destacar las cinco mayores concentraciones y sus porcentajes, pero no calificar automáticamente una concentración como aceptable o inaceptable sin un objetivo definido por la persona usuaria.

## Ola 3 — Alertas fiables y actualizaciones eficientes

Las alertas programáticas se activarán solo sobre datos conciliados. La interfaz mostrará el estado de la evaluación en vez de prometer alertas por el mero hecho de guardar una regla.

| Entregable | Regla de seguridad | Criterio de aceptación |
|---|---|---|
| Evaluación coalescida | Agrupar cambios de Realtime y refrescar solamente los conjuntos afectados. | Una ráfaga de cambios concluye con una vista consistente y una actualización visible de frescura. |
| Registro de evaluación | Regla, versión, insumos, hora, resultado y deduplicación. | Cada alerta puede explicar por qué se abrió o suprimió. |
| Estados operativos | `borrador`, `sin datos`, `activa`, `silenciada`, `evaluada hasta`. | Una regla guardada sin servicio evaluador no se muestra como activa. |
| Escalado explícito | Centro interno primero; cualquier canal externo requiere consentimiento y configuración. | Ninguna notificación sale de la aplicación por defecto. |

## Ola 4 — Cola de decisiones e informes reproducibles

La aplicación debe asistir a la revisión humana y al aprendizaje posterior, no a la ejecución de operaciones. Cada decisión debe referirse a una instantánea cerrada y conservar el razonamiento.

| Entregable | Contenido | Límite explícito |
|---|---|---|
| Cola de revisión | Pregunta, evidencia, datos ausentes, hipótesis, riesgo, fecha objetivo y responsable. | No crea órdenes de compra, venta ni transferencias. |
| Registro de decisión | Instantánea, versión de métrica, comentario humano, resultado posterior. | No lo presenta como consejo financiero personalizado. |
| Informe de cartera | Rendimiento TWR/MWR, flujos, costes, exposición, riesgos, cobertura y metodología. | No sustituye un extracto de entidad ni una declaración fiscal. |
| Anexo de fuentes | Fuente, período y estado de cada métrica relevante. | No oculta valores excluidos o pendientes. |

## Ola 5 — Piloto de IA solo después de los fundamentos

El piloto debe restringirse a consultas de lectura y explicaciones con citas. Su activación requiere una aprobación explícita de alcance, proveedores, presupuesto, retención y fuentes externas.

| Requisito previo | Evidencia exigida |
|---|---|
| Datos internos | RLS revisada por organización/cartera, herramientas agregadas y consentimiento revocable. |
| Datos externos | Adaptador server-side, fuente/licencia, caché de datos públicos y límites por proveedor. |
| Respuesta | Citas, fecha de información, alcance de cartera usado, incertidumbre y advertencias. |
| Seguridad | Auditoría de solicitudes, sin secretos en cliente, sin ejecución de operaciones. |

## Decisión de inicio recomendada

La próxima implementación debería ser la **Ola 0**, seguida de una prueba pequeña de la Ola 1 con transacciones ficticias. Esta secuencia mejora todas las pantallas existentes, no depende de proveedores de mercado, no requiere persistencia nueva en el Canvas local y reduce el riesgo de fabricar una conclusión a partir de información incompleta.

Antes de iniciar la Ola 1 se debe acordar de forma explícita la moneda base, política de tratamiento de aportaciones/retiros, fuentes de FX, definición de costes netos y si la primera versión calculará TWR, MWR/XIRR o ambas. No se debe tomar una decisión de conectores, automatización o IA sin ese contrato.
