# Readiness de producción — Gestor financiero / Portafolio Intel

**Fecha de revisión:** 27 de agosto de 2026  
**Autor:** Manus AI  
**Alcance:** revisión local de la compilación de producción, código disponible, regresiones, dependencias, comportamiento visual no autenticado y documentación de seguridad. No se ejecutaron cambios en Supabase remoto, GitHub, conectores, fuentes financieras, Google Sheets, IA ni datos reales.

> **Dictamen:** la base local se encuentra **apta para continuar un piloto estrictamente local** de Canvas, Criptomonedas y Salud empresa con datos introducidos o cargados de forma explícita por el usuario. La aplicación **no está lista para un lanzamiento de producción completo** del espacio autenticado ni de las integraciones descritas, porque faltan validaciones remotas de RLS, la corrección arquitectónica de Realtime, pruebas E2E/accesibilidad y varios flujos declarados como preparación, no como integración operativa.

---

## 1. Alcance funcional evaluado

| Componente | Estado local comprobado | Estado para producción completa |
| --- | --- | --- |
| Acceso y pantalla inicial | La compilación `next start` mostró correctamente la pantalla de acceso y el enlace al Canvas local. | Requiere prueba de autenticación, sesión caducada, alta de organización y recuperación en staging con datos ficticios. |
| Canvas privado | Se abrió desde producción local y se ejecutó el ejemplo integrado de seis filas ficticias. Están disponibles filtros, KPIs, gráficos, tabla editada, sesión JSON y exportaciones explícitas. | Apto como modo local condicionado a E2E, accesibilidad y pruebas de archivos límite. No presupone privacidad de modo cloud. |
| Exportaciones CSV | Canvas, Criptomonedas y Salud empresa utilizan la utilidad común contra fórmulas en CSV destinado a apertura humana. | Aprobado por regresiones locales; mantener pruebas en CI y no emplear este formato como contrato de reimportación. |
| Criptomonedas/FIFO | Las fechas de calendario imposibles se bloquean antes de crear lotes y los cálculos son locales/revisables. | Apto como borrador orientativo; no es presentación fiscal ni formato oficial de AEAT. |
| Salud empresa | Cálculo manual, exportación PDF/CSV y aviso de oportunidad explicable disponibles. | Requiere datos procedentes y conciliados para afirmaciones de cobertura; no ofrece recomendación personalizada. |
| Dashboard autenticado | Código y consultas presentes; límites de selección definidos. | **Bloqueado:** falta comprobar RLS/grants efectivos, flujos de usuario reales, errores de red, Realtime y multiorganización. |
| Fuentes Google Sheets/SQL | Formulario y previsualización ficticia disponibles; la configuración se registra como pendiente. | **No integrado:** no hay OAuth autorizado, lectura de hoja, importación ni conectores de producción. |
| TWR, XIRR y puente neto | Diseño, contratos y fixtures definidos en documentación. | **No implementado:** no presentar como funcional hasta construir ledger, políticas, cálculos y reconciliación. |
| Power BI Embedded | CSV/manifiesto local para interoperabilidad. | **No integrado:** requiere backend, token efímero, RLS/OLS y revisión de despliegue. |
| Agente IA y datos de mercado | Diseño de mínimo privilegio y vistas previas. | **No integrado:** no hay secretos, conectores, herramientas activas ni proveedor de datos aprobado. |

---

## 2. Controles aprobados en esta revisión

### 2.1. Compilación y regresiones

La siguiente batería se ejecutó localmente tras el endurecimiento de DCF y cabeceras. Todas las comprobaciones terminaron correctamente.

| Control | Resultado | Interpretación precisa |
| --- | --- | --- |
| `npm run build` | Correcto con Next.js 16.3.1. | El proyecto compila, pasa TypeScript y genera las rutas estáticas `/` y `/_not-found`. |
| `npm run lint` | Correcto. | No se detectaron infracciones por la configuración ESLint actual. |
| `npm audit --omit=dev --audit-level=high` | `0 vulnerabilities`. | No se detectaron vulnerabilidades de nivel alto en dependencias de producción en la fecha de revisión; no equivale a auditoría integral. |
| `verify-csv-and-fifo-hardening.mts` | Correcto. | Neutraliza prefijos de fórmula y bloquea fechas imposibles sin crear tenencias. |
| `verify-crypto-tax.mts` | Correcto. | Mantiene FIFO, permutas atómicas, inventario y coste encadenado. |
| `verify-audit-regressions.mts` | Correcto. | Confirma inventario FIFO atómico, filtro de fecha europeo y bloqueo DCF de crecimiento terminal/deuda neta no finitos. |
| `verify-local-cell-validation.mts` | Correcto. | Comprueba la validación tipada de fechas, importes y textos del Canvas. |
| `verify-company-fundamentals.mts` y `verify-company-fundamentals-export.mts` | Correctos. | Confirman ratios y cobertura de la defensa CSV común de Salud empresa. |

