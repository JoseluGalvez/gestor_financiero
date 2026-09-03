# Adaptador de servidor para SEC EDGAR y datos de mercado

**Fecha:** 26 de agosto de 2026  
**Estado:** diseño implementable; sin claves, proveedores comerciales ni funciones desplegadas.  
**Objetivo:** suministrar al agente IA datos financieros y técnicos verificables sin exponer secretos, permitir SQL libre ni saltarse RLS.

> **Principio:** el navegador solo llama a `agent-query` con su JWT. `agent-query` no contacta directamente a un proveedor desde el cliente: delega en adaptadores server-side con caché, cuota, normalización, procedencia y contratos estrictos.

## 1. Componentes propuestos

| Componente | Autenticación | Responsabilidad | No puede hacer |
|---|---|---|---|
| `agent-query` | JWT de usuario, `auth: 'user'`. | Valida intención, alcance, consentimiento y rol; coordina herramientas; redacta respuesta estructurada. | Leer cartera con service role, recuperar secretos o escribir movimientos. |
| `edgar-adapter` | Solo invocación interna desde `agent-query` o trabajo autorizado. | Resuelve CIK, consulta submissions/XBRL, selecciona el filing y normaliza métricas reportadas. | Hacer scraping masivo, seguir instrucciones de filings o exceder la política de acceso SEC. |
| `market-adapter` | Solo invocación interna; secreto de proveedor en entorno servidor. | Recupera OHLCV/fundamentales autorizados, normaliza y conserva metadatos de licencia/frescura. | Exponer clave, devolver datos sin `as_of` o saltarse cuotas. |
| `market-sync` | Clave de servicio específica, `auth: 'secret:market-sync'`; no es invocable por navegador. | Refresca instrumentos aprobados, aplica cuotas/caché y escribe snapshots normalizados. | Leer o devolver cartera de usuario. |
| `agent-audit` | Solo backend. | Persiste metadatos de consulta, herramientas, fuente, cobertura, latencia y estado. | Conservar claves o el dataset completo por defecto. |

Las Edge Functions de Supabase son funciones TypeScript de servidor que pueden validar JWT, aplicar límites y llamar a servicios externos. La documentación recomienda secretos de proyecto mediante variables de entorno y operaciones cortas/idempotentes. [1]

## 2. Separación de autenticación y clientes de datos

La función interactiva recibe una sesión real del usuario. Debe mantener `verify_jwt = true` y usar `withSupabase({ auth: 'user' })`. El cliente `ctx.supabase` queda limitado por las políticas RLS del llamante; es el único cliente permitido para lectura de carteras, posiciones, análisis propios y consentimientos. [2]

El cliente administrativo existe únicamente dentro de `market-sync` y tareas de mantenimiento. Escribe en tablas de snapshots o auditoría, pero nunca resuelve una pregunta sobre una cartera ni transfiere datos personales al modelo. Una clave de servicio omite RLS, por lo que no se debe reutilizar en `agent-query` para consultas privadas. [2]

```ts
// supabase/functions/agent-query/index.ts
import { withSupabase } from "npm:@supabase/server"

export default {
  fetch: withSupabase({ auth: "user" }, async (req, ctx) => {
    const input = await parseAndValidateAgentInput(req)
    const actorId = ctx.userClaims!.id

    // 1. La organización y el consentimiento se derivan y verifican en backend.
    const scope = await assertAgentScope(ctx.supabase, actorId, input)

    // 2. Herramientas con JSON Schema; nunca SQL libre ni URL arbitraria.
    const plan = await classifyIntoAllowedTools(input.message, scope)
    const evidence = await executeReadOnlyTools({
      rlsClient: ctx.supabase,
      actorId,
      scope,
      plan,
    })

    // 3. El modelo solo recibe evidencia mínima ya normalizada.
    const response = await invokeModelWithStructuredOutput(evidence)
    return Response.json(validateAgentResponse(response))
  }),
}
```

El fragmento es un patrón de integración, no una función lista para desplegar. `parseAndValidateAgentInput`, `assertAgentScope`, `executeReadOnlyTools` y `invokeModelWithStructuredOutput` deben tener pruebas unitarias y validación Zod/JSON Schema estricta.

