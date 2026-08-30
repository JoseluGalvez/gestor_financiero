-- PROPUESTA NO APLICADA — aislamiento opcional por cartera para organizaciones con varios miembros.
-- Debe probarse en rama con datos ficticios y poblar portfolio_members ANTES de sustituir lecturas.
-- El esquema vigente protege a nivel de organización; esta migración añade el límite de cartera.

begin;

-- 1) Matriz explícita de acceso por cartera.
create table if not exists public.portfolio_members (
  portfolio_id uuid not null references public.portfolios(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.member_role not null default 'viewer',
  created_at timestamptz not null default now(),
  primary key (portfolio_id, user_id)
);

create index if not exists portfolio_members_user_portfolio_idx
  on public.portfolio_members (user_id, portfolio_id);

alter table public.portfolio_members enable row level security;

-- Lectura de la propia membresía, más visibilidad para owners de la organización.
create policy portfolio_members_self_or_owner_read
  on public.portfolio_members
  for select to authenticated
  using (
    user_id = auth.uid()
    or exists (
      select 1
      from public.portfolios p
      where p.id = portfolio_members.portfolio_id
        and private.is_organization_editor(p.organization_id)
    )
  );

-- Solo editor/owner de la organización de la cartera puede gestionar asignaciones.
create policy portfolio_members_org_editor_manage
  on public.portfolio_members
  for all to authenticated
  using (
    exists (
      select 1
      from public.portfolios p
      where p.id = portfolio_members.portfolio_id
        and private.is_organization_editor(p.organization_id)
    )
  )
  with check (
    exists (
      select 1
      from public.portfolios p
      where p.id = portfolio_members.portfolio_id
        and private.is_organization_editor(p.organization_id)
    )
  );

-- 2) Helpers sin SQL dinámico. SECURITY DEFINER solo devuelve booleanos.
create or replace function private.is_portfolio_member(p_portfolio_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, private
as $$
  select exists (
    select 1
    from public.portfolio_members pm
    where pm.portfolio_id = p_portfolio_id
      and pm.user_id = auth.uid()
  );
$$;

create or replace function private.is_portfolio_editor(p_portfolio_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, private
as $$
  select exists (
    select 1
    from public.portfolio_members pm
    where pm.portfolio_id = p_portfolio_id
      and pm.user_id = auth.uid()
      and pm.role in ('owner', 'editor')
  );
$$;

revoke all on function private.is_portfolio_member(uuid) from public;
revoke all on function private.is_portfolio_editor(uuid) from public;
grant execute on function private.is_portfolio_member(uuid) to authenticated;
grant execute on function private.is_portfolio_editor(uuid) to authenticated;

-- 3) Bootstrap obligatorio antes de cambiar las lecturas.
-- Ejecutar como migración administrativa con una regla de producto explícita:
-- añadir al owner de cada organización como owner de sus carteras.
insert into public.portfolio_members (portfolio_id, user_id, role)
select p.id, o.owner_id, 'owner'::public.member_role
from public.portfolios p
join public.organizations o on o.id = p.organization_id
on conflict (portfolio_id, user_id) do nothing;

-- Una vez poblada la membresía, el consentimiento propio también queda limitado
-- a una cartera que el usuario pueda leer. Reemplaza la política de inserción
-- de la propuesta base de agente, no la habilita si agent_consent_grants no existe.
drop policy if exists agent_consent_self_insert on public.agent_consent_grants;
create policy agent_consent_self_insert
  on public.agent_consent_grants
  for insert to authenticated
  with check (
    grantee_user_id = auth.uid()
    and private.is_portfolio_member(portfolio_id)
  );

-- 4) Sustituir SOLO tras validar la tabla anterior. Se preserva la
-- escritura de portfolios para org editors; las transacciones no obtienen
-- escritura directa de cliente y continúan entrando por rutas backend auditadas.
drop policy if exists portfolios_member_read on public.portfolios;
create policy portfolios_portfolio_member_read
  on public.portfolios
  for select to authenticated
  using (private.is_portfolio_member(id));

drop policy if exists transactions_member_read on public.transactions;
create policy transactions_portfolio_member_read
  on public.transactions
  for select to authenticated
  using (private.is_portfolio_member(portfolio_id));

-- Datos derivados con el mismo límite para que no filtren balances ni precios:
drop policy if exists positions_member_read on public.positions;
create policy positions_portfolio_member_read
  on public.positions
  for select to authenticated
  using (private.is_portfolio_member(portfolio_id));

drop policy if exists snapshots_member_read on public.portfolio_snapshots;
create policy snapshots_portfolio_member_read
  on public.portfolio_snapshots
  for select to authenticated
  using (private.is_portfolio_member(portfolio_id));

-- La función de consentimiento del agente debe pasar de membership de organización
-- a membership de cartera:
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
    where g.id = p_consent_id
      and g.grantee_user_id = auth.uid()
      and g.portfolio_id = p_portfolio_id
      and g.scope = p_scope
      and g.revoked_at is null
      and g.expires_at > now()
      and private.is_portfolio_member(g.portfolio_id)
  );
$$;

commit;

-- PRUEBAS DE AISLAMIENTO REQUERIDAS:
-- 1. Owner A y viewer B de la misma organización; B no incluido en cartera_A.
--    SELECT de portfolios, transactions, positions y portfolio_snapshots de cartera_A devuelve cero filas a B.
-- 2. B es añadido como viewer de cartera_B: puede leer solo cartera_B y sus derivados.
-- 3. B pasa UUID de cartera_A a agent_portfolio_summary con consentimiento propio de cartera_B: devuelve {}.
-- 4. Editor de organización administra portfolio_members, pero no necesita ser miembro para crear asignaciones.
-- 5. Usuario sin sesión: todas las tablas RLS devuelven cero filas.
-- 6. Verificar UI actual: si la app asume que todo miembro de organización ve todas las carteras,
--    adaptar la navegación y selectores antes del despliegue.
