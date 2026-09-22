import {
  PaymentGatewayError,
  type CreatePixChargeInput,
  type ParsedWebhook,
  type PaymentGateway,
  type PaymentProvider,
  type ProviderPaymentStatus,
  type PixCharge,
} from "./types";

export class UnsupportedGateway implements PaymentGateway {
  constructor(public readonly provider: PaymentProvider) {}

  testConnection(): Promise<void> {
    return Promise.reject(
      new PaymentGatewayError(
        `O teste de conexão do gateway ${this.provider} ainda não está integrado.`,
        "unsupported_operation",
      ),
    );
  }

  createPixCharge(input: CreatePixChargeInput): Promise<PixCharge> {
    void input;
    return Promise.reject(
      new PaymentGatewayError(
        `O gateway ${this.provider} ainda não está integrado.`,
        "unsupported_operation",
      ),
    );
  }

  getPaymentStatus(providerPaymentId: string): Promise<ProviderPaymentStatus> {
    void providerPaymentId;
    return Promise.reject(
      new PaymentGatewayError(
        `A consulta de pagamentos do gateway ${this.provider} ainda não está integrada.`,
        "unsupported_operation",
      ),
    );
  }

  parseWebhook(payload: unknown, headers: Headers): ParsedWebhook {
    void payload;
    void headers;
    throw new PaymentGatewayError(
      `O webhook do gateway ${this.provider} ainda não está integrado.`,
      "unsupported_operation",
    );
  }
}
