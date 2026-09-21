# Política de isolamento de pagamentos

Este documento define as regras obrigatórias para impedir que pagamentos,
pedidos ou confirmações de um evento sejam associados a outro evento.

## Escopo

As regras se aplicam a:

- pedidos públicos;
- cobranças Pix ou cartão;
- conexões de gateway dos organizadores;
- webhooks dos provedores;
- painéis de produção e retirada;
- auditoria e relatórios financeiros.

## Invariantes obrigatórias

1. Todo pedido pertence a exatamente um evento por meio de `orders.event_id`.
2. Todo pagamento pertence a exatamente um pedido.
3. Todo pagamento deve registrar o evento do pedido e a conexão de gateway usada.
4. O evento e a conexão de gateway devem pertencer ao mesmo organizador.
5. O evento usado para criar um pedido é imutável para esse pedido.
6. A conexão de gateway usada para criar um pagamento é imutável para esse pagamento.
7. Trocar o gateway de um evento só afeta pedidos novos.
8. Uma cobrança externa não pode ser vinculada a dois pagamentos internos.
9. O valor confirmado deve ser exatamente o valor esperado do pagamento.
10. O frontend nunca pode confirmar um pagamento.
11. Um webhook inválido ou ambíguo nunca pode liberar um pedido para produção.
12. Um webhook repetido não pode gerar efeitos repetidos.

## Identidade de um pagamento

Nenhum pagamento pode ser localizado somente por valor, nome, horário, senha de
retirada ou identificador público do evento.

A identificação válida precisa formar a cadeia:

```text
gateway
  -> conexão do organizador
  -> evento
  -> pedido
  -> pagamento
```

Quando o provedor permitir metadados, a cobrança deve incluir:

```json
{
  "kermesse_order_id": "uuid do pedido",
  "kermesse_event_id": "uuid do evento",
  "kermesse_tenant_id": "uuid do organizador"
}
```

O `order_id` é a referência principal. `event_id` e `tenant_id` são validações
adicionais e devem ser comparados com os registros internos.

## Regras de criação

Ao criar um pedido que exige pagamento online, o backend deve:

1. Validar que o evento existe e está ativo.
2. Buscar a conexão habilitada para esse evento.
3. Confirmar que a conexão pertence ao mesmo organizador do evento.
4. Criar o pedido vinculado ao evento.
5. Criar o pagamento vinculado ao pedido, evento e conexão.
6. Criar a cobrança externa usando essa conexão.
7. Persistir o identificador externo somente depois de validar a resposta do gateway.

O cliente pode escolher o método de pagamento, mas nunca pode escolher uma
conexão, fornecer credenciais ou indicar o `tenant_id`.

## Regras de webhook

Todo webhook deve ser processado nesta ordem:

1. Identificar o provedor pela rota.
2. Validar a assinatura, token ou mecanismo oficial do provedor.
3. Identificar a cobrança externa.
4. Localizar o pagamento interno pela conexão e pelo identificador externo.
5. Confirmar que o provedor da cobrança corresponde ao pagamento.
6. Confirmar que a conexão corresponde ao pagamento.
7. Confirmar que o evento interno corresponde ao pedido.
8. Confirmar os metadados do evento e organizador, quando disponíveis.
9. Confirmar o valor e a moeda.
10. Mapear o status externo para um status interno permitido.
11. Registrar o evento de webhook de forma idempotente.
12. Atualizar pagamento e pedido na mesma transação.

Se qualquer validação falhar, o sistema deve registrar a rejeição e manter o
pedido no estado anterior.

## Estados de pagamento e pedido

O pedido só pode avançar para `paid` quando o pagamento correspondente estiver
`confirmed`.

```text
awaiting_payment -> paid -> preparing -> ready -> delivered
```

Estados de falha, expiração ou estorno não podem liberar produção:

```text
pending -> failed
pending -> expired
confirmed -> refunded
```

Um pedido já entregue não deve ser alterado por um webhook tardio, exceto por
um fluxo administrativo explícito e auditado.

## Isolamento entre eventos

Dois eventos simultâneos, inclusive usando a mesma conta de gateway, devem ser
tratados como conjuntos independentes.

O sistema deve rejeitar:

- um webhook de cobrança do Evento A aplicado ao pedido do Evento B;
- uma cobrança externa já vinculada a outro pagamento;
- uma conexão pertencente a outro organizador;
- um valor diferente do valor registrado;
- um pedido de evento encerrado, salvo regra administrativa explícita;
- uma atualização de produção sem o evento correto no contexto da API.

Senhas de retirada, como `A-042`, só têm significado dentro do evento:

```text
event_id + pickup_code
```

## Auditoria mínima

Para cada pagamento, a auditoria deve conseguir responder:

- qual organizador;
- qual evento;
- qual pedido;
- qual conexão;
- qual provedor;
- qual identificador externo;
- qual valor esperado;
- qual valor confirmado;
- quando foi criado;
- quando foi confirmado;
- qual webhook causou a atualização;
- quais validações foram rejeitadas.

Não registrar API keys, tokens secretos ou dados de cartão em logs.

## Critérios de aprovação da Fase 0

A Fase 0 está concluída quando:

- estas regras forem tratadas como requisito para as fases seguintes;
- o modelo de dados da Fase 1 incluir evento e conexão no pagamento;
- a criação de pedidos não aceitar conexão ou organizador fornecidos pelo cliente;
- os webhooks forem projetados para validar a cadeia completa;
- existirem testes para webhook cruzado, valor divergente e duplicidade.

Nenhuma integração de gateway deve ser liberada em produção antes de cumprir
esses critérios.
