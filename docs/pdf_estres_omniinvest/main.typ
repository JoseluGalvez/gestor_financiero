// Informe profesional — prueba de estrés OmniInvest.
#import "report-theme.typ": report-accent, report-theme
#import "@preview/glossarium:0.5.10": make-glossary, register-glossary, print-glossary, gls

#show: report-theme.with(
  title: "Prueba de estrés OmniInvest",
  author: "Manus AI",
  rhythm: "report",
  running-header: true,
)
#show: make-glossary

#let glossary-entries = (
  (
    key: "cobertura",
    short: [cobertura],
    long: [Cobertura],
    description: [Porcentaje del valor o de los factores para el que existe evidencia utilizable y declarada.],
  ),
  (
    key: "hhi",
    short: [HHI],
    long: [Índice Herfindahl–Hirschman],
    description: [Suma de los cuadrados de los pesos conocidos; describe la concentración de una distribución, no predice pérdidas.],
  ),
  (
    key: "estres",
    short: [prueba de estrés],
    long: [Prueba de estrés],
    description: [Escenario hipotético que aplica un choque explícito para observar sensibilidad aritmética.],
  ),
  (
    key: "volatilidad",
    short: [volatilidad],
    long: [Volatilidad],
    description: [Variación de retornos en una serie; requiere observaciones, frecuencia y cobertura suficientes antes de anualizarse.],
  ),
  (
    key: "concentracion",
    short: [concentración],
    long: [Concentración],
    description: [Peso relativo acumulado en uno o varios buckets de cartera, por ejemplo emisor, sector o divisa.],
  ),
)
#register-glossary(glossary-entries)

// ---------- Portada ----------
#page(margin: (top: 28%, x: 2.2cm), numbering: none, header: none)[
  #set par(first-line-indent: 0em)
  #align(center)[
    #text(size: 26pt, weight: "bold", fill: report-accent)[Prueba de estrés OmniInvest]
    #v(0.5em)
    #text(size: 14pt, fill: luma(80))[Caída uniforme del 20 %, métricas de riesgo y controles generales de diversificación]
    #v(2em)
    #line(length: 40%, stroke: 0.5pt + luma(160))
    #v(2em)
    #text(size: 11pt)[
      Autor: Manus AI \
      Fecha: 28 de agosto de 2026 \
      Datos: escenario didáctico enteramente ficticio
    ]
  ]
]

// ---------- Índice ----------
#page(numbering: none, header: none)[
  #outline(title: [Contenido], indent: 1.5em)
]

// ---------- Cuerpo ----------
#counter(page).update(1)

= Resumen ejecutivo

La simulación aplica una caída uniforme del 20,00 % solo a los buckets ficticios definidos como exposición valorada a mercado. Con 90.000,00 EUR de valor inicial ficticio, de los cuales 15.000,00 EUR se mantienen como efectivo bajo la hipótesis, el valor estresado es 75.000,00 EUR. El impacto aritmético total es −15.000,00 EUR, equivalente a −16,67 % del valor inicial.

El resultado no debe interpretarse como una previsión. Es una @estres con una única hipótesis de precio: no incorpora correlaciones, colas de distribución, liquidez, crédito, divisas, derivados, comisiones, impuestos ni cambios de comportamiento. El uso correcto del resultado es comprobar que el módulo conserva valores, signos, @cobertura y advertencias sin inventar datos.

#quote(block: true)[
  La cifra de 100 % de cobertura corresponde a los seis factores declarados del ejemplo OmniInvest. No equivale a cobertura integral de riesgos financieros ni a suficiencia para tomar una decisión.
]

= Escenario y resultados

== Hipótesis explícitas

La tabla siguiente describe la única composición utilizada. Los nombres, importes y categorías son de prueba. Las posiciones de renta variable y renta fija se someten al choque de mercado; el efectivo no cambia por definición del caso.

#table(
  columns: (2.5fr, 1.1fr, 1fr, 1.1fr, 1.2fr),
  inset: 6pt,
  stroke: 0.4pt + luma(180),
  [*Bucket ficticio*], [*Base (EUR)*], [*Choque*], [*Cambio (EUR)*], [*Estrés (EUR)*],
  [Renta variable global], [50.000,00], [−20,00 %], [−10.000,00], [40.000,00],
  [Renta fija diversificada], [25.000,00], [−20,00 %], [−5.000,00], [20.000,00],
  [Efectivo en EUR], [15.000,00], [0,00 %], [0,00], [15.000,00],
  [*Total*], [*90.000,00*], [*−16,67 %*], [*−15.000,00*], [*75.000,00*],
)