Las pruebas directas TypeScript mantienen los avisos conocidos de Node sobre *type stripping* experimental y paquete sin `type: module`. No fallan la compilación ni las regresiones, pero se deben sustituir por un runner de pruebas establecido o armonizar su configuración antes de considerar el pipeline de CI terminado.

### 2.2. Controles estáticos y visuales

No se localizaron en `src/` usos de `eval`, `new Function`, `dangerouslySetInnerHTML` ni asignaciones `innerHTML`. Tampoco se encontró persistencia en `localStorage`, `sessionStorage` o `indexedDB`; la única coincidencia es el texto del aviso de privacidad del Canvas. Estas comprobaciones reducen superficie, pero no reemplazan una revisión de dependencias, CSP, pruebas de navegador o pentest.

El servidor de producción local devolvió correctamente `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` que deshabilita cámara/geolocalización/micrófono/pagos/USB y una **Content-Security-Policy en modo Report-Only**. La política permite el propio origen, el origen HTTPS/WSS de Supabase configurado, workers y blobs necesarios para el modo local. Se mantiene en observación para no interrumpir todavía rutas que deban probarse con proveedores autorizados.

| Control añadido | Estado actual | Paso obligatorio antes de enforcing |
| --- | --- | --- |
| CSP | `Content-Security-Policy-Report-Only` activa. | Ejecutar recorridos autenticados y locales en staging, recoger violaciones en un endpoint sin datos sensibles y cerrar fuentes no necesarias. |
| Cabeceras anti-sniff/frame/referrer/permisos | Emitidas por la aplicación local. | Verificar que CDN/proxy no las sobrescribe y habilitar HSTS solo cuando el dominio final use HTTPS de forma exclusiva. |
| Dependencias | `npm audit` sin alto impacto; `npm ls` mostró artefactos `extraneous` locales de paquetes wasm/opcionales. | Construir desde un lockfile limpio en CI con `npm ci`; no subir `node_modules` ni `.next`. |
| Vista de producción | Acceso y Canvas ficticio renderizan en `next start`. | Añadir E2E de sesión, errores, teclado, móvil y accesos entre organizaciones. |

---

## 3. Correcciones nuevas incluidas durante la revisión

### 3.1. DCF: entradas numéricas no finitas

`calculateDcf` rechazaba flujos y WACC no finitos, pero no validaba explícitamente `terminalGrowthRate`; con `NaN` podía continuar hasta devolver componentes nulos sin una advertencia de entrada clara. Se añadió validación para crecimiento terminal finito y superior a −100 %, y para `netDebt` finita cuando se informa. El motor ahora devuelve todos los importes DCF como `null` y el diagnóstico correspondiente si se incumple alguna condición.

La regresión `verify-audit-regressions.mts` incluye dos fixtures: crecimiento terminal `NaN` y deuda neta infinita. Ambos deben bloquear el resultado empresarial antes de usar la valoración. Esta corrección reduce precisión falsa; no valida supuestos económicos ni transforma el DCF en una recomendación.

### 3.2. Cabeceras de aplicación

Se añadió `next.config.ts` con cabeceras defensivas y CSP en modo de observación. La configuración toma solo `NEXT_PUBLIC_SUPABASE_URL` para construir los orígenes de conexión HTTPS/WSS; no lee ni expone secretos. Los valores secretos siguen fuera del frontend. La CSP se publica primero como *report-only* porque pasarla a enforcement sin ejercicios completos de rutas autenticadas puede cortar una función legítima; el criterio de cierre es verificar su comportamiento en staging y entonces hacerla obligatoria.[1]

---

## 4. Bloqueos de salida a producción completa

### 4.1. Prioridad P0 — aislamiento y consistencia remota

