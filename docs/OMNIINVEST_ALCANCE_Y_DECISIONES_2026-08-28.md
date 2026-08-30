# OmniInvest — alcance, decisiones y límites de la primera entrega

**Fecha:** 28 de agosto de 2026  
**Estado:** implementación local de interfaz y cálculo determinista; sin proveedores, IA, tareas en segundo plano, secretos, migraciones ni datos reales.

## 1. Material analizado

El vídeo adjunto plantea un problema de fragmentación entre gráficos, escáneres, fuentes, análisis técnico, análisis fundamental y gestión de riesgos. Su contribución útil para el producto es la necesidad de un resumen único y explicable; no se adoptan como hechos las afirmaciones de superioridad, usuarios, costes o eficacia de las plataformas citadas en la pieza audiovisual.

`OmniInvest.md` propone un MVP de análisis combinado en frontend, servidor de IA y base de datos. La primera entrega reutiliza exclusivamente el motor analítico ya presente en la aplicación y una interfaz de resumen. Las partes que requieren servicios externos quedan expresamente fuera del código activo porque implican credenciales, permisos, tratamiento de datos, coste, licencia o procesamiento asíncrono.

La transcripción completa del audio adjunto no pudo completarse porque el servicio informó que la cuota disponible era insuficiente. No se ha sustituido esta evidencia por una transcripción inventada ni se ha utilizado un mecanismo alternativo para esquivar la limitación.

## 2. Decisión de producto

| Necesidad identificada | Entrega OmniInvest actual | Deliberadamente no incluido |
| --- | --- | --- |
| Unificar señales | Resumen local de salud financiera, crecimiento, valoración, ventaja competitiva, momentum técnico y riesgo. | Señal de compra/venta, recomendación personalizada u órdenes. |
| Ocultar complejidad sin ocultar evidencia | Indicador de consistencia, cobertura, fecha de corte, fuente declarada, avisos y desglose de factores. | Un semáforo de inversión que se presente como consejo o certeza. |
| Análisis reproducible | Reutilización de `calculateWeightedScore` con pesos visibles y validación de 0–100. | Puntuación inventada por un modelo o ponderación opaca. |
| Privacidad | Entradas procesadas en memoria del navegador y escenario de demostración ficticio. | Lectura implícita de Canvas local, cartera, Supabase, Google Sheets, proveedores o almacenamiento residente. |
| Preparación para IA/RAG | Etiquetas de fuente, fecha, cobertura y contrato de resultado compatibles con el diseño existente. | LLM, LangChain/LangGraph, embeddings, pgvector, scraping de 10-K, FastAPI, Cloud Run/Lambda o colas de tareas. |

## 3. Flujo implementado

1. La persona escribe un activo/empresa, una referencia opcional, fecha de corte y fuente declarada.
2. Introduce de forma manual las seis dimensiones en una escala 0–100, o carga el **escenario ficticio** integrado.
3. OmniInvest valida fecha real, fuente, nombre y cada valor finito dentro de la escala.
4. El motor calcula únicamente el promedio ponderado con la cobertura disponible, usando los pesos que muestra la interfaz.
5. La vista publica el resultado como **indicador de consistencia de datos declarados**, parcial o bloqueado. No publica recomendaciones ni usa información de mercado.

## 4. Contrato conceptual de salida

```ts
type OmniInvestLocalSummary = {
  status: "ready" | "partial" | "blocked";
  overallScore: number | null;
  coveragePct: number;
  factorScores: Partial<Record<FactorKey, number | null>>;
  asOf: string | null;
  declaredSource: string | null;
  warnings: string[];
  scope: "manual_local" | "fictitious_demo";
};
```

La transición a datos propios o externos no debe cambiar este contrato de forma silenciosa. Debe añadirse como mínimo `source_id`, `source_url`, `retrieved_at`, `fiscal_period`, `currency`, `units`, `coverage`, `calculation_version` y un vínculo de consentimiento cuando se use una cartera. El catálogo de herramientas, la RLS y las pruebas de aislamiento ya se describen en `docs/AGENTE_IA_HERRAMIENTAS_Y_RLS.md`.

## 5. Ruta previa a servicios conectados

| Alternativa | Beneficio | Coste de seguridad/operación | Decisión pendiente |
| --- | --- | --- | --- |
| Continuar solo con entrada manual/local | Sin secreto, proveedor, transferencia ni job. | La persona debe documentar sus métricas; no aporta actualidad automática. | Disponible en la entrega actual. |
| Servicio de servidor bajo demanda para fuentes permitidas | Datos con fuente y fecha, sin exponer claves al navegador. | Requiere proveedor/licencia, secretos de servidor, RLS, cuota, errores y revisión de privacidad. | Requiere autorización explícita. |
| Ingesta asíncrona y análisis documental | Permite procesar filings extensos y cachear evidencia. | Requiere cola/job durable, gobernanza de datos, seguridad anti-instrucciones, coste y borrado. | Requiere diseño aprobado, no se implementa en el sandbox. |

> La interfaz OmniInvest no debe presentarse como análisis integral de mercado ni recomendación. El indicador solo resume entradas manuales o el escenario ficticio cargado de forma explícita.
