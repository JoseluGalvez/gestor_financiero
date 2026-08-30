# Portafolio Intel

Portafolio Intel consolida fuentes de datos financieros de una organización en una **base de datos gestionada y protegida**, para visualizar cartera, tendencias, alertas e informes sin depender de arrays de demostración en el navegador.

> **Aviso importante:** la aplicación muestra información y cálculos de apoyo. No es un asesor financiero o tributario, no ejecuta operaciones y los documentos fiscales son borradores para revisión profesional; no se presentan ante la AEAT.

## Estado de la entrega

Esta versión introduce una base Supabase activa con seguridad por organización, panel React/Next conectado a datos persistentes, suscripciones Realtime, informes PDF de cartera y un motor cuantitativo explicable. El proyecto empieza vacío de forma intencional: no genera ni inserta datos financieros ficticios. Las métricas se activan cuando se conecte y concilie una fuente real.

| Área | Capacidades implementadas |
|---|---|
| Identidad y aislamiento | Acceso por enlace seguro, organización inicial autenticada y RLS en todas las tablas financieras. |
| Datos persistentes | PostgreSQL con carteras, instrumentos, transacciones, posiciones, fuentes, ejecuciones de sincronización, cotizaciones, snapshots, alertas, informes y auditoría. |
| Dashboard persistente | KPIs y gráficas Recharts sobre `portfolio_snapshots` reales. El frontend se suscribe a cambios mediante Supabase Realtime. |
| Canvas local privado | Apertura de CSV/XLSX sin cuenta, en memoria del navegador; KPIs, filtros, gráficos, mapa relativo, tabla, conclusiones deterministas y exportación CSV/manifiesto para Power BI. |
| Navegación | Barra lateral persistente para Resumen, Cartera, Plataformas, Criptomonedas, Alertas, Informes, Fuentes, Análisis y Canvas local; se adapta a una cuadrícula navegable en móvil. |
| Plataformas | Comparación por fuente del resultado realizado con compras/ventas identificables en la divisa base y método FIFO. Las filas incompletas se excluyen o se señalan para revisión. |
| Criptomonedas | Importación local de CSV, detalle FIFO de ventas y permutas, avisos de datos incompletos, inventario de lotes y descarga de borrador CSV revisable. |
| Cartera | Tabla de posiciones persistidas, identificadores de instrumento y marca temporal de actualización. |
| Fuentes | Registro de Google Sheets, CSV, XLSX o SQL como fuente pendiente; los secretos no entran en el navegador. |
| Alertas | Reglas de umbral editables para mora P2P, dividendos, rebalanceo, FX y calidad de fuentes; las notificaciones se guardan y deduplican en el backend cuando exista un sincronizador. |
| Informes | PDF de resumen de cartera, generado desde la última instantánea disponible. Los calendarios y borradores fiscales se bloquean hasta que los datos sean conciliados. |
| Análisis | Score ponderado, DCF, SMA, MACD, RSI, Bandas de Bollinger, ATR, volatilidad, drawdown, Sharpe y Kelly conservador, con cobertura, fuentes y advertencias. |

## Canvas local privado

El acceso **«Abrir Canvas local sin cuenta»** permite explorar un archivo CSV o XLSX temporalmente, sin persistirlo en la base de datos. El lector y los agregados se ejecutan en el navegador, mediante un `Web Worker` cuando está disponible. No usa `localStorage`, no invoca Supabase, no llama a servicios de IA ni envía filas a un conector de Power BI. La sesión se pierde al recargar, cerrar la pestaña o pulsar **«Eliminar de memoria»**.

| Elemento | Comportamiento |
|---|---|
| Esquema | Detecta y permite corregir las columnas de fecha, valor, categoría, plataforma, geografía y estado. |
| Interacción | Los selectores y los clics en el donut, las barras y las burbujas geográficas aplican filtros cruzados locales. |
| Interpretación | Las conclusiones se generan con reglas auditables sobre las filas filtradas; no constituyen asesoramiento de inversión. |
| Power BI | Descarga un CSV filtrado y un manifiesto local. Un embed real requiere backend, token efímero y RLS/OLS; no se implementa `Publish to web`. |

> El Canvas no importa ni sincroniza datos reales. Para persistirlos en Supabase debe usarse el flujo autenticado de fuentes, con autorización explícita, previsualización y conciliación.

## Criptomonedas y borrador fiscal revisable

