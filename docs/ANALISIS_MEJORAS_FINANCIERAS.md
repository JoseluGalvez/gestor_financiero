# Diagnóstico de mejoras para análisis financiero y toma de decisiones

**Aplicación evaluada:** Portafolio Intel / Gestor financiero  
**Fecha:** 26 de agosto de 2026  
**Alcance:** aplicación Next.js local, componentes de cartera autenticada, Canvas privado, lógica de análisis, Criptomonedas/FIFO, comparación de plataformas, informes y diseños de conectores/agente.  
**Límite:** este documento es una evaluación de producto y arquitectura. No utiliza datos financieros reales, no recomienda valores concretos ni autoriza operaciones, integraciones, migraciones o despliegues.

## Conclusión ejecutiva

La aplicación ya reúne una base poco habitual y adecuada para construir decisiones **explicables**: separa un Canvas local privado de la cartera autenticada, conserva trazabilidad de fuentes, limita la comparación entre plataformas a ventas FIFO con coste conocido, distingue el borrador fiscal del documento oficial y evita producir análisis artificial cuando faltan entradas. El motor financiero incorpora DCF, puntuación ponderada, indicadores técnicos, drawdown, volatilidad, Sharpe y Kelly conservador, con advertencias cuando la cobertura es insuficiente.

La principal oportunidad no consiste en añadir más gráficos, sino en consolidar la cadena **dato → calidad → métrica → contexto → decisión revisable**. Hoy la interfaz muestra valor, resultado, posiciones, alertas y ejecuciones de análisis, pero no permite interpretar con suficiente precisión si la rentabilidad procede de flujos externos, mercado, divisa, comisiones, fiscalidad estimada o una valoración aún incompleta. Ese vacío puede llevar a comparar cifras válidas pero no homogéneas.

> La primera mejora debe ser que cada cifra financiera responda de forma visible a cuatro preguntas: **qué período cubre, qué fuentes la componen, qué método se aplicó y qué parte sigue pendiente de conciliación**.

## Base actual verificada

| Área | Capacidad implementada | Evidencia revisada | Valor para la decisión |
|---|---|---|---|
| Modo privado | Importación CSV/XLSX, mapeo, filtros, KPIs, gráficos y edición vinculada en memoria. | `LocalCanvasWorkspace.tsx`, `local-analytics.ts`, Worker local. | Permite explorar archivos sin enviar filas a red, Supabase o IA. |
| Calidad de entrada | Límites de 15 MB/100.000 filas, validación tipada por celda y sesiones JSON explícitas. | `LocalCanvasWorkspace.tsx` y validadores locales. | Evita que borradores inválidos alteren los resultados. |
| Cartera autenticada | Posiciones, instantáneas, transacciones, fuentes, reglas, alertas y análisis persistidos por organización. | `RealtimePortfolioApp.tsx`, `supabase.ts`. | Aporta un perímetro de datos y un resumen de cartera basado en datos disponibles. |
| Análisis | Score con cobertura, DCF, SMA/EMA/MACD/RSI/Bollinger/ATR, volatilidad, drawdown, Sharpe y Kelly conservador. | `financial-analysis.ts`. | El cálculo no publica un score si la cobertura baja del 60 %. |
| Comparación de plataformas | Resultado realizado por fuente con lotes FIFO, cobertura y avisos por ventas incompletas. | `platform-comparison.ts`. | Evita declarar «mejor plataforma» cuando faltan lotes de compra comparables. |
| Fiscalidad cripto | FIFO local para ventas/permutas, avisos y exportación de borrador revisable. | `CryptoTaxWorkspace.tsx`, `crypto-tax.ts`. | Separa el cálculo de trabajo de una declaración fiscal oficial. |
| Actualización e informes | Suscripciones Realtime, alertas configurables y PDF de resumen. | `RealtimePortfolioApp.tsx`. | Ofrece una base para seguimiento, aún con automatizaciones pendientes. |

La línea base técnica revisada es correcta: `npm run lint`, `npm run build` y `npm audit --omit=dev --audit-level=high` finalizaron satisfactoriamente, y la auditoría de dependencias de producción no reportó vulnerabilidades. Esta evidencia no constituye una certificación de seguridad ni un pentest.

## Hallazgos y oportunidades

Los siguientes puntos separan hechos observados de mejoras propuestas. Ninguno se clasifica como vulnerabilidad crítica sin una prueba de exposición; son riesgos de interpretación, operación o escalabilidad que conviene resolver antes de ampliar conectores o automatización.

