# Pruebas, Supabase en producción y revisión de seguridad

**Autor:** Manus AI  
**Fecha de revisión:** 22 de agosto de 2026  
**Ámbito:** repositorio `JoseluGalvez/gestor_financiero`, proyecto Supabase `yuhmwljncejlqjrzkqpl` y flujo previsto Google Sheets → Supabase.

> Este documento describe una validación técnica. No supone que la importación real desde Google Sheets ya esté activa: en la versión revisada existe una configuración pendiente y una previsualización ficticia, pero todavía no un adaptador OAuth de servidor que lea una hoja real y escriba movimientos conciliados.

## Resumen ejecutivo

La base de partida es sólida para el MVP: el cliente usa únicamente una URL y una clave **publicable** de Supabase, la clave con privilegios elevados permanece dentro de la Edge Function, las 16 tablas públicas listadas tienen RLS activa y el asesor de seguridad del proyecto no comunicó hallazgos en la revisión. La auditoría de dependencias de producción tampoco encontró vulnerabilidades altas o críticas.

| Área | Estado verificado | Decisión operativa |
|---|---|---|
| Código cliente | Solo referencia `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. | Mantener ambas variables como publicables; RLS es obligatoria. |
| Secretos de servidor | `SUPABASE_SERVICE_ROLE_KEY` se consume exclusivamente en `bootstrap-organization`. | Configurar y rotar solo en secretos de Edge Functions; nunca en `NEXT_PUBLIC_*`, Git o el navegador. |
| RLS desplegado | Las lecturas dependen de `private.is_organization_member`; las escrituras de editor de `private.is_organization_editor`. | Mantener la segmentación por organización y añadir pruebas pgTAP por operación. |
| Tests existentes | Vitest: 2 pruebas unitarias aprobadas para el mapeo/previsualización. | Ampliar con un adaptador real y pruebas de integración aisladas. |
| Google Sheets | Hoja ficticia y previsualización de prueba disponibles. | No habilitar importación productiva hasta completar OAuth de solo lectura y confirmación de lote. |

## 1. Ejecutar las pruebas actuales

Instala dependencias bloqueadas y ejecuta la batería local. No necesita credenciales ni toca Supabase ni Google Sheets:

```bash
npm ci
npm run test:unit
npm run lint
npm run build
npm audit --omit=dev --audit-level=high
```

`npm run test:unit` ejecuta `tests/unit/sample-google-sheet.test.ts`. Verifica que el mapeo explícito de `Fecha`, `Instrumento`, `Tipo`, `Cantidad`, `Precio` y `Divisa` acepta el esquema de prueba, y que un encabezado inexistente bloquea la previsualización antes de cualquier operación de base de datos.

| Capa | Qué debe probarse | Estado |
|---|---|---|
| Unidad | Normalización de ID/URL, presencia de seis encabezados, validación de fecha/divisa/tipo, deduplicación de `external_id` y conteos aceptados/rechazados. | Mapeo de encabezados implementado; ampliar validadores al crear el importador real. |
| Integración | OAuth de solo lectura, lectura limitada a pestaña/rango autorizados, previsualización, confirmación explícita y escritura de `sync_runs`/`transactions`. | Pendiente: no existe aún adaptador Google Sheets de servidor. |
| RLS | Un propietario/editor lee y escribe solo su organización; un miembro ajeno no lee, no inserta, no actualiza ni elimina. | Requiere pruebas de base de datos repetibles. |
| E2E | Inicio de sesión, alta de fuente, previsualización, confirmación de lote y actualización Realtime del dashboard. | Pendiente hasta implantar la importación real y un entorno de pruebas. |

### Estrategia de integración recomendada

No ejecute pruebas contra la base de producción. Cree un proyecto Supabase independiente o una rama de desarrollo para pruebas y una hoja de Google Sheets dedicada, con datos sintéticos. Las pruebas deben recibir secretos solo desde el almacén de secretos del entorno de CI:

```bash
TEST_SUPABASE_URL=https://<proyecto-pruebas>.supabase.co
TEST_SUPABASE_PUBLISHABLE_KEY=sb_publishable_<pruebas>
TEST_SUPABASE_SECRET_KEY=sb_secret_<solo-ejecutor-ci>
TEST_GOOGLE_SHEET_ID=<hoja-sintetica>
TEST_GOOGLE_SHEET_RANGE=Transacciones!A1:I50
TEST_GOOGLE_OAUTH_REFRESH_TOKEN=<solo-almacen-secreto-ci>
```

El futuro comando `test:integration` debe fallar cerrado si falta cualquiera de esas variables. Debe seguir este orden: crear una organización de prueba; conceder acceso de solo lectura a la hoja sintética; solicitar una previsualización; comprobar que no existe ningún `sync_run` ni `transaction`; confirmar la importación; verificar filas aceptadas/rechazadas, deduplicación y trazabilidad; y, por último, comprobar que el cambio de `portfolio_snapshots` se recibe mediante Realtime. Todos los datos se eliminan al finalizar en el proyecto de pruebas, nunca en producción.

Supabase recomienda probar las políticas en la misma modificación que las crea y ofrece `supabase test db` con pgTAP. Las pruebas deben impersonar al menos dos usuarios autenticados y el rol anónimo, e incluir tanto casos permitidos como denegados.[1]

## 2. Credenciales y secretos de producción

La siguiente separación es obligatoria. Una clave publicable identifica el componente web, pero no autoriza datos por sí sola; la autorización efectiva depende de la sesión de Supabase Auth y de RLS.[2]

| Ubicación | Variables permitidas | Prohibiciones |
|---|---|---|
| Aplicación Next.js pública | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. | Cualquier clave `sb_secret_*`, `service_role`, contraseña SQL, refresh token de Google o clave de cifrado. |
| Edge Function `bootstrap-organization` | Variables predeterminadas de Supabase y secreto de configuración `APP_ORIGIN`. | Registrar valores de entorno o devolverlos en errores. |
| Importador Google futuro | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`, `TOKEN_ENCRYPTION_KEY`; solo como secretos del servidor. | Pasar refresh tokens al cliente o guardarlos en `data_sources.connection_config`. |
| CI | Variables `TEST_*` del proyecto de pruebas y credenciales de Google de prueba. | Secretos de producción, salida de logs con valores o archivos `.env` versionados. |

