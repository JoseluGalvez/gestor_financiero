# Investigación de fuentes de datos de mercado y persistencia

**Autor:** Manus AI  
**Fecha:** 22 de agosto de 2026  
**Decisión a validar:** fuentes de mercado y base de datos para la evolución reactiva de Portafolio Intel.

> **Conclusión ejecutiva.** No existe una fuente que sea, al mismo tiempo, **gratuita, sin cuotas, de cotización en tiempo real, con cobertura global y licenciada para mostrar datos a clientes**. Las bolsas regulan y licencian los datos de mercado en tiempo real. La propuesta segura es iniciar con una base de datos gestionada gratuita y fuentes oficiales de fundamentales/FX, y reservar las cotizaciones en vivo mostradas a clientes para un proveedor con licencia comercial cuando se active ese caso de uso.

## 1. Criterios de selección

La selección se ha evaluado contra la cobertura real de la cartera actual —fondos, ETF, acciones, P2P, cripto y divisas—, la estabilidad operativa, los límites gratuitos, el derecho de uso y la capacidad de alimentarla desde un servicio backend. No se ha considerado válida una API no oficial o extraída mediante scraping, porque no ofrece garantía de continuidad, calidad ni licencia de redistribución.

| Criterio | Umbral requerido | Por qué importa |
|---|---|---|
| Licencia | Uso permitido para el destino final del dato | Mostrar datos a clientes es diferente de hacer pruebas personales. |
| Frescura | Marca de tiempo y estado de mercado por observación | Evita etiquetar como «en vivo» un dato retrasado o de cierre. |
| Cobertura | Identificador estable por ISIN/ticker y mercado de negociación | Reduce asignaciones erróneas entre fondos, ETF y listados duales. |
| Resiliencia | Límite, reintentos, caché y proveedor de reserva | La UI no debe bloquearse ni duplicar alertas por un fallo de proveedor. |
| Coste | Sin tarjeta para el MVP, con ruta clara de escalado | El servicio puede empezar sin pago, pero no se ocultan límites técnicos o legales. |

## 2. Hallazgo principal: la restricción «sin cuota» no es compatible con el dato en vivo para clientes

Alpha Vantage indica expresamente que su servicio gratuito se limita a 25 peticiones diarias y que los datos estadounidenses en tiempo real o con retraso de 15 minutos son servicios premium, por requisitos regulatorios y de licencia.[1] Finnhub ofrece un plan gratuito de 60 peticiones por minuto y WebSocket para 50 símbolos, pero lo etiqueta como **uso personal**; por tanto no debe utilizarse como fuente para un producto que distribuya datos a clientes.[2]

Twelve Data ofrece un nivel gratuito de 800 peticiones diarias, ocho créditos de WebSocket de prueba y solo uso interno sin visualización; esto impide tratarlo como un feed gratuito para el dashboard de clientes.[3] CoinGecko permite un plan Demo sin tarjeta, pero limita a 10.000 créditos mensuales, 100 llamadas por minuto, una frescura desde 60 segundos y atribución; sus WebSockets comerciales pertenecen a planes de pago.[4]

> La palabra «en tiempo real» debe ser un dato del modelo, no una etiqueta de interfaz: cada observación almacenará `observed_at`, `provider_at`, `market_status`, `delay_seconds`, `source` y `license_scope`.

## 3. Comparativa de proveedores

| Fuente | Datos relevantes | Gratuito actualmente | Límite o restricción decisiva | Veredicto |
|---|---|---|---|---|
| **Supabase** | PostgreSQL, Auth, Storage, cambios de Postgres en tiempo real | Sí, sin tarjeta para MVP | 500 MB de BD, 5 GB de salida, 2 M de mensajes de tiempo real/mes; pausa tras una semana inactiva. | **Base de datos recomendada para el MVP.** |
| **Finnhub Free** | Cotizaciones US, fundamentales US, FX/cripto y WebSocket | Sí | 60 peticiones/minuto, 50 símbolos WebSocket, licencia de uso personal. | Solo laboratorio interno; **no** para mostrar cotizaciones a clientes. |
| **Twelve Data Basic** | Acciones US, ETF US, FX, cripto y referencias | Sí | 800 llamadas/día, 8 créditos WebSocket de prueba; «internal non-display». | Útil para prototipo interno y pruebas de adaptador, no para producción con clientes. |
| **Alpha Vantage Free** | Series históricas y algunos fundamentales | Sí | 25 peticiones/día; tiempo real y datos US retrasados son premium. | Fuente auxiliar de baja frecuencia, no un feed reactivo. |
| **CoinGecko Demo** | Cripto y metadatos de mercado | Sí | 10.000 créditos/mes, 100 llamadas/min, frescura desde 60 s, atribución. | Útil solo para una vista cripto de demostración claramente etiquetada. |
| **SEC EDGAR** | Presentaciones y XBRL de emisores estadounidenses | Sí, sin clave | No contiene cotizaciones; el navegador no debe consultarlo directamente por CORS. | **Fuente primaria para fundamentales y DCF de valores US.** |
| **ECB Data Portal** | Series estadísticas y tipos de cambio de referencia | Acceso programático documentado | No sustituye una cotización intradía negociable. | **Fuente primaria para FX de referencia y reporting.** |

Supabase incluye en su plan gratuito 500 MB de base de datos, 5 GB de transferencia, 50.000 usuarios activos mensuales y 2 millones de mensajes de Realtime; ofrece peticiones API ilimitadas, aunque el proyecto se pausa tras una semana de inactividad.[5] Es la mejor opción para persistir las transacciones del MVP, controlar acceso por filas y propagar los cambios de datos ya validados hacia Recharts.

## 4. Arquitectura recomendada por tipo de dato

