export type PaymentProvider = "asaas" | "mercado_pago" | "pagseguro";
export type PaymentEnvironment = "sandbox" | "production";

export type PaymentConnection = {
  id: string;
  tenantId: string;
  provider: PaymentProvider;
  environment: PaymentEnvironment;
  credentialsCiphertext: string | null;
  accountReference: string | null;
};

export type CreatePixChargeInput = {
  orderId: string;
  eventId: string;
  tenantId: string;
  amountCents: number;
  description: string;
  expiresAt: string | null;
};

export type PixCharge = {
  providerPaymentId: string;
  providerReference: string | null;
  copyPasteCode: string;
  qrCodeImage: string | null;
  expiresAt: string | null;
};

export type ProviderPaymentStatus = "pending" | "confirmed" | "failed" | "refunded";

export type ParsedWebhook = {
  providerEventId: string;
  providerPaymentId: string;
  status: ProviderPaymentStatus;
  amountCents: number | null;
  eventId: string | null;
  orderId: string | null;
};

export type PaymentGateway = {
  readonly provider: PaymentProvider;
  testConnection(): Promise<void>;
  createPixCharge(input: CreatePixChargeInput): Promise<PixCharge>;
  getPaymentStatus(providerPaymentId: string): Promise<ProviderPaymentStatus>;
  parseWebhook(payload: unknown, headers: Headers): ParsedWebhook;
};

export class PaymentGatewayError extends Error {
  constructor(
    message: string,
    readonly code:
      | "unsupported_operation"
      | "invalid_credentials"
      | "provider_error"
      | "invalid_webhook",
  ) {
    super(message);
    this.name = "PaymentGatewayError";
  }
}
