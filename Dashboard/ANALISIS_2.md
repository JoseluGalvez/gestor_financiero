## Contexto y Rol

Actúa como un **Lead Full-Stack Software Engineer y Arquitecto de Inteligencia Artificial**. Tu objetivo es diseñar la arquitectura del sistema, proponer el *Tech Stack* óptimo y redactar el código fundacional (MVP) para una plataforma integral de análisis de inversiones (web y móvil) impulsada por un sistema multiagente de IA.

La aplicación debe igualar las capacidades analíticas de un terminal profesional (Bloomberg, Morningstar, TradingView) pero con una UX/UI radicalmente simplificada para inversores retail e institucionales.

## 1. Arquitectura del Sistema Multiagente (AI Framework)

El núcleo del sistema será una orquestación de agentes especializados. Debes proponer una implementación utilizando frameworks como LangGraph, CrewAI o Autogen. Los agentes a definir e instanciar son:

* **Data Fetcher Agent:** Encargado de enrutar peticiones a APIs externas, manejar *rate limits* y normalizar JSONs.
* **Fundamental Agent:** Analiza 10-Ks, 10-Qs y calcula ratios financieros.
* **Strategic & Moat Agent:** Analiza ventajas competitivas y posición en la industria.
* **Technical Agent:** Procesa series temporales de precios y calcula indicadores.
* **Risk & NLP Agent:** Ejecuta análisis de sentimiento en noticias y redes sociales (RAG sobre *Earnings Calls* y noticias).
* **Portfolio & Quant Agent:** Ejecuta modelos de valoración y asignación de capital.
* **Executive Analyst (Orquestador):** Sintetiza las salidas de todos los agentes en un informe unificado y accionable.

## 2. Integración de Fuentes de Datos (APIs)

Diseña los esquemas de integración para las siguientes capas de datos:

* **Financiera e Institucional:** SEC EDGAR, CNMV, Financial Modeling Prep, Alpha Vantage.
* **Precios y Mercado:** Polygon.io, TradingView, TwelveData.
* **Noticias y NLP (RAG):** Reuters, Bloomberg, MarketWatch, X, Reddit.

## 3. Lógica de Negocio y Motor Algorítmico

El sistema debe procesar un Ticker/ISIN y calcular automáticamente las siguientes métricas. (Debes diseñar los servicios/funciones en el backend para estos cálculos):

**Crecimiento:**
Tasa de Crecimiento Anual Compuesto (CAGR):
$CAGR = \left(\frac{Valor_{final}}{Valor_{inicial}}\right)^{\frac{1}{n}} - 1$

**Rentabilidad y Márgenes:**

* $ROE = \frac{Net\ Income}{Shareholder\ Equity}$
* $ROIC = \frac{NOPAT}{Invested\ Capital}$
* $Net\ Margin = \frac{Net\ Income}{Revenue}$

**Salud Financiera:**

* $Free\ Cash\ Flow\ (FCF) = Operating\ Cash\ Flow - CapEx$
* $Net\ Debt = Total\ Debt - Cash$
* $Debt\ to\ EBITDA = \frac{Net\ Debt}{EBITDA}$ (Alerta si $>3$)

**Valoración y DCF (Discounted Cash Flow):**
Implementar un modelo DCF automatizado calculando el Valor Terminal (TV):
$TV = \frac{FCF_{10} \times (1 + g_{terminal})}{WACC - g_{terminal}}$

**Análisis Técnico:**
Implementar detección de cruces de medias (SMA20, SMA50, SMA200), MACD, RSI14 (Alerta $>70$ Sobrecompra, $<30$ Sobreventa), Bandas de Bollinger y ATR.

## 4. Motor de Puntuación (Scoring System)

El backend debe ponderar los resultados de los agentes para generar un **Investment Score** (0-100) basado en la siguiente tabla:

| Factor Analítico | Peso en el Score Global | Criterio de Puntuación |
| --- | --- | --- |
| Salud Financiera | 20% | Deuda, Liquidez, FCF. |
| Crecimiento | 20% | CAGR de ingresos y EPS. |
| Valoración | 20% | PER, PEG, DCF vs Precio actual. |
| Ventaja Competitiva | 15% | Moat, marca, retención. |
| Técnico y Momentum | 15% | Tendencias, RSI, MACD. |
| Gestión de Riesgos | 10% | Geopolítica, ESG, concentración. |