En el proveedor que aloja Next.js, configure únicamente las dos variables `NEXT_PUBLIC_*` anteriores. En **Supabase Dashboard → Edge Function Secrets**, configure `APP_ORIGIN=https://<dominio-productivo>` y los secretos del importador cuando exista. Las variables de Supabase para URL y claves de función están disponibles en Edge Functions; las claves elevadas deben permanecer solo allí.[3]

La Edge Function actual usa la clave heredada `SUPABASE_SERVICE_ROLE_KEY` exclusivamente en servidor. Como mejora planificada, migre a una `sb_secret_*` de función dedicada y rote la clave heredada una vez confirmada la migración. Las claves secretas omiten RLS y no pueden entregarse al navegador.[2]

Para Google, use un cliente OAuth de tipo **Web application**, limite el permiso a lectura de Sheets y solicite el alcance de forma incremental. El código de autorización se intercambia en servidor; el refresh token se cifra y se guarda en un almacén de secretos o una tabla no expuesta por la API. Google recomienda emplear bibliotecas OAuth mantenidas y guardar los refresh tokens en almacenamiento seguro.[4]

## 3. Políticas RLS de producción

La auditoría en vivo comprobó RLS habilitada en `profiles`, `organizations`, `organization_members`, `portfolios`, `instruments`, `data_sources`, `sync_runs`, `transactions`, `positions`, `market_quotes`, `portfolio_snapshots`, `alert_rules`, `alerts`, `report_runs`, `audit_events` y `analysis_runs`.

| Recurso | Lectura | Escritura actual |
|---|---|---|
| `profiles` | Solo `id = auth.uid()`. | Solo el propio usuario. |
| `organizations` | Miembro de la organización. | Solo el propietario actualiza su organización. |
| `organization_members` | Cada usuario lee únicamente su propia pertenencia. | Gestionado por backend privilegiado. |
| Datos de cartera y fuentes | `private.is_organization_member(organization_id)`. | Editor/propietario mediante `private.is_organization_editor(organization_id)` donde hay escritura cliente. |
| Movimientos, posiciones, cotizaciones, snapshots, alertas, informes y auditoría | Miembro de la organización. | Las rutas de ingestión están reservadas a backend; no hay política cliente de escritura general. |

El proyecto utiliza funciones `security definer` en el esquema privado y revoca su ejecución pública. Esta es la dirección correcta: las funciones con privilegios no deben exponerse por la Data API y deben tener un `search_path` fijo.[1] Como endurecimiento adicional, cambie en una migración futura el `search_path` de estas funciones a vacío (`set search_path = ''`) y mantenga todas las referencias totalmente calificadas.

