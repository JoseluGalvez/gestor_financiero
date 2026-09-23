# Guía de Inversión 2026 — Plataformas, Análisis y Protocolo Diario

> **Documento único consolidado.** Esta guía reemplaza el formato de rankings solapados ("10 mejores…", "5 gratuitos…", "7 screeners…") por una **base de datos de una sola entrada por herramienta**, una **hoja de ruta por nivel de experiencia**, un **semáforo de datos gratuitos**, los indicadores como **ecosistema de confirmación**, **rutas de lectura por perfil** y un **protocolo tecnofundamental diario**.
>
> **Fuentes**: revisiones de audio (*Plataformas y análisis de bolsa para principiantes* y *Cómo organizar tu guía de inversión*, 2026) · `DATOS/TECNICO.md` · `DATOS/FUNDAMENTAL.md` · `DATOS/CONCEPTOS.md` · contexto de mercado de *herramientas.m4a*.
> **Glosario**: no se duplica aquí — ver [`DATOS/Terminologia.md`](Terminologia.md) y [`DATOS/CONCEPTOS.md`](CONCEPTOS.md).
> **Aviso**: precios y límites de planes gratuitos son de 2026 → **verificar vigencia** antes de decidir.

---

## Índice

1. [Cómo usar esta guía (diagnóstico y rutas por perfil)](#1-cómo-usar-esta-guía-diagnóstico-y-rutas-por-perfil)
2. [Fundamentos unificados: fundamental + técnico](#2-fundamentos-unificados-fundamental--técnico)
3. [Ecosistema de indicadores: confluencia, no diccionario](#3-ecosistema-de-indicadores-confluencia-no-diccionario)
4. [Hoja de ruta de plataformas por nivel de experiencia](#4-hoja-de-ruta-de-plataformas-por-nivel-de-experiencia)
5. [Base de datos de herramientas (ficha única por herramienta)](#5-base-de-datos-de-herramientas-ficha-única-por-herramienta)
6. [Semáforo de datos gratuitos (operar vs. estudiar)](#6-semáforo-de-datos-gratuitos-operar-vs-estudiar)
7. [Teoría aplicada al software (dónde se hace cada análisis)](#7-teoría-aplicada-al-software-dónde-se-hace-cada-análisis)
8. [Protocolo tecnofundamental diario (checklist de 3 pasos)](#8-protocolo-tecnofundamental-diario-checklist-de-3-pasos)
9. [Paper trading y curva de aprendizaje](#9-paper-trading-y-curva-de-aprendizaje)
10. [Glosario y referencias](#10-glosario-y-referencias)

---

## 1. Cómo usar esta guía (diagnóstico y rutas por perfil)

### Diagnóstico rápido (árbol de decisión)

Responde una sola pregunta — **¿qué buscas principalmente en esta guía?** — y salta a tu ruta:

| Si tu prioridad es… | Ve a… | Ruta |
|---|---|---|
| Valorar empresas a 5-10 años, dividendos, fundamentales | [§Ruta A](#ruta-a--inversor-fundamental-largo-plazo) → secciones 2, 5 (screeners), 8 | **A** |
| Programar estrategias, backtest, baja latencia, futuros | [§Ruta B](#ruta-b--desarrollador-cuant-algorítmico) → secciones 3, 5 (ejecución), 7, 9 | **B** |
| Operar a diario, opciones, greeks, simulación realista | [§Ruta C](#ruta-c--trader-activo-y-de-opciones) → secciones 3, 5 (paper), 6, 8, 9 | **C** |
| Las tres anteriores en distintos días | [Usuario híbrido](#usuario-híbrido) | A+B+C |

> **Regla de organización**: cada herramienta aparece **una sola vez** en la base de datos (§5), categorizada por su función principal. No hay rankings repetidos. El usuario híbrido "elige sombrero" cada mañana; no se mezclan rutas en el mismo bloque.

### Ruta A — Inversor fundamental largo plazo

- **Objetivo**: encontrar empresas de calidad (ROIC > WACC) a precio razonable; el *timing* de milisegundos no importa.
- **Stack mínimo**: **Coyfin** o **Stock Rover** (valoración y percentiles) → **Finviz** o **Gainify** (filtro y contexto) → gráfico simple (**Yahoo Finance** o TradingView plan básico) para colocar entradas.
- **Ignora de entrada**: ATAS, Sierra Chart, footprint, Trading Technologies (ruido para ti).
- **Sigue**: [§2](#2-fundamentos-unificados-fundamental--técnico), [§5 categoría 2](#2-screeners-y-análisis-fundamental), [§8](#8-protocolo-tecnofundamental-diario-checklist-de-3-pasos).

### Ruta B — Desarrollador cuant/algorítmico

- **Objetivo**: latencia, paridad entre backtesting y ejecución en vivo, programación.
- **Stack mínimo**: **NautilusTrader** (motor Rust, paridad backtest→live) o **Trading Technologies** / **NinjaTrader** (futuros, baja latencia) → **MetaTrader 5** si tu mercado es Forex → **TrendSpider** para automatizar el trazado de niveles sin programar.
- **Ignora de entrada**: tutoriales de "qué es el RSI" (ya lo sabes); céntrate en [§7](#7-teoría-aplicada-al-software-dónde-se-hace-cada-análisis) y [§9](#9-paper-trading-y-curva-de-aprendizaje).
- **Sigue**: [§3](#3-ecosistema-de-indicadores-confluencia-no-diccionario), [§5 categoría 5](#5-ejecución-algorítmica-y-quants), [§8](#8-protocolo-tecnofundamental-diario-checklist-de-3-pasos).

### Ruta C — Trader activo y de opciones

- **Objetivo**: generar volumen con control de riesgo; opciones, intradía, swing.
- **Stack mínimo**: **Thinkorswim (Paper Money)** o **Webull** para practicar con realismo → **TradingView** (confluencia de indicadores) → bróker real tipo **Interactive Brokers** cuando pases a capital real.
- **Ojo**: tus datos **no pueden** tener 15-20 min de retraso → [§6 Semáforo](#6-semáforo-de-datos-gratuitos-operar-vs-estudiar) es obligatorio para ti.
- **Sigue**: [§3](#3-ecosistema-de-indicadores-confluencia-no-diccionario), [§6](#6-semáforo-de-datos-gratuitos-operar-vs-estudiar), [§8](#8-protocolo-tecnofundamental-diario-checklist-de-3-pasos), [§9](#9-paper-trading-y-curva-de-aprendizaje).

### Usuario híbrido

Si analizas a largo plazo **y** haces swing con opciones: las rutas separadas te permiten **elegir qué sombrero llevas hoy**. Cada mañana, aplica [§8](#8-protocolo-tecnofundamental-diario-checklist-de-3-pasos) (común a todas las rutas) y luego ve a tu sección del día. Mezclar fundamentales de 10 años con order flow en el mismo párrafo es ruido para todos.

---

## 2. Fundamentos unificados: fundamental + técnico

> Profundidad completa en [`DATOS/TECNICO.md`](TECNICO.md) y [`DATOS/FUNDAMENTAL.md`](FUNDAMENTAL.md). Aquí, solo el núcleo operativo. **Ninguno de los dos "bandos" funciona solo**: el mercado te puede aplastar a corto plazo por muy buenos que sean tus fundamentales, y un balance perfecto no sirve si entras en el peor punto de la curva.

### 2.1 Análisis fundamental — el *qué* comprar

- **Origen**: Graham & Dodd (1934), *margen de seguridad* — comprar solo con descuento sobre valor intrínseco.
- **Enfoques**: *Top-Down* (macro → sector → empresa) vs. *Bottom-Up* (negocio → valor). La inversión en valor clásica prefiere bottom-up.
- **Los 3 estados financieros se leen juntos**: P&L (rentabilidad) ↔ Balance (solvencia) ↔ Flujo de efectivo (el más honesto; FCF = caja operativa − CapEx).
- **Calidad numérica mínima**: 
  - **ROIC > WACC** (el retorno del capital supera su coste → ventaja competitiva real).
  - Deuda neta/EBITDA < 3 (ideal < 1); D/E < 0,5 conservador.
- **Valoración**: absoluta (DCF, dos etapas + valor terminal con g ≤ 3-4%) o relativa (PER, EV/EBITDA, P/FCF vs. *peer group*).
- **Cualitativo**: *moat* (intangibles, efectos de red, costes de cambio, escala) + sesgos conductuales (anclaje, aversión a la pérdida, confirmación → exige contratesis escrita).

### 2.2 Análisis técnico — el *cuándo* entrar

- **Teoría de Dow**: el precio descuenta todo; tres tendencias (primaria/secundaria/menor); el **volumen confirma la tendencia**; la tendencia persiste hasta señal clara de reversión.
- **Patrones**: revisión (hombro-cabeza-hombro, doble techo/suelo, cuñas) y continuación (banderas, triángulos, taza-con-asas).
- **Filtro obligatorio**: ningún breakout vale **sin volumen** → exige **1,5-2× la media móvil de 20 días** el día del quiebre.
- **Indicadores núcleo**: SMA/EMA (cruces, Golden Cross 50/200), Bollinger (squeeze = compresión → movimiento inminente), RSI (0-100; 70/30 clásicos), MACD (cruces vs. línea de señal), ATR (volatilidad para stops), ADX (>25 = tendencia fuerte), Fibonacci (23,6 / 38,2 / 50 / 61,8 / 78,6%).
- **Nivel institucional** (solo avanzados, ver [§4](#4-hoja-de-ruta-de-plataformas-por-nivel-de-experiencia)): Market Profile (POC, VAH/VAL, regla del 80%) y footprint charts (flujo de órdenes bid/ask por vela, p. ej. ATAS).

### 2.3 Sinergia tecnofundamental (el enfoque híbrido)

La dicotomía "valor vs. técnico" **murió en la práctica profesional**: las plataformas modernas asumen enfoque híbrido.

1. **Fundamental** filtra la calidad del negocio (ROIC > WACC, balance sano, moat).
2. **Técnico** mapea la acción del precio y ejecuta la entrada/cobertura en soportes óptimos.
3. **Riesgo** (Kelly/fraccional, §8) protege de ti mismo.

*Analogía*: el fundamental es revisar el motor del coche antes de comprarlo; el técnico es observar el tráfico para incorporarte a la autopista sin estrellarte. Coche bueno + entrada en mitad de un crash = el mercado te aplasta igual.

---

## 3. Ecosistema de indicadores: confluencia, no diccionario

> **Problema que corrige este documento**: definir RSI, MACD y Bollinger como entradas independientes deja al principiante vulnerable a señales falsas. Aquí se enseñan como **un ecosistema de confirmación**: la lectura individual es una *alerta*; la decisión exige **convergencia** (el "jurado").

### 3.1 Regla del jurado

> **Nunca operes con un indicador aislado.** Exige que 3-4 indicadores de **categorías distintas** converjan:
> - **Volatilidad** (Bollinger, ATR) · **Momentum** (RSI, MACD, ADX) · **Volumen** (OBV, volumen clásico) · — opcional — **Tendencia** (SMA/EMA, ADX).

### 3.2 Patrón de validación RSI + MACD

| Paso | Lectura | Acción |
|---|---|---|
| 1 | RSI > 70 (o < 30) | **Alerta**, no señal. En tendencia alcista fuerte el RSI puede estar "sobrecomprado" meses. |
| 2 | Esperar **cruce bajista del MACD** (línea MACD cruza bajo línea de señal) | El MACD hace de **juez**: confirma o veta la lectura del RSI. |
| 3 | Si RSI dice "venta" pero MACD mantiene tendencia fuerte | **Nos quedamos quietos.** El jurado no ha deliberado. |

### 3.3 Patrón de validación Squeeze de Bollinger + Volumen (OBV)

| Paso | Lectura | Acción |
|---|---|---|
| 1 | Bandas estrechándose (squeeze) | Baja volatilidad → **expansión violenta inminente**; el mercado no sostiene volatilidad anormalmente baja. |
| 2 | El precio "salta" hacia una banda | **¿Hacia dónde?** La banda sola no lo dice: puede ser ruptura real o trampa. |
| 3 | Validar con **volumen / OBV** | Precio rompe al alza + **volumen plano o cayendo** → **ruptura falsa, no entres**. Precio rompe + volumen expansivo (ideal 1,5-2× media 20d) → movida con respaldo de capital. |

*Por qué OBV*: el precio a corto plazo se puede manipular; el **volumen neto negociado no miente**. Si precio sube y OBV cae → divergencia bajista (movimiento sin dinero real detrás).

### 3.4 Confluencia mínima operativa

- **No apiles 10 indicadores** buscando que todos "se pongan en verde" → parálisis por análisis.
- **Usa 3-4 de categorías distintas** y exige que la estructura matemática confirme el movimiento.
- Complemento útil: **OBV** en la misma ecuación (volumen en balance) + **ADX > 25** para confirmar fuerza de tendencia (si está por debajo de 20, mercado sin dirección → no insistas).

### 3.5 Dónde configurarlo en la práctica

| Validación | Plataforma recomendada | Ver |
|---|---|---|
| RSI + MACD + Bollinger juntos (hasta 100+ indicadores) | **TradingView** | [§7](#7-teoría-aplicada-al-software-dónde-se-hace-cada-análisis) |
| Detección automática de tendencias/fibo sin trazar a mano | **TrendSpider** (IA) | §7 |
| Volumen a nivel de vela (order flow real, no agregado) | **ATAS** (avanzado) | §7 · [§4](#4-hoja-de-ruta-de-plataformas-por-nivel-de-experiencia) |

---

## 4. Hoja de ruta de plataformas por nivel de experiencia

> **Principio**: dar las llaves de un F1 a quien se saca el carnet es confusión masiva (p. ej. ATAS con ~400 configuraciones de clusters). Se **estructura escalonado**: de interfaces visuales simples a software institucional.

```
NIVEL 1 — INICIAL          NIVEL 2 — INTERMEDIO         NIVEL 3 — AVANZADO
(aprender a leer)           (confluencia y comunidad)    (institucional, solo al final)
─────────────────────       ─────────────────────────    ─────────────────────────────
• Yahoo Finance             • TradingView                • ATAS / Sierra Chart
  – patrones auto (H&C)       – 100+ indicadores           – footprint / order flow
  – "ruedines" del ojo         – PineScript (150k scripts)  – ~400 configs de cluster
  – gratis                    – red social de ideas       • NautilusTrader (Rust, quants)
• Finviz                    • (profundizar en §5)        • Trading Technologies / NinjaTrader
  – heatmaps verde/rojo                                  • MetaTrader 5 (Forex, bots)
  – sectores al vistazo                                  • Interactive Brokers TWS
```

| Fase | Cuándo pasar de nivel | Regla |
|---|---|---|
| 1 → 2 | Cuando identificas patrones sin ayuda y entiendes heatmaps | Añadir indicadores **en ecosistema** (§3), no en aislamiento |
| 2 → 3 | Cuando dominas confluencia y papel en simulador (§9) | **Nunca al principio**: los terminales de flujo de órdenes van al **final** del material y solo si tu operativa lo exige (futuros/microestructura) |

---

## 5. Base de datos de herramientas (ficha única por herramienta)

> **Formato**: una entrada por herramienta, ordenada por **función principal** (sin solapamientos). Cada ficha: nivel · rutas (A/B/C) · pros · contras · acceso · **restricciones de datos** (enlaza §6).
> **Enfrentamientos cara a cara** al final de cada categoría relevante.

### 5.1 Plataformas todo-en-uno (gráficos + datos)

#### TradingView
| | |
|---|---|
| **Función** | Gráficos en la nube, indicadores, alertas, social, scripts |
| **Nivel / Rutas** | 1→2 · A, B, C |
| **Pros** | 100M usuarios; 100+ indicadores; PineScript con +150.000 scripts de la comunidad (foso defensivo); ideas sociales con gráfico interactivo; tiempo real en plan básico |
| **Contras** | Plan básico limitado a **2 indicadores/gráfico**; para order flow institucional (footprint milisegundo a milisegundo) se queda corto (→ ATAS/Sierra) |
| **Acceso** | Gratis (limitado) / Plus-Pro-Elite (verificar precios 2026) |
| **Datos** | Tiempo real en plan básico; límite de indicadores → [§6](#6-semáforo-de-datos-gratuitos-operar-vs-estudiar) |

#### Yahoo Finance
| | |
|---|---|
| **Función** | Datos de bolsa básicos + reconocimiento automático de patrones |
| **Nivel / Rutas** | **1 (empezar aquí)** · A, C |
| **Pros** | Gratis; dibuja patrones (cabeza y hombros) directamente en pantalla → educa el ojo sin esfuerzo ("ruedines de la bici") |
| **Contras** | Superficie limitada para análisis profundo; sin ecosistema de confluencia avanzado |
| **Acceso** | Gratis |
| **Datos** | Adecuado para aprender; para operativa real ver §6 y bróker con datos profesionales |

#### (Categoría) Cara a cara: **TradingView vs ATAS**

| Criterio | TradingView | ATAS |
|---|---|---|
| Perfil | Versatilidad, todo-en-uno, comunidad | Profundidad pura en microestructura |
| Fortaleza | 150k scripts, 100 indicadores, ideas sociales | Footprint charts, lectura de flujo de órdenes |
| Curva | Baja (fases 1-2) | Extrema (~400 configs de cluster) |
| **Conclusión** | **Flexibilidad de una** vs. **profundidad de la otra**: no compiten; escalonar según [§4](#4-hoja-de-ruta-de-plataformas-por-nivel-de-experiencia) |

---

### 5.2 Screeners y análisis fundamental

#### Coyfin
| | |
|---|---|
| **Función** | Screener macro/fundamental, percentiles históricos |
| **Nivel / Rutas** | 2 · **A** |
| **Pros** | +500 métricas; **10 años** de datos históricos; **percentile ranks** (p. ej. "PER 15 = percentil 90 caro vs. su propia historia en 10 años" → protege de sesgos); retroceso histórico para comparables |
| **Contras** | Orientado fundamental/macro; no es terminal de ejecución |
| **Acceso** | Gratis limitado / premium (verificar) |
| **Datos** | Fundamental histórico; latencia intradía no es su caso de uso |

#### Finviz
| | |
|---|---|
| **Función** | Screener rápido + heatmaps visuales de sectores |
| **Nivel / Rutas** | 1-2 · A (filtro y panadería visual) |
| **Pros** | Velocidad de filtrado inigualable para escaneo preliminar; heatmaps verde/rojos intuitivos; clásico presente en todos los informes |
| **Contras** | Free: gráficos **estáticos** (refresco manual); **retraso 15-20 min** en cotizaciones → **semáforo rojo para operar** (§6) |
| **Acceso** | Gratis (estático/retrasado) / Elite |
| **Datos** | 🔴 Free = solo estudiar/fin de día, **no day trading** |

#### Stock Rover
| | |
|---|---|
| **Función** | Valoración y métricas para inversor fundamental |
| **Nivel / Rutas** | 2 · **A** |
| **Pros** | Énfasis en valoración, rating, carteras de ideas value |
| **Contras** | Menos momentum/social que TradingView; no es para intradía |
| **Acceso** | Gratis limitado / premium |
| **Datos** | Enfoque histórico → apto Ruta A |

#### Ticker (screener)
| | |
|---|---|
| **Función** | Screener con amplio abanico de parámetros |
| **Nivel / Rutas** | 2 · A, B |
| **Pros** | Catálogo amplio de filtros (comparable a Coyfin en profundidad de parámetros) |
| **Contras** | Verificar cobertura geográfica y planes vigentes |
| **Acceso** | Verificar 2026 |
| **Datos** | Fundamental → Ruta A |

#### Gainify
| | |
|---|---|
| **Función** | Plataforma **nativa de IA**: portafolio + motor de análisis + NLP |
| **Nivel / Rutas** | 2-3 · **A** (y C para etiquetas en gráfico) |
| **Pros** | Resume/analiza **earnings calls** en tiempo real (NLP especializado: tono vs. trimestre previo, guidance, márgenes, cuellos de botella); **superpone eventos en el gráfico** (p. ej. etiqueta en la vela de −10%: "revisión guidance a la baja por costes de materias primas" → une *cuándo* técnico con *por qué* fundamental); visualiza estimaciones de Wall Street |
| **Contras** | Requiere conexión de portafolio; calidad de IA a validar caso a caso; startup vs. incumbents |
| **Acceso** | Verificar plan free 2026 |
| **Datos** | Fundamental + estimaciones; no sustituye datos de ejecución en vivo |

#### (Categoría) Cara a cara: **Coyfin/Ticker (profundidad) vs Finviz (velocidad)**

| Criterio | Coyfin / Ticker | Finviz |
|---|---|---|
| Fortaleza | **500+ parámetros**, 10 años, percentiles, comparables | **Velocidad**: escaneo preliminar en segundos |
| Ideal para | Filtro fundamental profundo (§8 paso 1) | Panorama de mercado + primer cribado |
| Trampa free | Menos intradía (no es su foco) | 🔴 Datos retrasados + gráficos estáticos |
| **Conclusión** | **Profundidad vs. velocidad**: usar Finviz para *cribar* y Coyfin/Ticker para *decidir* — no rankings separados, **un embudo en dos pasos** |

---

### 5.3 Automatización y análisis con IA

#### TrendSpider
| | |
|---|---|
| **Función** | Análisis técnico automatizado con IA (tendencias, fibo, zonas de liquidez) + asistente NLP de estrategias |
| **Nivel / Rutas** | 2-3 · B, C |
| **Pros** | Elimina el **sesgo de confirmación** al trazar líneas con algoritmos objetivos (no "dibujas la soporte que quieres ver"); detecta OBV/momentum y patrones sin programar; asistente de lenguaje natural ("crea estrategia que compre si precio cruza SMA50 y RSI sube desde 40" → programa y backtestea) |
| **Contras** | Suscripción; no reemplaza execution venue |
| **Acceso** | Trials / planes mensuales (verificar) |
| **Datos** | Depende del feed conectado → §6 |

*(Nota: en las transcripciones de audio aparece también como "Transpire" al describir el trazado automático con "Psychic AI"; se documenta aquí como capacidades de automatización IA de la categoría TrendSpider/afines — verificar nombre comercial exacto del asistente NLP en 2026.)*

---

### 5.4 Order flow y microestructura (nivel avanzado — final de la hoja de ruta)

#### ATAS
| | |
|---|---|
| **Función** | Footprint charts y flujo de órdenes (bid/ask por nivel de precio) |
| **Nivel / Rutas** | **3 (solo al final)** · B, C (futuros/órdenes) |
| **Pros** | Desglosa volumen interno de cada vela; imbalances institucionales ocultos en velas tradicionales; estándar para lectura de huella |
| **Contras** | ~400 configuraciones de clusters → **confusión masiva si eres novato**; no bonita como TradingView; curva extrema |
| **Acceso** | Licencia de pago (verificar) |
| **Datos** | Requiere feed de tiempo real profesional (broker/exchange) → no apto con datos retrasados |

#### Sierra Chart
| | |
|---|---|
| **Función** | Plataforma profesional de escritorio, order flow, alta personalización |
| **Nivel / Rutas** | **3** · B, C |
| **Pros** | Profundidad y control institucional; integración con datos/feeds serios |
| **Contras** | Interfaz de alto aprendizaje; no para fase 1 |
| **Acceso** | De pago + feed (verificar) |
| **Datos** | Feed profesional obligatorio |

---

### 5.5 Ejecución algorítmica y quants

#### NautilusTrader
| | |
|---|---|
| **Función** | Plataforma quant para **backtesting + ejecución en vivo** en un solo código |
| **Nivel / Rutas** | **3** · **B** |
| **Pros** | Escrito en **Rust** (no Python interpretado): seguridad de memoria + velocidad de milisegundos/nanosegundos; **paridad backtest↔live** (el código de investigación es el que va al mercado → sin discrepancias); estándar emergente del trading algorítmico institucional |
| **Contras** | Exige programación; no es para inversor casual; curva técnica |
| **Acceso** | Open source / hosting (verificar) |
| **Datos** | Requiere feeds de mercado de baja latencia |

*(El audio transcribe el lenguaje como "RAST"; se asume **Rust**, el lenguaje de NautilusTrader — verificar en la fuente si aplica otro runtime.)*

#### NinjaTrader
| | |
|---|---|
| **Función** | Futuros/acción de mercado, estrategias en C#, baja latencia |
| **Nivel / Rutas** | 3 · B, C |
| **Pros** | Compila estrategias complejas; acceso directo al mercado minimizando latencia |
| **Contras** | Menos "bonita" visualmente; foco futuros/EE. UU. |
| **Acceso** | Gratuita para data/simulación + licencia de live trading (verificar) |
| **Datos** | Exige data feed de pago/intradía serio |

#### MetaTrader 5 (MT5)
| | |
|---|---|
| **Función** | Forex/CFD multi-asset, Expert Advisors (bots), MQL5 |
| **Nivel / Rutas** | 2-3 · **B** (sobre todo Forex) |
| **Pros** | Dominante en Forex mundial; bots nativos y gratuitos vía mayoría de brokers; 21 marcos temporales; gran ecosistema |
| **Contras** | Interfaz "sacada de Windows 98"; curva media; brokers = contrapartida según región |
| **Acceso** | Gratis (broker) |
| **Datos** | Tiempo real según broker → §6 |

#### Trading Technologies (TT)
| | |
|---|---|
| **Función** | Terminal profesional de futuros, prioridad en **latencia** |
| **Nivel / Rutas** | **3** · **B** |
| **Pros** | Infra para que la latencia no mate la estrategia cuant |
| **Contras** | Coste y complejidad institucional; solo si operas volumen/activos que lo justifiquen |
| **Acceso** | Suscripción (verificar) |
| **Datos** | Exchange directo / profesionales |

#### Interactive Brokers (TWS)
| | |
|---|---|
| **Función** | Bróker multi-mercado global (**170 mercados**) + Terminal TWS |
| **Nivel / Rutas** | 2-3 · A, B, C (global) |
| **Pros** | Acceso casi universal; niveles de precio competitivos; API para quants |
| **Contras** | **Curva de aprendizaje durísima**; configuración inicial que exige paciencia; papeleo (KYC) exigente |
| **Acceso** | Cuenta bróker (sin mínimo alto habitual — verificar jurisdicción) |
| **Datos** | Tiempo real con condiciones/comisiones de datos según mercado |

#### Sarwa Trade (Sarwa)
| | |
|---|---|
| **Función** | App de inversión accesible (EAU), acciones **fraccionarias desde 1$** |
| **Nivel / Rutas** | **1** · **A** (puerta de entrada minorista) |
| **Pros** | Democratización extrema; complementa la ruta de valor con acceso mínimo |
| **Contras** | Enfoque regional (EAU/GCC); catálogo y regulación local |
| **Acceso** | App + cuenta local |
| **Datos** | Estándar retail → para aprender y acumular |

---

### 5.6 Simulación / paper trading

→ Detalle en [§9](#9-paper-trading-y-curva-de-aprendizaje): **Thinkorswim Paper Money** (Schwab) y **Webull**.

### 5.7 Proveedores de datos (perfil desarrollador / Ruta B)

| Herramienta | Uso | Notas (de `777.md`) |
|---|---|---|
| Yahoo Finance (API) | Cotizaciones, índices | Límite de API, sin XBRL |
| Alpha Vantage | APIs financieras completas | ~5 req/min en free |
| Financial Modeling Prep | Datos financieros estructurados | Plan free limitado |
| SEC EDGAR (XBRL) | Fundamentales oficiales EE. UU. | Gratuito, sin dependencia comercial |
| Morningstar | Análisis profundo | Muy caro ($2000+/año) |

*(Este bloque es de **datos para desarrolladores**, no de plataformas de gráficos — categoría única, sin solaparse con §5.1.)*

---

## 6. Semáforo de datos gratuitos (operar vs. estudiar)

> **Alerta central**: un gráfico retrasado "sigue mostrando cómo se mueve el precio" para **teoría estática**, pero para **day trading con 15 min de retraso los algoritmos te comen vivo**: entras cuando el movimiento ya terminó ("a la fiesta cuando recogen las sillas").
>
> **Regla**: clasificar toda plataforma gratis por **latencia real** y **límites de análisis**, y responder: *¿esto sirve para operar en real o solo para estudiar al final del día?*

| Plataforma (plan free) | Latencia datos | Límites de análisis | Semáforo operativo |
|---|---|---|---|
| **Finviz** free | **15-20 min retraso** | Gráficos **estáticos**, refresco manual | 🔴 **Solo estudiar** — prohibidísimo corto plazo / day trading |
| **StockCharts** free | Sin intradía (solo **diario/semanal**) | Sin velas intradía | 🔴 Inútil para day trader · 🟡 válido para inversor a **meses vista** |
| **TradingView** plan básico | **Tiempo real** (cotizaciones) | **Solo 2 indicadores/gráfico** → parálisis de análisis en plan free | 🟡 Datos ok, **análisis mutilado** → estudiar y aprender; para confluencia real (§3) sube de plan o usa otra instancia |
| **Yahoo Finance** | Adecuado learning | Patrones automáticos básicos | 🟡 **Fase 1-2**; para ejecución en real usar bróker con feed serio |
| **ATAS / Sierra / TT / Nautilus** | Exigen **feed profesional** | — | Solo tienen sentido con datos de pago/exchange (no son "free tiers") |

**Cómo leer el semáforo**:
- 🔴 = el producto free es para **estudiar al cierre**, nunca para ejecutar órdenes a corto plazo.
- 🟡 = sirve para **aprender/planificar**; verifica el límite concreto (¿indicadores? ¿intradía?) antes de operar.
- 🟢 = tiempo real **y** sin límites que rompan tu estrategia → apto para operar (casi siempre = plan de pago o feed de bróker).

*Coherencia con §5*: cada ficha "Datos" apunta aquí; no se repiten tablas de latencia.

---

## 7. Teoría aplicada al software (dónde se hace cada análisis)

> **Corrección estructural**: teoría (indicadores, fundamentales) y software reseñado han de ir **unidos**. Cada bloque teórico → plataforma concreta que lo facilita.

| Concepto teórico | Qué aporta la plataforma | Herramienta |
|---|---|---|
| Patrones de gráfico (H&C, dobles suelos…) | **Dibujo automático** de patrones en pantalla → educación visual sin esfuerzo | **Yahoo Finance** (fase 1) |
| Heatmap de sectores / panadería | Ver en segundos qué sectores suben/bajan | **Finviz** |
| RSI, MACD, Bollinger, +100 indicadores, confluencia | Todos los osciladores **en el mismo gráfico**; scripts comunidad (PineScript) | **TradingView** |
| Tendencias, Fibonacci, zonas de liquidez **objetivas** (anti sesgo confirmación) | IA traza niveles **sin que tú dibujes** lo que quieres ver; OBV/momentum automatizados; estrategias en lenguaje natural → backtest | **TrendSpider** |
| Earnings calls, guidance, estimaciones Wall Street, "por qué cayó la vela" | NLP sobre transcripciones + **etiqueta de evento sobre la vela** (fundamental ↔ gráfico en una pantalla) | **Gainify** |
| Comparables, percentiles históricos 10 años, EV/EBITDA vs. pares | Retrocede una década y sitúa cada ratio en **percentil vs. la propia empresa** | **Coyfin** (y **Stock Rover**/**Ticker** para value) |
| MACD / algoritmos cuant a **resolución de nanosegundos**, backtest = live | Motor **Rust**: investigación y ejecución con el mismo código | **NautilusTrader** |
| Order flow, huella, imbalances bid/ask | Desglosa el interior de cada vela (nivel institucional) | **ATAS** / **Sierra Chart** |
| Validar señales con capital realista (slippage, depth, delays) | Simuladores modernos **replican los problemas reales** | **Thinkorswim Paper Money** / **Webull** |
| Filtro fundamental ROIC>WACC + contexto de eventos | Ver [§8](#8-protocolo-tecnofundamental-diario-checklist-de-3-pasos) | **Coyfin** / **Gainify** |

---

## 8. Protocolo tecnofundamental diario (checklist de 3 pasos)

> **Objetivo**: una rutina secuencial, estandarizada y **obligatoria** cada mañana antes de abrir posición — integra filtro de calidad + timing + riesgo matemático. Convierte teoría en sistema y protege de pánico/avaricia (el "instinto del principiante" es el superenemigo).
>
> *Aplicable a todas las rutas (§1). Copiar y pegar como checklist operativa:*

### ☀️ Checklist diario

**Paso 1 — Filtro fundamental (antes de mirar ningún gráfico de colores)**
- [ ] Seleccionar solo empresas **de calidad**: exigir **ROIC > WACC** (la empresa gana más de lo que le cuesta financiarse).
- [ ] Herramientas: **Coyfin** (percentiles 10 años) o **Gainify** (resumen IA de resultados/estimaciones) → [§7](#7-teoría-aplicada-al-software-dónde-se-hace-cada-análisis).
- [ ] Comprobación rápida salud: Deuda Neta/EBITDA < 3; FCF positivo recurrente (ver §2.1).
- [ ] **Si no supera el filtro → no pasa al paso 2.** Nada de mirar el gráfico "a ver qué hace".

**Paso 2 — Sincronización técnica (con la lista de empresas buenas)**
- [ ] Abrir **TradingView** y buscar **punto de entrada** (soporte, ruptura de patrón, confluencia §3).
- [ ] Exigir que la **ruptura técnica vaya acompañada de volumen de 1,5-2× la media de los últimos 20 días**.
- [ ] Cruz de jurado: RSI alerta + MACD confirma; squeeze de Bollinger + OBV/volumen acompaña (§3.2-3.3).
- [ ] **Si no hay volumen de confirmación → no entramos** (ruptura trampa).

**Paso 3 — Gestión de riesgo (tamaño de posición por matemática, no por calentón)**
- [ ] Calcular tamaño con **criterio de Kelly** o **modelo fraccionario** (fracción de Kelly p. ej. ¼-½K para reducir varianza).
- [ ] Definir stop con base en **ATR** (volatilidad real) antes de entrar.
- [ ] Regla antimpulsiva: **nunca** todo el capital en una idea "de Twitter"; pánico y euforia quedan fuera del sistema.
- [ ] **Si el tamaño sale desproporcionado → reducir o no entrar.**

### Por qué funciona

1. **Secuencia lógica**: calidad → timing → tamaño (no al revés).
2. **Filtros duros** (ROIC, volumen, Kelly) sustituyen al "instinto".
3. **Antisesgos**: contratesis implícita en el paso 1; confirmación externa en el paso 2; aversión a la pérdida domeñada en el paso 3 (matemática que protege de ti mismo).

---

## 9. Paper trading y curva de aprendizaje

> La psicología te traiciona en cuanto hay dinero real. La **simulación de alta fidelidad** (paper trading) es la única forma sensata de empezar. Evolución clave: antes las demos llenaban órdenes al "mejor precio" irreal → falsos genios de Wall Street; hoy los simuladores **replican los problemas reales**.

| Simulador | Señas de identidad | Ruta |
|---|---|---|
| **Thinkorswim Paper Money** (Schwab) | Misma plataforma profesional que el real, dinero virtual; domina enrutamiento de órdenes complejos, **opciones multipata** y alertas condicionadas **sin riesgo de ruina** | **C** (y B para opciones/estructuras) |
| **Webull** (paper trading) | Simulador premiado (Stockbrokers): **slippage**, profundidad del libro de órdenes y retrasos realistas; **greeks en tiempo real** | **C** |
| **NinjaTrader** (sim) | Ensayo de estrategias C# con feed de data simulado | B |

**Regla de oro**: el error mayúsculo es **practicar en plataforma básica y operar después en plataforma compleja con dinero real**. Practica en el mismo nivel de complejidad con el que operarás (Paper Money si tu meta son opciones; sim de NinjaTrader si tu meta son futuros algorítmicos).

**Bucle recomendado**: §8 (protocolo) en simulador → revisar sesgo tras cada semana → escalar a real solo cuando el checklist sea automático.

---

## 10. Glosario y referencias

> **Esta guía no duplica el glosario** (evita redundancia con el material existente). Para definiciones y fórmulas completas:

| Recurso | Contenido |
|---|---|
| [`DATOS/Terminologia.md`](Terminologia.md) | Glosario integral: rentabilidad, riesgo, TWR/XIRR, ratios, finanzas conductuales, tabla resumen de métricas |
| [`DATOS/CONCEPTOS.md`](CONCEPTOS.md) | Fórmulas: NAV, TER, PER, EV/EBITDA, ROIC, RSI, Sharpe, Beta, Max Drawdown |
| [`DATOS/TECNICO.md`](TECNICO.md) | Análisis técnico completo: Dow, chartismo, indicadores, Market Profile, footprint, tecnofundamental |
| [`DATOS/FUNDAMENTAL.md`](FUNDAMENTAL.md) | Análisis fundamental completo: estados financieros interconectados, DCF, múltiplos, moat, Munger, sesgos |
| [`777.md`](../777.md) | Comparativa de proveedores de datos/competencia (contexto Portafolio Intel) |
| `audio/*.transcripcion.md` | Transcripciones de las revisiones que motivan esta reestructuración |

---

*Generado: 2026-09-23 · Plan: `PLAN_0923.md` · Cumple requisitos R1-R8 de la revisión de audio (roadmap por nivel, semáforo de datos, ecosistema de indicadores, checklist diario, ficha única por herramienta, teoría↔software, rutas por perfil, sin duplicar glosario).*
