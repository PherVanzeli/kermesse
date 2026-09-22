import { PaymentGatewayError, type CreatePixChargeInput, type ParsedWebhook, type PaymentGateway, type PaymentProvider, type ProviderPaymentStatus, type PixCharge } from "./types";

type AsaasResponse = Record<string, unknown>;

function getString(value: unknown, field: string) {
  if (typeof value !== "string" || !value) {
    throw new PaymentGatewayError(`Resposta do Asaas sem ${field}.`, "provider_error");
  }
  return value;
}

export class AsaasGateway implements PaymentGateway {
  readonly provider: PaymentProvider = "asaas";
  private readonly baseUrl: string;

  constructor(private readonly apiKey: string, environment: "sandbox" | "production") {
    this.baseUrl = environment === "sandbox"
      ? "https://api-sandbox.asaas.com/v3"
      : "https://api.asaas.com/v3";
  }

  private async request(path: string, init?: RequestInit) {
    const response = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        "user-agent": "Kermesse/1.0 (Asaas integration)",
        access_token: this.apiKey,
        ...(init?.headers ?? {}),
      },
      cache: "no-store",
    });
    const body = await response.json().catch(() => ({})) as AsaasResponse;
    if (!response.ok) {
      const description = typeof body.errors === "object"
        ? JSON.stringify(body.errors)
        : typeof body.message === "string"
          ? body.message
          : `Resposta rejeitada pelo Asaas (HTTP ${response.status}).`;
      throw new PaymentGatewayError(description, response.status === 401 ? "invalid_credentials" : "provider_error");
    }
    return body;
  }

  async testConnection() {
    await this.request("/myAccount");
  }

  async createPixCharge(input: CreatePixChargeInput): Promise<PixCharge> {
    const customer = await this.request("/customers", {
      method: "POST",
      body: JSON.stringify({
        name: input.customerName,
        cpfCnpj: input.customerDocument,
        externalReference: `kermesse-tenant-${input.tenantId}`,
      }),
    });
    const customerId = getString(customer.id, "id do cliente");
    const payment = await this.request("/payments", {
      method: "POST",
      body: JSON.stringify({
        customer: customerId,
        billingType: "PIX",
        value: input.amountCents / 100,
        dueDate: new Date(Date.now() + 30 * 60 * 1000).toISOString().slice(0, 10),
        description: input.description,
        externalReference: `kermesse:${input.orderId}`,
      }),
    });
    const providerPaymentId = getString(payment.id, "id da cobrança");
    const pix = await this.request(`/payments/${providerPaymentId}/pixQrCode`);
    return {
      providerPaymentId,
      providerReference: typeof payment.invoiceUrl === "string" ? payment.invoiceUrl : null,
      copyPasteCode: getString(pix.payload, "código Pix"),
      qrCodeImage: typeof pix.encodedImage === "string" ? `data:image/png;base64,${pix.encodedImage}` : null,
      expiresAt: typeof pix.expirationDate === "string" ? pix.expirationDate : null,
    };
  }

  async getPaymentStatus(providerPaymentId: string): Promise<ProviderPaymentStatus> {
    const payment = await this.request(`/payments/${encodeURIComponent(providerPaymentId)}`);
    switch (payment.status) {
      case "RECEIVED":
      case "CONFIRMED":
        return "confirmed";
      case "REFUNDED":
        return "refunded";
      case "OVERDUE":
      case "DELETED":
        return "failed";
      default:
        return "pending";
    }
  }

  parseWebhook(payload: unknown, headers: Headers): ParsedWebhook {
    void headers;
    if (!payload || typeof payload !== "object") {
      throw new PaymentGatewayError("Payload do webhook do Asaas inválido.", "invalid_webhook");
    }

    const body = payload as {
      id?: unknown;
      event?: unknown;
      payment?: {
        id?: unknown;
        value?: unknown;
        externalReference?: unknown;
      };
    };
    const providerEventId = getString(body.id, "id do evento");
    const providerPaymentId = getString(body.payment?.id, "id do pagamento");
    const event = getString(body.event, "tipo do evento");
    const externalReference = parseExternalReference(body.payment?.externalReference);

    return {
      providerEventId,
      providerPaymentId,
      amountCents: typeof body.payment?.value === "number"
        ? Math.round(body.payment.value * 100)
        : null,
      eventId: externalReference?.eventId ?? null,
      orderId: externalReference?.orderId ?? null,
      status: getWebhookStatus(event),
    };
  }
}

function parseExternalReference(value: unknown) {
  if (typeof value !== "string") return null;
  if (value.startsWith("kermesse:")) {
    return {
      eventId: null,
      orderId: value.slice("kermesse:".length) || null,
    };
  }
  try {
    const parsed = JSON.parse(value) as {
      kermesse_event_id?: unknown;
      kermesse_order_id?: unknown;
    };
    return {
      eventId: typeof parsed.kermesse_event_id === "string" ? parsed.kermesse_event_id : null,
      orderId: typeof parsed.kermesse_order_id === "string" ? parsed.kermesse_order_id : null,
    };
  } catch {
    return null;
  }
}

function getWebhookStatus(event: string): ProviderPaymentStatus {
  if (event === "PAYMENT_CONFIRMED" || event === "PAYMENT_RECEIVED") return "confirmed";
  if (event === "PAYMENT_REFUNDED") return "refunded";
  if (event === "PAYMENT_OVERDUE" || event === "PAYMENT_DELETED") return "failed";
  return "pending";
}
