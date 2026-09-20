create policy "members can view event orders"
  on public.orders for select
  to authenticated
  using (
    public.is_tenant_member(
      (select event.tenant_id from public.events event where event.id = event_id)
    )
  );

create policy "members can update event orders"
  on public.orders for update
  to authenticated
  using (
    public.is_tenant_member(
      (select event.tenant_id from public.events event where event.id = event_id)
    )
  )
  with check (
    public.is_tenant_member(
      (select event.tenant_id from public.events event where event.id = event_id)
    )
  );

create policy "members can view order items"
  on public.order_items for select
  to authenticated
  using (
    public.is_tenant_member(
      (select event.tenant_id
       from public.events event
       join public.orders order_record on order_record.event_id = event.id
       where order_record.id = order_id)
    )
  );

create policy "members can view order payments"
  on public.payments for select
  to authenticated
  using (
    public.is_tenant_member(
      (select event.tenant_id
       from public.events event
       join public.orders order_record on order_record.event_id = event.id
       where order_record.id = order_id)
    )
  );
