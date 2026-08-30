-- PROPUESTA NO APLICADA — revisar y probar en una rama de Supabase antes de producción.
-- Fecha: 2026-08-26
-- Objetivo: el agente solo recibe agregados de una cartera por un consentimiento activo;
-- no se concede SQL libre al modelo ni una vía de escritura sobre datos financieros.

begin;

-- 1) Consentimiento explícito, revocable y con caducidad.
create table if not exists public.agent_consent_grants (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  portfolio_id uuid not null references public.portfolios(id) on delete cascade,
  grantee_user_id uuid not null references auth.users(id) on delete cascade,
  scope text not null check (scope in ('portfolio_summary', 'transaction_aggregate')),
  granted_at timestamptz not null default now(),
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  check (expires_at > granted_at),
  unique (organization_id, portfolio_id, grantee_user_id, scope)
);

create index if not exists agent_consent_active_lookup_idx
  on public.agent_consent_grants (grantee_user_id, portfolio_id, scope, expires_at)
  where revoked_at is null;

alter table public.agent_consent_grants enable row level security;

-- El usuario gestiona solamente sus propios consentimientos.
create policy agent_consent_self_read
  on public.agent_consent_grants
  for select to authenticated
  using (grantee_user_id = auth.uid());

create policy agent_consent_self_insert
  on public.agent_consent_grants
  for insert to authenticated
  with check (
    grantee_user_id = auth.uid()
    and private.is_organization_member(organization_id)
    and exists (
      select 1
      from public.portfolios p
      where p.id = portfolio_id
        and p.organization_id = agent_consent_grants.organization_id
    )
  );

-- La revocación se materializa por fecha. PostgreSQL no ofrece OLD en WITH CHECK
-- de una política RLS, por lo que el trigger siguiente impide cualquier cambio
-- de columnas distinto de establecer revoked_at una única vez.
create or replace function private.guard_agent_consent_update()
returns trigger
language plpgsql
security definer
set search_path = public, private
as $$
begin
  if old.grantee_user_id <> auth.uid() then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  if new.organization_id <> old.organization_id
     or new.portfolio_id <> old.portfolio_id
     or new.grantee_user_id <> old.grantee_user_id
     or new.scope <> old.scope
     or new.granted_at <> old.granted_at
     or new.expires_at <> old.expires_at
     or new.revoked_at is null then
    raise exception 'only revocation is allowed' using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists guard_agent_consent_update on public.agent_consent_grants;
create trigger guard_agent_consent_update
before update on public.agent_consent_grants
for each row execute function private.guard_agent_consent_update();

-- El trigger restringe la mutación a una revocación. No se permite DELETE:
-- la revocación conserva una evidencia de auditoría.
create policy agent_consent_self_revoke
  on public.agent_consent_grants
  for update to authenticated
  using (grantee_user_id = auth.uid())
  with check (grantee_user_id = auth.uid());

-- 2) Predicado central. SECURITY DEFINER solo comprueba autorización;
-- no devuelve datos de transacciones ni permite SQL dinámico.
create or replace function private.agent_consent_allows(
  p_consent_id uuid,
  p_portfolio_id uuid,
  p_scope text
)
returns boolean
language sql
stable
security definer
set search_path = public, private
as $$
  select exists (
    select 1
    from public.agent_consent_grants g
    join public.portfolios p on p.id = g.portfolio_id
    where g.id = p_consent_id
      and g.grantee_user_id = auth.uid()
      and g.portfolio_id = p_portfolio_id
      and g.organization_id = p.organization_id
      and g.scope = p_scope
      and g.revoked_at is null
      and g.expires_at > now()
      and private.is_organization_member(g.organization_id)
  );
$$;

revoke all on function private.agent_consent_allows(uuid, uuid, text) from public;
grant execute on function private.agent_consent_allows(uuid, uuid, text) to authenticated;

-- 3) Herramienta de resumen de cartera. SECURITY INVOKER conserva RLS del JWT
-- y devuelve solo una vista agregada, nunca notes/external_id/movimientos individuales.
create or replace function public.agent_portfolio_summary(
  p_consent_id uuid,
  p_portfolio_id uuid
)
returns jsonb
language sql
stable
security invoker
set search_path = public, private
as $$
  select coalesce((
    select jsonb_build_object(
      'portfolio_id', p.id,
      'base_currency', p.base_currency,
      'position_count', coalesce(position_stats.position_count, 0),
      'market_value', position_stats.market_value,
      'cost_basis', position_stats.cost_basis,
      'latest_snapshot_at', latest_snapshot.as_of,
      'latest_snapshot_value', latest_snapshot.market_value,
      'latest_snapshot_gain', latest_snapshot.gain
    )
    from public.portfolios p
    left join lateral (
      select
        count(*)::int as position_count,
        sum(pos.market_value) as market_value,
        sum(pos.cost_basis) as cost_basis
      from public.positions pos
      where pos.portfolio_id = p.id
    ) position_stats on true
    left join lateral (
      select ps.as_of, ps.market_value, ps.gain
      from public.portfolio_snapshots ps
      where ps.portfolio_id = p.id
      order by ps.as_of desc
      limit 1
    ) latest_snapshot on true
    where p.id = p_portfolio_id
      and private.agent_consent_allows(
        p_consent_id, p_portfolio_id, 'portfolio_summary'
      )
  ), '{}'::jsonb);
