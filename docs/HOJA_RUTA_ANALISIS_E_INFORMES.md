# Hoja de ruta de análisis e informes — Gestor financiero

**Fecha de análisis:** 26 de agosto de 2026  
**Alcance:** producto actual, no una cartera concreta ni una recomendación de inversión.  
**Principio rector:** cada métrica debe mostrar período, divisa, fuente, cobertura de datos y fórmula; si falta una entrada, debe quedar sin calcular o marcada para revisión, nunca estimada silenciosamente.

> **Conclusión ejecutiva:** Gestor financiero ya tiene una base sólida de privacidad local, cálculos FIFO, comparación realizada por plataforma, análisis de instrumentos y datos persistentes bajo RLS. La siguiente mejora de mayor impacto no es añadir más indicadores aislados, sino convertir los movimientos y snapshots existentes en un sistema de **rendimiento, atribución, riesgo, liquidez y calidad de datos** que explique qué cambió, por qué cambió y cuán confiable es cada conclusión.

## 1. Diagnóstico de capacidades y brechas

| Dominio | Capacidad actual | Brecha que limita la decisión | Mejora de mayor valor |
|---|---|---|---|
| Rendimiento de cartera | Snapshots, posiciones y resultado realizado por plataforma. | No separa efecto de mercado, aportaciones/retiros, divisa, comisiones y resultado no realizado. | Motor de rendimiento con TWR, MWR/XIRR, puente de patrimonio y atribución conciliable. |
| Riesgo | Volatilidad anualizada, drawdown, Sharpe, ATR y técnico cuando existen velas. | Faltan presupuesto de riesgo, contribución por activo, duración de drawdown y cobertura visible de la serie. | Panel de riesgo con matriz de concentración, drawdown, contribución y nivel de confianza del dato. |
| Asignación | Posiciones y mapa/exposición local. | No existe una vista jerárquica persistente por clase de activo, divisa, plataforma, geografía o liquidez. | Exposición navegable tipo árbol, con top posiciones, HHI y límites configurables informativos. |
| Análisis de instrumentos | Score ponderado, DCF, técnico y Kelly conservador. | Las hipótesis y sensibilidades no se visualizan como un modelo explicable de escenarios. | Ficha de instrumento con tabla de supuestos, sensibilidad DCF y registro de cobertura. |
| Flujo de caja | Transacciones, posiciones y alertas. | No se reconcilian aportaciones, retiros, dividendos, intereses, cupones, comisiones y vencimientos. | Calendario de caja y puente mensual de entradas/salidas, condicionado a datos conciliados. |
| Fiscal | FIFO cripto, borrador CSV y controles de revisión. | No existe una consolidación por tipo de renta, ejercicio, divisa, retención y calidad del justificante. | Libro fiscal por ejercicio con conciliación, estado de evidencia y separación clara de borrador/presentación. |
| Informes | PDF de Portfolio Summary y borradores parciales. | No hay paquetes periódicos ni secciones comparables entre períodos. | Informe ejecutivo reproducible de cuatro páginas, descargable y con trazabilidad. |
| Calidad de datos | Advertencias y mapeo previo en Canvas/Cripto. | No hay semáforo global de cobertura, caducidad, conciliación o duplicados. | Centro de calidad con reglas visibles y bloqueo selectivo de métricas incompletas. |

## 2. Arquitectura analítica recomendada

La aplicación debe almacenar y derivar tres capas distintas. La primera es el **libro de hechos**, compuesto por transacciones, snapshots de valoración, datos de mercado documentados, tipos de cambio, eventos de renta y datos fiscales. La segunda es la **capa semántica**, que normaliza instrumentos, clase de activo, divisa, entidad/plataforma, flujos externos, comisiones, periodos y benchmarks. La tercera es la **capa de decisión**, formada por agregados inmutables por fecha, informes versionados, medidas de cobertura y explicaciones.

Esta separación evita que un gráfico recalcule reglas de negocio en el navegador o mezcle una posición con una transacción. También permite conservar la privacidad: el Canvas local conserva las tres capas solo en memoria; el espacio autenticado las construye en backend con RLS, auditoría y acceso por organización.

