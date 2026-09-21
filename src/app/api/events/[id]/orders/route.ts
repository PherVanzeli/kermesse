import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type OrderItemRow = {
  order_id: string;
  quantity: number;
  unit_price_cents: number;
  products: { name: string } | { name: string }[] | null;
};

async function getAuthorizedEvent(eventId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { supabase, error: "Não autenticado.", status: 401 as const };

  const { data: membership } = await supabase
    .from("tenant_members")
    .select("tenant_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();
  if (!membership) {
    return { supabase, error: "Você não tem acesso a este evento.", status: 403 as const };
  }

  const { data: event } = await supabase
    .from("events")
    .select("id, name")
    .eq("id", eventId)
    .eq("tenant_id", membership.tenant_id)
    .maybeSingle();
  if (!event) return { supabase, error: "Evento não encontrado.", status: 404 as const };
  return { supabase, event, status: 200 as const };
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const result = await getAuthorizedEvent(id);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  const { data: orders, error } = await result.supabase
    .from("orders")
    .select("id, customer_name, pickup_code, total_cents, status, created_at, ready_at, delivered_at")
    .eq("event_id", id)
    .order("created_at", { ascending: true });
  if (error) {
    return NextResponse.json({ error: "Não foi possível carregar os pedidos." }, { status: 500 });
  }

  const orderIds = (orders ?? []).map((order) => order.id);
  const { data: rawItems, error: itemsError } = orderIds.length
    ? await result.supabase
        .from("order_items")
        .select("order_id, quantity, unit_price_cents, products(name)")
        .in("order_id", orderIds)
    : { data: [], error: null };
  if (itemsError) {
    return NextResponse.json({ error: "Não foi possível carregar os itens." }, { status: 500 });
  }

  return NextResponse.json({
    event: result.event,
    orders: (orders ?? []).map((order) => ({
      ...order,
      items: ((rawItems ?? []) as unknown as OrderItemRow[])
        .filter((item) => item.order_id === order.id)
        .map((item) => ({
          quantity: item.quantity,
          unitPriceCents: item.unit_price_cents,
          name: Array.isArray(item.products) ? item.products[0]?.name : item.products?.name,
        })),
    })),
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const result = await getAuthorizedEvent(id);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  let payload: { orderId?: unknown; status?: unknown };
  try {
    payload = (await request.json()) as { orderId?: unknown; status?: unknown };
  } catch {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  }
  if (
    typeof payload.orderId !== "string" ||
    !["preparing", "ready", "delivered"].includes(String(payload.status))
  ) {
    return NextResponse.json({ error: "Status do pedido inválido." }, { status: 400 });
  }

  const update = {
    status: payload.status,
    ...(payload.status === "ready" ? { ready_at: new Date().toISOString() } : {}),
    ...(payload.status === "delivered" ? { delivered_at: new Date().toISOString() } : {}),
  };
  const { data, error } = await result.supabase
    .from("orders")
    .update(update)
    .eq("id", payload.orderId)
    .eq("event_id", id)
    .eq("status", "ready")
    .select("id, status, ready_at, delivered_at")
    .single();
  if (error) {
    return NextResponse.json({ error: "Não foi possível atualizar o pedido." }, { status: 500 });
  }
  return NextResponse.json({ order: data });
}
