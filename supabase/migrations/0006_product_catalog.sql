create table public.catalog_products (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  image_url text,
  category text not null default 'food',
  brand text,
  size text,
  suggested_price_cents integer check (suggested_price_cents is null or suggested_price_cents >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.products
  add column catalog_product_id uuid references public.catalog_products(id) on delete set null;

alter table public.catalog_products enable row level security;

create policy "authenticated users can view active catalog products"
  on public.catalog_products for select
  to authenticated
  using (active = true);

insert into public.catalog_products
  (name, description, category, brand, size, suggested_price_cents)
values
  ('Coca-Cola Lata 350 ml', 'Refrigerante em lata', 'drink', 'Coca-Cola', '350 ml', 600),
  ('Água mineral 500 ml', 'Água mineral sem gás', 'drink', null, '500 ml', 300),
  ('Suco de uva 300 ml', 'Suco de uva gelado', 'drink', null, '300 ml', 500),
  ('Pastel de queijo', 'Massa crocante com recheio de queijo', 'food', null, null, 800),
  ('Pastel de carne', 'Massa crocante com recheio de carne', 'food', null, null, 800),
  ('Cachorro-quente', 'Pão, salsicha e complementos', 'food', null, null, 1000),
  ('Caldinho de feijão', 'Caldinho quente com cheiro-verde', 'food', null, null, 700),
  ('Milho cozido', 'Milho cozido com manteiga e sal', 'food', null, null, 600),
  ('Pipoca', 'Porção de pipoca salgada', 'food', null, null, 500),
  ('Canjica cremosa', 'Canjica com canela', 'sweet', null, null, 700),
  ('Quentão sem álcool', 'Bebida quente com especiarias', 'drink', null, null, 600)
on conflict (name) do nothing;