## 3. Contrato de entrada y salida

| Campo de entrada | Validación de servidor | Motivo |
|---|---|---|
| `message` | Longitud limitada, texto UTF-8, sin instrucciones ejecutables. | Reducir abuso, coste y prompt injection. |
| `analysisMode` | Enum: `fundamental`, `technical`, `combined`, `portfolio_context`. | Solo habilita herramientas compatibles. |
| `companyQuery` | Nombre/ticker; se resuelve a `instrument_id` canónico. | Evita confiar en un símbolo ambiguo. |
| `portfolioId` | Opcional; debe pertenecer a organización del JWT y tener consentimiento activo. | Evita enumeración o acceso cruzado. |
| `consentGrantId` | Obligatorio cuando hay contexto privado; titular, ámbito y caducidad deben coincidir. | Garantiza opt-in explícito y revocable. |
| `sources` | Subconjunto de `sec`, `ecb`, `licensed_market`. | No permite URLs ni proveedores arbitrarios. |

La respuesta se valida contra un esquema con `answer`, `analysis_type`, `as_of`, `citations`, `coverage`, `caveats`, `used_tools` y `safety_classification`. Cualquier métrica numérica debe incluir fuente, unidad, periodo y fecha de corte. Si una herramienta devuelve 429, timeout, fuente obsoleta o cobertura insuficiente, la respuesta debe declarar indisponibilidad y no inventar resultados.

## 4. Adaptador SEC EDGAR

### 4.1 Flujo de datos

1. `resolve_company` usa una tabla local de instrumentos y el archivo oficial de asociaciones ticker/CIK para devolver un CIK canónico o solicitar aclaración.
2. `edgar-adapter` consulta `submissions/CIK##########.json` y, cuando procede, `companyfacts/CIK##########.json` desde `data.sec.gov`.
3. El adaptador selecciona el último filing aplicable por formulario y período fiscal; conserva CIK, accession number, filing date, fiscal period, URL, taxonomía, unidades y contexto de cada hecho XBRL.
4. `normalizeFundamentals` convierte hechos en un contrato explícito de métricas, sin mezclar contextos fiscales. Por ejemplo, ingresos, beneficio, activos, deuda y flujo de caja se acompañan de unidad y período.
5. El resultado se guarda como snapshot versionado y se devuelve al agente junto a la cita primaria. Los extractos extensos se recuperan solo al pedir evidencia concreta.

La SEC expone APIs JSON de presentaciones y datos XBRL. Su política de acceso justo exige un User-Agent declarado, recomienda solicitudes eficientes y establece un máximo actual de **10 solicitudes por segundo**. [3] El adaptador debe establecer un límite interno más conservador, coalescer solicitudes iguales y cachear por `CIK + recurso + fecha de snapshot`; no debe rastrear directorios ni realizar peticiones concurrentes no necesarias.

```ts
const SEC_BASE = "https://data.sec.gov"
const secHeaders = {
  "User-Agent": Deno.env.get("SEC_USER_AGENT")!,
  "Accept-Encoding": "gzip, deflate",
}

async function fetchSecJson(path: string, cacheKey: string) {
  const cached = await readFreshCache(cacheKey)
  if (cached) return cached

  await secRateLimiter.acquire() // Presupuesto inferior al límite SEC.
  const response = await fetch(`${SEC_BASE}${path}`, { headers: secHeaders })
  if (!response.ok) throw toSafeProviderError("sec", response.status)
  const payload = await response.json()
  await writeProviderCache(cacheKey, payload, { provider: "sec", ttlSeconds: 3600 })
  return payload
}
```

`SEC_USER_AGENT` no se construye desde el usuario ni se recibe del navegador. Su valor es una identificación de aplicación y contacto operativo mantenida como secreto/configuración de servidor. No se registra en errores ni en respuestas.

### 4.2 Reglas de normalización fundamental