| Activo de datos que debe añadirse | Campos mínimos | Regla de calidad | Uso posterior |
|---|---|---|---|
| Valoración diaria | `instrument_id`, `as_of`, `market_value`, `price`, `currency`, `source_id`, `as_of_timezone` | Una fuente y una hora por punto; no mezclar cierres con intradía. | TWR, drawdown, volatilidad, exposición. |
| Flujo externo | `occurred_at`, `type`, `amount`, `currency`, `portfolio_id`, `evidence_id` | Clasificar aportación/retiro separado de P&L. | MWR/XIRR, puente de patrimonio y caja. |
| Evento de renta | `kind`, `gross`, `withholding`, `net`, `currency`, `pay_date`, `instrument_id` | Adjuntar justificante o estado de revisión. | Calendario, rendimiento neto y fiscalidad. |
| Tipo de cambio | `pair`, `as_of`, `rate`, `source_id`, `method` | No convertir sin fecha y fuente. | Rendimiento consolidado y exposición divisa. |
| Benchmark | `identifier`, `currency`, `methodology`, `rebalance_rule`, `start_date`, `source_id` | Declarar antes del período y validar que sea invertible/medible. | Exceso de rentabilidad y atribución. |
| Metadato de confianza | `coverage_pct`, `freshness`, `reconciled`, `warnings` | No esconder advertencias al agregar. | Semáforo de datos e informes. |

## 3. Métricas prioritarias y reglas de visualización

La medición y la atribución deben conciliar contra el retorno o el cambio de patrimonio total. El CFA Institute distingue medición, atribución y evaluación: la primera dice qué ocurrió, la segunda explica las fuentes y la tercera interpreta resultados a la luz del riesgo y de sus límites. [1] La aplicación debe seguir el mismo orden y no presentar ratios como conclusiones autosuficientes.

| Métrica o informe | Definición y fórmula resumida | Datos requeridos | Visual recomendado | Salvaguarda |
|---|---|---|---|---|
| Puente de patrimonio | `valor inicial + flujos externos + P&L de mercado + FX + rentas − comisiones = valor final`. | Snapshots, transacciones, FX y eventos de renta. | Cascada por período y tabla conciliable. | Bloquear si no cuadra dentro de una tolerancia declarada. |
| TWR | Encadena retornos de subperíodos, neutralizando flujos externos: `Π(1 + r_t) − 1`. | Valoraciones alrededor de cada flujo externo. | Línea indexada base 100 y tabla mensual. | Mostrar solo si hay valoraciones suficientes alrededor de flujos. |
| MWR / XIRR | Tasa que hace cero el valor presente de flujos y valor final. Explica el efecto temporal de aportaciones/retiros. | Fechas y cuantías reales de flujos, valoración final. | Tarjeta comparativa TWR vs MWR y explicación. | No comparar MWR de usuarios/plataformas como si fuera habilidad de gestor; depende del momento de flujos. [2] |
| Atribución de rentabilidad | Contribución por clase, instrumento, plataforma, divisa, renta y comisión; debe sumar el retorno total. | Holdings/snapshots, transacciones y clasificación. | Barras apiladas y waterfall con drill-down. | Etiquetar método: holdings, transacciones o retorno; no mezclar. [1] |
| Resultado realizado/no realizado | Ganancias/pérdidas cerradas frente a variación de valoración de posiciones abiertas. | FIFO/identificación, coste y valor actual. | Dos tarjetas y puente por instrumento. | No usar cotización no licenciada ni datos no fechados. |
| Concentración | Peso por activo, plataforma, divisa, clase y geografía; HHI `Σ peso²`. | Valoraciones y taxonomía. | Treemap + tabla Top 10 + umbrales informativos. | Indicar posiciones sin clasificar y no llamar «diversificada» a una cartera con cobertura incompleta. |
| Riesgo y pérdida | Volatilidad, drawdown máximo, duración de drawdown, Sortino y exposición a divisa. | Serie homogénea de valoraciones/precios y rendimiento libre de riesgo documentado si aplica. | Línea de drawdown, abanico de riesgos y tabla de período. | Mostrar ventana, frecuencia, divisa y número de observaciones; no extrapolar a futuro. [1] |
| Liquidez y caja | Saldo disponible, rentas previstas confirmadas, vencimientos y flujos futuros programados. | Movimientos, eventos y estado de confirmación. | Calendario mensual y tabla 30/90/180 días. | Separar confirmado de estimado; no prometer dividendos no declarados. |
| Coste total por plataforma | Comisiones, FX, spreads documentados, incidencias y resultado realizado. | Transacciones con fee y tasa, fuentes. | Matriz plataforma × métrica y ranking descriptivo. | No declarar «mejor plataforma» sin normalizar por universo, periodo y cobertura. |
| Calidad de datos | Cobertura, duplicados, antigüedad, movimientos sin coste, divisa/fecha/ISIN ausentes. | Todas las capas. | Barra de cobertura, lista priorizada y bloqueos. | Cada informe debe incluir su cobertura y advertencias. |

