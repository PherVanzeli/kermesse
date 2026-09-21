import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type OrderPayload = {
  eventId?: unknown;
  customerName?: unknown;
  paymentMethod?: unknown;
  items?: unknown;
};

export async function POST(request: Request) {
  let payload: OrderPayload;
  try {
    payload = (await request.json()) as OrderPayload;
  } catch {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  }

  if (
    typeof payload.eventId !== "string" ||
    typeof payload.customerName !== "string" ||
    !["pix", "card"].includes(String(payload.paymentMethod)) ||
    !Array.isArray(payload.items)
  ) {
    return NextResponse.json({ error: "Dados do pedido inválidos." }, { status: 400 });
  }

  const items = payload.items.filter(
    (item): item is { productId: string; quantity: number } =>
      typeof item === "object" &&
      item !== null &&
      typeof (item as { productId?: unknown }).productId === "string" &&
      Number.isInteger((item as { quantity?: unknown }).quantity) &&
      Number((item as { quantity: number }).quantity) > 0,
  );

  if (items.length === 0 || items.length !== payload.items.length) {
    return NextResponse.json({ error: "O pedido precisa ter itens válidos." }, { status: 400 });
  }

  const databaseItems = items.map((item) => ({
    product_id: item.productId,
    quantity: item.quantity,
  }));

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_public_order", {
    p_event_id: payload.eventId,
    p_customer_name: payload.customerName.trim(),
    p_payment_method: payload.paymentMethod,
    p_items: databaseItems,
  });

  if (error || !data?.[0]) {
    const errorMessage = error?.message ?? "";
    console.error("create_public_order failed", {
      code: error?.code,
      message: errorMessage,
      eventId: payload.eventId,
    });
    const message = errorMessage.includes("function public.create_public_order")
      ? "A configuração de pedidos ainda não foi aplicada no Supabase. Execute a migration 0008."
      : errorMessage.includes("sem estoque")
      ? "Um dos produtos ficou sem estoque."
      : errorMessage.includes("não está disponível")
        ? "Um dos produtos não está mais disponível."
        : errorMessage.includes("Evento não encontrado")
          ? "Este evento não está disponível para novos pedidos."
        : `Não foi possível registrar o pedido. ${errorMessage || "Verifique os logs da Vercel."}`;
    return NextResponse.json({ error: message }, { status: error?.code === "42883" ? 503 : 400 });
  }

  return NextResponse.json(
    {
      order: {
        id: data[0].order_id,
        pickupCode: data[0].pickup_code,
        publicToken: data[0].public_token,
        totalCents: data[0].total_cents,
        status: data[0].order_status,
      },
    },
    { status: 201 },
  );
}
