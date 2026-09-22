import { UnsupportedGateway } from "./unsupported-gateway";
import type { PaymentGateway, PaymentProvider } from "./types";

export function createPaymentGateway(provider: PaymentProvider): PaymentGateway {
  return new UnsupportedGateway(provider);
}
