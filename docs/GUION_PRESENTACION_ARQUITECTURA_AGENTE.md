# Guion y contenido: Arquitectura del Agente IA y RLS

## 1. Portada
- **Título:** Agente IA Financiero: Arquitectura y Seguridad
- **Subtítulo:** Controles de acceso, herramientas y diseño RLS para Portafolio Intel
- **Concepto visual:** Diseño sobrio, azul/teal, foco en seguridad y arquitectura.

## 2. El problema: Datos vs. Privacidad
- **Contenido:** Un agente útil necesita datos privados y actualidad de mercado, pero un LLM libre expone secretos, mezcla carteras y es susceptible a inyecciones.
- **Solución:** Arquitectura en tres capas: cliente autenticado, Edge Function con herramientas R/O y modelo con contexto mínimo.
- **Nota orador:** No queremos un chat que consulte la base de datos entera ni que exponga la API key de un proveedor comercial al navegador del usuario.

## 3. Arquitectura del Agente (Diagrama)
- **Contenido:**
  - 1. Usuario autenticado (JWT) -> UI.
  - 2. UI -> Edge Function (`agent-query`).
  - 3. Edge Function valida RLS, rol y cuota.
  - 4. Edge Function coordina herramientas (Supabase R/O, Adaptador SEC, Adaptador Mercado).
  - 5. Modelo IA procesa solo evidencia y devuelve JSON estructurado.
- **Nota orador:** El modelo no llama a los proveedores ni ejecuta SQL. Solo recibe el resultado normalizado de herramientas previamente autorizadas.

## 4. Herramientas de solo lectura
- **Contenido:**
  - `resolve_company`: desambigua ticker/ISIN.
  - `get_fundamental_snapshot`: filings SEC o proveedor comercial (reportado).
  - `get_technical_snapshot`: OHLCV y cálculos técnicos deterministas.
  - `get_portfolio_summary`: agregado privado con consentimiento.
- **Nota orador:** Separamos estrictamente el dato reportado (ej. ingresos), el cálculo (ej. SMA 200) y la hipótesis. No hay herramientas para escribir, comprar o borrar.

## 5. Políticas RLS y Permisos
- **Contenido:**
  - **JWT original:** Se usa para consultar Supabase. RLS bloquea el acceso a otras organizaciones o carteras.
  - **Clave de servicio:** Solo para adaptadores de mercado y auditoría. Nunca se usa para leer carteras privadas.
  - **Consentimiento:** El agente verifica que el usuario haya aprobado explícitamente el uso de su cartera en la sesión.
- **Nota orador:** La Edge Function actúa como guardián. Si un usuario intenta consultar un `portfolio_id` ajeno, Supabase RLS lo deniega en la capa de datos antes de llegar al modelo.

## 6. Adaptadores de Servidor (SEC y Mercado)
- **Contenido:**
  - **Aislamiento de secretos:** Las API keys (FMP, CoinGecko) viven solo en el servidor.
  - **Límites (Rate Limiting):** El adaptador respeta las cuotas de la SEC (máx. 10 req/s) y de proveedores.
  - **Caché y normalización:** Las peticiones repetidas leen el snapshot, reduciendo latencia y coste.
- **Nota orador:** La SEC prohíbe el acceso automatizado abusivo. Nuestro adaptador declara un User-Agent autorizado y cachea resultados para cumplir la política de acceso justo.

## 7. Reglas de Respuesta y Auditoría
- **Contenido:**
  - **Esquema JSON:** `answer`, `citations`, `as_of`, `coverage`, `caveats`.
  - **Citas obligatorias:** Toda cifra debe tener fuente y fecha de corte.
  - **Auditoría:** Se registra intención, herramientas, latencia y estado, sin guardar secretos ni payloads masivos.
- **Nota orador:** Si la serie de precios es insuficiente para una SMA 200, el agente no inventa el dato; la estructura JSON obliga a declarar la cobertura y las advertencias.

## 8. Siguientes pasos
- **Contenido:**
  - Desplegar migraciones RLS y tablas de auditoría.
  - Activar Edge Function `agent-query` con herramientas de prueba.
  - Conectar adaptador SEC EDGAR (público).
  - Seleccionar proveedor de mercado (licencia comercial).
- **Nota orador:** Empezaremos con un piloto mixto: datos de cartera autorizada más filings públicos de la SEC, antes de comprometer presupuesto en licencias comerciales de cotizaciones.