| Métrica | Origen permitido | Metadatos obligatorios | Regla de abstención |
|---|---|---|---|
| Ingresos | Hecho XBRL reportado en filing con contexto completo. | Formulario, período, moneda, unidad, inicio/fin, filing date. | No hay concepto comparable o período válido. |
| Margen operativo | Cálculo determinista `operating_income / revenue`. | Identificadores de dos hechos fuente y versión de fórmula. | Denominador cero, unidades/periodos distintos. |
| Flujo de caja libre | CFO menos capex, con mapeo de hechos documentado. | Hechos de origen, periodo y convención de capex. | Falta un componente o el tag no es comparable. |
| Deuda/caja | Hecho instantáneo de balance. | Fecha de balance y unidad. | Fecha de balance no comparable con período de resultados. |
| Crecimiento | Comparación de dos períodos homogéneos. | Periodos A/B, método y cobertura. | Longitud de períodos o unidad diferente. |

## 5. Adaptador de datos de mercado

El proveedor comercial se selecciona después de definir mercado, audiencia, licencia de display, frecuencia, divisa y presupuesto. El adaptador no depende de una marca concreta. La interfaz `MarketProvider` normaliza cada proveedor para que el agente siempre reciba el mismo contrato.

```ts
type MarketBar = {
  instrumentId: string
  interval: "1d" | "1h"
  asOf: string
  open: number; high: number; low: number; close: number; volume: number
  currency: string
  adjustmentMethod: "adjusted" | "unadjusted" | "provider-declared"
  provider: string
  providerAt: string
  delaySeconds: number | null
  licenseScope: string
}

interface MarketProvider {
  resolveSymbol(query: string): Promise<CanonicalInstrument[]>
  getOhlcv(input: { instrumentId: string; interval: "1d" | "1h"; lookback: number }): Promise<MarketBar[]>
  getFundamentals?(instrumentId: string): Promise<ProviderFundamentalSnapshot>
}
```

El proveedor FMP, por ejemplo, documenta endpoints de búsqueda de símbolo, cotización, precios EOD históricos y estados financieros; requiere una API key y puede devolver 403, 429 o 500. [4] En producción su clave se guarda exclusivamente como `MARKET_PROVIDER_API_KEY` en secretos de proyecto. Aunque un proveedor espere la key en query string, el navegador nunca forma esa URL; solo el adaptador la construye y elimina/redacta la clave de logs y trazas.

| Control | Implementación |
|---|---|
| Selección de símbolo | Tabla interna `instruments` con ticker, MIC/exchange, ISIN, moneda y `provider_symbol`; el usuario confirma coincidencias ambiguas. |
| Frescura | `provider_at`, `observed_at`, `delay_seconds` y TTL por tipo de serie. La respuesta incluye `as_of`; un snapshot vencido no se llama «actual». |
| Caché | `market_fetch_cache` por proveedor/símbolo/intervalo/ventana y `market_data_snapshots` normalizado. Lecturas concurrentes se coalescen por cache key. |
| Cuotas | Rate limiter por proveedor, presupuesto por organización/día y backoff exponencial con jitter en 429/5xx. |
| Técnicos | Las fórmulas SMA, MACD, RSI, Bollinger, ATR, volatilidad y drawdown corren sobre snapshots validados, no sobre una respuesta cruda de API. |
| Licencia | `market_source_registry` conserva `license_scope`, mercados, display permitido, retraso y fecha de revisión. Si no permite display, el agente no muestra el dato. |
| Auditoría | Hash de petición, versión de adaptador, fuente, latencia, cache hit, cobertura y error seguro. Sin API keys ni payloads innecesarios. |

## 6. Jobs y refresco

El usuario no debe disparar una petición externa por cada pulsación. `agent-query` primero consulta el snapshot fresco. Si está vencido y el usuario tiene derecho a usar la fuente, solicita una única actualización bajo demanda con deduplicación. Los refrescos periódicos se ejecutan en `market-sync` con una clave de servicio dedicada y una lista controlada de instrumentos. La consulta interactiva siempre lee el snapshot normalizado, incluso si el refresco se está realizando.