El impacto de cartera se calcula como `(75.000,00 − 90.000,00) / 90.000,00`. La caída no es −20,00 % sobre el total porque 16,67 % del valor inicial se mantiene como efectivo sin choque. Este detalle es un control de consistencia: sumar porcentajes de retorno en lugar de aplicar la exposición por bucket produciría una lectura errónea.

#figure(
  image("assets/omniinvest-estres-mercado-ficticio.png", width: 100%),
  caption: [Sensibilidad y cambio de pesos bajo el escenario ficticio. Fuente: cálculo determinista de `simulate-omniinvest-market-drop.mts`.],
)

== Concentración y señal de riesgo

La @concentracion se describe con pesos relativos y HHI. En la composición inicial, el bucket de renta variable representa 55,56 %, renta fija 27,78 % y efectivo 16,67 %. Después del choque, los pesos son 53,33 %, 26,67 % y 20,00 %, respectivamente. El HHI pasa de `0,4135802469` a `0,3955555556` porque el efectivo no afectado gana peso relativo.

Este descenso de HHI no acredita una mejora del riesgo. Solo refleja una composición relativa distinta tras el choque. Una evaluación de riesgo conectada requerirá valorar cada posición, declarar la cobertura de FX y taxonomía, y separar concentración, sensibilidad de mercado, @volatilidad, crédito y liquidez.

#table(
  columns: (2.3fr, 1.25fr, 1.25fr, 2.1fr),
  inset: 6pt,
  stroke: 0.4pt + luma(180),
  [*Métrica*], [*Base ficticia*], [*Estrés ficticio*], [*Lectura válida*],
  [Peso mayor bucket], [55,56 %], [53,33 %], [Sigue siendo la mayor exposición declarada.],
  [Peso de efectivo], [16,67 %], [20,00 %], [Aumenta por el supuesto de no choque.],
  [HHI], [0,4135802469], [0,3955555556], [Distribución de pesos, no probabilidad de pérdida.],
  [Valor no cubierto], [0,00 %], [0,00 %], [Cero solo dentro de este fixture plenamente declarado.],
)

= Indicador OmniInvest bajo estrés

OmniInvest conserva los pesos visibles de sus seis dimensiones. El escenario de estrés no importa señales externas: declara una hipótesis didáctica de menor valoración, momentum técnico y gestión de riesgo. La puntuación baja de 65,6 a 59,6 puntos sobre 100 con cobertura de factores del 100 %.

#table(
  columns: (2.5fr, 1.2fr, 1.3fr, 1fr),
  inset: 6pt,
  stroke: 0.4pt + luma(180),
  [*Factor*], [*Base*], [*Estrés*], [*Variación*],
  [Salud financiera], [76,0], [76,0], [0,0],
  [Crecimiento], [68,0], [68,0], [0,0],
  [Valoración], [59,0], [55,0], [−4,0],
  [Ventaja competitiva], [72,0], [72,0], [0,0],
  [Momentum técnico], [54,0], [30,0], [−24,0],
  [Gestión de riesgo], [61,0], [45,0], [−16,0],
  [*Indicador ponderado*], [*65,6 / 100*], [*59,6 / 100*], [*−6,0*],
)

La puntuación no es una recomendación de compra, venta o asignación. Es una salida local explicable: cada factor está presente, por lo que se publica la cobertura; si faltase información suficiente, el motor debe marcar `partial` y puede suprimir la puntuación agregada.

= Pruebas deterministas y resultados

Las pruebas adicionales verifican que el módulo gestiona tanto un choque moderado como un crash hipotético, y que mantiene las salvaguardas de valores no finitos, posiciones vacías y límites imposibles.

#table(
  columns: (1.25fr, 2.7fr, 2.75fr),
  inset: 6pt,
  stroke: 0.4pt + luma(180),
  [*Caso*], [*Entrada sintética*], [*Resultado requerido y observado*],
  [STRESS-001], [−20 % sobre 75.000,00 EUR expuestos; 15.000,00 EUR en efectivo.], [Valor 75.000,00 EUR, impacto −16,67 %, efectivo sin choque y HHI recalculado.],
  [STRESS-002], [−100 % sobre los buckets valorados a mercado.], [Solo 15.000,00 EUR de efectivo; valores de mercado no negativos; HHI igual a 1.],
  [STRESS-003], [Ruta: −35 %, +40 %, −30 %, +25 %, −50 %.], [Valor final 39,8125 sobre base 100; se conserva composición multiplicativa.],
  [STRESS-004], [Seis factores, dos con valor cero explícito.], [Cobertura 100 %, estado `ready` y puntuación 47,6; cero no se trata como dato ausente.],
  [STRESS-005], [Choque menor que −100 %, NaN o escenario vacío.], [Bloqueo controlado con error; no se publica un resultado aparente.],
)