| Prioridad | Hallazgo verificado | Riesgo para la decisión | Mejora propuesta |
|---|---|---|---|
| P0 | El resumen presenta valor, ganancia y variación entre dos instantáneas, pero no diferencia explícitamente retorno por mercado, aportaciones/retiros, comisiones, FX e impuestos. | Una variación de cartera puede confundirse con rentabilidad de inversión. | Crear un **motor de rendimiento** con TWR, MWR/XIRR, flujos externos, rendimiento neto de comisiones y estado fiscal separado. |
| P0 | La interfaz expone fecha de algunas instantáneas y estado de fuentes, pero no una cobertura de calidad por KPI ni por posición. | Una cifra desactualizada, sin precio, sin FX o sin clasificación puede parecer definitiva. | Añadir un **panel de confianza de datos** y sellos por métrica: `as_of`, cobertura, fuente, versión de cálculo, divisas pendientes y advertencias. |
| P1 | La cartera lista posiciones y la librería calcula volatilidad/drawdown sobre velas, pero no existe una vista de riesgo y concentración de cartera. | El usuario puede ver ganancia agregada sin identificar concentración en emisor, activo, divisa o región. | Incorporar una **matriz de exposición y riesgo**: pesos, top concentraciones, divisa, clase, país/sector, liquidez declarada y contribución al drawdown. |
| P1 | La comparación de plataformas se limita deliberadamente a compras/ventas en divisa base con FIFO y coste identificable. | Es una métrica correcta pero parcial; no mide posición abierta, rendimiento total ni coste operativo total. | Mantener el FIFO actual y añadir etiquetas de alcance, coste total por fuente y una vista independiente de rendimiento total comparable cuando exista cobertura suficiente. |
| P1 | La suscripción Realtime vuelve a cargar siete conjuntos de datos ante cambios en varias tablas. | Una ráfaga de cambios puede provocar lecturas repetidas y una sensación de actualización inestable. | Aplicar coalescencia/debounce, refresco selectivo por tabla y marca de «datos actualizándose» con versión de instantánea. |
| P1 | Las reglas de alertas se almacenan, pero la evaluación server-side de datos conciliados se describe como paso posterior. | El usuario puede interpretar una regla guardada como alerta ya operativa. | Mostrar estados explícitos `borrador`, `activa`, `sin datos`, `silenciada` y `evaluada hasta`, con historial y deduplicación. |
| P2 | El informe PDF resume valoración, coste, ganancia y posiciones. | Falta contexto de período, flujos, rentabilidad neta, benchmark, calidad y riesgos. | Convertirlo en un **informe de decisión reproducible** basado en una instantánea cerrada y métodos versionados. |
| P2 | La restauración JSON convencional conserva todas las filas; el modo NDJSON incremental está documentado como referencia y no integrado. | Sesiones cercanas al límite pueden producir presión de memoria si se requiere retener toda la tabla editable. | Mantener el Canvas actual para tamaños moderados y ofrecer un modo separado de análisis masivo incremental que conserve agregados y una vista previa, no todas las filas. |
| P3 | El agente IA y adaptadores de fuentes son diseños no activados. | Lanzarlo antes de cerrar procedencia y cobertura podría producir explicaciones que parezcan basadas en datos completos. | Posponer el piloto hasta disponer de contrato de fuentes, consentimiento, RLS, citas, registros de auditoría y respuestas estrictamente de solo lectura. |

## Mejoras funcionales prioritarias

### 1. Ficha de verdad de la cartera

La página **Resumen** debe evolucionar de un conjunto de KPIs a una ficha de verdad. Cada KPI principal mostraría valor, fecha/hora, cobertura, base de divisa, método y estado de conciliación. Por ejemplo, «Valor de mercado: 82 % de posiciones con precio reciente; 18 % pendiente de valoración» es más útil que una cifra exacta sin contexto.

La información mínima que debe quedar versionada es la siguiente:

| Dato | Atributos de control necesarios | Comportamiento seguro |
|---|---|---|
| Precio o valoración | Fuente, hora, moneda, tipo de valoración, estado de mercado. | No mezclar una valoración retrasada con una cotización reciente sin indicarlo. |
| Tipo de cambio | Par, fuente, hora, tipo de cambio aplicado. | Marcar valor de cartera como parcial si falta conversión. |
| Posición | Cantidad conciliada, coste, ajustes corporativos, estado de revisión. | No calcular peso o plusvalía definitiva si falta coste o cantidad. |
| Flujo de caja | Fecha, importe, moneda, tipo: aportación, retiro, dividendo, comisión, impuesto. | Separar los flujos externos del rendimiento de mercado. |
| Métrica | Fórmula, período, versión de cálculo y cobertura de entradas. | Mantener reproducibilidad al regenerar informes. |