Para cada nueva tabla pública, aplique el siguiente patrón en una migración, no mediante cambios manuales:

```sql
alter table public.nueva_tabla enable row level security;
revoke all on table public.nueva_tabla from anon, authenticated;
grant select on table public.nueva_tabla to authenticated;
create policy nueva_tabla_member_read
  on public.nueva_tabla for select to authenticated
  using (private.is_organization_member(organization_id));
```

Añada por separado los privilegios y políticas `insert`, `update` y `delete` necesarios. Evite `for all` para tablas nuevas: separar operaciones simplifica la revisión y reduce errores de autorización.[1]

## 4. Revisión de seguridad del código publicado

### Controles que superan la revisión

| Comprobación | Resultado |
|---|---|
| Claves o contraseñas versionadas en `src` | No detectadas. El cliente referencia solo variables `NEXT_PUBLIC_*`. |
| Inyecciones DOM comunes (`dangerouslySetInnerHTML`, `eval`, `new Function`, `innerHTML`) | No detectadas en el código fuente. |
| Dependencias de producción | `npm audit --omit=dev --audit-level=high` devolvió 0 vulnerabilidades. |
| RLS/Security Advisor de Supabase | Sin avisos en la auditoría realizada. |
| Repositorio | `.env.local` y `.next` permanecen ignorados. |

### Hallazgos y acciones prioritarias

| Severidad | Hallazgo | Riesgo | Acción requerida |
|---|---|---|---|
| Media | La Edge Function no dispone de límite de tasa y el alta de organización comprueba y escribe en operaciones separadas. | Abuso de endpoint o solicitudes simultáneas pueden crear más de una organización por cuenta. | Añadir límite por usuario/IP, una restricción de unicidad o transacción/RPC atómica e idempotency key. |
| Media | `next.config.ts` no define cabeceras de seguridad. | Menor defensa ante clickjacking, MIME sniffing o políticas de contenido demasiado abiertas. | Añadir `Content-Security-Policy`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy` y `frame-ancestors 'none'`; probar pagos, OAuth y PDFs antes de endurecer CSP. |
| Baja | `APP_ORIGIN` tiene fallback a `http://localhost:3000`. | Un despliegue sin variable puede fallar por CORS o dejar una configuración no intencionada. | Hacer `APP_ORIGIN` obligatoria en producción y rechazar el arranque si no es HTTPS y no coincide con una lista permitida. |
| Baja | Las políticas de editor usan `FOR ALL`. | La revisión de una futura ampliación puede conceder una operación innecesaria. | Sustituir progresivamente por políticas independientes por operación y grants mínimos. |
| Informativa | No existe aún un importador OAuth ni una prueba E2E real de Google Sheets a Supabase. | No se puede afirmar que la importación de producción funciona de extremo a extremo. | Implementar el adaptador servidor, confirmación de lote, test project y suite `test:integration` antes de activar fuentes reales. |

No se modificaron secretos ni datos productivos durante esta revisión. El resultado positivo del asesor no sustituye pruebas RLS ni una revisión periódica: una política incorrecta puede filtrar filas sin generar un error.[1]

## 5. Lista de salida a producción

| Control | Criterio de aceptación |
|---|---|
| Entorno | Dominio HTTPS configurado, `APP_ORIGIN` exacto, URLs de redirección OAuth permitidas y separadas por entorno. |
| Secretos | Ningún secreto en Git o `NEXT_PUBLIC_*`; rotación documentada; secretos CI y Edge Functions configurados. |
| RLS | Todas las tablas y vistas expuestas tienen RLS, grants mínimos y prueba permitida/denegada. |
| Importación | OAuth read-only, rango delimitado, preview sin escritura, confirmación explícita, deduplicación y `sync_runs`. |
| Observabilidad | Errores sin tokens ni valores de filas sensibles; auditoría de actor, fuente, checksum y resultado del lote. |
| Calidad | `npm run test:unit`, `npm run lint`, `npm run build`, `npm audit --omit=dev --audit-level=high` y pruebas pgTAP aprobadas. |

## Referencias

[1]: https://supabase.com/docs/guides/database/postgres/row-level-security "Supabase — Row Level Security"
[2]: https://supabase.com/docs/guides/api/api-keys "Supabase — Understanding API keys"
[3]: https://supabase.com/docs/guides/functions/secrets "Supabase — Environment Variables"
[4]: https://developers.google.com/identity/protocols/oauth2 "Google Identity — Using OAuth 2.0 to Access Google APIs"
