# Fluxo do usuário

Este documento descreve o caminho realizado por uma pessoa que compra na
Kermesse durante uma festa.

## 1. Encontrar o cardápio

O usuário encontra um QR code em uma mesa, parede, entrada ou material de
divulgação.

1. Abra a câmera do celular.
2. Aponte para o QR code.
3. Toque no link exibido.
4. O cardápio do evento será aberto no navegador.

Não é necessário instalar aplicativo ou criar uma conta para consultar o
cardápio.

## 2. Escolher os produtos

Na tela do evento, o usuário verá:

- Nome da festa.
- Local e horário.
- Categorias do cardápio.
- Produtos disponíveis.
- Preço e descrição de cada item.

Para montar o pedido:

1. Selecione uma categoria ou mantenha **Todos**.
2. Toque no botão `+` do produto desejado.
3. Toque novamente para aumentar a quantidade.
4. Use o botão flutuante do carrinho para revisar o pedido.

## 3. Revisar o carrinho

No carrinho, o usuário deve:

1. Conferir os produtos.
2. Ajustar as quantidades.
3. Remover itens que não deseja.
4. Conferir o total.
5. Selecionar **Continuar para pagamento**.

O total é recalculado automaticamente conforme as quantidades são alteradas.

## 4. Informar o nome para retirada

Na tela de pagamento, informe o nome que ajudará a identificar o pedido no
balcão. A senha do pedido continua sendo o identificador principal.

Exemplo:

```text
Maria da Silva
```

Use um nome que o próprio usuário reconheça quando ouvir a chamada da retirada.

## 5. Escolher a forma de pagamento

### Pix

1. Selecione **Pix**.
2. Confirme o pedido.
3. Copie o código Pix ou escaneie o QR code.
4. Abra o aplicativo do banco.
5. Faça o pagamento.
6. Aguarde a confirmação.

No fluxo atual, a confirmação do Pix é simulada. Quando o gateway estiver
conectado, essa confirmação será feita automaticamente pelo webhook do
provedor.

### Cartão

1. Selecione **Cartão**.
2. Confirme o pedido.
3. Anote a senha exibida.
4. Vá ao caixa indicado.
5. Faça o pagamento no terminal.
6. Aguarde a liberação conforme a operação da festa.

No MVP atual, cartão significa pagamento no balcão. A integração futura poderá
adicionar pagamento com cartão diretamente no celular.

## 6. Guardar a senha e o QR code

Depois da criação do pedido, a tela mostra:

- Senha, por exemplo `A-347`.
- QR code de retirada.
- Status do pagamento.
- Instruções para o próximo passo.

Não feche a tela sem guardar a senha. Se possível, faça uma captura de tela.

## 7. Acompanhar o pedido

O pedido passa pelos seguintes estados:

1. **Aguardando pagamento**  
   O pedido foi criado, mas o Pix ainda não foi confirmado.
2. **Pago**  
   O pagamento foi aprovado ou confirmado no caixa.
3. **Preparando**  
   A barraca começou a preparar os itens.
4. **Pronto**  
   O pedido está disponível para retirada.
5. **Entregue**  
   O voluntário confirmou a entrega.

O usuário só deve se dirigir ao balcão quando o pedido estiver pronto, salvo
orientação diferente dos voluntários.

## 8. Retirar o pedido

Quando o pedido estiver pronto:

1. Vá ao balcão de retirada.
2. Informe a senha ou mostre o QR code.
3. Aguarde o voluntário conferir os itens.
4. Receba o pedido.
5. Confira se todos os produtos estão presentes antes de sair.

Caso a senha não seja localizada, informe o nome usado no pedido e o horário
aproximado da compra para que a equipe possa ajudar.

## 9. Problemas comuns

### O QR code não abre

- Confira se o celular está conectado à internet.
- Aumente a iluminação.
- Aproxime ou afaste a câmera.
- Peça o link ao voluntário.

### O produto aparece indisponível

O estoque pode ter acabado. Escolha outro item ou consulte um voluntário.

### O pagamento Pix foi feito, mas não confirmou

- Confira se o valor e o destinatário estão corretos.
- Não faça um segundo pagamento imediatamente.
- Guarde o comprovante.
- Procure o caixa ou organizador com a senha do pedido.

### Perdi a senha

Procure o balcão de atendimento e informe:

- Nome usado no pedido.
- Horário aproximado da compra.
- Valor pago.
- Comprovante do pagamento, se houver.

## 10. Resumo da jornada

```text
Escanear QR code
      ↓
Escolher produtos
      ↓
Revisar carrinho
      ↓
Informar nome
      ↓
Escolher Pix ou cartão
      ↓
Guardar senha e QR code
      ↓
Aguardar "Pronto"
      ↓
Mostrar senha ou QR code
      ↓
Receber o pedido
```
