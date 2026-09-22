# Camada de gateways

Esta pasta define o contrato comum para os provedores de pagamento da
Kermesse. O fluxo da aplicação deve depender de `PaymentGateway`, e não de
detalhes de Asaas, Mercado Pago ou PagSeguro.

## Contrato

Cada adaptador deverá implementar:

- criação de cobrança Pix;
- consulta de status;
- interpretação e validação do webhook.

As entradas de cobrança sempre incluem `orderId`, `eventId` e `tenantId`.
Esses identificadores devem ser enviados como metadados quando o provedor
suportar esse recurso.

Nesta fase, os três provedores são reconhecidos pelo tipo e pela fábrica, mas
as operações externas ainda falham explicitamente como não implementadas. Isso
evita simular pagamentos ou produzir uma confirmação falsa.

As credenciais permanecem no backend e não fazem parte do contrato enviado ao
cliente.