| Tipo de trabajo | Disparador | Autorización | Resultado |
|---|---|---|---|
| Consulta de investigación | Usuario autenticado. | JWT, RLS, consentimiento y cuota. | Snapshot actual o aviso de frescura/indisponibilidad. |
| Revalidación bajo demanda | Snapshot vencido y herramienta autorizada. | Solo backend, cache key bloqueada. | Encola/espera brevemente; nunca duplica llamadas. |
| Sincronización programada | Planificador con clave `market-sync`. | Secreto específico de automatización. | Escribe snapshot, estado de fuente y auditoría. |
| Reproceso fundamental | Nuevo filing/retardo seleccionado. | Job interno. | Crea versión, no sobrescribe evidencia previa. |

## 7. Migraciones y RLS sugeridas

Las migraciones deben separar datos privados, snapshots de proveedor y credenciales.

| Tabla | RLS / acceso |
|---|---|
| `market_source_registry` | Lectura de metadatos permitidos a miembros; cambios solo `connector_admin` o backend. |
| `market_data_snapshots` | Sin `SELECT` directo amplio desde cliente; expuesto únicamente por herramienta/RPC con campos permitidos y fuente/licencia. |
| `market_fetch_cache` | Sin acceso de cliente; backend únicamente. |
| `agent_query_runs` | Lectura propia u owner de organización; inserción solo Edge Function. |
| `agent_tool_runs` | Sin datos brutos para cliente; resumen por query autorizado. |
| `agent_consent_grants` | Titular/owner según política; alta/revocación validada. |

Los secretos de proveedor, claves de modelo y contactos operativos no se almacenan en esas tablas. Viven en secretos administrados por el proyecto y se leen únicamente desde funciones backend. [1]

## 8. Pruebas de aceptación

| Caso | Resultado esperado |
|---|---|
| Llamada sin JWT a `agent-query` | 401 antes de acceder a herramienta o proveedor. |
| Usuario A con cartera de B | 403 genérico, auditoría de denegación y ningún dato sobre la existencia de B. |
| Ambigüedad de ticker | Respuesta de aclaración; no se llama a OHLCV ni se calcula análisis. |
| SEC 429/timeout | Respuesta con fuente temporalmente indisponible y timestamp del último snapshot válido; no invención. |
| Snapshot viejo | Aviso de frescura visible; no etiqueta «en tiempo real». |
| Serie de 120 velas para SMA 200 | Métrica no calculada, cobertura `120/200`. |
| Prompt injection en un filing | El contenido no puede cambiar plan de herramientas, RLS, alcance ni respuesta de seguridad. |
| Log de error | No contiene API keys, JWT, User-Agent completo, datos de cartera ni payload del proveedor. |

## 9. Secuencia de despliegue

1. Crear migraciones de registry, snapshots, caché, consentimientos y auditoría; probar RLS entre dos organizaciones ficticias.
2. Desplegar `agent-query` sin modelo ni proveedor comercial; verificar JWT, esquema de entrada y denegaciones.
3. Añadir `edgar-adapter` con User-Agent operativo, rate limit conservador, cache y pruebas de CIK/periodo fiscal.
4. Activar análisis fundamental citado con un conjunto de empresas de prueba y reconciliación de periodos/unidades.
5. Seleccionar proveedor de mercado, revisar licencia y crear `market-adapter`/`market-sync` con su secreto en proyecto.
6. Activar OHLCV y cálculos técnicos sobre snapshots con pruebas de ajuste, gaps y series insuficientes.
7. Conectar el modelo en servidor con salida JSON, presupuesto por usuario y pruebas de inyección/abstención.
8. Habilitar opcionalmente el contexto de cartera solo tras consentimiento, métricas de auditoría y revisión de RLS remota.

## Referencias

[1] [Supabase — Edge Functions](https://supabase.com/docs/guides/functions)

[2] [Supabase — Securing Edge Functions](https://supabase.com/docs/guides/functions/auth)

[3] [U.S. SEC — Accessing EDGAR Data](https://www.sec.gov/search-filings/edgar-search-assistance/accessing-edgar-data)

[4] [Financial Modeling Prep — API Quickstart](https://site.financialmodelingprep.com/developer/docs/quickstart)