$$;

revoke all on function public.agent_portfolio_summary(uuid, uuid) from public;
grant execute on function public.agent_portfolio_summary(uuid, uuid) to authenticated;

-- 4) Herramienta de movimientos agregados. No expone notes, external_id,
-- data_source_id ni el detalle de cada operación al agente.
create or replace function public.agent_transaction_aggregate(
  p_consent_id uuid,
  p_portfolio_id uuid,
  p_from timestamptz,
  p_to timestamptz
)
returns table (
  month_start date,
  kind text,
  currency char(3),
  transaction_count bigint,
  gross_amount numeric,
  fees numeric,
  withholding_tax numeric
)
language sql
stable
security invoker
set search_path = public, private
as $$
  select
    date_trunc('month', t.occurred_at)::date as month_start,
    t.kind,
    t.currency,
    count(*) as transaction_count,
    sum(t.gross_amount) as gross_amount,
    sum(t.fees) as fees,
    sum(t.withholding_tax) as withholding_tax
  from public.transactions t
  where t.portfolio_id = p_portfolio_id
    and t.occurred_at >= p_from
    and t.occurred_at < p_to
    and p_to > p_from
    and p_to - p_from <= interval '731 days'
    and private.agent_consent_allows(
      p_consent_id, p_portfolio_id, 'transaction_aggregate'
    )
  group by 1, 2, 3
  order by 1 desc, 2, 3;
$$;

revoke all on function public.agent_transaction_aggregate(uuid, uuid, timestamptz, timestamptz) from public;
grant execute on function public.agent_transaction_aggregate(uuid, uuid, timestamptz, timestamptz) to authenticated;

-- 5) Auditoría: la API cliente solo puede leer su propio historial; no insertar.
-- Las inserciones las realiza una Edge Function controlada con una credencial interna.
create table if not exists public.agent_query_runs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  actor_id uuid not null references auth.users(id) on delete restrict,
  consent_id uuid references public.agent_consent_grants(id) on delete set null,
  portfolio_id uuid references public.portfolios(id) on delete set null,
  tool_names text[] not null default '{}',
  source_summary jsonb not null default '{}'::jsonb,
  coverage jsonb not null default '{}'::jsonb,
  status text not null check (status in ('succeeded', 'denied', 'partial', 'failed')),
  latency_ms integer check (latency_ms >= 0),
  created_at timestamptz not null default now()
);

alter table public.agent_query_runs enable row level security;

create policy agent_query_runs_self_read
  on public.agent_query_runs
  for select to authenticated
  using (actor_id = auth.uid());

-- No INSERT/UPDATE/DELETE policy para authenticated: denegación implícita.

commit;

-- PRUEBAS DE AISLAMIENTO (ejecutar con dos usuarios, organizaciones y carteras ficticias):
-- A) Usuario A sin consent: select public.agent_portfolio_summary(<any>, cartera_A) -> {}.
-- B) Usuario A con grant propio activo: devuelve solo agregado de cartera_A.
-- C) Usuario A con consentimiento inválido/caducado: devuelve {} y agent-query responde 403 sin indicar existencia.
-- D) Usuario A pasando cartera_B: devuelve {} aunque A conozca el UUID.
-- E) User A llama a public.transactions: RLS actual permite solo filas de su organización;
--    la Edge Function NO expone esa consulta como herramienta al modelo.
-- F) INSERT/UPDATE/DELETE desde JWT usuario en agent_query_runs: denegado por ausencia de policy.
-- G) Revocación: update revoked_at = now(); siguientes llamadas no devuelven contexto.

-- NOTAS DE INTEGRACIÓN:
-- 1. No aplicar este archivo directamente en producción sin probarlo en branch/migración revisada.
-- 2. La función agent-query debe llamar exclusivamente a estos RPC y a snapshots públicos;
--    el LLM nunca recibe un cliente Supabase, SQL, nombres de tabla o acceso a secretos.
-- 3. Las políticas existentes confirmadas a 2026-08-26 son:
--    portfolios_member_read / portfolios_editor_write / transactions_member_read.
--    No se sustituyen aquí; se añade una capacidad más estrecha para el agente.