| Bloqueo | Por qué impide el lanzamiento autenticado | Criterio de cierre verificable |
| --- | --- | --- |
| RLS/grants/vistas/funciones remotos | La definición local no demuestra que el proyecto vivo tenga RLS, grants mínimos, policies por operación, vistas seguras y funciones sin bypass. | Inventario remoto de solo lectura; pgTAP con dos organizaciones/roles; Security Advisor; evidencia posterior a migración; `anon` sin acceso y cliente sin DML sobre derivados. [2] |
| Realtime | Seis tablas suscritas ejecutan una recarga integral de siete datasets en cada evento; se pueden producir ráfagas y respuestas obsoletas. | Cargas por dominio, coalescencia, filtros por organización/cartera, versión de petición, reconexión canónica y pruebas RT-001–RT-010. [3] |
| Autenticación real | No se ejecutó un recorrido de magic link, expiración, logout, alta de organización ni recuperación ante fallo. | E2E de staging con identidades ficticias y logs sin PII/secreto. |

### 4.2. Prioridad P1 — trazabilidad y calidad operativa

| Bloqueo | Situación | Acción para cerrar |
| --- | --- | --- |
| E2E, teclado y accesibilidad | No existe configuración Playwright/Cypress ni suites de navegador detectables. | Definir runner, recorridos críticos, viewport móvil, foco visible, navegación por teclado, contrastes y mensajes de error accesibles. |
| Fuentes con secretos | Solo se configura previsualización; no existe conexión OAuth/SQL aprobada. | Backend/Edge Function con vault, roles mínimos, rotación, auditoría, previsualización y escritura confirmada/reversible. |
| Importaciones grandes | CSV/JSON se leen por completo antes de aplicar límite de filas; Cripto sigue en hilo principal. | Rechazar por tamaño antes de leer, parsear por streaming/worker, cancelar, medir memoria y añadir fixtures límite. |
| Trazabilidad de KPIs | No todos los KPI persistentes portan fuente, `as_of`, cobertura, divisa, conciliación y versión de cálculo. | Aplicar contrato de calidad/procedencia y bloquear etiquetas de precisión cuando falte evidencia. |
| Informes productivos | Informe de cartera disponible; Tax Tracker/calendario de dividendos siguen condicionados a datos conciliados. | Completar datos, reconciliación, plantilla, accesibilidad de PDF y pruebas de contenido. |
| CSP obligatoria | Está en report-only, no en enforcement. | Staging con reportes revisados y sustitución de permisos/fuentes temporales por una lista estricta. |

### 4.3. Prioridad P2/P3 — funcionalidades aún de diseño o entrega

| Bloque | Estado verdadero | Condición para anunciarlo como disponible |
| --- | --- | --- |
| TWR, XIRR y puente neto | Especificación y contratos preparados. | Ledger normalizado, cálculos deterministas, fixtures, FX/procedencia, conciliación y protección RLS. |
| Datos de mercado y sparklines vivos | No existe proveedor licenciado ni sincronizador de servidor activo. | Contrato/licencia, cache, límites, secretos en servidor y tratamiento de caídas. |
| Asistente IA | Diseño y preview, sin modelos ni tools activas. | Herramientas R/O, RLS efectiva, consentimiento, auditoría, fuentes con cita y evaluación adversarial. |
| Power BI Embedded | Solo exportación local. | Backend seguro, token corto, modelo semántico RLS/OLS y revisión de licencia. |
| Fiscalidad oficial | Borradores locales revisables. | Formato vigente, datos completos, revisión profesional y controles legales aplicables. |
| Entrega GitHub | La copia no conserva `.git`; autenticación de GitHub inválida y no se hizo push. | Reautorización del propietario, revisión de secretos, inicialización/remote y publicación explícita. |

---

## 5. Plan de salida recomendado

La secuencia reduce riesgo al evitar que una función parcialmente conectada llegue antes que su aislamiento y trazabilidad.

