alter table public.orders
  add column if not exists public_token text;

update public.orders
set public_token = encode(gen_random_bytes(24), 'hex')
where public_token is null;

alter table public.orders
  alter column public_token set not null;

create unique index if not exists orders_public_token_idx
  on public.orders(public_token);

drop function if exists public.create_public_order(uuid, text, public.payment_method, jsonb);

create function public.create_public_order(
  p_event_id uuid,
  p_customer_name text,
  p_payment_method public.payment_method,
  p_items jsonb
)
returns table (
  order_id uuid,
  pickup_code text,
  public_token text,
  total_cents integer,
  order_status public.order_status
)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_product record;
  requested_item record;
  new_order_id uuid;
  new_pickup_code text;
  new_public_token text;
  calculated_total integer := 0;
begin
  if p_customer_name is null or char_length(trim(p_customer_name)) < 2
     or char_length(trim(p_customer_name)) > 120 then
    raise exception using errcode = '22023', message = 'Nome do cliente inválido.';
  end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception using errcode = '22023', message = 'O pedido precisa ter itens.';
  end if;

  if not exists (select 1 from public.events where id = p_event_id and status = 'active') then
    raise exception using errcode = '22023', message = 'Evento não encontrado ou encerrado.';
  end if;

  for requested_item in
    select product_id, quantity
    from jsonb_to_recordset(p_items) as items(product_id uuid, quantity integer)
  loop
    if requested_item.product_id is null or requested_item.quantity is null
       or requested_item.quantity <= 0 or requested_item.quantity > 99 then
      raise exception using errcode = '22023', message = 'Item ou quantidade inválida.';
    end if;
  end loop;

  for current_product in
    select products.id, products.price_cents, products.stock, requested.quantity
    from public.products
    join (
      select product_id, sum(quantity)::integer as quantity
      from jsonb_to_recordset(p_items) as items(product_id uuid, quantity integer)
      group by product_id
    ) as requested on requested.product_id = products.id
    where products.event_id = p_event_id and products.active = true
    for update of products
  loop
    if current_product.stock is not null and current_product.stock < current_product.quantity then
      raise exception using errcode = '22023', message = 'Um dos produtos ficou sem estoque.';
    end if;
    calculated_total := calculated_total + (current_product.price_cents * current_product.quantity);
  end loop;

  if (
    select count(*) from jsonb_to_recordset(p_items) as items(product_id uuid, quantity integer)
  ) <> (
    select count(*)
    from public.products
    join (
      select product_id
      from jsonb_to_recordset(p_items) as items(product_id uuid, quantity integer)
      group by product_id
    ) as requested on requested.product_id = products.id
    where products.event_id = p_event_id and products.active = true
  ) then
    raise exception using errcode = '22023', message = 'Um dos produtos não está disponível.';
  end if;

  loop
    new_pickup_code := 'A-' || lpad((floor(random() * 900) + 100)::integer::text, 3, '0');
    exit when not exists (
      select 1 from public.orders
      where event_id = p_event_id and orders.pickup_code = new_pickup_code
    );
  end loop;

  loop
    new_public_token := encode(gen_random_bytes(24), 'hex');
    exit when not exists (
      select 1 from public.orders where orders.public_token = new_public_token
    );
  end loop;

  insert into public.orders (
    event_id, customer_name, pickup_code, public_token, total_cents, status
  )
  values (
    p_event_id, trim(p_customer_name), new_pickup_code, new_public_token,
    calculated_total, 'awaiting_payment'
  )
  returning id into new_order_id;

  insert into public.order_items (order_id, product_id, quantity, unit_price_cents)
  select new_order_id, products.id, requested.quantity, products.price_cents
  from public.products
  join (
    select product_id, sum(quantity)::integer as quantity
    from jsonb_to_recordset(p_items) as items(product_id uuid, quantity integer)
    group by product_id
  ) as requested on requested.product_id = products.id
  where products.event_id = p_event_id;

  update public.products
  set stock = products.stock - requested.quantity
  from (
    select product_id, sum(quantity)::integer as quantity
    from jsonb_to_recordset(p_items) as items(product_id uuid, quantity integer)
    group by product_id
  ) as requested
  where products.id = requested.product_id and products.stock is not null;

  insert into public.payments (order_id, method, status, amount_cents)
  values (new_order_id, p_payment_method, 'pending', calculated_total);

  return query
  select new_order_id, new_pickup_code, new_public_token, calculated_total,
    'awaiting_payment'::public.order_status;
end;
$$;

revoke all on function public.create_public_order(uuid, text, public.payment_method, jsonb)
  from public, anon, authenticated;

grant execute on function public.create_public_order(uuid, text, public.payment_method, jsonb)
  to anon, authenticated;

create or replace function public.get_public_order(p_token text)
returns table (
  pickup_code text,
  customer_name text,
  total_cents integer,
  status public.order_status,
  created_at timestamptz,
  items jsonb
)
language sql
security definer
set search_path = public
as $$
  select
    orders.pickup_code,
    orders.customer_name,
    orders.total_cents,
    orders.status,
    orders.created_at,
    coalesce(jsonb_agg(jsonb_build_object(
      'name', products.name,
      'quantity', order_items.quantity
    ) order by products.name), '[]'::jsonb)
  from public.orders
  join public.order_items on order_items.order_id = orders.id
  join public.products on products.id = order_items.product_id
  where orders.public_token = p_token
  group by orders.id;
$$;

revoke all on function public.get_public_order(text) from public, authenticated;
grant execute on function public.get_public_order(text) to anon, authenticated;
