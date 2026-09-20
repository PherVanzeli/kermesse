# Tutorial técnico: integração com gateways de pagamento

Este documento orienta a pessoa de TI responsável por conectar a Kermesse a um
gateway de pagamento, como Mercado Pago ou Asaas.

O objetivo é substituir a simulação atual por cobranças Pix reais, sem alterar
a experiência principal do cliente:

```text
Cliente cria pedido
        ↓
Kermesse cria cobrança no gateway
        ↓
Cliente paga por Pix
        ↓
Gateway envia webhook
        ↓
Kermesse confirma o pagamento
        ↓
Pedido é liberado para produção
```

## 1. Estado atual do projeto

O projeto já possui:

- Tela de cardápio e carrinho.
- Checkout com escolha de Pix ou cartão.
- Schema inicial de `orders`, `order_items` e `payments`.
- Clientes Supabase para browser e servidor.
- Fluxo visual de confirmação de pedido.

O checkout atual ainda é demonstrativo. Ele não deve ser considerado uma
confirmação financeira real. A integração precisa mover a criação e a
confirmação do pagamento para o servidor.

Arquivos relacionados:

- [Checkout](../src/app/evento/[slug]/menu-client.tsx)
- [Schema SQL](../supabase/migrations/0001_initial_schema.sql)
- [Cliente Supabase server](../src/lib/supabase/server.ts)
- [Variáveis de ambiente](../.env.example)

## 2. Decisões obrigatórias antes de codificar

Defina com o responsável pelo produto:

1. Gateway inicial: Mercado Pago ou Asaas.
2. Se cada organizador terá sua própria conta ou se haverá uma conta central.
3. Se o cartão será somente no caixa ou também no celular.
4. Prazo de expiração de uma cobrança Pix.
5. Regra para cancelamento e reembolso.
6. Quando o estoque será reservado:
   - na criação do pedido; ou
   - somente após o pagamento.
7. Se o pedido pode ser alterado depois de criado.

Para o MVP, a recomendação é:

- começar com um gateway;
- aceitar Pix no celular;
- manter cartão no caixa;
- reservar estoque somente após confirmação do pagamento;
- não permitir edição de pedido pago;
- usar uma conta central até existir necessidade de split ou marketplace.

## 3. Arquitetura recomendada

Não coloque lógica de gateway no componente React. Use uma camada de
provedor no servidor:

```text
src/
  lib/
    payments/
      types.ts
      provider.ts
      mercado-pago.ts
      asaas.ts
      service.ts
  app/
    api/
      payments/
        create/route.ts
        webhook/[provider]/route.ts
```

O restante da aplicação deve conversar com uma interface comum. Assim, trocar
Mercado Pago por Asaas não exige reescrever o checkout.

Exemplo de contrato interno:

```ts
type CreatePixChargeInput = {
  orderId: string;
  amountCents: number;
  description: string;
  payerName: string;
  payerEmail?: string;
  expiresAt: string;
};

type PixCharge = {
  providerPaymentId: string;
  qrCode: string;
  qrCodeBase64?: string;
  expiresAt: string;
};

interface PaymentProvider {
  createPixCharge(input: CreatePixChargeInput): Promise<PixCharge>;
  getPayment(paymentId: string): Promise<PaymentProviderStatus>;
  validateWebhook(request: Request): Promise<ProviderWebhookEvent>;
}
```

Os nomes acima são um contrato interno da Kermesse. Cada adaptador deve
traduzir esse contrato para o formato específico do gateway.

## 4. Configurar a conta do gateway

No painel do provedor:

1. Crie ou selecione a conta que receberá os pagamentos.
2. Complete a validação cadastral.
3. Crie credenciais de teste.
4. Ative o produto de pagamentos Pix.
5. Cadastre uma URL de webhook HTTPS.
6. Configure credenciais de produção somente perto do lançamento.

Nunca commite tokens ou chaves no Git. Nunca envie credenciais secretas ao
navegador.

## 5. Variáveis de ambiente

As chaves secretas devem existir somente no ambiente do servidor:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=

PAYMENT_PROVIDER=mercado_pago
PAYMENT_ENVIRONMENT=sandbox
PAYMENT_WEBHOOK_BASE_URL=https://seu-dominio.com