**Salida de Recomendación:**
$\geq 90$: Alta Convicción | $80-89$: Compra | $70-79$: Mantener | $60-69$: Neutral | $< 60$: Venta/Evitar.

## 5. Gestión de Cartera

El sistema incluirá un módulo de dimensionamiento de posición utilizando un Criterio de Kelly simplificado:
$f^* = \frac{bp - q}{b}$
*(Donde $p$ = probabilidad de acierto, $q$ = probabilidad de pérdida, $b$ = ratio beneficio/pérdida esperado).*

## Entregables Requeridos en tu Respuesta

Por favor, actúa como el Lead Engineer y proporcióname lo siguiente:

1. **Tech Stack Propuesto:** Selecciona las mejores tecnologías modernas para Frontend, Backend, Base de Datos, Framework de IA y Cloud Hosting.
2. **Arquitectura de Datos y RAG:** Explica brevemente cómo estructuraremos la base de datos vectorial para los *Earnings Calls* y reportes de la SEC.
3. **Código Backend (Agente Orquestador):** Escribe el código Python del agente principal (usando LangChain o similar) que reciba un *Ticker*, coordine al agente fundamental y al técnico, y devuelva un JSON estructurado.
4. **Estructura del Componente UI:** Un esquema en React/Next.js del Dashboard principal que mostrará el semáforo de riesgo y los scores.

---

Aquí tienes el diseño técnico del MVP adaptado a este entorno:

---

## 1. Tech Stack Propuesto (Serverless MVP)

Para equilibrar la velocidad del análisis técnico con la profundidad del análisis fundamental, utilizaremos el siguiente stack:

* **Frontend & API Gateway:** **Next.js** alojado en **Vercel**. Aprovecharemos las *Serverless Functions* para endpoints rápidos (datos técnicos, precios) y el enrutamiento de la UI.
* **Backend de Inteligencia Artificial:** **Python (FastAPI)** alojado en **Google Cloud Run** o **AWS Lambda**. Python es obligatorio para el ecosistema de IA. Cloud Run es ideal porque cobra por milisegundo de uso, pero permite ejecuciones de hasta 60 minutos (vital para que los agentes lean reportes financieros densos sin interrupciones).
* **Base de Datos & Autenticación:** **Supabase** (PostgreSQL). Nos proporciona autenticación, base de datos relacional (para perfiles de usuario, carteras) y, crucialmente, soporta **pgvector**, lo que nos ahorra tener que pagar una base de datos vectorial dedicada.
* **Framework de IA Multiagente:** **LangChain** (para construir los chains de análisis) y **LangGraph** (para orquestar el flujo cíclico entre el Agente Técnico y el Agente Fundamental).

---

## 2. Arquitectura de Datos y RAG (Análisis Fundamental)

El **Agente Fundamental** necesita leer *Earnings Calls* (transcripciones) y reportes 10-K. En un entorno Serverless, procesaremos esto así:

1. **Ingesta Asíncrona:** Cuando el usuario pide analizar "AAPL", una función serverless verifica si ya tenemos los datos de este trimestre. Si no, se dispara un *background job* que descarga el JSON de la SEC o el PDF del *Investor Presentation*.
2. **Chunking & Embedding:** El documento se divide en fragmentos semánticos (por ejemplo, separando la sección de "Riesgos" de la de "Resultados Operativos"). Usamos el modelo `text-embedding-3-small` de OpenAI para convertir el texto en vectores.
3. **Almacenamiento (pgvector):** Guardamos los vectores en **Supabase**.
4. **Recuperación (RAG):** El Agente Fundamental hace una búsqueda de similitud (ej. *"¿Cuáles son las ventajas competitivas mencionadas por el CEO?"*) y extrae el contexto para inyectarlo en el LLM y calcular el *Moat Score*.

---

## 3. Código Backend: El Agente Orquestador (Python/FastAPI)

Este es el esqueleto del microservicio en Python. Actúa como el puente entre el mundo cuantitativo (Técnico) y el cualitativo (Fundamental).

