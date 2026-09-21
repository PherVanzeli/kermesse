alter type public.payment_provider add value if not exists 'pagseguro';

alter table public.events
  add constraint events_id_tenant_unique
  unique (id, tenant_id);

alter table public.orders
  add constraint orders_id_event_unique
  unique (id, event_id);

alter table public.payment_accounts
  add constraint payment_accounts_id_tenant_unique
  unique (id, tenant_id);

create table public.event_payment_settings (
  event_id uuid primary key references public.events(id) on delete cascade,
  tenant_id uuid not null,
  payment_account_id uuid not null,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint event_payment_settings_event_tenant_fk
    foreign key (event_id, tenant_id)
    references public.events(id, tenant_id)
    on delete cascade,
  constraint event_payment_settings_account_tenant_fk
    foreign key (payment_account_id, tenant_id)
    references public.payment_accounts(id, tenant_id)
    on delete restrict
);

create index event_payment_settings_tenant_id_idx
  on public.event_payment_settings(tenant_id);

create index event_payment_settings_payment_account_id_idx
  on public.event_payment_settings(payment_account_id);

alter table public.event_payment_settings enable row level security;

create policy "members can view event payment settings"
  on public.event_payment_settings for select
  to authenticated
  using (public.is_tenant_member(tenant_id));

create policy "owners and admins manage event payment settings"
  on public.event_payment_settings for all
  to authenticated
  using (
    public.is_tenant_member(
      tenant_id,
      array['owner', 'admin']::public.tenant_member_role[]
    )
  )
  with check (
    public.is_tenant_member(
      tenant_id,
      array['owner', 'admin']::public.tenant_member_role[]
    )
  );

alter table public.payments
  add column event_id uuid,
  add column payment_account_id uuid,
  add column provider public.payment_provider,
  add column provider_payment_id text,
  add column provider_reference text,
  add column pix_copy_paste text,
  add column pix_qr_code text,
  add column paid_at timestamptz,
  add column failure_reason text,
  add column metadata jsonb not null default '{}'::jsonb;

update public.payments
set event_id = orders.event_id
from public.orders
where orders.id = payments.order_id
  and payments.event_id is null;

alter table public.payments
  alter column event_id set not null,
  add constraint payments_event_order_fk
    foreign key (order_id, event_id)
    references public.orders(id, event_id)
    on delete cascade,
  add constraint payments_provider_payment_unique
    unique (payment_account_id, provider_payment_id);

create index payments_event_id_idx on public.payments(event_id);
create index payments_payment_account_id_idx on public.payments(payment_account_id);
create index payments_provider_payment_id_idx
  on public.payments(provider, provider_payment_id);

create table public.payment_webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider public.payment_provider not null,
  provider_event_id text not null,
  payment_account_id uuid,
  payment_id uuid references public.payments(id) on delete set null,
  event_id uuid,
  payload jsonb not null default '{}'::jsonb,
  status text not null check (status in ('received', 'processed', 'rejected')),
  rejection_reason text,
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (provider, provider_event_id),
  constraint payment_webhook_events_account_fk
    foreign key (payment_account_id)
    references public.payment_accounts(id)
    on delete set null,
  constraint payment_webhook_events_event_fk
    foreign key (event_id)
    references public.events(id)
    on delete set null
);

create index payment_webhook_events_payment_id_idx
  on public.payment_webhook_events(payment_id);

create index payment_webhook_events_event_id_idx
  on public.payment_webhook_events(event_id);

alter table public.payment_webhook_events enable row level security;

create policy "members can view event payment webhooks"
  on public.payment_webhook_events for select
  to authenticated
  using (
    event_id is not null
    and public.is_tenant_member(
      (select event_record.tenant_id
       from public.events event_record
       where event_record.id = event_id)
    )
  );
