# Tutorial do organizador

Este guia explica como o responsável pela igreja, escola ou associação deve
preparar um evento na Kermesse.

## 1. Antes de começar

Separe as seguintes informações:

- Nome do evento.
- Data, horário e endereço.
- Nome e contato do responsável.
- Logo ou imagem do evento, se houver.
- Lista de produtos vendidos.
- Preço de cada produto.
- Estoque disponível de cada item.
- Nome dos voluntários responsáveis pela produção e retirada.
- Dados da conta do gateway de pagamento, quando a integração estiver ativa.

Também defina previamente:

- Onde os clientes encontrarão o QR code do cardápio.
- Qual balcão será usado para retirada.
- Como os pedidos serão separados por senha.
- Quem ficará responsável por acompanhar os pedidos pagos.

## 2. Criar o evento

1. Acesse o painel da Kermesse.
2. Faça login com o e-mail do organizador.
3. Selecione **Criar evento**.
4. Preencha:
   - Nome do evento.
   - Data.
   - Horário de início e encerramento.
   - Local.
   - Logo, se disponível.
   - Cor ou tema visual.
5. Salve como **Rascunho**.

Enquanto o evento estiver em rascunho, o cardápio ainda não deve ser divulgado.
Use esse período para revisar produtos, preços e equipe.

## 3. Cadastrar produtos

Para cada produto, você pode escolher um item comum do catálogo da Kermesse ou
criar um produto personalizado:

1. Abra **Produtos**.
2. Selecione **Adicionar produto**.
3. Informe:
   - Nome curto e fácil de entender.
   - Descrição dos ingredientes ou tamanho.
   - Foto, quando disponível.
   - Categoria: comida, bebida, doce ou ingresso.
   - Preço.
   - Estoque.
4. Marque o produto como **Ativo**.
5. Salve.

Produtos comuns, como **Coca-Cola Lata 350 ml**, já podem aparecer no catálogo
com nome, categoria e preço sugerido. O organizador ainda define o preço e o
estoque específicos do evento. Produtos personalizados continuam disponíveis
para receitas próprias da comunidade.

No painel da Kermesse, a gestão de produtos fica dentro do evento em:

```text
/painel/eventos/[id]/produtos
```

O organizador pode adicionar produtos, informar estoque, escolher categoria e
desativar temporariamente itens sem apagá-los do cardápio.

### Recomendações para o cardápio

- Use nomes que o público reconheça rapidamente.
- Informe o tamanho da porção.
- Evite cadastrar produtos que não estarão disponíveis no evento.
- Use preço em reais com duas casas decimais.
- Se o estoque for ilimitado, configure o produto conforme a opção
  disponibilizada pelo painel.
- Desative imediatamente um item que acabar.

## 4. Revisar o pedido mínimo

Antes de publicar, faça um pedido de teste:

1. Abra o link público do evento.
2. Adicione pelo menos dois produtos diferentes.
3. Altere as quantidades.
4. Abra o carrinho.
5. Confira o total.
6. Avance até a tela de pagamento.
7. Confira se o nome da festa, preços e instruções estão corretos.

Após finalizar um pedido, o cliente recebe um link de acompanhamento sem
precisar criar conta. Oriente-o a salvar ou compartilhar esse link caso feche
a página:

```text
/pedido/[token]
```

O link mostra a senha, os itens e o status atualizado do pedido.

No ambiente atual, o checkout pode simular a confirmação do Pix. O pagamento
real será conectado ao Mercado Pago ou Asaas em uma etapa posterior.

## 5. Configurar pagamentos

### Pix

Quando o gateway estiver conectado:

1. Crie ou acesse a conta empresarial do provedor escolhido.
2. Complete a validação da conta.
3. Gere as credenciais de produção.
4. Cadastre as credenciais no ambiente seguro da aplicação.
5. Configure a URL de webhook fornecida pela Kermesse.
6. Faça um pagamento de teste.
7. Confirme se o pedido muda de **Aguardando pagamento** para **Pago**.

Nunca coloque chaves secretas no código do frontend, no QR impresso ou em
variáveis públicas iniciadas por `NEXT_PUBLIC_`.

### Cartão

No MVP atual, o fluxo de cartão representa pagamento no caixa. O voluntário
deve receber a senha, cobrar no terminal disponível e liberar a retirada
somente após a aprovação.

## 6. Publicar o evento

Quando tudo estiver revisado:

1. Altere o evento de **Rascunho** para **Ativo**.
2. Copie o link público do cardápio.
3. No painel, abra **QR Code do cardápio** no evento.
4. Baixe a imagem ou copie o link público.
5. Imprima ou compartilhe o QR code:
   - Nas mesas.
   - Na entrada.
   - Próximo às filas.
   - No balcão de informações.
6. Faça um teste usando outro celular ou uma janela anônima.

O QR code deve apontar para o endereço público do evento, por exemplo:

```text
https://kermesse.app/evento/arraia-sao-jose
```

## 7. Preparar os voluntários

### Produção

O voluntário da cozinha deve:

1. Abrir o painel de produção em um celular ou tablet.
2. Conferir os pedidos pagos ou liberados.
3. Aceitar o pedido.
4. Separar os itens.
5. Marcar como **Pronto**.
6. Deixar o pedido identificado pela senha.

### Retirada

O voluntário do balcão deve:

1. Abrir o painel de produção em um celular ou tablet.
2. Na coluna **Prontos**, tocar em **Abrir retirada** ou usar **Escanear QR
   Code**.
3. Pedir ao cliente que mostre o QR code na tela do pedido.
4. Conferir a senha, o nome e os itens do pedido.
5. Confirmar a entrega no modal.
6. Entregar o pedido ao cliente.

Se a câmera não funcionar, digite a senha manualmente. Não entregue um pedido
apenas com base no nome. O QR code ou a senha devem ser conferidos antes da
confirmação para reduzir entregas duplicadas.

## 8. Operação durante o evento

O organizador deve acompanhar:

- Pedidos novos.
- Pedidos aguardando pagamento.
- Pedidos em produção.
- Pedidos prontos.
- Pedidos entregues.
- Produtos com estoque baixo.
- Tempo entre pagamento, preparo e retirada.

Se a internet estiver instável:

- Mantenha um voluntário no caixa para ajudar clientes.
- Aceite a senha digitada quando o QR code não funcionar.
- Evite atualizar o catálogo várias vezes.
- Registre manualmente pedidos críticos para conferência posterior.

## 9. Encerrar o evento

Ao finalizar:

1. Desative produtos esgotados.
2. Altere o evento para **Encerrado**.
3. Confira pedidos pagos e entregues.
4. Separe pedidos pendentes para conferência.
5. Exporte o relatório do evento.
6. Compare o estoque restante com as vendas.
7. Registre problemas relatados pelos voluntários.

## 10. Checklist rápido

- [ ] Evento criado.
- [ ] Data, local e horário revisados.
- [ ] Produtos cadastrados.
- [ ] Preços conferidos.
- [ ] Estoques conferidos.
- [ ] Equipe de produção definida.
- [ ] Equipe de retirada definida.
- [ ] Pagamento testado.
- [ ] QR code impresso.
- [ ] Pedido de teste realizado.
- [ ] Voluntários treinados.
- [ ] Evento publicado.
- [ ] Evento encerrado após a festa.