### 2. Motor de rendimiento, coste y atribución

Se recomienda introducir dos métricas complementarias: **TWR** para medir el efecto de la gestión/mercado aislando los flujos externos, y **MWR/XIRR** para reflejar el resultado experimentado por quien decide la fecha e importe de aportaciones y retiradas. No deben sustituirse una por otra; deben mostrarse juntas, con su definición y período. CFA Institute distingue y compara ambos métodos de medida de rendimiento. [1]

El módulo debe incorporar un puente de atribución legible: valor inicial, aportaciones, retiradas, rendimiento de mercado, dividendos/intereses, comisiones, retenciones/impuestos informados, efecto FX y valor final. Las comisiones deben visualizarse tanto en euros como en porcentaje del patrimonio y del flujo operado. La transparencia de costes y rendimiento es un elemento central de la capacidad del inversor para tomar decisiones informadas, según ESMA. [2]

Para cualquier comparación externa, el sistema debe declarar explícitamente el benchmark, moneda, frecuencia de valoración, política de flujos y si el rendimiento es bruto o neto. Las normas GIPS subrayan la consistencia metodológica, el tratamiento documentado de flujos externos, la deducción de costes de transacción y la comparabilidad del rendimiento. [3] La aplicación no debe declarar cumplimiento GIPS; debe adoptar solo sus principios de trazabilidad y comparabilidad.

### 3. Riesgo y concentración antes de señales técnicas

La ficha de análisis por instrumento es útil, pero una decisión de cartera necesita una vista agregada. La primera versión debe priorizar medidas explicables antes que modelos opacos: peso por clase de activo, emisor, sector, país, divisa y plataforma; top 10 posiciones; porcentaje ilíquido o sin valoración; concentración Herfindahl-Hirschman; drawdown histórico de cartera cuando haya serie válida; y escenarios deterministas de choque configurables.

Los indicadores técnicos existentes deben conservar sus advertencias: una SMA, RSI o MACD es una observación, no una instrucción de compra o venta. La interfaz debe asociarlos a la exposición real de cartera y a un intervalo de datos, no presentarlos como señal aislada.

### 4. Cola de decisiones y bitácora de tesis

Se propone una vista **Decisiones** que no ejecute operaciones. Cada tarjeta debe incluir la pregunta, el hecho que cambió, evidencia y fuentes, impacto estimado, supuestos, datos ausentes, riesgos, fecha de revisión y resultado posterior. Acciones como «revisar cobertura», «confirmar coste», «comparar contra benchmark» o «validar una desviación» son apropiadas; «comprar» o «vender» no debe generarse automáticamente.

La bitácora enlazaría una decisión humana con una instantánea de datos y con la tesis inicial. Después permitiría revisar si el resultado procedió de la hipótesis, los flujos, costes o cambios de mercado. Esto mejora aprendizaje y auditoría sin convertirse en asesoramiento personalizado.

### 5. Alertas con estado operacional verificable

Las alertas deben separar las reglas de su ejecución. Para alertas deterministas existen dos rutas viables:

| Alternativa | Uso apropiado | Ventaja | Límite |
|---|---|---|---|
| Evaluación programada de datos conciliados | Desvíos de peso, datos obsoletos, dividendos o mora con frecuencia definida. | Reproducible, ajustable y suficiente para controles no intradía. | No responde a cambios de cotización sub-minuto. |
| Procesamiento por evento cuando entra una valoración o transacción validada | Actualizaciones de fuentes que ya notifican cambios al sistema. | Menor latencia y evita revisar conjuntos sin cambios. | Requiere idempotencia, deduplicación, cola y fuente con evento fiable. |

La interfaz debe presentar la última evaluación, conjunto evaluado, regla/versión, umbral, severidad, evidencia y motivo de supresión. No debe enviar notificaciones externas ni activar automatizaciones hasta que el usuario elija canal, frecuencia, destinatario y retención de datos.

### 6. Análisis fundamental y técnico con procedencia

El actual `analysis_runs` ya transmite cobertura, score, DCF, Kelly y advertencias. La mejora necesaria es una vista de **explicabilidad**: hipótesis de DCF, rango de sensibilidad de WACC/crecimiento terminal, fecha fiscal de cada fundamental, período de velas, fuente/licencia, datos faltantes y enlace a los documentos que justifican el análisis.

El score ponderado debe mostrar los seis factores, peso usado, valor base, evidencia y fecha; no solo el agregado. Cuando la cobertura es inferior al umbral, el estado «No publicado» es correcto y debe mantenerse. La fracción Kelly solo debería aparecer con una explicación del supuesto de probabilidad y relación ganancia/pérdida; es una medida de escenario, no un tamaño de orden.