| Fase | Trabajo | Salida medible | Decisión de avance |
| --- | --- | --- | --- |
| 1. Baseline seguro | Establecer CI con build/lint/regresiones, lockfile limpio y escaneo de secretos. | Artefacto reproducible y evidencia por commit. | No continuar si fallan tests o hay secretos. |
| 2. Staging de identidad | Validar Auth, organizaciones, grants, policies, vistas, funciones y Edge Functions con datos ficticios. | Matriz allow/deny y pgTAP aprobados. | P0 RLS cerrado antes de ingesta real. |
| 3. Realtime controlado | Refactor por dominios detrás de feature flag y pruebas de ráfagas/reconexión. | Métricas de eventos/cargas, p95 y versión sin carreras. | P0 Realtime cerrado antes de activar cotizaciones/sincronización. |
| 4. Calidad e importación | Procedencia, conciliación, límites streaming/Worker, previsualización y reversión. | KPI con sello de calidad y run auditado. | Solo entonces conectar un proveedor autorizado. |
| 5. Experiencia de lanzamiento | E2E, a11y, CSP enforcement, cabeceras de CDN, observabilidad y runbook. | Prueba de smoke y criterios de rollback. | Piloto limitado con personas autorizadas. |
| 6. Funciones avanzadas | TWR/XIRR/bridge, informes completos, mercado, Power BI e IA por prioridades aprobadas. | Versionado, auditabilidad y métricas de uso/errores. | Disponibilidad gradual, no promesas de cobertura total. |

El modo Canvas puede seguir usándose sin cuenta mientras se completa el trabajo remoto. El acceso autenticado no debe usarse para conectar fuentes reales o presentar resultados de rentabilidad avanzada hasta superar las fases 1–5 que le aplican.

---

## 6. Estado del vídeo de 40 segundos

| Segmento | Archivo | Estado técnico | Estado de producto |
| --- | --- | --- | --- |
| 01 — Datos dispersos | `01_datos_dispersos.mp4` | 720 × 1280, 10,005 s, 24 fps. | Disponible. |
| 02 — Panel unificado | `02_panel_unificado_40s.mp4` | 720 × 1280, 10,005 s, 24 fps. | Disponible. |
| 03 — Fuentes y previsualización | `03_fuentes_preview_40s.mp4` | 720 × 1280, 10,005 s, 24 fps. | Generado desde `02_end_reference.png`; mantiene abstracción y no usa datos reales. |
| 04 — Alertas y cierre | Pendiente. | El fotograma `03_end_reference.png` está preparado. | La generación se detuvo por el límite diario del plan gratuito. No se ha intentado eludir la cuota ni sustituido la escena por un activo que se presente como generación equivalente. |
| Montaje final | Pendiente. | No se debe exportar como 40 segundos hasta disponer del cuarto clip y los recursos de audio/subtítulos aprobados. | Pendiente. |

La continuación permitida consiste en usar `03_end_reference.png` como referencia cuando la capacidad de vídeo esté disponible y generar el prompt de cierre ya aprobado. La alternativa honesta antes de ello es entregar el corte de tres clips como **material de trabajo de 30 segundos**, no como vídeo final de 40 segundos; requiere aprobación explícita si se desea un montaje parcial.

---

## 7. Conclusión y gate de lanzamiento

El proyecto supera actualmente un baseline local sólido: compilación, lint, dependencias de producción auditadas, regresiones deterministas, visual del modo local, defensa CSV, FIFO validado, DCF endurecido y cabeceras defensivas en observación. Estas evidencias justifican continuar el desarrollo con confianza, pero **no** reemplazan el gate de despliegue autenticado.

Para dar por terminada la aplicación en su alcance actual, se debe declarar explícitamente un perfil de lanzamiento. El perfil **“local-first”** puede completarse tras E2E/a11y, parser seguro y CSP enforcement. El perfil **“cartera conectada multiusuario”** requiere además RLS remota, Realtime por dominios, procedencia/conciliación, administración de secretos y pruebas de operación. Las capacidades de mercado, IA, TWR/XIRR, Power BI Embedded y presentación fiscal deben quedar fuera de la primera declaración de “terminado” salvo que se complete su checklist específico.

[1]: https://nextjs.org/docs/app/api-reference/config/next-config-js/headers "Next.js — headers"

[2]: https://supabase.com/docs/guides/database/postgres/row-level-security "Supabase — Row Level Security"

[3]: https://supabase.com/docs/guides/realtime/postgres-changes "Supabase — Postgres Changes"

[4]: ./ESTRATEGIA_MITIGACION_RLS_REALTIME_2026-08-27.md "Estrategia local de mitigación RLS y Realtime"

[5]: ./HOJA_DE_RUTA_CIERRE_SEGURIDAD_Y_PRODUCTO.md "Hoja de ruta local de cierre de seguridad y producto"
