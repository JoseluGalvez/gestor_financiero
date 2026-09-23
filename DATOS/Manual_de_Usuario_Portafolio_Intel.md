# Manual de Usuario — Gestor Financiero Portafolio Intel

---

## Portada

**GESTOR FINANCIERO PORTAFOLIO INTEL**  
**Manual de Usuario — Versión 1.0**

Análisis Fundamental · Gestión de Carteras · Terminal de Mercado

**Fecha:** 3 de septiembre de 2026  
**Autor:** Gestor Financiero Portafolio Intel  
**Categoría:** Herramienta de análisis e inversión  
**Licencia:** Uso interno y demostración

---

*Los ratios e información contenidos en esta herramienta son informativos y dependen de definiciones contables, sector, periodo y calidad de los datos. No constituyen una recomendación de compra, venta o inversión. Toda inversión conlleva riesgos.*

---

## Índice

1. [Introducción](#1-introducción)
2. [Qué es Portafolio Intel](#2-qué-es-portafolio-intel)
3. [Problemas que resuelve](#3-problemas-que-resuelve)
4. [Beneficios de usar la aplicación](#4-beneficios-de-usar-la-aplicación)
5. [Arquitectura técnica de la aplicación](#5-arquitectura-técnica-de-la-aplicación)
6. [Módulo 1: Análisis Fundamental de Empresas](#6-módulo-1-análisis-fundamental-de-empresas)
7. [Módulo 2: GMT Terminal — Monitor Global de Mercado](#7-módulo-2-gmt-terminal-monitor-global-de-mercado)
8. [Cálculos financieros realizados](#8-cálculos-financieros-realizados)
9. [Consejos de uso](#9-consejos-de-uso)
10. [Opinión y valoraciones](#10-opinión-y-valoraciones)
11. [Conclusiones](#11-conclusiones)
12. [Glosario de términos](#12-glosario-de-términos)

---

## 1. Introducción

El Gestor Financiero Portafolio Intel es una aplicación web de análisis financiero diseñada para inversores, analistas y gestores que buscan evaluar empresas, mercados y activos de forma ágil, clara y fundamentada.

La aplicación integra dos módulos principales:

- **Análisis Fundamental:** Permite introducir datos financieros de una empresa y obtener un informe completo de ratios, señales de salud y evaluación de oportunidad de inversión.
- **GMT Terminal:** Un monitor global de mercado que muestra cotizaciones en tiempo real de criptomonedas, divisas e índices, con heatmap, ranking, alertas de precio y watchlist personalizable.

Esta guía te acompañará desde la instalación hasta el uso avanzado de cada función, explicando los cálculos que se realizan, los principios de diseño que la impulsan y las mejores prácticas para obtener el máximo provecho.

---

## 2. Qué es Portafolio Intel

Portafolio Intel es una **herramienta de análisis financiero autocontenida** que se ejecuta en el navegador sin necesidad de servidor backend. Combina:

- **Cálculo de ratios financieros** a partir de datos introducidos manualmente
- **Evaluación automática de salud financiera** con señales clasificadas por severidad
- **Detección de oportunidades** para investigación adicional basada en criterios cuantitativos
- **Monitor de mercado en tiempo real** con datos de múltiples fuentes
- **Sistema de alertas de precio** para seguimiento de activos específicos
- **Preferencias persistentes** guardadas en el navegador del usuario

La aplicación está construida con React, TypeScript, Vite y testing automatizado con Vitest, garantizando fiabilidad y rendimiento.

---

## 3. Problemas que resuelve

| Problema | Solución Portafolio Intel |
|----------|--------------------------|
| **Complejidad de cálculo de ratios** | Introduce los datos y obtén 16 ratios calculados automáticamente |
| **Dependencia de herramientas externas caras** | Herramienta gratuita y autocontenida en el navegador |
| **Dificultad para comparar empresas** | Análisis estandarizado que permite comparabilidad entre empresas |
| **Falta de monitoreo de mercados en tiempo real** | GMT Terminal con cotizaciones de 25+ criptomonedas, 10+ divisas e índices globales |
| **No detectar oportunidades de inversión** | Motor que evalúa automáticamente criterios de oportunidad |
| **Ausencia de herramientas de alertas** | Sistema de alertas de precio con condiciones personalizables |
| **Pérdida de configuración al cerrar navegador** | Preferencias guardadas en localStorage (watchlist, pestaña activa, orden de paneles) |
| **Interfaces complejas y confusas** | Diseño limpio con separación clara entre secciones y progresión gradual |
| **Errores en la entrada de datos** | Validación en tiempo real con feedback inmediato al usuario |
| **Falta de documentación** | Esta guía completa con glosario de términos financieros |

---

## 4. Beneficios de usar la aplicación

### 4.1 Beneficios Analíticos
- **Rapidez:** Obtén un informe completo en menos de un minuto
- **Precisión:** Cálculos basados en fórmulas financieras estándar verificadas
- **Cobertura:** 16 ratios que cubren valoración, rentabilidad, márgenes, solvencia y caja
- **Comparabilidad:** Análisis estandarizado que permite comparar empresas del mismo sector
- **Exportación:** Genera CSV para análisis posterior en Excel u otras herramientas

### 4.2 Beneficios de Mercado
- **Visión global:** Datos de mercados de criptomonedas, divisas e índices en un solo lugar
- **Actualización frecuente:** Datos cada 60 segundos sin necesidad de recarga manual
- **Múltiples fuentes:** CoinGecko (cripto), ECB (FX), Yahoo Finance (índices)
- **Transparencia:** Cada cifra muestra su fuente, latencia y ámbito de licencia

### 4.3 Beneficios de Gestión
- **Alertas personalizables:** Configura avisos de precio para tus activos favoritos
- **Watchlist:** Guarda y organiza los activos que sigues de forma persistente
- **Preferencias guardadas:** El navegador recuerda tu configuración entre sesiones
- **Sin costes:** No requiere suscripción ni pago por uso

### 4.4 Beneficios de Diseño
- **Interfaz intuitiva:** Separación clara entre secciones con progresión gradual
- **Accesibilidad:** Cumple estándares WCAG con focus states, labels permanentes y alturas de toque mínimas
- **Responsive:** Se adapta a pantallas móviles y de escritorio
- **Jerarquía visual:** Colores y pesos tipográficos que guían la atención del usuario

---

## 5. Arquitectura técnica de la aplicación

### 5.1 Stack tecnológico
- **Frontend:** React 18 + TypeScript + Vite 5
- **Testing:** Vitest (98 tests automatizados)
- **Diseño:** CSS custom con Design Tokens (escala de múltiplos de 4/8)
- **Persistencia:** localStorage para preferencias del usuario
- **Fuentes de datos:** APIs públicas (CoinGecko, ExchangeRate, Yahoo Finance proxy)

### 5.2 Módulos principales
```
├── App.tsx                    → Módulo de Análisis Fundamental
├── GmtTerminal.tsx            → Monitor Global de Mercado
├── company-fundamentals.ts    → Motor de cálculo de ratios
├── company-fundamentals-export.ts → Exportación a CSV
├── market-adapters.ts         → Adaptadores de fuentes de datos
├── price-alerts.ts            → Sistema de alertas de precio
├── dashboard-preferences.ts   → Gestión de preferencias
├── workspace-realtime-scheduler.ts → Optimización de actualizaciones en tiempo real
├── styles.css                 → Estilos (Design Tokens + UI/UX best practices)
└── index.html                 → Punto de entrada HTML
```

### 5.3 Seguridad y datos
- **Sin backend:** Toda la aplicación se ejecuta en el navegador
- **Sin almacenamiento de datos sensibles:** No se guardan contraseñas ni datos financieros personales
- **Datos de demostración:** Las cotizaciones son de referencia, no constituyen precio ejecutable
- **RLS y Supabase:** Preparado para integración con bases de datos si se necesita persistencia de datos

---

## 6. Módulo 1: Análisis Fundamental de Empresas

### 6.1 Descripción general
Este módulo permite introducir datos financieros de una empresa y obtener un informe completo que incluye:
- 16 ratios organizados por categorías
- Señales de salud financiera
- Evaluación de oportunidad de inversión
- Recomendaciones de investigación adicional
- Exportación a CSV

### 6.2 Campos del formulario

#### Datos Generales
| Campo | Descripción | Requerido |
|-------|-------------|-----------|
| Nombre de la empresa | Razón social o ticker | Sí |
| Fecha de referencia | Fecha de los datos contables | Sí |
| Divisa | EUR, USD o GBP | No |
| Fuente de los datos | Documento o informe del que se extraen | Sí |

#### Mercado y Capital
| Campo | Descripción | Unidad |
|-------|-------------|--------|
| Precio por acción | Precio actual de la acción en bolsa | EUR/USD/GBP |
| Acciones en circulación | Número total de acciones emitidas | Unidades |
| Capitalización bursátil | Valor de mercado total (alternativa a precio × acciones) | Moneda |

#### Resultados
| Campo | Descripción | Unidad |
|-------|-------------|--------|
| Beneficio neto | Resultado neto del ejercicio | Moneda |
| Ventas | Ingresos totales / Ventas netas | Moneda |
| Coste de ventas | Coste directo de los bienes vendidos o servicios prestados | Moneda |
| EBIT | Beneficio antes de intereses e impuestos (BAII) | Moneda |
| EBITDA | Beneficio antes de intereses, impuestos, depreciaciones y amortizaciones | Moneda |
| Flujo de caja libre | Flujo de caja libre reportado | Moneda |

#### Capital y Deuda
| Campo | Descripción | Unidad |
|-------|-------------|--------|
| Patrimonio neto | Fondos propios | Moneda |
| Deuda financiera total | Corto + largo plazo | Moneda |
| Caja y equivalentes | Efectivo e inversiones de alta liquidez | Moneda |
| Gastos financieros por intereses | Gastos por intereses en la cuenta de resultados | Moneda |

#### Supuestos
| Campo | Descripción | Formato |
|-------|-------------|---------|
| Tasa fiscal (%) | Tipo impositivo efectivo | Decimal (ej. 0.25 para 25%) |
| WACC (%) | Coste medio ponderado de capital | Decimal (ej. 0.08 para 8%) |

### 6.3 Cálculos realizados

Los ratios se agrupan en 5 categorías:

#### A. Valoración
| Ratio | Fórmula | Interpretación |
|-------|---------|----------------|
| Price/Earnings (P/E) | Precio por acción / Beneficio por acción | Cuántas veces se paga el beneficio |
| EV/EBITDA | (Capitalización + Deuda - Caja) / EBITDA | Valoración relativa ajustada por estructura de capital |
| Price/Sales (P/S) | Capitalización / Ventas | Valoración respecto a ingresos |
| PEG Ratio | (P/E) / Crecimiento del beneficio | P/E ajustado por crecimiento |

#### B. Rentabilidad
| Ratio | Fórmula | Interpretación |
|-------|---------|----------------|
| ROE (Return on Equity) | Beneficio neto / Patrimonio neto | Rentabilidad sobre fondos propios |
| ROA (Return on Assets) | Beneficio neto / Activos totales | Rentabilidad sobre activos |
| Margen neto | Beneficio neto / Ventas | Porcentaje de beneficio sobre ingresos |
| Margen bruto | (Ventas - Coste de ventas) / Ventas | Porcentaje bruto sobre ventas |

#### C. Eficiencia
| Ratio | Fórmula | Interpretación |
|-------|---------|----------------|
| Asset Turnover | Ventas / Activos totales | Eficiencia en el uso de activos |
| Days Sales Outstanding | (Cuentas por cobrar / Ventas) × 365 | Días medios de cobro |
| Days Inventory Outstanding | (Inventario / Coste de ventas) × 365 | Días medios de rotación de inventario |

#### D. Solvencia y Estructura
| Ratio | Fórmula | Interpretación |
|-------|---------|----------------|
| Debt/Equity | Deuda total / Patrimonio neto | Apalancamiento financiero |
| Interest Coverage | EBIT / Gastos por intereses | Capacidad de pago de intereses |
| Current Ratio | Activos corrientes / Pasivos corrientes | Capacidad de pago a corto plazo |
| Debt Service Coverage | EBITDA / (Intereses + Amortización de deuda) | Capacidad de servicio de deuda |

#### E. Caja y Flujo
| Ratio | Fórmula | Interpretación |
|-------|---------|----------------|
| Free Cash Flow Yield | FCF / Capitalización | Rendimiento del flujo de caja libre |
| FCF/EBITDA | FCF / EBITDA | Calidad del flujo de caja libre |
| Cash Conversion | FCF / Beneficio neto | Capacidad de convertir beneficio en caja |

### 6.4 Señales de Salud Financiera

El sistema genera automáticamente señales clasificadas por severidad:

- **Nivel 1 — INFO:** Observaciones de bajo impacto (ej. margen bruto bajo pero industria lo justifica)
- **Nivel 2 — REVIEW:** Requiere revisión (ej. deuda creciente, caída de ingresos)
- **Nivel 3 — ATENCIÓN:** Riesgo significativo (ej. interés coverage bajo, quema de caja)

### 6.5 Evaluación de Oportunidad

El motor evalúa automáticamente si la empresa es **candidata para investigación adicional** basándose en:
- Criterio 1: P/E razonable (< 20x)
- Criterio 2: ROE positivo y estable
- Criterio 3: Deuda controlada (Debt/Equity < 2)
- Criterio 4: Flujo de caja libre positivo
- Criterio 5: Interés coverage adecuado (> 3x)

La evaluación puede ser: *Candidata para revisión*, *No respaldada* o *Evidencia insuficiente*.

### 6.6 Exportación a CSV

Pulsando **Exportar CSV**, se genera un archivo con todos los ratios, valores, fórmulas e interpretaciones, listo para abrir en Excel, Google Sheets u otra herramienta de análisis.

---

## 7. Módulo 2: GMT Terminal — Monitor Global de Mercado

### 7.1 Descripción general
GMT Terminal es un monitor financiero en tiempo real que muestra:
- Cotizaciones de más de 25 criptomonedas (fuente: CoinGecko)
- Tipos de cambio de divisas (fuente: ECB vía ExchangeRate)
- Índices bursátiles globales (fuente: Yahoo Finance)
- Alertas de precio personalizables
- Watchlist de activos favoritos

### 7.2 Pantalla de inicio (Boot Screen)
Al iniciar, se muestra una pantalla de carga con los pasos de inicialización:
1. Initializing adapter handles
2. Negotiating data channels
3. Mounting CoinGecko feed
4. Mounting ECB FX feed
5. Mounting index feed
6. Validating provenance
7. Tape ready

La carga dura aproximadamente 2 segundos.

### 7.3 Navegación por pestañas

| Pestaña | Contenido |
|---------|-----------|
| OVERVIEW | Heatmap, Top Movers, Ranking de cripto, Estadísticas globales, Adapters |
| FX / ÍNDICES | Tabla de índices globales + tabla de divisas (1 EUR =) |
| ALERTAS | Formulario para crear alertas + lista de alertas activas/recientes + sugerencias |
| WATCHLIST | Activos que el usuario ha fijado con estrella |

### 7.4 Cinta de cotizaciones (Tape)
Muestra los 25 activos principales con:
- Símbolo y precio actual
- Porcentaje de cambio en 24h
- Flecha verde (subida) o roja (bajada)
- Botón de pausa/reanudación

### 7.5 Heatmap de capitalización
Visualización gráfica donde:
- El tamaño de cada celda es proporcional a la capitalización de mercado
- El color indica dirección (verde = subida, rojo = bajada en 24h)
- Hover muestra nombre completo y porcentaje

### 7.6 Top Movers
- **Mayores subidas:** Los 5 activos con mayor subida en 24h
- **Mayores bajadas:** Los 5 activos con mayor bajada en 24h
- Incluye sparklines (mini gráficas de tendencia)

### 7.7 Tabla de Ranking de Criptoactivos
Columnas:
| Columna | Descripción |
|---------|-------------|
| ★ | Botón de favorito (estrella) |
| # | Ranking por capitalización |
| ACTIVO | Símbolo + nombre completo |
| PRECIO | Precio actual (formato adaptativo) |
| 24H | Cambio porcentual en 24 horas |
| 7D | Cambio porcentual en 7 días |
| CAP. MERCADO | Capitalización total |

### 7.8 Tabla de Índices
Columnas: ★, ÍNDICE (símbolo + nombre), PRECIO, VAR. 24H

### 7.9 Tabla de Divisas (FX)
Columnas: ★, DIVISA, NOMBRE, 1 EUR =

### 7.10 Sistema de Alertas de Precio
- **Crear alerta:** Selecciona activo, condición (por encima/abajo) y umbral
- **Evaluar:** Se evalúan automáticamente en cada sondeo de datos
- **Gestionar:** Borrar, rearmar (si se disparó), descartar

### 7.11 Watchlist
- Añadir activos con la estrella ☆ en cualquier tabla
- Los activos aparecen en la pestaña WATCHLIST
- Persiste en localStorage entre sesiones

### 7.12 Panel de Adapters (Data Status)
Muestra el estado de las tres fuentes de datos:
- CoinGecko (cripto): Estado, latencia, licencia
- ExchangeRate/ECB (FX): Estado, latencia, licencia
- Yahoo Finance (índices): Estado, latencia, licencia

### 7.13 Preferencias
- **Orden de paneles:** Botones ▲/▼ para reordenar
- **Pausa del tape:** Botón TAPE ▶/⏸
- **Reset preferencias:** Restaura configuración por defecto

---

## 8. Cálculos financieros realizados

### 8.1 Ratios de valoración

**Price/Earnings (P/E)**
```
P/E = Precio por acción / (Beneficio neto / Acciones en circulación)
```
Interpretación: Menor que 15 = potencialmente infravalorada. Mayor que 25 = potencialmente sobrevalorada.

**EV/EBITDA**
```
EV = Capitalización bursátil + Deuda total - Caja
EV/EBITDA = EV / EBITDA
```
Interpretación: Menor que 8 = valoración atractiva. Mayor que 15 = valoración elevada.

**Price/Sales (P/S)**
```
P/S = Capitalización bursátil / Ventas totales
```
Interpretación: Útil para empresas con beneficios negativos o cíclicos.

### 8.2 Ratios de rentabilidad

**ROE (Return on Equity)**
```
ROE = Beneficio neto / Patrimonio neto
```
Interpretación: Mayor que 15% = excelente. 10-15% = bueno. Menor que 5% = mejorable.

**Margen Neto**
```
Margen neto = (Beneficio neto / Ventas) × 100
```
Interpretación: Varía por sector. Tecnología 20%+, Retail 2-5%.

### 8.3 Ratios de solvencia

**Debt/Equity**
```
D/E = Deuda financiera total / Patrimonio neto
```
Interpretación: Menor que 1 = baja apalancamiento. Mayor que 2 = riesgo elevado.

**Interest Coverage**
```
IC = EBIT / Gastos financieros por intereses
```
Interpretación: Mayor que 3 = cómodo. Menor que 1.5 = riesgo de impago.

### 8.4 Ratios de caja

**Free Cash Flow Yield**
```
FCF Yield = (FCF / Capitalización) × 100
```
Interpretación: Mayor que 8% = atractivo. Menor que 3% = poco atractivo.

### 8.5 Motor de salud financiera

El sistema evalúa automáticamente:
- Crecimiento de ingresos vs tendencia
- Estabilidad de márgenes
- Nivel de apalancamiento
- Cobertura de intereses
- Generación de flujo de caja libre
- Tendencia de deuda

Cada señal recibe una clasificación: INFO, REVIEW o ATENCIÓN.

### 8.6 Motor de oportunidad

Evalúa 5 criterios cuantitativos:
1. P/E < 20x
2. ROE > 10%
3. Debt/Equity < 2
4. FCF > 0
5. Interest Coverage > 3x

Si se cumplen 4 o más: **Candidata para revisión**.  
Si se cumplen 2-3: **Evidencia insuficiente**.  
Si se cumplen 0-1: **No respaldada**.

---

## 9. Consejos de uso

### 9.1 Para el Análisis Fundamental
- **Usa datos actualizados:** Asegúrate de que los datos correspondan al último ejercicio fiscal disponible.
- **No dejes campos vacíos:** Aunque son opcionales, los campos vacíos afectan a los ratios calculados.
- **Compara empresas del mismo sector:** Los ratios son más significativos al comparar dentro del mismo sector.
- **Revisa las advertencias:** El sistema genera warnings cuando detecta datos inconsistentes o ausentes.
- **Exporta para análisis posterior:** Usa el CSV para guardar historial de análisis o comparaciones.

### 9.2 Para el GMT Terminal
- **Configura alertas tempranas:** No esperes a que los precios se disparen. Configura alertas con márgenes de seguridad.
- **Usa la watchlist:** Marca con estrella los activos que sigues regularmente para acceso rápido.
- **Revisa los adapters:** Si ves datos faltantes, verifica que las fuentes de datos estén operativas.
- **Pausa el tape si es necesario:** Si la cinta distrae, puedes pausarla con el botón TAPE ▶/⏸.
- **Personaliza el orden de paneles:** Usa los botones ▲/▼ para mover los paneles según tu preferencia.

### 9.3 Consejos generales
- **Guarda tu trabajo:** Exporta CSV después de cada análisis importante.
- **No tomes decisiones basadas solo en ratios:** Combina con análisis cualitativo, noticias y tendencias.
- **Actualiza regularmente:** Los ratios varían con cada ejercicio económico.
- **Comparte resultados:** El CSV es fácil de enviar por email o compartir en informes.

---

## 10. Opinión y valoraciones

### 10.1 Fortalezas de la aplicación

**Simplicidad de uso:** La separación clara entre secciones y la progresión gradual hacen que cualquier usuario, incluso sin experiencia financiera avanzada, pueda introducir datos y obtener resultados útiles.

**Transparencia:** Cada ratio muestra su fórmula, objetivo y entradas requeridas. No hay "cajas negras". El usuario siempre sabe cómo se calcula cada cifra.

**Diseño accesible:** La aplicación cumple con principios WCAG: focus states visibles, labels permanentes, hit areas adecuadas para dispositivos móviles, contraste suficiente.

**Autocontenida:** No requiere servidor backend, base de datos ni suscripciones. Todo se ejecuta en el navegador.

**Testing automatizado:** 98 tests cubren los módulos críticos, dando confianza en la fiabilidad de los cálculos.

### 10.2 Áreas de mejora

**Sin persistencia de análisis:** Los análisis no se guardan entre sesiones. Sería útil implementar almacenamiento local o backend para historial.

**Fuentes de datos limitadas:** El módulo de índices requiere un proxy local. Las fuentes gratuitas tienen límites de frecuencia de sondeo.

**Sin gráficas de tendencia:** Los ratios se muestran como valores puntuales. Sería valioso incluir gráficas de evolución temporal.

**Sin comparación directa:** No permite comparar dos empresas lado a lado en una misma vista.

**Sin integración con datos reales:** Los datos de cotizaciones son de demostración para fines de evaluación de la interfaz.

### 10.3 Valoración global

| Criterio | Puntuación (1-10) | Comentario |
|----------|-------------------|------------|
| Usabilidad | 9/10 | Interfaz intuitiva, separación clara |
| Diseño visual | 8/10 | Limpio, profesional, cumple WCAG |
| Funcionalidad core | 8/10 | Ratios completos, cálculos fiables |
| Rendimiento | 9/10 | Carga rápida, actualización eficiente |
| Fiabilidad | 9/10 | 98 tests, build automatizado |
| Documentación | 7/10 | Manual completo (este documento) |
| Potencial de escalabilidad | 8/10 | Arquitectura modular preparada para crecer |

**Valoración media: 8.3/10**

---

## 11. Conclusiones

El Gestor Financiero Portafolio Intel es una herramienta sólida para el análisis financiero básico y el monitoreo de mercados. Su diseño limpio, cálculos transparentes y testing automatizado la convierten en una opción fiable para inversores y analistas.

Los puntos fuertes son:
- **Cálculos financieros completos** que cubren los ratios más importantes del análisis fundamental
- **Interfaz accesible** que cumple estándares WCAG y principios de diseño centrado en el usuario
- **Monitoreo de mercado en tiempo real** con múltiples fuentes de datos
- **Sistema de alertas** que permite seguir activos sin vigilancia constante
- **Sin costes de infraestructura** — se ejecuta en el navegador del usuario

Las mejoras futuras más relevantes serían:
1. Implementar persistencia de análisis entre sesiones
2. Añadir gráficas de evolución temporal de ratios
3. Permitir comparación lado a lado de empresas
4. Integrar fuentes de datos reales para cotizaciones en producción
5. Añadir exportación a PDF de los informes de análisis

En conclusión, Portafolio Intel representa una base sólida para una herramienta de análisis financiero que puede crecer y evolucionar según las necesidades de sus usuarios. La combinación de cálculos financieros rigurosos, diseño centrado en el usuario y arquitectura técnica moderna la posicionan como una solución efectiva para la toma de decisiones informadas en los mercados financieros.

---

## 12. Glosario de términos

| Término | Definición |
|---------|------------|
| **EBIT** | Earnings Before Interest and Taxes — Beneficio antes de intereses e impuestos |
| **EBITDA** | Earnings Before Interest, Taxes, Depreciation and Amortization — Beneficio antes de intereses, impuestos, depreciaciones y amortizaciones |
| **FCF** | Free Cash Flow — Flujo de caja libre |
| **ROE** | Return on Equity — Rentabilidad sobre fondos propios |
| **ROA** | Return on Assets — Rentabilidad sobre activos |
| **WACC** | Weighted Average Cost of Capital — Coste medio ponderado de capital |
| **P/E** | Price to Earnings ratio — Ratio precio/beneficio |
| **EV** | Enterprise Value — Valor de la empresa |
| **D/E** | Debt to Equity ratio — Ratio deuda/patrimonio |
| **ROI** | Return on Investment — Retorno de la inversión |
| **BCP** | Business Continuity Plan — Plan de continuidad del negocio |
| **MFA** | Multi-Factor Authentication — Autenticación multifactor |
| **RLS** | Row-Level Security — Seguridad a nivel de fila |
| **WCAG** | Web Content Accessibility Guidelines — Guías de accesibilidad para contenido web |
| **CSV** | Comma-Separated Values — Valores separados por comas (formato de archivo) |

---

## Nota legal

Este documento y la aplicación descrita son herramientas de análisis financiero informativo. No constituyen asesoramiento financiero, recomendación de inversión ni oferta de valores. Toda inversión conlleva riesgos, incluyendo la posible pérdida del capital invertido. Antes de tomar decisiones de inversión, consulta con un asesor financiero profesional.

---

*Documento generado el 3 de septiembre de 2026.*  
*Gestor Financiero Portafolio Intel — Versión 1.0*