MERCADO_PAGO_ACCESS_TOKEN=
MERCADO_PAGO_WEBHOOK_SECRET=

ASAAS_API_KEY=
ASAAS_WEBHOOK_TOKEN=
```

Use apenas `NEXT_PUBLIC_` para valores que podem ser expostos ao browser.
Tokens de gateway, segredos de webhook e chaves administrativas nunca devem
usar esse prefixo.

Depois de configurar as variáveis:

1. Reinicie o servidor local.
2. Confirme que o endpoint não imprime os segredos nos logs.
3. Verifique as variáveis no ambiente de preview.
4. Configure valores diferentes para sandbox e produção.

## 6. Criar o pedido no servidor

O navegador deve enviar somente:

```json
{
  "eventId": "uuid-do-evento",
  "customerName": "Maria da Silva",
  "items": [
    { "productId": "uuid-do-produto", "quantity": 2 }
  ],
  "paymentMethod": "pix"
}
```

O servidor deve:

1. Validar o evento e seu status.
2. Buscar os produtos no Supabase.
3. Conferir se os produtos estão ativos.
4. Conferir estoque.
5. Recalcular os preços no servidor.
6. Calcular o total em centavos.
7. Criar o pedido com status `awaiting_payment`.
8. Criar os itens em `order_items`.
9. Criar o registro `payments` como `pending`.
10. Criar a cobrança no gateway.
11. Salvar o identificador externo da cobrança em `provider_txid`.
12. Retornar o QR code e o copia e cola ao navegador.

Nunca aceite `total`, `unit_price` ou preço calculado pelo cliente como fonte de
verdade.

## 7. Valores monetários

Use sempre centavos inteiros:

```text
R$ 8,00 → 800
R$ 21,50 → 2150
```

Não use `float` para calcular valores financeiros. A coluna correspondente no
schema é `price_cents`, `unit_price_cents`, `total_cents` ou `amount_cents`.

## 8. Idempotência na criação

O usuário pode tocar duas vezes no botão ou perder a conexão depois que a
cobrança foi criada. Para evitar pedidos duplicados:

1. Gere uma chave de idempotência por tentativa de checkout.
2. Envie essa chave ao gateway quando a API permitir.
3. Persista a chave junto ao pagamento.
4. Antes de criar outra cobrança, procure um pagamento pendente para o mesmo
   pedido.
5. Reutilize a cobrança existente quando possível.

Também crie uma restrição ou tabela de eventos processados para impedir que o
mesmo webhook confirme um pagamento duas vezes.

## 9. Webhook

Crie um endpoint por provedor ou um endpoint único que identifique o provedor:

```text
POST /api/payments/webhook/mercado-pago
POST /api/payments/webhook/asaas
```

O webhook deve:

1. Receber a requisição sem confiar no corpo como prova suficiente.
2. Validar assinatura, token ou mecanismo oficial do provedor.
3. Extrair o identificador do pagamento.
4. Consultar o gateway para obter o estado atual.
5. Localizar o registro em `payments` usando `provider_txid`.
6. Ignorar notificações já processadas.
7. Atualizar o pagamento de forma transacional.
8. Se confirmado, atualizar o pedido para `paid`.
9. Reservar ou baixar o estoque uma única vez.
10. Responder rapidamente com HTTP 2xx.

Não marque o pedido como pago apenas porque o webhook informa `approved` no
corpo. Sempre consulte o pagamento no gateway quando o provedor recomendar
essa prática.

### Estados de pagamento

Mapeie os estados do provedor para estados internos:

```text
pending / waiting → pending
approved / confirmed → confirmed
rejected / cancelled / expired → failed
refunded → refunded
```

O mapeamento deve ficar dentro do adaptador do provedor, não espalhado pelas
telas.

## 10. Transação de confirmação

Ao confirmar um pagamento:

```text
iniciar transação
  buscar payment com bloqueio ou controle de concorrência
  se já confirmado: finalizar sem repetir efeitos
  atualizar payment.status = confirmed
  atualizar order.status = paid
  reservar/baixar estoque
  registrar data de confirmação