## 4. Informes reproducibles de alto valor

### 4.1 Informe ejecutivo de cartera

El informe mensual o trimestral debe ofrecer una lectura corta, comparable y verificable. La primera página muestra valor neto, cambio del período, TWR/MWR cuando estén disponibles y el nivel de cobertura. La segunda explica la atribución con un puente de patrimonio y contribución por clase/plataforma. La tercera recoge concentración, drawdown, divisas y liquidez. La cuarta enumera calidad de datos, movimientos significativos, alertas y anexos de metodología.

Cada gráfico debe incluir periodo, divisa base, origen y fecha de corte. Las páginas no deben adoptar lenguaje prescriptivo: «concentración observada» o «métrica pendiente de datos» es correcto; «comprar», «vender» o «mejor inversión» no lo es.

### 4.2 Informe de plataforma y coste operativo

Debe comparar únicamente períodos homogéneos y transacciones comparables. Incluiría volumen operado, comisiones, gasto FX, número de incidencias, tasa de operaciones con coste conocido, resultado realizado y cobertura. La posición en el ranking no debe ser una recomendación; su función es mostrar dónde falta conciliación y qué costes afectan al resultado histórico.

### 4.3 Dossier de instrumento y escenarios

La ficha de cada instrumento debe separar hechos de hipótesis. Los hechos incluyen cobertura disponible, fechas, fuente, precios/series documentadas, posiciones y resultado realizado. Las hipótesis incluyen FCF proyectado, WACC, crecimiento terminal, deuda neta, número de acciones y benchmark. Una matriz DCF de sensibilidad entre WACC y crecimiento terminal haría visible que la valoración depende de dichos supuestos.

### 4.4 Libro fiscal y de rentas

El módulo fiscal debe agrupar por ejercicio, tipo de activo, resultado realizado, operaciones bloqueadas, comisiones, retenciones, rentas y evidencia disponible. Solo podrá indicar «preparado para revisión» cuando no queden filas bloqueadas y la cobertura de justificantes alcance el umbral configurado. No debe declarar que el archivo está listo para presentar ni que determina una obligación tributaria individual.

## 5. Diseño de experiencia y visualizaciones

La mejora visual debe usar un **cockpit de cartera** en lugar de más tarjetas sin jerarquía. El área superior reúne cuatro decisiones: valor y retorno, riesgo, liquidez y calidad de datos. Debajo, una columna ancha explica el cambio del período con la cascada y una columna secundaria muestra concentración, eventos y alertas. Un selector global de período, cartera, divisa y nivel de datos —confirmado frente a estimado— debe afectar todo el tablero y quedar impreso en los informes exportados.

