create policy "members can view their events"
  on public.events for select
  to authenticated
  using (public.is_tenant_member(tenant_id));

create policy "owners and admins manage their events"
  on public.events for all
  to authenticated
  using (public.is_tenant_member(
    tenant_id,
    array['owner', 'admin']::public.tenant_member_role[]
  ))
  with check (public.is_tenant_member(
    tenant_id,
    array['owner', 'admin']::public.tenant_member_role[]
  ));

create policy "members can view event products"
  on public.products for select
  to authenticated
  using (
    public.is_tenant_member(
      (select event.tenant_id from public.events event where event.id = event_id)
    )
  );

create policy "owners and admins manage event products"
  on public.products for all
  to authenticated
  using (
    public.is_tenant_member(
      (select event.tenant_id from public.events event where event.id = event_id),
      array['owner', 'admin']::public.tenant_member_role[]
    )
  )
  with check (
    public.is_tenant_member(
      (select event.tenant_id from public.events event where event.id = event_id),
      array['owner', 'admin']::public.tenant_member_role[]
    )
  );