| Dominio | Fuente inicial | Frecuencia | Uso en producto | Regla de interfaz |
|---|---|---|---|---|
| Movimientos, posiciones, préstamos P2P y dividendos | Google Sheets / CSV / SQL del usuario | Al cambiar o según sincronización | Fuente de verdad de cartera y fiscalidad. | Mostrar origen, última conciliación y lote. |
| Cotización de valores de clientes | Proveedor con licencia comercial seleccionado al activar el servicio | WebSocket o intervalos del proveedor | Valoración de cartera y sparklines. | Mostrar proveedor, hora y retraso; no usar feed personal para clientes. |
| Fundamentales US | SEC EDGAR | Tras publicación/conciliación diaria | Módulo de análisis financiero, ratios y DCF. | Distinguir «dato reportado» de «estimación». |
| Divisas de referencia | ECB Data Portal | Diario | Informes y normalización de moneda. | Etiquetar como tipo de referencia, no de ejecución. |
| Cripto de demostración | CoinGecko Demo, detrás del servidor | Mínimo 60 s y respetando cuota | Vista opcional no crítica del MVP. | Incluir atribución y fecha/hora; no prometer streaming. |

La SEC publica sus datos EDGAR y XBRL sin autenticación ni clave; las estructuras de envíos se actualizan en tiempo real al difundirse los documentos. Son adecuados para fundamentar los datos contables US del módulo de análisis, pero no para cotizaciones.[6] El portal de datos del BCE expone un servicio SDMX REST para recuperar series y metadatos, apropiado para tipos de cambio de referencia.[7]

## 5. Decisión técnica recomendada

### Fase de lanzamiento sin pago

Se debe activar **Supabase Free** como fuente de verdad de datos del usuario, con autenticación, RLS, almacenamiento privado y Realtime para cambios internos de posiciones, sincronizaciones y alertas. Los dashboards de Recharts se suscribirán a cambios de las tablas agregadas (`portfolio_snapshots`, `positions`, `alerts`) y no a datos estáticos del componente.

Para precios, el sistema incorporará un contrato `MarketDataProvider` con adaptadores deshabilitados por defecto. El adaptador de Finnhub/Twelve Data puede usarse únicamente en un entorno de pruebas privado, con una etiqueta que indique que no puede ser redistribuido bajo el plan gratuito. El adaptador SEC/ECB sí podrá alimentar datos primarios de fundamentales y FX para el módulo analítico y de reporting.

### Fase de datos de mercado para clientes

Antes de mostrar cotizaciones en vivo a terceros, se debe contratar y registrar un proveedor con el permiso comercial que cubra los mercados concretos, especialmente ETF/fondos europeos. La decisión se basará en el inventario real de ISIN, bolsas y número máximo de espectadores, no en una API genérica. La tabla `market_data_entitlements` impedirá activar un ticker si la licencia configurada no permite su visualización.

| Elemento | MVP sin coste | Escalado con datos para clientes |
|---|---|---|
| Persistencia y seguridad | Supabase Free con RLS, límites y auditoría de negocio. | Plan con backups, retención y controles organizativos. |
| Tiempo real | Cambios de cartera y estados de alerta desde Postgres Realtime. | Igual; las cotizaciones llegan al backend desde proveedor licenciado. |
| Cotizaciones | No se presentan como tiempo real a clientes. Modo interno o datos de cierre/valor aportado por la fuente. | WebSocket comercial, caché y fan-out a Realtime. |
| Fundamentales / DCF | SEC EDGAR para valores US; indicadores calculados y fecha de fuente. | Añadir cobertura internacional licenciada cuando sea necesario. |
| Cripto | Demo con atribución y límites. | Feed con licencia comercial y SLA si se vuelve crítico. |

## 6. Pasos de implementación aprobables

1. Crear el proyecto Supabase y habilitar Auth, Postgres, Storage privado, RLS y Realtime para las tablas de lectura de dashboard.
2. Modelar `data_sources`, `sync_runs`, `transactions`, `positions`, `portfolio_snapshots`, `market_quotes`, `alerts`, `report_runs` y `audit_events`.
3. Implementar el conector de Google Sheets en servidor con OAuth de solo lectura y archivo de auditoría por lote; mantener los secretos fuera de la aplicación cliente.
4. Construir un adaptador de datos de mercado con validación de licencia, límite de peticiones, caché, timestamp de fuente e idempotencia. No incrustar claves de Finnhub, Twelve Data ni CoinGecko en el navegador.
5. Reemplazar los arrays estáticos por consultas a Supabase y suscripciones Realtime de snapshots y alertas; Recharts recibe únicamente series ya normalizadas.
6. Añadir alertas deterministas basadas en datos conciliados; cada alerta tendrá umbral, severidad, fuente, deduplicación y estado de entrega.
7. Habilitar los informes PDF y borradores tributarios solo cuando el conjunto de transacciones esté cerrado, conciliado y versionado.
8. Contratar un feed comercial solo tras conocer el inventario de mercados y el número de usuarios externos que recibirán las cotizaciones.

## Referencias

[1] [Alpha Vantage — Support and usage limits](https://www.alphavantage.co/support/)  
[2] [Finnhub — Pricing and licensing](https://finnhub.io/pricing)  
[3] [Twelve Data — Individual pricing and Basic limits](https://twelvedata.com/pricing)  
[4] [CoinGecko — API plans and pricing](https://www.coingecko.com/en/api/pricing)  
[5] [Supabase — Pricing and Realtime limits](https://supabase.com/pricing)  
[6] [U.S. SEC — EDGAR application programming interfaces](https://www.sec.gov/search-filings/edgar-application-programming-interfaces)  
[7] [European Central Bank — Data Portal API overview](https://data.ecb.europa.eu/help/api/overview)
