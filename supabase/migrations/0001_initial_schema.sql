create extension if not exists "pgcrypto";

create type public.event_status as enum ('draft', 'active', 'closed');
create type public.order_status as enum (
  'awaiting_payment',
  'paid',
  'preparing',
  'ready',
  'delivered',
  'cancelled'
);
create type public.payment_method as enum ('pix', 'card', 'cash');
create type public.payment_status as enum ('pending', 'confirmed', 'failed', 'refunded');
create type public.operator_role as enum ('production', 'pickup');

create table public.tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  plan text not null default 'free',
  created_at timestamptz not null default now()
);

create table public.events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  slug text not null unique,
  name text not null,
  event_date date not null,
  starts_at timestamptz,
  location text,
  logo_url text,
  theme text not null default 'terracotta',
  status public.event_status not null default 'draft',
  created_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  name text not null,
  description text,
  image_url text,
  price_cents integer not null check (price_cents >= 0),
  stock integer check (stock is null or stock >= 0),
  category text not null default 'food',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete restrict,
  customer_name text,
  customer_phone text,
  pickup_code text not null,
  total_cents integer not null check (total_cents >= 0),
  status public.order_status not null default 'awaiting_payment',
  created_at timestamptz not null default now(),
  ready_at timestamptz,
  delivered_at timestamptz,
  unique (event_id, pickup_code)
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  quantity integer not null check (quantity > 0),
  unit_price_cents integer not null check (unit_price_cents >= 0)
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  method public.payment_method not null,
  status public.payment_status not null default 'pending',
  provider_txid text,
  amount_cents integer not null check (amount_cents >= 0),
  created_at timestamptz not null default now()
);

create table public.operators (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  name text not null,
  role public.operator_role not null,
  created_at timestamptz not null default now()
);

alter table public.events enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payments enable row level security;
alter table public.operators enable row level security;
