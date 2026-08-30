# Simulación OmniInvest — caída uniforme de mercado del 20 %

**Fecha de simulación:** 28 de agosto de 2026  
**Naturaleza:** ejemplo enteramente ficticio y determinista. No representa una cartera, precio, instrumento, cotización ni recomendación real.

## 1. Propósito y supuestos

Esta simulación ilustra cómo una futura capa de sensibilidad de OmniInvest podría separar el efecto de un choque de mercado de la composición de una cartera. Usa tres posiciones **inventadas para prueba** en EUR y un choque uniforme del **−20,00 %** solo sobre las posiciones clasificadas como valoradas a mercado. El efectivo permanece constante por hipótesis. No se consideran comisiones, impuestos, retenciones, FX, cambios de crédito, liquidez, correlaciones, derivados, rebalanceos, inflación, suspensión de cotización ni variación de spreads.

> El `100 %` de cobertura de factores de OmniInvest significa únicamente que se declararon los seis factores del ejemplo. No significa que el escenario cubra todos los riesgos financieros ni que las hipótesis sean suficientes para una decisión.

## 2. Cartera ficticia y efecto del choque

| Posición ficticia | Valor inicial (EUR) | Choque supuesto | Variación (EUR) | Valor bajo estrés (EUR) |
| --- | ---: | ---: | ---: | ---: |
| Renta variable global — posición ficticia | 50.000,00 | −20,00 % | −10.000,00 | 40.000,00 |
| Renta fija diversificada — posición ficticia | 25.000,00 | −20,00 % | −5.000,00 | 20.000,00 |
| Efectivo en EUR — posición ficticia | 15.000,00 | 0,00 % | 0,00 | 15.000,00 |
| **Total** | **90.000,00** | **−16,67 % sobre cartera** | **−15.000,00** | **75.000,00** |

La cartera no cae un 20,00 % porque solo 75.000,00 EUR están expuestos al choque uniforme; el efectivo de 15.000,00 EUR no cambia bajo el supuesto definido. La fórmula usada es:

```text
valor_estresado = Σ(valor_inicialᵢ × (1 + choqueᵢ))
impacto_cartera = (valor_estresado − valor_inicial_total) / valor_inicial_total
```

## 3. Lectura de concentración de este ejemplo

Con pesos sobre el total de cartera, antes del escenario los buckets son 55,56 %, 27,78 % y 16,67 %. Tras el choque son 53,33 %, 26,67 % y 20,00 %. El HHI ilustrativo pasa de `0,4135802469` a `0,3955555556` porque el efectivo no afectado gana peso relativo; este cambio no significa que el riesgo total se haya reducido ni sustituye una medida de volatilidad, correlación o crédito.

| Métrica descriptiva | Base ficticia | Estrés ficticio | Interpretación limitada |
| --- | ---: | ---: | --- |
| Peso mayor posición | 55,56 % | 53,33 % | Sigue siendo el bucket de mayor peso. |
| Peso de efectivo | 16,67 % | 20,00 % | Aumenta por no sufrir el choque supuesto. |
| HHI de los tres buckets | 0,4135802469 | 0,3955555556 | Mide distribución de pesos bajo esta clasificación simplificada, no una predicción de pérdida. |

## 4. Señales OmniInvest simuladas

El motor local `evaluateOmniInvest` parte del escenario ficticio integrado de OmniInvest. Para el estrés se conservan los factores financieros declarados y se cambian solo las hipótesis de valoración, momentum técnico y riesgo. Estas variaciones son parámetros didácticos explícitos; no se han calculado desde precios de mercado.

| Factor 0–100 | Caso ficticio base | Caso ficticio bajo estrés | Cambio hipotético |
| --- | ---: | ---: | ---: |
| Salud financiera | 76,0 | 76,0 | 0,0 |
| Crecimiento | 68,0 | 68,0 | 0,0 |
| Valoración | 59,0 | 55,0 | −4,0 |
| Ventaja competitiva | 72,0 | 72,0 | 0,0 |
| Momentum técnico | 54,0 | 30,0 | −24,0 |
| Riesgo | 61,0 | 45,0 | −16,0 |
| **Indicador ponderado** | **65,6 / 100** | **59,6 / 100** | **−6,0 puntos** |
| **Cobertura de factores** | **100 %** | **100 %** | **Sin cambio** |

El cambio de `65,6` a `59,6` es el resultado reproducible de los pesos visibles de OmniInvest sobre las hipótesis introducidas. No es una probabilidad de caída, un precio objetivo ni una recomendación de modificar la cartera.

## 5. Controles validados

El script `tests/simulate-omniinvest-market-drop.mts` ejecutó y verificó los siguientes controles:

1. El valor inicial ficticio suma 90.000,00 EUR.
2. El choque se aplica solo a los dos buckets definidos como `market_priced`.
3. El valor final ficticio es 75.000,00 EUR y el cambio preserva signo e importe de −15.000,00 EUR.
4. El impacto agregado resulta −16,6666666667 %, no −20,00 %, al conservar el efectivo.
5. El escenario base devuelve `65,6 / 100` y el escenario estresado `59,6 / 100` con el motor OmniInvest.
6. La cobertura de factores se mantiene en 100 % porque todos los inputs hipotéticos están presentes.
7. El HHI bajo estrés es inferior al inicial bajo esta composición y supuesto, sin interpretar esa diferencia como una mejora de riesgo.

## 6. Qué faltaría para una sensibilidad de cartera real

Una simulación conectada requeriría el libro mayor normalizado, valoraciones y FX con procedencia, clasificación de instrumentos, RLS remota verificada, consentimiento de ámbito, política versionada, tratamiento de efectivo/derivados/impuestos y validación de cobertura. El resultado debería declarar corte temporal, base monetaria, proveedores, precios ajustados, huecos, algoritmo, fecha y versión de política. Nunca debería importar de forma implícita el contenido del Canvas local ni publicar eventos crudos por Realtime.

## 7. Límites

Este ejemplo no modela distribución de probabilidades, correlación, colas, VaR/CVaR, cambios de volatilidad, crédito, liquidez, contraparte, margen, stop-loss, fiscalidad ni conducta del inversor. Una caída uniforme es un escenario de estrés simple para enseñar el efecto aritmético de la exposición; no describe cómo se comportará ningún mercado o cartera.

---

**Divulgación:** la base metodológica es una sensibilidad aritmética de valor de mercado con un choque uniforme y un indicador OmniInvest ponderado con entradas ficticias. La fecha del ejemplo es 28 de agosto de 2026; no se usaron fuentes ni datos de mercado. Los supuestos están listados expresamente y el escenario no recomienda ninguna acción. Esto es investigación y análisis ilustrativo, no asesoramiento financiero personalizado.
