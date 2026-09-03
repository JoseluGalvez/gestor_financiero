# Presentación: exportaciones y oportunidad a revisar

## Cover

**Exportaciones confiables y oportunidad explicable**

**Portafolio Intel · Salud financiera de empresa**

## Slide 1

**El análisis no termina en la pantalla**

- La misma instancia local de análisis alimenta la interfaz, CSV y PDF.
- Cada resultado conserva fecha, fuente declarada, divisa y cobertura.
- No existe sincronización automática de los datos introducidos.

## Slide 2

**CSV: trazabilidad y seguridad para hojas de cálculo**

- Exporta ratios, fórmula, objetivo, entradas, estado y advertencias.
- Añade BOM UTF-8 para preservar caracteres.
- Neutraliza celdas que podrían evaluarse como fórmulas en una hoja de cálculo.

## Slide 3

**PDF: contexto antes que conclusiones**

- Organiza las métricas por valoración, rentabilidad, márgenes, solvencia y caja.
- Incluye señales de salud, evidencia de oportunidad y advertencias.
- Es un informe local explicable; no certifica ni audita las fuentes.

## Slide 4

**OPORTUNIDAD significa investigar, no predecir**

- El estado favorable se denomina “candidata a investigación adicional”.
- No calcula una probabilidad de beneficios ni indica comprar, vender o mantener.
- Exige fuentes actualizadas, valoración, riesgos y un horizonte definidos antes de decidir.

## Slide 5

**Las reglas favorables son acumulativas**

- Cobertura de métricas de al menos 80 %.
- ROIC−WACC positivo, deuda neta/EBITDA inferior a 2,0× y cobertura de intereses de al menos 3,0×.
- Conversión de FCF de al menos 80 % y ROE de al menos 12 % como referencias orientativas.

## Slide 6

**Una alerta crítica bloquea el estado favorable**

- Deuda neta/EBITDA superior a 2,5×.
- Cobertura de intereses inferior a 3,0×.
- ROIC−WACC negativo o evidencia insuficiente.

## Slide 7

**Los perfiles de inversores son fuentes, no señales**

- Buffett, Simons, Burry, Druckenmiller y Smith aparecen como referencias de estudio.
- Las tarjetas enlazan cartas, fichas oficiales o divulgaciones SEC; cuando existe, enlazan composición o gráfico público.
- Un 13F puede ser histórico, parcial y no mostrar la exposición económica completa. [1]

## Slide 8

**Control de calidad antes de ampliar automatización**

- Pruebas deterministas validan fórmulas, valores no significativos y bloqueo por apalancamiento.
- Build y lint verifican la integración de exportación.
- Pendiente: incorporar un runner TypeScript explícito para activar la regresión CSV en CI.

## Slide 9

**Decisión: usar la función como investigación trazable**

**Datos consistentes → ratios explicables → evidencia y advertencias → revisión humana**

> No usar una exportación ni una cartera divulgada como instrucción operativa.

## Referencias

[1] [SEC — Form 13F de Scion Asset Management, alcance y advertencia de exactitud](https://www.sec.gov/Archives/edgar/data/1649339/000164933925000007/xslForm13F_X02/primary_doc.xml)
