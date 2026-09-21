create extension if not exists "pgcrypto";

alter function public.create_public_order(uuid, text, public.payment_method, jsonb)
  set search_path = public, extensions;