## Plan de implementación propuesto

| Orden | Entregable | Dependencias y controles | Criterio de aceptación |
|---:|---|---|---|
| 0 | Contrato de datos y calidad | Definir origen de precios, FX, flujos, comisiones, impuestos y estado de conciliación; usar datos ficticios de prueba. | Ningún KPI principal se renderiza sin `as_of`, fuente o estado de cobertura. |
| 1 | Motor de rendimiento y puente de atribución | Clasificar flujos externos, calcular TWR/MWR, neto de comisiones y convertir con FX trazable. | Casos deterministas de aportación/retiro demuestran que TWR y MWR no se confunden; los periodos incompletos se marcan. |
| 2 | Riesgo y exposición | Taxonomía de activo/emisor/sector/país/divisa; serie de valor con calidad suficiente. | La pantalla identifica concentraciones, cobertura de clasificación y posiciones sin valoración. |
| 3 | Realtime y alertas fiables | Coalescencia, actualización selectiva, idempotencia y registro de evaluaciones. | Una ráfaga de cambios produce una vista final consistente, una única alerta por condición y un sello de frescura. |
| 4 | Cola de decisiones y simulador sin ejecución | Objetivo/constraints configurables; estimación de impacto y confirmación humana. | Todo escenario muestra supuestos, costes estimados, datos excluidos y no puede enviar órdenes. |
| 5 | Informes de decisión | Instantánea cerrada, metodología, rendimientos, costes, riesgos, cobertura y anexo de fuentes. | El PDF se reproduce desde la misma instantánea y distingue borrador fiscal de informe de cartera. |
| 6 | Piloto IA de solo lectura | Aprobación explícita, RLS, adaptadores server-side, citas, auditoría y límites de fuente. | Cada respuesta declara alcance, fecha, fuente, datos privados incluidos y limitaciones; no ejecuta cambios. |

## Guardrails de producto

La mejora no debe diluir los compromisos actuales. El Canvas debe seguir sin red ni persistencia automática. Las integraciones deben validar esquema, consentimiento y permisos antes de leer datos. Las exportaciones fiscales continúan como borradores revisables, y las simulaciones no deben convertirse en órdenes ni recomendaciones personalizadas.

La aplicación autenticada debe conservar RLS y el perímetro de organización; cualquier tabla nueva de métricas, decisiones, objetivos o alertas ha de tener políticas de lectura/escritura por organización y, cuando corresponda, por cartera. Las métricas derivadas deben guardar versión de algoritmo e insumos para permitir reproducción, no solo el valor final.

## Métricas de éxito de producto

| Dimensión | Señal de éxito | Antiobjetivo |
|---|---|---|
| Confianza | Cada cifra crítica explica fecha, cobertura, fuente y método. | Mostrar cifras redondas sin señalar datos excluidos. |
| Comparabilidad | Rendimientos, costes y benchmarks declaran moneda, período y flujos. | Ordenar «mejores» activos o plataformas con bases heterogéneas. |
| Riesgo | La concentración y las posiciones no valoradas son visibles antes de la rentabilidad agregada. | Ocultar exposiciones por falta de clasificación. |
| Acción | La cola convierte datos en revisiones humanas documentadas. | Generar órdenes, avisos agresivos o recomendaciones automáticas. |
| Privacidad | El modo local sigue aislado; las integraciones son explícitas y auditables. | Activar sincronización o IA silenciosamente. |
| Rendimiento | Las actualizaciones se coalescen y los conjuntos grandes se procesan por lotes cuando proceda. | Añadir visualizaciones que repliquen tablas completas sin necesidad. |

## Limitaciones de la evaluación

No se inspeccionaron datos de producción, secretos, tokens ni `.env`; tampoco se aplicaron migraciones, se creó una automatización, se modificó Supabase o se activó el agente IA. El repositorio local restaurado sigue sin `.git`, por lo que no se asocia este diagnóstico con un commit nuevo ni se declara publicación remota. Las recomendaciones de arquitectura requieren un alcance de piloto, fuentes, presupuesto y aprobación posterior antes de ser implementadas.

## Referencias

[1] [CFA Institute — Rates and Returns](https://www.cfainstitute.org/insights/professional-learning/refresher-readings/2026/rates-and-returns)

[2] [ESMA — Cost of Investment Products](https://www.esma.europa.eu/investor-corner/cost-investment-products)

[3] [CFA Institute — Overview of the Global Investment Performance Standards](https://www.cfainstitute.org/insights/professional-learning/refresher-readings/2026/overview-of-the-global-investment-performance-standards)