El módulo **Criptomonedas** está disponible en la navegación autenticada y procesa el CSV elegido únicamente en la memoria del navegador. Acepta operaciones de **Compra**, **Venta** y **Permuta**. Para cada transmisión intenta reconstruir el coste de adquisición con FIFO por activo, calcula la diferencia entre transmisión y adquisición y muestra las operaciones que requieren revisión porque faltan lotes, valores EUR, cantidades o fechas.

| Resultado | Alcance |
|---|---|
| Borrador CSV | Incluye el detalle de transmisiones, coste FIFO, valor de transmisión, comisiones, resultado y advertencias. |
| Cálculo de permutas | Registra la baja del activo entregado y crea el lote del activo recibido al valor de transmisión usado por el cálculo. |
| Modelo 721 | Solo muestra una advertencia de revisión. Ventas y permutas no bastan para decidir la obligación ni para completar una declaración informativa. |
| Límites | No determina la cuota final de IRPF ni cubre staking, airdrops, minería, NFT, derivados, actividad económica, insolvencias o compensaciones con otras rentas. |

> **Revisión fiscal obligatoria:** el archivo descargable es un borrador de trabajo y no se presenta ante la AEAT. Revisa las fuentes y el resultado con un profesional tributario antes de incorporarlo a Renta. El detalle normativo y las referencias oficiales se encuentran en [`docs/ALCANCE_FISCAL_CRIPTOMONEDAS.md`](docs/ALCANCE_FISCAL_CRIPTOMONEDAS.md).

## Ejecución local

Instala las dependencias y define la configuración pública de Supabase. No añadas claves de proveedor de cotizaciones, credenciales SQL ni claves de servicio al cliente.

```bash
npm ci
cp .env.example .env.local
npm run dev
```

