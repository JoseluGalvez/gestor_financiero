# Exportaciones, oportunidad a revisar y pruebas del análisis de salud financiera

> **Aviso financiero.** Esta función realiza análisis explicable a partir de datos introducidos por la persona usuaria. No estima una probabilidad de beneficio, no genera una recomendación de compra o venta y no ejecuta operaciones. Invertir conlleva riesgo y la decisión final corresponde a la persona usuaria.

## 1. Pruebas unitarias de las fórmulas

La regresión `tests/verify-company-fundamentals.mts` usa `node:assert/strict` para fijar entradas ficticias y comprobar resultados esperados. No depende de precios ni estados financieros reales. De este modo, una modificación de la fórmula o de su redondeo provoca un fallo reproducible.

| Grupo de prueba | Comprobación | Finalidad |
|---|---|---|
| Valoración | Capitalización, deuda neta, EV, BPA, PER, EV/EBITDA y P/FCF. | Evitar que las métricas utilicen un denominador o componente incorrecto. |
| Rentabilidad | ROE, ROIC y diferencial ROIC−WACC. | Confirmar NOPAT, capital invertido y conversión a puntos porcentuales. |
| Márgenes, solvencia y caja | Márgenes, deuda neta/EBITDA, cobertura de intereses y conversión FCF. | Validar relaciones contables básicas y unidades. |
| Valores no significativos | BPA, FCF o EBITDA negativos. | Exigir que PER, P/FCF y deuda neta/EBITDA queden en `null` con el estado `not_meaningful`. |
| Oportunidad a revisar | Caso completo y caso con deuda neta/EBITDA superior a 2,5×. | Asegurar que una empresa solo queda como candidata a investigación si hay evidencia suficiente y que una alerta de endeudamiento la bloquea. |

El patrón central es deliberadamente directo:

```ts
assert.equal(metricValue(result, "roic"), 14.2713);
assert.equal(metricValue(nonMeaningful, "per"), null);
assert.equal(
  nonMeaningful.metrics.find((metric) => metric.key === "per")?.status,
  "not_meaningful",
);
assert.equal(redFlag.opportunity.status, "not_supported");
```

La prueba se ejecutó correctamente con:

```bash
node --experimental-strip-types tests/verify-company-fundamentals.mts
```

El repositorio incluye también `tests/verify-company-fundamentals-export.mts`, que verifica el BOM UTF-8 del CSV, las cabeceras, la evidencia de oportunidad y el escape de celdas que comienzan por `=`, `+`, `-` o `@`. Ese archivo está preparado como regresión, pero su ejecución directa con el modo experimental de TypeScript de Node encontró limitaciones de resolución ESM para imports de tipos. Tras tres intentos no se siguió forzando el mismo ejecutor. La compilación de producción y el lint sí validan el exportador. Para convertirlo en una prueba ejecutable en la integración continua se debe adoptar de forma explícita un runner TypeScript con resolución de aliases, por ejemplo Jest/ts-jest o Vitest, antes de declararla como control de entrega.

## 2. Exportación reproducible

Los botones **Exportar CSV** y **Exportar PDF** se habilitan cuando existe al menos una métrica calculable. Ambos archivos se construyen localmente a partir de la misma instancia `analysis` que alimenta la pantalla; no se envían a Supabase ni a un proveedor externo.

| Formato | Contenido | Protección |
|---|---|---|
| CSV UTF-8 | Contexto, fecha, fuente declarada, cobertura, ratios, fórmula, objetivo, entradas, estado, advertencias y evidencia de oportunidad. | Añade BOM UTF-8 y antepone una comilla simple a valores que podrían convertirse en fórmulas de hoja de cálculo. |
| PDF | Encabezado, contexto, ratios por categoría, fórmulas, señales, oportunidad y advertencias. | Se genera con `@react-pdf/renderer` desde datos de memoria; no es un informe auditado ni una validación independiente. |

El nombre de los archivos se normaliza sin caracteres de ruta y adopta la forma `salud-financiera-{empresa}-{fecha}.{csv|pdf}`.

## 3. Criterio de “OPORTUNIDAD”

La aplicación no puede afirmar una posibilidad real de inversión con alta probabilidad de beneficios. Ese tipo de afirmación exigiría una definición de horizonte, comparación sectorial, calidad y actualización de estados financieros, estimación de riesgos, valoración, datos de mercado y un modelo validado; incluso así, las inversiones no tienen resultados garantizados.

Por esta razón, la sección se denomina **OPORTUNIDAD — candidata a investigación adicional**. Solo adopta ese estado cuando se cumplen simultáneamente las siguientes condiciones con los datos introducidos:

| Evidencia | Regla explícita | Uso |
|---|---|---|
| Cobertura | Al menos 80 % de métricas disponibles. | Evita interpretar una ficha incompleta como positiva. |
| ROIC−WACC | Positivo. | Señal condicional de retorno sobre capital por encima del coste de capital introducido. |
| Deuda neta/EBITDA | Inferior a 2,0× como referencia orientativa. | Control descriptivo de apalancamiento. |
| Cobertura de intereses | Igual o superior a 3,0×. | Revisión mínima de capacidad de cubrir intereses. |
| Conversión de FCF | Igual o superior a 80 %. | Contraste básico de caja frente a beneficio. |
| ROE | Igual o superior a 12 % como referencia sectorial orientativa. | Indicador contable que requiere comparación sectorial. |

Una deuda neta/EBITDA superior a 2,5×, una cobertura de intereses inferior a 3× o un diferencial ROIC−WACC negativo bloquean la clasificación favorable. El resultado sigue siendo una lista de investigación: debe contrastarse con valoración, competencia, riesgos de negocio, gobierno corporativo, vencimientos, ciclo, calidad de beneficios y fuentes actuales.

## 4. Perfiles y enlaces de inversores

Los perfiles de Buffett, Simons, Burry, Druckenmiller y Smith son recursos de estudio. La pantalla publica enlaces directos a cartas, fichas oficiales o búsquedas SEC, además de un enlace al gráfico/composición pública cuando la fuente lo ofrece. No replica una cartera ni presenta las posiciones divulgadas como una señal.

Los formularios 13F tienen retrasos y alcance limitado. La propia SEC advierte que no ha revisado necesariamente la información de esas presentaciones ni ha determinado que sea exacta y completa. Por tanto, un enlace a un 13F debe entenderse como una divulgación histórica, no como una orden de operación. [1]

Fundsmith publica en su ficha datos de composición, rendimiento y riesgos del fondo; la propia entidad declara que la rentabilidad pasada no es guía de la futura. [2]

## Referencias

[1] [SEC — Form 13F de Scion Asset Management, advertencia de alcance y exactitud](https://www.sec.gov/Archives/edgar/data/1649339/000164933925000007/xslForm13F_X02/primary_doc.xml)

[2] [Fundsmith — Factsheet, composición, gráfico de rendimiento y riesgos](https://www.fundsmith.co.uk/factsheet/)

[3] [Berkshire Hathaway — Cartas a accionistas](https://www.berkshirehathaway.com/letters/letters.html)

[4] [SEC — Form 13F de Duquesne Family Office](https://www.sec.gov/Archives/edgar/data/1536411/000153641124000007/xslForm13F_X02/primary_doc.xml)
