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
        access_token: this.apiKey,
        ...(init?.headers ?? {}),
      },
      cache: "no-store",
    });
    const body = await response.json().catch(() => ({})) as AsaasResponse;
    if (!response.ok) {
      const description = typeof body.errors === "object" ? JSON.stringify(body.errors) : "Resposta rejeitada pelo Asaas.";
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
        name: input.description,
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
        externalReference: JSON.stringify({
          kermesse_order_id: input.orderId,
          kermesse_event_id: input.eventId,
          kermesse_tenant_id: input.tenantId,
        }),
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
    void payload;
    void headers;
    throw new PaymentGatewayError("O webhook do Asaas será implementado na próxima fase.", "unsupported_operation");
  }
}
