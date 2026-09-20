create policy "anyone can view active events"
  on public.events for select
  to anon, authenticated
  using (status = 'active');

create policy "anyone can view active products from active events"
  on public.products for select
  to anon, authenticated
  using (
    active = true
    and exists (
      select 1
      from public.events event
      where event.id = event_id
        and event.status = 'active'
    )
  );
