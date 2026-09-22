create or replace function public.validate_payment_isolation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  payment_account_tenant_id uuid;
  payment_account_provider public.payment_provider;
  event_tenant_id uuid;
begin
  if new.order_id is null or new.event_id is null then
    raise exception using
      errcode = '23514',
      message = 'Pagamento precisa estar vinculado a um pedido e evento.';
  end if;

  select tenant_id
  into event_tenant_id
  from public.events
  where id = new.event_id;

  if event_tenant_id is null then
    raise exception using
      errcode = '23503',
      message = 'Evento do pagamento não encontrado.';
  end if;

  if new.payment_account_id is not null then
    select tenant_id, provider
    into payment_account_tenant_id, payment_account_provider
    from public.payment_accounts
    where id = new.payment_account_id;

    if payment_account_tenant_id is null then
      raise exception using
        errcode = '23503',
        message = 'Conta de gateway do pagamento não encontrada.';
    end if;

    if payment_account_tenant_id <> event_tenant_id then
      raise exception using
        errcode = '23514',
        message = 'A conta de gateway não pertence ao organizador do evento.';
    end if;

    if new.provider is null or new.provider <> payment_account_provider then
      raise exception using
        errcode = '23514',
        message = 'O provedor do pagamento não corresponde à conta configurada.';
    end if;
  elsif new.provider is not null or new.provider_payment_id is not null then
    raise exception using
      errcode = '23514',
      message = 'Pagamento com provedor precisa de uma conta de gateway.';
  end if;

  if tg_op = 'UPDATE' then
    if new.event_id <> old.event_id
       or new.order_id <> old.order_id
       or new.payment_account_id is distinct from old.payment_account_id
       or new.provider is distinct from old.provider then
      raise exception using
        errcode = '23514',
        message = 'A identidade do pagamento não pode ser alterada.';
    end if;

    if old.provider_payment_id is not null
       and new.provider_payment_id is distinct from old.provider_payment_id then
      raise exception using
        errcode = '23514',
        message = 'O identificador externo do pagamento não pode ser alterado.';
    end if;
  end if;

  return new;
end;
$$;

revoke all on function public.validate_payment_isolation() from public, anon, authenticated;

drop trigger if exists payments_validate_isolation on public.payments;

create trigger payments_validate_isolation
before insert or update on public.payments
for each row
execute function public.validate_payment_isolation();

create or replace function public.prevent_event_payment_identity_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.event_id <> old.event_id
     or new.tenant_id <> old.tenant_id
     or new.payment_account_id <> old.payment_account_id then
    raise exception using
      errcode = '23514',
      message = 'A identidade da configuração de pagamento não pode ser alterada.';
  end if;

  return new;
end;
$$;

revoke all on function public.prevent_event_payment_identity_change()
  from public, anon, authenticated;

drop trigger if exists event_payment_settings_identity on public.event_payment_settings;

create trigger event_payment_settings_identity
before update on public.event_payment_settings
for each row
execute function public.prevent_event_payment_identity_change();

create or replace function public.prevent_webhook_identity_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.provider <> old.provider
     or new.provider_event_id <> old.provider_event_id
     or new.payment_account_id is distinct from old.payment_account_id
     or new.payment_id is distinct from old.payment_id
     or new.event_id is distinct from old.event_id then
    raise exception using
      errcode = '23514',
      message = 'A identidade do webhook não pode ser alterada.';
  end if;

  return new;
end;
$$;

revoke all on function public.prevent_webhook_identity_change()
  from public, anon, authenticated;

drop trigger if exists payment_webhook_identity on public.payment_webhook_events;

create trigger payment_webhook_identity
before update on public.payment_webhook_events
for each row
execute function public.prevent_webhook_identity_change();