```python
from fastapi import FastAPI, BackgroundTasks
from pydantic import BaseModel
from langchain_openai import ChatOpenAI
from langchain.agents import AgentExecutor, create_tool_calling_agent
from langchain.tools import tool

app = FastAPI()
llm = ChatOpenAI(model="gpt-4o", temperature=0)

# --- Definición de Herramientas (Tools) ---

@tool
def analisis_tecnico(ticker: str) -> dict:
    """Extrae precios, calcula MACD, RSI, SMA y devuelve el Technical Score."""
    # Aquí iría la llamada a Polygon.io o AlphaVantage y el cálculo matemático
    return {"rsi": 65, "tendencia": "alcista", "technical_score": 85}

@tool
def analisis_fundamental_rag(ticker: str) -> dict:
    """Busca en Supabase (pgvector) datos del último 10-K y calcula ratios."""
    # Aquí se calcularía el ROIC, FCF y se aplicaría el modelo DCF
    return {"roic": 0.25, "moat": "Amplio", "fundamental_score": 90, "dcf_upside": 0.15}

# --- Configuración del Orquestador ---
tools = [analisis_tecnico, analisis_fundamental_rag]
# (Asumimos que el prompt del sistema está definido y cargado)
# agent = create_tool_calling_agent(llm, tools, prompt)
# agent_executor = AgentExecutor(agent=agent, tools=tools)

class AnalyzeRequest(BaseModel):
    ticker: str

@app.post("/api/v1/analyze")
async def analyze_asset(request: AnalyzeRequest):
    """
    Endpoint Serverless. Ejecuta el análisis combinado.
    En producción, si toma > 30s, se recomienda devolver un Job ID y usar Webhooks.
    """
    ticker = request.ticker
    
    # El LLM decide llamar al agente técnico y al fundamental
    # y luego pondera la información según nuestro modelo algorítmico.
    response = f"Ejecutando análisis integral para {ticker}..." # agent_executor.invoke({"input": ticker})
    
    # Retorno estructurado para el Frontend
    return {
        "ticker": ticker,
        "investment_score": 88, # Resultado del algoritmo matemático
        "recomendacion": "Compra",
        "semaforo": "Verde",
        "scores": {
            "fundamental": 90,
            "tecnico": 85,
            "riesgo": 80
        }
    }

```

---

## 4. Estructura del Componente UI (React / Next.js)

El frontend debe ser minimalista, ocultando la complejidad del DCF o del MACD detrás de un diseño limpio estilo "Semáforo".

```jsx
import React, { useState } from 'react';
import { Card, Title, Text, Metric, BadgeDelta, Grid, ProgressBar } from '@tremor/react';

export default function OmniInvestDashboard({ tickerData }) {
  // tickerData contendría la respuesta del backend
  const { ticker, investment_score, recomendacion, semaforo, scores } = tickerData;

  const getSemaforoColor = (color) => {
    const colors = { Verde: 'emerald', Amarillo: 'yellow', Rojo: 'rose' };
    return colors[color] || 'gray';
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <Title>Análisis Integral: {ticker}</Title>
          <Text>OmniInvest AI Executive Summary</Text>
        </div>
        <BadgeDelta deltaType={semaforo === 'Verde' ? 'increase' : 'decrease'} color={getSemaforoColor(semaforo)}>
          {recomendacion}
        </BadgeDelta>
      </div>

      <Card>
        <Text>Investment Score Global</Text>
        <Metric>{investment_score} / 100</Metric>
        <ProgressBar value={investment_score} color={getSemaforoColor(semaforo)} className="mt-4" />
      </Card>

      <Grid numItemsSm={2} numItemsLg={4} className="gap-4">
        <Card>
          <Text>Salud Fundamental</Text>
          <Metric>{scores.fundamental}</Metric>
        </Card>
        <Card>
          <Text>Momentum Técnico</Text>
          <Metric>{scores.tecnico}</Metric>
        </Card>
        <Card>
          <Text>Ventaja Competitiva</Text>
          <Metric>{scores.competitivo}</Metric>
        </Card>
        <Card>
          <Text>Riesgo</Text>
          <Metric>{scores.riesgo}</Metric>
        </Card>
      </Grid>
      
      {/* Secciones adicionales para la Tesis de Inversión y Gestión de Cartera (Kelly Criterion) */}
    </div>
  );
}

```

---

