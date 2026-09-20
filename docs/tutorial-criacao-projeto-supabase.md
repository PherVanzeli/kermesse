# Tutorial: criar e configurar o projeto Supabase

Este guia explica como criar o projeto Supabase da Kermesse e conectá-lo ao
frontend Next.js hospedado na Vercel.

O Supabase será usado para:

- PostgreSQL.
- Autenticação do organizador.
- Storage de logos e imagens de produtos.
- Realtime para atualização dos pedidos.
- Row Level Security (RLS).

## 1. Pré-requisitos

Tenha disponível:

- Uma conta de e-mail da organização responsável pelo projeto.
- Acesso ao repositório GitHub da Kermesse.
- Acesso ao projeto Vercel.
- Um nome para o projeto, por exemplo `kermesse-production`.
- Uma senha forte para o banco de dados.

Use uma conta da organização, não a conta pessoal de um desenvolvedor. Ative
MFA na conta Supabase.

## 2. Criar a conta Supabase

1. Acesse [supabase.com](https://supabase.com).
2. Selecione **Start your project**.
3. Escolha **Continue with GitHub** ou crie uma conta com e-mail.
4. Confirme o e-mail, se solicitado.
5. Crie uma organização para a Kermesse ou selecione uma organização existente.

Use nomes que identifiquem claramente o ambiente:

```text
Kermesse
Kermesse - Produção
Kermesse - Staging
```

## 3. Criar o projeto

1. No painel do Supabase, selecione **New project**.
2. Escolha a organização correta.
3. Informe o nome do projeto:

```text
kermesse-production
```

4. Escolha a região mais próxima do público do evento.
5. Crie uma senha forte para o banco de dados.
6. Armazene essa senha em um gerenciador seguro.
7. Selecione o plano adequado.
8. Clique em **Create new project**.
9. Aguarde o provisionamento.

### Recomendação de região

Para usuários no Brasil, escolha uma região da América do Sul quando
disponível. Banco, funções e usuários devem ficar em uma região adequada ao
público e às exigências de privacidade do projeto.

## 4. Copiar as credenciais públicas

Depois que o projeto estiver criado:

1. Abra **Project Settings**.
2. Acesse **Data API** ou a seção equivalente de API.
3. Copie a **Project URL**.
4. Copie a chave pública recomendada pelo painel.

No projeto local, crie `.env.local` a partir do exemplo:

```powershell
Copy-Item .env.example .env.local
```

Preencha:

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sua-chave-publica
```

A chave pública pode ser usada pelo cliente quando as políticas RLS estiverem
corretas. A chave administrativa nunca deve ser enviada ao navegador.

## 5. Aplicar o schema da Kermesse

O schema inicial está em:

```text
supabase/migrations/0001_initial_schema.sql
```

### Opção A: SQL Editor

Para o primeiro projeto, a opção mais simples é:

1. Abra **SQL Editor** no Supabase.
2. Selecione **New query**.
3. Abra o arquivo `supabase/migrations/0001_initial_schema.sql`.
4. Copie o conteúdo.
5. Cole no editor.
6. Clique em **Run**.
7. Abra **Table Editor** e confirme as tabelas.

Depois de aplicar o schema inicial, repita o processo para:

```text
supabase/migrations/0002_multi_tenant_members_and_payments.sql
```

Essa segunda migration cria:

- `tenant_members`: vínculo entre usuários do Supabase Auth e organizadores.
- `payment_accounts`: configuração de gateway por organizador e ambiente.
- Policies iniciais para tenants, membros e contas de pagamento.

O campo `credentials_ciphertext` existe para armazenar uma referência ou valor
criptografado pelo backend. Não grave access tokens em texto puro. A chave de
criptografia deve ficar somente no ambiente do servidor, nunca em uma variável
`NEXT_PUBLIC_` e nunca no banco junto do ciphertext.

Depois aplique a migration de bootstrap da conta:

```text
supabase/migrations/0003_auth_tenant_bootstrap.sql
```

Ela cria automaticamente um tenant e um membro com papel `owner` quando um
novo usuário é cadastrado pelo Supabase Auth. Isso permite que cada
organizador comece com uma organização isolada.

Para permitir o gerenciamento de eventos e produtos pelo painel, aplique
também:

```text
supabase/migrations/0004_event_product_policies.sql
```

Para liberar a consulta pública do cardápio, aplique por último:

```text
supabase/migrations/0005_public_catalog_policies.sql
```

Essa migration permite que visitantes consultem somente eventos `active` e
produtos ativos desses eventos. Eventos em rascunho continuam invisíveis.

Para habilitar o catálogo de produtos comuns, aplique depois:

```text
supabase/migrations/0006_product_catalog.sql
```

Essa migration cria `catalog_products`, adiciona a referência opcional em
`products` e insere produtos iniciais como Coca-Cola Lata 350 ml, água,
pastel, cachorro-quente e canjica.

Para habilitar fotos dos produtos, aplique por último:

```text
supabase/migrations/0007_product_images_storage.sql
```

Ela cria o bucket público `product-images`. O painel limita uploads a imagens
JPG, PNG ou WebP de até 2 MB.

Devem existir, entre outras:

- `tenants`
- `events`
- `products`
- `orders`
- `order_items`
- `payments`
- `operators`

### Opção B: Supabase CLI

Para um fluxo controlado por migrations:

1. Instale a Supabase CLI seguindo a documentação oficial.
2. Faça login:

```powershell
supabase login
```

3. Vincule o projeto remoto:

```powershell
supabase link --project-ref SEU_PROJECT_REF
```

4. Aplique as migrations:

```powershell
supabase db push
```

O `project-ref` pode ser encontrado na URL ou nas configurações do projeto.

Use a CLI em equipe para manter o schema versionado. Não edite diretamente o
banco de produção sem registrar a mudança em uma migration.

## 6. Conferir tipos e relacionamentos

No **Table Editor**, confirme:

- Produtos pertencem a um evento.
- Eventos pertencem a um tenant.
- Itens pertencem a um pedido.
- Pagamentos pertencem a um pedido.
- Exclusão de evento não remove pedidos importantes sem uma decisão explícita.
- Valores monetários estão em centavos inteiros.

Os tipos de status devem existir:

```text
event_status
order_status
payment_method
payment_status
operator_role
```

## 7. Configurar autenticação

No Supabase:

1. Abra **Authentication**.
2. Acesse **Providers**.
3. Ative o provedor de e-mail.
4. Defina confirmação de e-mail conforme a política do produto.
5. Configure a URL local:

```text
http://localhost:3000
```

6. Adicione a URL de produção:

```text
https://kermesse.app
```

7. Adicione a URL de preview da Vercel, se necessário.

Para recuperação de senha, configure os templates de e-mail em **Authentication
> Email Templates**.

### Redirecionamento após confirmação

O cadastro da Kermesse envia o usuário para `/auth/callback` usando o domínio
atual da aplicação. No Supabase, em **Authentication > URL Configuration**,
configure:

**Site URL**:

```text
https://kermesse-prod.vercel.app
```

**Redirect URLs**:

```text
http://localhost:3000/auth/callback
https://kermesse-prod.vercel.app/auth/callback
```

Se o domínio próprio for configurado depois, adicione também:

```text
https://kermesse.app/auth/callback
```

Não use `http://localhost:3000` como único **Site URL** quando estiver
testando a aplicação publicada. Depois de alterar essas URLs, faça um novo
cadastro para gerar um novo e-mail de confirmação; links antigos podem
continuar apontando para a configuração anterior.

### Login social

Google ou outro provedor pode ser adicionado depois. Para o MVP, login por
e-mail e senha é suficiente.

## 8. Configurar o Storage

Crie buckets separados para imagens públicas e arquivos privados, conforme a
necessidade:

```text
event-logos
product-images
```

Para criar um bucket:

1. Abra **Storage**.
2. Selecione **New bucket**.
3. Informe o nome.
4. Defina se os arquivos serão públicos ou privados.
5. Salve.

### Recomendação de acesso

- Logos e fotos de produtos podem ser públicas quando usadas no cardápio.
- Arquivos administrativos devem ser privados.
- Limite extensões e tamanho de upload.
- Não permita que qualquer usuário sobrescreva arquivos de outro evento.
- Use políticas de Storage baseadas no usuário e no tenant.

Não coloque imagens diretamente no repositório se elas forem conteúdo dos
eventos. Use Storage e salve apenas a URL ou caminho no banco.

## 9. Ativar Realtime

O painel de produção poderá acompanhar mudanças nos pedidos usando Realtime.

1. Abra **Database**.
2. Acesse a configuração de publicação ou Realtime.
3. Adicione as tabelas necessárias, começando por:

```text
orders
```

4. Salve a configuração.

Ative somente as tabelas necessárias. Realtime não substitui autorização:
RLS continua obrigatório.

## 10. Configurar RLS

As tabelas de negócio devem permanecer com RLS habilitado:

- `events`
- `products`
- `orders`
- `order_items`
- `payments`
- `operators`

As políticas precisam separar três tipos de acesso:

1. Leitura pública limitada do evento e produtos ativos.
2. Acesso do organizador aos próprios eventos e dados.
3. Acesso dos operadores somente aos pedidos do evento em que trabalham.

### Regras mínimas

- Usuário não pode ler dados de outro tenant.
- Usuário não pode alterar o preço enviado pelo cliente.
- Cliente público não pode listar todos os pedidos.
- Cliente deve acessar somente o próprio pedido usando um identificador seguro.
- Operador de produção não deve alterar configurações do evento.
- Operador de retirada não deve alterar produtos.
- Pagamentos devem ser atualizados pelo servidor ou função confiável.

Antes de colocar em produção, teste as políticas com usuários diferentes.
Nunca deixe tabelas de pedidos abertas para leitura pública.

## 11. Configurar a Vercel

Na Vercel:

1. Abra o projeto da Kermesse.
2. Acesse **Settings**.
3. Selecione **Environment Variables**.
4. Adicione:

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sua-chave-publica
```

5. Selecione `Preview` e `Production` conforme o projeto.
6. Salve.
7. Faça um novo deployment.

Use projetos Supabase separados:

```text
Preview     → kermesse-staging
Production  → kermesse-production
```

Não use a chave de serviço (`service_role`) em variáveis públicas. Se uma
operação administrativa precisar dela, execute-a no servidor e armazene-a como
segredo sem o prefixo `NEXT_PUBLIC_`.

## 12. Testar a conexão local

Com `.env.local` configurado:

```powershell
npm run dev
```

Verifique:

1. A aplicação abre em `http://localhost:3000`.
2. O cardápio de teste abre em `/evento/arraia-sao-jose`.
3. O cliente Supabase consegue iniciar sem erro.
4. A aplicação não exibe tokens no navegador.

Depois execute:

```powershell
npm run lint
npm run build
```

## 13. Criar dados iniciais de teste

Use o SQL Editor ou o painel para criar:

- Um tenant de teste.
- Um evento ativo.
- Três produtos.
- Um operador de produção.
- Um operador de retirada.

Não use dados reais de clientes durante o desenvolvimento.

Exemplo de valores:

```text
Evento: Arraiá de Teste
Produto: Pastel de queijo
Preço: 800 centavos
Estoque: 50
```

## 14. Ambientes

Mantenha pelo menos dois ambientes:

### Staging

- Projeto Supabase separado.
- Dados fictícios.
- Gateway em sandbox.
- Usado por Pull Requests e homologação.

### Produção

- Projeto Supabase separado.
- Dados reais.
- Gateway de produção.
- Acesso administrativo restrito.

Nunca copie dados reais de clientes para staging sem anonimização.

## 15. Backup e manutenção

Antes de mudanças importantes:

1. Confirme o backup disponível no plano utilizado.
2. Registre a migration.
3. Teste a migration em staging.
4. Faça backup ou exportação conforme a política da organização.
5. Aplique em produção em horário controlado.

Migrations destrutivas exigem plano de rollback. Evite apagar colunas ou tabelas
sem uma etapa de transição.

## 16. Checklist de segurança

- [ ] MFA ativado na conta Supabase.
- [ ] Organização responsável configurada.
- [ ] Senha do banco armazenada com segurança.
- [ ] `.env.local` ignorado pelo Git.
- [ ] Chave pública separada de chaves administrativas.
- [ ] RLS ativo nas tabelas de negócio.
- [ ] Políticas testadas com usuários diferentes.
- [ ] Storage com políticas de acesso.
- [ ] Realtime limitado às tabelas necessárias.
- [ ] Projeto de staging separado da produção.
- [ ] Backups e migrations documentados.
- [ ] URLs de autenticação revisadas.

## 17. Checklist de entrega

- [ ] Projeto Supabase criado.
- [ ] Região definida.
- [ ] Schema aplicado.
- [ ] Tabelas conferidas.
- [ ] Auth configurado.
- [ ] Storage configurado.
- [ ] Realtime configurado.
- [ ] RLS habilitado e testado.
- [ ] Variáveis configuradas na Vercel.
- [ ] Deploy validado.
- [ ] Dados de teste criados em staging.
- [ ] Processo de migration definido.
- [ ] Acesso de produção entregue somente à equipe autorizada.