La configuración local mínima utiliza valores publicables, protegidos por RLS:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://<proyecto>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_<clave-publicable>
```

Comprueba calidad y compilación con:

```bash
npm run lint
npm run build
npm audit --omit=dev --audit-level=high
```

## Base de datos y seguridad

Las migraciones ejecutadas se conservan como archivos de entrada para Supabase en [`supabase/`](supabase/). Crean las tablas de negocio, restringen su lectura por pertenencia de organización, restringen la escritura a propietarios/editores y publican únicamente las tablas reactivas necesarias. El asesor de seguridad de Supabase no presenta avisos después de aplicar las migraciones.

El aprovisionamiento de una organización se realiza mediante la función autenticada [`bootstrap-organization`](supabase/functions/bootstrap-organization/index.ts). La función verifica la sesión, crea una organización, asigna el rol `owner`, crea una cartera inicial y registra un evento de auditoría. No expone ninguna clave de servicio al navegador.

| Información | Dónde vive | Regla |
|---|---|---|
| URL y clave publicable | `.env.local`, ignorado por Git | Se puede usar solo con RLS y una sesión autenticada. |
| Clave de servicio, OAuth y SQL | Secretos de servidor / función | Nunca se suben ni se incluyen en `NEXT_PUBLIC_*`. |
| Datos de cartera | Supabase PostgreSQL | Política de acceso por organización y auditoría de operaciones. |
| Archivos e informes | Storage privado planificado | Enlaces firmados de corta duración. |

## Datos de mercado: decisión de MVP

No existe una fuente que sea simultáneamente gratuita, sin cuotas, global, en tiempo real y licenciada para visualizar datos a clientes. Por ello, esta versión no etiqueta ningún feed gratuito como «en vivo» para clientes. Las actualizaciones **Realtime** corresponden a los datos persistidos en la cartera, alertas, snapshots y análisis.

Para un MVP sin pago, el proyecto usa Supabase como fuente de verdad y puede integrar SEC EDGAR para fundamentales US, el BCE para FX de referencia y CoinGecko Demo como cripto no crítica con atribución y límites. Antes de mostrar cotizaciones a terceros debe contratarse y configurarse un feed con licencia comercial para los mercados concretos de la cartera.

## Google Sheets y SQL

El formulario de fuentes registra la intención de conexión. Para completar la sincronización real se necesita identificar una hoja o un endpoint SQL y configurar el servicio del lado servidor:

1. Google Sheets: cliente OAuth de mínimo privilegio, consentimiento del usuario, tokens cifrados y auditoría de cada ejecución.
2. SQL: cuenta de solo lectura, TLS, red restringida, vista/consulta permitida y rotación de credenciales.
3. Ambos: mapeo validado a transacciones, deduplicación por `external_id`, lote (`sync_runs`), conciliación y snapshots derivados.

La hoja o base no se explora automáticamente para evitar leer datos que el usuario no haya seleccionado expresamente.

## Alertas e informes

Las reglas se configuran en el panel, pero las evaluaciones requieren un proceso backend que reciba cambios de la fuente y escriba resultados deduplicados en `alerts`. El centro de notificaciones es el canal inicial; correo o Web Push solo se activarán cuando exista consentimiento, un proveedor de entrega y reglas de retención.

El informe PDF actual es un **Portfolio Summary** generado desde una instantánea real. Los informes de calendario de dividendos, Tax Tracker, modelo 720 y modelo 721 quedan obligatoriamente en estado de borrador/revisión hasta que se disponga de transacciones completas, retenciones, conversiones de divisa, datos de fuente y validación profesional.

## Módulo de análisis financiero

El motor implementado se encuentra en [`src/lib/financial-analysis.ts`](src/lib/financial-analysis.ts). Todas las funciones validan sus entradas y devuelven advertencias cuando falta cobertura. El módulo almacena cada ejecución en `analysis_runs`, incluyendo fecha de corte, hipótesis DCF, manifest de fuentes y métricas calculadas.

> El score se bloquea por debajo de 60 % de cobertura. El DCF se bloquea si faltan diez FCF o si `WACC ≤ g`. Kelly se presenta como resultado matemático de un escenario documentado, no como una instrucción de inversión.

## Documentación

| Documento | Contenido |
|---|---|
| [`docs/INVESTIGACION_DATOS_MERCADO.md`](docs/INVESTIGACION_DATOS_MERCADO.md) | Comparativa de fuentes gratuitas, límites de licencia y decisión para el MVP. |
| [`docs/ARQUITECTURA_DATOS_REACTIVOS.md`](docs/ARQUITECTURA_DATOS_REACTIVOS.md) | Arquitectura de datos, Realtime, controles de fuentes y plan de despliegue. |
| [`docs/MODULO_ANALISIS_FINANCIERO.md`](docs/MODULO_ANALISIS_FINANCIERO.md) | Fórmulas, requisitos de cobertura, trazabilidad y límites del módulo analítico. |
| [`docs/CONEXIONES_Y_FISCALIDAD.md`](docs/CONEXIONES_Y_FISCALIDAD.md) | Diseño de Google Sheets/SQL y salvaguardas del borrador fiscal. |
| [`docs/DEMO_IMPORTACION_GOOGLE_SHEETS.md`](docs/DEMO_IMPORTACION_GOOGLE_SHEETS.md) | Hoja ficticia, configuración de prueba, previsualización de solo lectura y estado de Recharts/análisis. |
| [`docs/VALIDACION_VISUAL.md`](docs/VALIDACION_VISUAL.md) | Evidencia de validación visual y de interacción. |
| [`docs/ANALISIS_VIDEOS_CANVAS_PRIVACIDAD.md`](docs/ANALISIS_VIDEOS_CANVAS_PRIVACIDAD.md) | Funciones detectadas en los vídeos, arquitectura local, comparación de privacidad y opciones seguras de Power BI. |
| [`docs/VALIDACION_CANVAS_LOCAL.md`](docs/VALIDACION_CANVAS_LOCAL.md) | Bitácora de pruebas de carga, mapeo, filtros y privacidad del Canvas local. |
| [`docs/ALCANCE_FISCAL_CRIPTOMONEDAS.md`](docs/ALCANCE_FISCAL_CRIPTOMONEDAS.md) | Alcance del cálculo de transmisiones y permutas, límites del borrador y referencias oficiales de la AEAT. |
| [`docs/VALIDACION_CRIPTOMONEDAS_Y_PLATAFORMAS.md`](docs/VALIDACION_CRIPTOMONEDAS_Y_PLATAFORMAS.md) | Verificación del FIFO, permutas, cobertura por fuente, calidad de compilación y privacidad local. |

## Stack

- Next.js 16, React 19 y TypeScript
- Supabase PostgreSQL, Auth, Row Level Security, Realtime y Edge Functions
- Recharts para series y tendencias reactivas
- `@react-pdf/renderer` para PDFs de cartera
- `read-excel-file` para la ruta de importación XLSX existente
- `lucide-react` para iconografía