finalizar transação
```

A transação precisa ser segura quando dois webhooks iguais chegarem ao mesmo
tempo.

## 11. Expiração, cancelamento e reembolso

Defina uma rotina para cobranças que não foram pagas:

- marcar o pagamento como `failed` ou expirado;
- cancelar o pedido, se essa for a regra do produto;
- liberar o estoque reservado;
- manter o registro para auditoria.

Para reembolso:

1. Verificar se o pagamento está confirmado.
2. Solicitar o reembolso pelo gateway.
3. Atualizar `payments.status` para `refunded` somente após confirmação.
4. Registrar motivo, usuário operador e horário.
5. Não apagar o pedido nem o pagamento.

## 12. Segurança

Obrigatório antes de produção:

- Usar HTTPS no webhook.
- Validar assinatura ou token do provedor.
- Não confiar em valores enviados pelo cliente.
- Não expor access tokens no frontend.
- Aplicar RLS no Supabase.
- Restringir operações administrativas ao organizador do evento.
- Limitar tentativas de criação de cobrança.
- Validar tamanho e formato dos campos recebidos.
- Não registrar dados de cartão ou tokens em logs.
- Redigir ou mascarar identificadores sensíveis nos logs.
- Usar timeout nas chamadas ao gateway.
- Tratar retentativas sem duplicar cobrança.

Não armazene número completo, CVV ou código de segurança de cartão. Se cartão
online for adicionado no futuro, use os componentes tokenizados do provedor.

## 13. Testes locais

Antes de usar produção:

1. Use credenciais sandbox.
2. Crie um evento de teste.
3. Cadastre um produto de baixo valor.
4. Crie um pedido.
5. Verifique a cobrança retornada.
6. Pague com o método de teste do provedor.
7. Confirme o recebimento do webhook.
8. Reenvie o mesmo webhook.
9. Confirme que não houve segundo pedido nem baixa duplicada de estoque.
10. Teste expiração e falha.
11. Teste timeout e resposta inválida do gateway.
12. Teste duas confirmações simultâneas.

## 14. Testes do endpoint de webhook

O endpoint deve ser testado com:

- assinatura válida;
- assinatura inválida;
- corpo malformado;
- pagamento inexistente;
- pagamento já confirmado;
- evento duplicado;
- status desconhecido;
- gateway indisponível;
- requisição sem identificador.

Para cada cenário, documente:

- HTTP retornado;
- log esperado;
- alteração esperada no banco;
- se o provedor deve tentar novamente.

## 15. Observabilidade

Registre eventos técnicos sem dados sensíveis:

- `payment.create.started`
- `payment.create.succeeded`
- `payment.create.failed`
- `payment.webhook.received`
- `payment.webhook.rejected`
- `payment.confirmed`
- `payment.expired`
- `payment.refunded`

Inclua no log:

- `order_id`;
- nome do provedor;
- `provider_txid`, se seguro;
- status interno;
- duração da chamada;
- código HTTP do provedor;
- correlation ID.

Não inclua access token, chave secreta, QR completo ou dados de cartão.

## 16. Critérios de aceite

A integração está pronta para homologação quando:

- [ ] O checkout cria uma cobrança real em sandbox.
- [ ] O total é recalculado no servidor.
- [ ] O QR code e copia e cola são exibidos.
- [ ] O pedido permanece aguardando pagamento antes do webhook.
- [ ] O webhook é validado.
- [ ] O pagamento confirmado muda o pedido para `paid`.
- [ ] Um webhook duplicado não duplica efeitos.
- [ ] Pagamento recusado não libera produção.
- [ ] Pagamento expirado libera estoque, conforme a regra definida.
- [ ] O pedido tem senha de retirada.
- [ ] Falhas do gateway aparecem como erro compreensível ao usuário.
- [ ] Nenhuma chave secreta aparece no bundle ou no navegador.
- [ ] Testes sandbox foram registrados.
- [ ] Logs e alertas mínimos estão configurados.

## 17. Checklist de publicação

- [ ] Conta de produção validada.
- [ ] Credenciais de produção configuradas no ambiente seguro.
- [ ] Webhook HTTPS cadastrado.
- [ ] Assinatura/token do webhook validado.
- [ ] URL de retorno revisada.
- [ ] Teste de baixo valor realizado.
- [ ] Política de expiração definida.
- [ ] Política de reembolso definida.
- [ ] Monitoramento ativo.
- [ ] Plano manual para indisponibilidade do gateway comunicado aos voluntários.
