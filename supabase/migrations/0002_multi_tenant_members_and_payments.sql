create type public.tenant_member_role as enum ('owner', 'admin', 'operator');
create type public.payment_provider as enum ('mercado_pago', 'asaas');
create type public.payment_environment as enum ('sandbox', 'production');

create table public.tenant_members (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.tenant_member_role not null default 'operator',
  created_at timestamptz not null default now(),
  unique (tenant_id, user_id)
);

create table public.payment_accounts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  provider public.payment_provider not null,
  environment public.payment_environment not null default 'sandbox',
  account_reference text,
  credentials_ciphertext text,
  secret_last_four text check (
    secret_last_four is null or length(secret_last_four) between 4 and 8
  ),
  active boolean not null default false,
  last_tested_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, provider, environment)
);

create index tenant_members_user_id_idx on public.tenant_members(user_id);
create index payment_accounts_tenant_id_idx on public.payment_accounts(tenant_id);

alter table public.tenants enable row level security;
alter table public.tenant_members enable row level security;
alter table public.payment_accounts enable row level security;

create or replace function public.is_tenant_member(
  requested_tenant_id uuid,
  allowed_roles public.tenant_member_role[] default null
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.tenant_members member
    where member.tenant_id = requested_tenant_id
      and member.user_id = auth.uid()
      and (
        allowed_roles is null
        or member.role = any(allowed_roles)
      )
  );
$$;

revoke all on function public.is_tenant_member(uuid, public.tenant_member_role[]) from public;
grant execute on function public.is_tenant_member(uuid, public.tenant_member_role[]) to authenticated;

create policy "members can view their tenants"
  on public.tenants for select
  to authenticated
  using (public.is_tenant_member(id));

create policy "owners and admins can update their tenants"
  on public.tenants for update
  to authenticated
  using (public.is_tenant_member(
    id,
    array['owner', 'admin']::public.tenant_member_role[]
  ))
  with check (public.is_tenant_member(
    id,
    array['owner', 'admin']::public.tenant_member_role[]
  ));

create policy "members can view tenant membership"
  on public.tenant_members for select
  to authenticated
  using (public.is_tenant_member(tenant_id));

create policy "owners and admins manage tenant membership"
  on public.tenant_members for all
  to authenticated
  using (public.is_tenant_member(
    tenant_id,
    array['owner', 'admin']::public.tenant_member_role[]
  ))
  with check (public.is_tenant_member(
    tenant_id,
    array['owner', 'admin']::public.tenant_member_role[]
  ));

create policy "owners and admins manage payment accounts"
  on public.payment_accounts for all
  to authenticated
  using (public.is_tenant_member(
    tenant_id,
    array['owner', 'admin']::public.tenant_member_role[]
  ))
  with check (public.is_tenant_member(
    tenant_id,
    array['owner', 'admin']::public.tenant_member_role[]
  ));
