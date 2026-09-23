create or replace function public.broadcast_order_status_change()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if new.status is distinct from old.status then
    perform realtime.broadcast_changes(
      'order:' || new.public_token,
      'status_changed',
      tg_op,
      tg_table_name,
      tg_table_schema,
      jsonb_build_object(
        'public_token', new.public_token,
        'status', new.status
      ),
      null
    );
  end if;
  return new;
end;
$$;

revoke all on function public.broadcast_order_status_change() from public, anon, authenticated;

drop trigger if exists orders_broadcast_status_change on public.orders;

create trigger orders_broadcast_status_change
after update of status on public.orders
for each row
execute function public.broadcast_order_status_change();
