import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { AsaasGateway } from "@/lib/payments/asaas-gateway";

function getWebhookToken(request: Request) {
  return request.headers.get("asaas-access-token") ?? request.headers.get("x-asaas-access-token");
}

export async function POST(request: Request) {
  const expectedToken = process.env.ASAAS_WEBHOOK_TOKEN;
  const receivedToken = getWebhookToken(request);
  if (!expectedToken || !receivedToken || receivedToken !== expectedToken) {
    return NextResponse.json({ error: "Webhook não autorizado." }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Payload inválido." }, { status: 400 });
  }

  try {
    const gateway = new AsaasGateway("webhook", "sandbox");
    const parsed = gateway.parseWebhook(payload, request.headers);
    const admin = createAdminClient();
    const { data: payment, error: paymentError } = await admin
      .from("payments")
      .select("id, order_id, event_id, payment_account_id, amount_cents, status")
      .eq("provider", "asaas")
      .eq("provider_payment_id", parsed.providerPaymentId)
      .maybeSingle();

    if (paymentError) throw paymentError;
    if (!payment) {
      return NextResponse.json({ error: "Pagamento não encontrado." }, { status: 404 });
    }
    if (parsed.amountCents !== null && parsed.amountCents !== payment.amount_cents) {
      return NextResponse.json({ error: "Valor do pagamento não confere." }, { status: 422 });
    }
    if (parsed.eventId && parsed.eventId !== payment.event_id) {
      return NextResponse.json({ error: "Evento do pagamento não confere." }, { status: 422 });
    }
    if (parsed.orderId && parsed.orderId !== payment.order_id) {
      return NextResponse.json({ error: "Pedido do pagamento não confere." }, { status: 422 });
    }

    const { data: existingEvent, error: existingError } = await admin
      .from("payment_webhook_events")
      .select("status")
      .eq("provider", "asaas")
      .eq("provider_event_id", parsed.providerEventId)
      .maybeSingle();
    if (existingError) throw existingError;
    if (existingEvent?.status === "processed") {
      return NextResponse.json({ ok: true, duplicate: true });
    }

    const { error: webhookError } = await admin
      .from("payment_webhook_events")
      .upsert({
        provider: "asaas",
        provider_event_id: parsed.providerEventId,
        payment_account_id: payment.payment_account_id,
        payment_id: payment.id,
        event_id: payment.event_id,
        payload,
        status: "received",
        rejection_reason: null,
      }, { onConflict: "provider,provider_event_id" });
    if (webhookError) throw webhookError;

    const paymentUpdate: Record<string, unknown> = { status: parsed.status };
    if (parsed.status === "confirmed") paymentUpdate.paid_at = new Date().toISOString();
    if (parsed.status === "failed") paymentUpdate.failure_reason = "Pagamento recusado ou vencido pelo Asaas.";
    if (parsed.status === "refunded") paymentUpdate.failure_reason = "Pagamento estornado pelo Asaas.";

    const { error: updatePaymentError } = await admin
      .from("payments")
      .update(paymentUpdate)
      .eq("id", payment.id);
    if (updatePaymentError) throw updatePaymentError;

    if (parsed.status === "confirmed") {
      const { error: updateOrderError } = await admin
        .from("orders")
        .update({ status: "paid" })
        .eq("id", payment.order_id)
        .eq("status", "awaiting_payment");
      if (updateOrderError) throw updateOrderError;
    }

    const { error: processedError } = await admin
      .from("payment_webhook_events")
      .update({ status: "processed", processed_at: new Date().toISOString() })
      .eq("provider", "asaas")
      .eq("provider_event_id", parsed.providerEventId);
    if (processedError) throw processedError;

    return NextResponse.json({ ok: true });
  } catch (caught) {
    console.error("process Asaas webhook failed", caught);
    return NextResponse.json({ error: "Não foi possível processar o webhook." }, { status: 500 });
  }
}