La ejecución de `verify-omniinvest-stress.mts`, `verify-omniinvest.mts` y `npm run lint` finalizó correctamente. Las pruebas usan exclusivamente fixtures. Las advertencias de Node relativas al type stripping ESM se registran como advertencias del ejecutor y no como resultados fallidos.

= Controles generales de diversificación

Las siguientes acciones son criterios educativos de revisión del riesgo, no una asignación individualizada. En una futura integración con el libro mayor, deberían convertirse en comprobaciones visibles y configurables por política, junto a su cobertura y procedencia.

#table(
  columns: (2.1fr, 2.6fr, 2fr),
  inset: 6pt,
  stroke: 0.4pt + luma(180),
  [*Control general*], [*Pregunta que debe responder la interfaz*], [*Evidencia mínima*],
  [Concentración por emisor], [¿Qué peso tienen top 1 y top 3, y qué valor no está clasificado?], [Taxonomía versionada, valoración y fecha de corte.],
  [Diversificación por fuente de riesgo], [¿Se agrupan exposiciones por activo, sector, región, divisa y plataforma?], [Clasificación de instrumento y cobertura por dimensión.],
  [Efectivo y liquidez], [¿Qué parte del valor depende de una hipótesis de liquidez o de precio?], [Separación de efectivo, activos valorados y valor no cubierto.],
  [Choques múltiples], [¿Cómo cambia el valor si los buckets no se mueven de forma uniforme?], [Escenarios declarados; sin inferir correlaciones no observadas.],
  [Calidad del dato], [¿Qué métricas no deben interpretarse por falta de precio, FX o serie?], [Cobertura, avisos, huella de entradas y política.],
)

El módulo no debe ocultar una posición sin clasificación para mejorar un indicador de concentración, ni sustituir ausencia de valoración por cero. Antes de mostrar medidas avanzadas, la interfaz debe declarar el valor sin precio, la parte sin FX y la proporción no clasificada. Este enfoque mejora la capacidad de revisión sin convertir una simulación en instrucción de inversión.

= Próximos pasos de producto

1. Cerrar RLS y Realtime en staging para que una futura cartera autorizada no pueda cruzar organizaciones ni disparar recargas integrales.
2. Aprobar una política versionada de cobertura, moneda base, valoraciones, efectivo, impuestos informados y tratamiento de instrumentos complejos.
3. Construir el proyector de exposición desde el libro mayor normalizado y mostrar buckets conocidos, no clasificados y valor no cubierto.
4. Añadir una biblioteca de escenarios declarados por el usuario, sin fuentes externas automáticas, antes de cualquier conector de datos.
5. Mantener resultados de estrés, TWR/XIRR y atribución separados: miden preguntas distintas y cada uno requiere sus propios controles de calidad.

#pagebreak()
= Glosario

#show heading.where(level: 1): set text(size: 17pt, weight: "bold", fill: report-accent)
#print-glossary(glossary-entries, show-all: true, disable-back-references: true)

= Referencias y trazabilidad

- `tests/simulate-omniinvest-market-drop.mts`: escenario inicial de caída uniforme del 20 % y cálculo de HHI.
- `tests/verify-omniinvest-stress.mts`: crash hipotético, volatilidad extrema compuesta, cobertura y bloqueos numéricos.
- `src/lib/omniinvest-stress.ts`: contrato local de sensibilidad y validación de límites del choque.
- `src/lib/omniinvest.ts`: motor de cobertura y puntuación ponderada de OmniInvest.
- `docs/INTEGRACION_OMNIINVEST_LIBRO_MAYOR_RIESGO_2026-08-28.md`: diseño de cobertura, concentración, RLS y Realtime futuros.
- #link("https://www.gipsstandards.org/standards/gips-standards-for-firms/gips-standards-handbook-for-firms/")[CFA Institute — GIPS Standards Handbook]: referencia técnica de rendimiento; no aporta cifras a este escenario ficticio.

#quote(block: true)[
  Divulgación: la base es una sensibilidad aritmética con posiciones inventadas y un choque uniforme; la fecha de referencia es 28 de agosto de 2026. No se usaron cotizaciones, carteras, proveedores ni estimaciones reales. Las conclusiones de diversificación son controles generales de revisión. Esto es investigación y análisis ilustrativo, no asesoramiento financiero personalizado.
]
