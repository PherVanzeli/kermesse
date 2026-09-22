import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { decryptPaymentCredential } from "@/lib/payments/credentials";
import { AsaasGateway } from "@/lib/payments/asaas-gateway";
import type { PaymentEnvironment } from "@/lib/payments/types";

type OrderPayload = {
  eventId?: unknown;
  customerName?: unknown;
  customerDocument?: unknown;
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
    (payload.paymentMethod === "pix" && typeof payload.customerDocument !== "string") ||
    !["pix", "card"].includes(String(payload.paymentMethod)) ||
    !Array.isArray(payload.items)
  ) {
    return NextResponse.json({ error: "Dados do pedido inválidos." }, { status: 400 });
  }
  const customerDocument = typeof payload.customerDocument === "string"
    ? payload.customerDocument.replace(/\D/g, "")
    : "";
  if (payload.paymentMethod === "pix" && ![11, 14].includes(customerDocument.length)) {
    return NextResponse.json({ error: "Informe um CPF ou CNPJ válido para pagar com Pix." }, { status: 400 });
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
        : errorMessage.includes("gateway de pagamento Pix")
          ? "O pagamento Pix ainda não está configurado para este evento."
        : `Não foi possível registrar o pedido. ${errorMessage || "Verifique os logs da Vercel."}`;
    return NextResponse.json({ error: message }, { status: error?.code === "42883" ? 503 : 400 });
  }

  const order = {
    id: data[0].order_id,
    pickupCode: data[0].pickup_code,
    publicToken: data[0].public_token,
    totalCents: data[0].total_cents,
    status: data[0].order_status,
  };

  if (payload.paymentMethod === "pix") {
    try {
      const admin = createAdminClient();
      const { data: payment, error: paymentError } = await admin
        .from("payments")
        .select("id, event_id, payment_account_id, provider, amount_cents")
        .eq("order_id", order.id)
        .single();
      if (paymentError || !payment?.payment_account_id || payment.provider !== "asaas") {
        throw new Error("A conta Asaas do evento não está disponível.");
      }

      const { data: account, error: accountError } = await admin
        .from("payment_accounts")
        .select("tenant_id, environment, credentials_ciphertext, active")
        .eq("id", payment.payment_account_id)
        .single();
      if (accountError || !account?.active || !account.credentials_ciphertext) {
        throw new Error("A conexão Asaas do evento não foi validada.");
      }

      const gateway = new AsaasGateway(
        decryptPaymentCredential(account.credentials_ciphertext),
        account.environment as PaymentEnvironment,
      );
      const charge = await gateway.createPixCharge({
        orderId: order.id,
        eventId: payment.event_id,
        tenantId: account.tenant_id,
        amountCents: payment.amount_cents,
        customerName: payload.customerName.trim(),
        customerDocument,
        description: `Pedido ${order.pickupCode}`,
        expiresAt: null,
      });
      const { error: updateError } = await admin
        .from("payments")
        .update({
          provider_payment_id: charge.providerPaymentId,
          provider_reference: charge.providerReference,
          pix_copy_paste: charge.copyPasteCode,
          pix_qr_code: charge.qrCodeImage,
        })
        .eq("id", payment.id);
      if (updateError) throw new Error("Não foi possível salvar a cobrança Pix.");

      return NextResponse.json({
        order: {
          ...order,
          pixCopyPaste: charge.copyPasteCode,
          pixQrCode: charge.qrCodeImage,
          pixExpiresAt: charge.expiresAt,
        },
      }, { status: 201 });
    } catch (caught) {
      const providerMessage = caught instanceof Error ? caught.message : "Erro desconhecido.";
      console.error("create Asaas Pix charge failed", {
        orderId: order.id,
        error: providerMessage,
      });
      return NextResponse.json(
        {
          error: process.env.NODE_ENV === "production"
            ? "Não foi possível gerar a cobrança Pix. Tente novamente ou escolha pagamento no caixa."
            : `Asaas recusou a cobrança: ${providerMessage}`,
        },
        { status: 502 },
      );
    }
  }

  return NextResponse.json({ order }, { status: 201 });
}