| Pantalla | Estructura visual | Interacción útil | Dato que debe permanecer visible |
|---|---|---|---|
| Resumen | KPI de valor/retorno/cobertura, cascada y concentración. | Cambiar período; abrir contribución desde cada barra. | Fecha de corte, divisa base, cobertura y advertencias. |
| Rendimiento | Línea indexada, TWR/MWR, puente de patrimonio y atribución. | Alternar rendimiento total, neto de comisiones y por plataforma. | Método de cálculo, flujos externos y benchmark. |
| Riesgo | Drawdown, concentración, divisa y matriz de correlación si hay serie suficiente. | Drill-down de activo a fuente. | Ventana, observaciones y valores ausentes. |
| Liquidez | Calendario 30/90/180 días y conciliación de caja. | Filtrar confirmado/estimado y plataforma. | Estado de confirmación y evidencia. |
| Instrumento | Precio/serie documentada, tesis, riesgo, supuestos DCF y sensibilidad. | Cambiar escenario sin alterar el caso base. | Fuente, periodo y supuestos. |
| Calidad | Reglas incumplidas, duplicados, filas sin coste, datos vencidos. | Ir al movimiento/fuente problemática. | Regla exacta y efecto sobre cada informe. |

La interfaz actual ya usa navegación lateral, una base clara de Canvas y Recharts. Se recomienda conservar el lenguaje visual azul-violeta/teal, usar color únicamente para codificar estados con leyenda textual y hacer que las advertencias sean navegables. Las visualizaciones deben poder descargarse junto con la tabla de respaldo; un gráfico sin su tabla de conciliación no es suficiente para un producto financiero.

## 6. Hoja de ruta priorizada

| Fase | Entregables | Dependencias | Criterio de finalización |
|---|---|---|---|
| **P0 — Fiabilidad de datos** | Modelo de flujos externos, clasificación de comisiones/rentas, metadatos de cobertura, centro de calidad y contrato de snapshots. | Esquema Supabase, migraciones, RLS remota verificada. | Cada panel identifica fecha, fuente, divisa y cobertura; no hay resultados agregados no conciliados. |
| **P1 — Explicar el rendimiento** | Puente de patrimonio, resultado realizado/no realizado, TWR/MWR, atribución inicial por plataforma/clase/divisa y PDF ejecutivo. | Valoraciones diarias, flujos y FX fechados. | La atribución reconcilia con cambio de patrimonio dentro de la tolerancia definida. |
| **P2 — Riesgo y liquidez** | Drawdown/duración, concentración/HHI, caja 30/90/180, coste operativo y alertas de calidad. | Series suficientes, taxonomía de activos y eventos de renta. | Cada ratio muestra ventana, cobertura y limitaciones; alertas no prescriptivas. |
| **P3 — Dossier y escenarios** | Sensibilidad DCF, benchmark declarado, factor/riesgo y paquete de informe por instrumento. | Fuente de fundamentales y precios con licencia, backend sincronizador. | Hipótesis versionadas, fuentes visibles y escenarios no confunden estimaciones con hechos. |
| **P4 — Integraciones seguras** | Google Sheets autorizado, SQL/OAuth backend, Power BI Embedded opcional y automatización de informes. | Edge Functions/vault, rol de conectores, Realtime optimizado y pruebas E2E. | Ningún secreto llega al navegador; el consentimiento y RLS se prueban por rol. |

## 7. Decisiones que deben mantenerse

La app no debe añadir cotizaciones en vivo sin licencia, un backend de sincronización y control de origen. Tampoco debe usar el score de análisis, Kelly, RSI o un DCF como consejo personalizado. El modelo actual ya marca varias de estas métricas como informativas; la nueva capa de informes debe reforzar esa distinción.

La comparación con benchmark solo debe aparecer tras definir por adelantado identificador, divisa, metodología, regla de rebalanceo y período. Un benchmark mal especificado invalida tanto atribución como evaluación posterior. [1] Para inversiones ilíquidas, criptoactivos sin serie confiable o activos alternativos, se debe ofrecer una vista de cobertura y método en lugar de forzar una comparación aparente.

## 8. Referencias

[1] [CFA Institute — Portfolio Performance Evaluation](https://www.cfainstitute.org/insights/professional-learning/refresher-readings/2026/portfolio-performance-evaluation)

[2] [GIPS Standards — Money-weighted returns in client reporting](https://www.gipsstandards.org/qadatabase/4805/)

[3] [CFA Institute Research and Policy Center — Performance Measurement and Attribution](https://rpc.cfainstitute.org/topics/performance-attribution)
