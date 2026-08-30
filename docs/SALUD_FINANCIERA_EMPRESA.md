# Salud financiera y rentabilidad de empresa

## Alcance

La sección **Salud empresa** permite introducir el nombre de una empresa y sus datos fundamentales para calcular ratios de valoración, rentabilidad, márgenes, solvencia y generación de caja. El cálculo se produce automáticamente en memoria del navegador mientras se edita el formulario. La versión actual no busca datos por ticker, no consulta proveedores de mercado, no guarda el análisis en Supabase y no transmite los valores introducidos a IA o servicios externos.

La finalidad es explicar las relaciones entre datos financieros de un mismo período y fuente. No es una recomendación de compra, venta, mantenimiento o asignación de capital; tampoco sustituye las cuentas anuales, la revisión de notas contables, una comparación sectorial o el criterio profesional.

## Datos de contexto obligatorios para interpretar un análisis

Además de los importes, el formulario solicita el nombre identificativo de la empresa, fecha de referencia, divisa y etiqueta de fuente/período contable. Estos valores no se verifican de forma automática. La persona usuaria debe asegurarse de que los datos proceden del mismo perímetro de consolidación, período y definición contable.

| Campo | Uso | Tratamiento si falta |
|---|---|---|
| Empresa indicada | Identifica la ficha calculada. | Se muestra una advertencia; no activa búsqueda externa. |
| Fecha de referencia | Evita comparar cotización y estados financieros de períodos no declarados. | Se muestra una advertencia. |
| Divisa | Formatea los importes monetarios. | Se usa EUR por defecto; no realiza conversión FX. |
| Fuente y período | Documenta de dónde proceden las cifras y el cierre contable. | Se muestra una advertencia; no se etiqueta el resultado como trazable. |

## Fórmulas implementadas

Las fórmulas se trasladan del archivo proporcionado `pasted_content.txt`. Cada ratio dispone de un icono de ayuda accesible por foco o puntero. El tooltip muestra fórmula, objetivo, entradas necesarias y el origen de la fórmula.

| Bloque | Métrica | Fórmula aplicada | Regla de disponibilidad |
|---|---|---|---|
| Valoración | BPA | `Beneficio neto / Acciones en circulación` | Exige acciones positivas. |
| Valoración | Capitalización | `Precio × Acciones`, o valor directo. | Requiere precio y acciones positivos o capitalización directa. |
| Valoración | Deuda neta | `Deuda financiera total − Caja y equivalentes` | Requiere deuda y caja. |
| Valoración | EV | `Capitalización + Deuda neta` | Requiere ambos componentes. |
| Valoración | PER | `Precio / BPA` | No se publica con BPA nulo o negativo. |
| Valoración | EV/EBITDA | `EV / EBITDA` | No se publica con EBITDA no positivo. |
| Valoración | P/FCF | `Capitalización / FCF` | No se publica con FCF no positivo. |
| Rentabilidad | ROE | `(Beneficio neto / Patrimonio neto) × 100` | Exige patrimonio neto positivo. |
| Rentabilidad | ROIC | `[EBIT × (1 − Tasa fiscal)] / (Patrimonio neto + Deuda neta) × 100` | Exige tasa fiscal de 0 % a 100 % y capital invertido positivo. |
| Rentabilidad | ROIC − WACC | `ROIC − WACC` | Requiere ROIC calculable y WACC explícito de 0 % a 100 %. |
| Márgenes | Margen bruto | `[(Ventas − Coste de ventas) / Ventas] × 100` | Exige ventas positivas. |
| Márgenes | Margen operativo | `(EBIT / Ventas) × 100` | Exige ventas positivas. |
| Márgenes | Margen neto | `(Beneficio neto / Ventas) × 100` | Exige ventas positivas. |
| Solvencia | Deuda neta / EBITDA | `Deuda neta / EBITDA` | No se publica con EBITDA no positivo. |
| Solvencia | Cobertura de intereses | `EBIT / Gastos financieros por intereses` | Exige gasto por intereses positivo. |
| Caja | Conversión FCF | `(Flujo de caja libre / Beneficio neto) × 100` | No se publica con beneficio neto no positivo. |

## Cobertura y estados

La pantalla calcula el porcentaje de métricas disponibles sobre el total de métricas definidas. La cobertura no es una puntuación de calidad empresarial; solo indica cuántos ratios pueden calcularse con los valores introducidos. Cuando la cobertura es inferior al 60 %, se añade una advertencia y el resultado debe leerse como parcial.

| Estado | Significado en la interfaz |
|---|---|
| **Calculable** | Existen entradas válidas y la fórmula devuelve un valor finito. |
| **Falta información** | Falta al menos una entrada necesaria. |
| **No significativo** | Las entradas existen, pero el denominador o la condición económica no permite una ratio comparable, por ejemplo BPA, EBITDA o FCF no positivos. |

## Señales orientativas

Cuando los valores son calculables, la interfaz añade observaciones descriptivas sobre deuda neta/EBITDA, cobertura de intereses y diferencial ROIC−WACC. Los umbrales de deuda neta/EBITDA (2,0–2,5×) y cobertura de intereses inferior a 3× aparecen como referencias orientativas del archivo aportado. La interfaz declara expresamente que dependen del sector, ciclo, estructura de vencimientos, liquidez y definición contable; no son una clasificación de riesgo ni una instrucción operativa.

## Privacidad y trazabilidad

Los cálculos ocurren en el estado React de la pantalla y se eliminan al recargar, cerrar la pestaña o usar **Limpiar**. El botón **Cargar ejemplo ficticio** carga exclusivamente la empresa ficticia `Compañía Horizonte`; sirve para comprobar los cálculos, no representa una empresa real. No hay almacenamiento automático, descarga, sincronización ni lectura de cotizaciones.

La futura conexión de este formulario con fundamentales reales requerirá selección de fuente/licencia, adaptador server-side, fecha fiscal y período de reporte, controles de cobertura, RLS y persistencia explícita de procedencia. No forma parte de esta implementación.

## Verificaciones realizadas

| Verificación | Resultado |
|---|---|
| Regresión determinista de fórmulas | Correcta: capitalización, deuda neta, EV, BPA, PER, EV/EBITDA, P/FCF, ROE, ROIC, márgenes, solvencia y conversión FCF. |
| Casos no significativos | Correctos: PER, P/FCF y deuda neta/EBITDA no se publican ante BPA, FCF o EBITDA no positivos. |
| Compilación y TypeScript | `npm run build` correcto. |
| Lint | `npm run lint` correcto. |
| Accesibilidad estática | Se verificaron etiquetas de campos, región de resultados `aria-live`, botones de tooltip etiquetados y contenido con `role="tooltip"`. |

La comprobación visual autenticada queda pendiente de iniciar sesión en la aplicación; no se utilizó ni se solicitó ninguna sesión de usuario para probar esta función.
