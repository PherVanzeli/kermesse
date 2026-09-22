# Tutorial: criar conta e publicar a Kermesse na Vercel

Este guia explica como criar a conta da Vercel e publicar o frontend Next.js da
Kermesse.

A arquitetura recomendada é:

```text
GitHub → Vercel → Aplicação Next.js
                 ↓
              Supabase
                 ↓
          Gateway de pagamento
```

## 1. Pré-requisitos

Antes de começar, tenha:

- Conta no GitHub.
- Repositório da Kermesse criado no GitHub.
- Projeto Supabase criado.
- URL e chave pública do Supabase.
- Domínio próprio, se já disponível.
- Acesso às credenciais do gateway, quando a integração estiver pronta.

O projeto precisa funcionar localmente:

```powershell
npm install
npm run lint
npm run build
```

## 2. Criar uma conta na Vercel

1. Acesse [vercel.com](https://vercel.com).
2. Selecione **Sign Up**.
3. Escolha **Continue with GitHub**.
4. Autorize a Vercel a acessar os repositórios necessários.
5. Confirme o e-mail da conta, se solicitado.
6. Crie ou selecione o time responsável pelo projeto.

### Recomendação de propriedade

Use uma conta ou organização pertencente à igreja, escola ou empresa
responsável pelo produto, não uma conta pessoal de um desenvolvedor.

Isso evita perder acesso ao deploy quando uma pessoa sair do projeto.

## 3. Preparar o repositório no GitHub

Na pasta local do projeto:

```powershell
git init
git add .
git commit -m "Initial Kermesse MVP"
git branch -M main
git remote add origin https://github.com/ORGANIZACAO/kermesse.git
git push -u origin main
```

Substitua `ORGANIZACAO` pelo usuário ou organização correta.

Antes do primeiro push, confirme que arquivos sensíveis não serão enviados:

```powershell
git status
```

Não envie:

- `.env`
- `.env.local`
- Tokens de gateway.
- Chaves secretas.
- Arquivos de credenciais.

O arquivo `.env.example` pode ser versionado porque não contém valores
secretos.

## 4. Importar o projeto na Vercel

1. Entre no painel da Vercel.
2. Selecione **Add New...**.
3. Escolha **Project**.
4. Encontre o repositório `kermesse`.
5. Clique em **Import**.
6. Confira as configurações:
   - Framework Preset: `Next.js`.
   - Root Directory: `.`
   - Build Command: `npm run build`.
   - Install Command: `npm install`.
   - Output Directory: deixar o padrão.
7. Não clique em deploy ainda antes de configurar as variáveis.

A Vercel normalmente detecta automaticamente o Next.js e preenche essas
opções. Mesmo assim, revise-as antes de publicar.

## 5. Configurar variáveis de ambiente

Na tela do projeto:

1. Abra **Settings**.
2. Abra **Environment Variables**.
3. Adicione as variáveis necessárias.
4. Selecione os ambientes em que cada variável será usada.

### Variáveis mínimas

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sua-chave-publica
```

Configure pelo menos em:

- Preview.
- Production.

Para Development, o arquivo `.env.local` continua sendo usado na máquina do
desenvolvedor.

### Variáveis dos gateways

Quando a integração estiver implementada:

```env
PAYMENT_PROVIDER=mercado_pago
PAYMENT_ENVIRONMENT=sandbox
PAYMENT_WEBHOOK_BASE_URL=https://kermesse.vercel.app

MERCADO_PAGO_ACCESS_TOKEN=
MERCADO_PAGO_WEBHOOK_SECRET=

ASAAS_API_KEY=
ASAAS_WEBHOOK_TOKEN=
```

Não configure variáveis de provedores que não serão usados no ambiente atual.

### Regra de segurança

Somente variáveis públicas podem começar com `NEXT_PUBLIC_`.

Nunca use esse prefixo em:

- Access token.
- API key privada.
- Segredo de webhook.
- Chave administrativa.
- Credencial de banco.

Depois de alterar variáveis de ambiente, faça um novo deploy. A alteração não
é aplicada retroativamente a uma versão já publicada.

## 6. Fazer o primeiro deploy

Depois de salvar as variáveis:

1. Volte à tela de importação.
2. Clique em **Deploy**.
3. Aguarde o build.
4. Abra a URL gerada pela Vercel.
5. Teste a página inicial.
6. Teste o evento de demonstração:

```text
/evento/arraia-sao-jose
```

O deploy pode levar alguns minutos na primeira execução.

## 7. Deploys automáticos

Depois da integração com GitHub:

- Push em `main` publica em produção.
- Pull Requests geram deployments de preview.
- Commits em branches geram URLs de teste.

Fluxo recomendado:

```text
Branch de trabalho
        ↓
Pull Request
        ↓
Preview da Vercel
        ↓
Testes
        ↓
Merge em main
        ↓
Produção
```

Não desenvolva diretamente em `main` quando o projeto começar a receber
alterações de outras pessoas.

## 8. Configurar domínio próprio

Na Vercel:

1. Abra o projeto.
2. Acesse **Settings**.
3. Selecione **Domains**.
4. Informe o domínio, por exemplo:

```text
kermesse.app
```

5. A Vercel exibirá os registros DNS necessários.
6. Abra o painel da empresa onde o domínio foi comprado.
7. Crie os registros solicitados.
8. Aguarde a propagação.
9. Confirme o domínio na Vercel.

Também é possível usar um subdomínio:

```text
app.kermesse.app
```

### Domínio do webhook

Use sempre um domínio HTTPS estável para o webhook. Depois de configurar o
domínio próprio, atualize:

```env
PAYMENT_WEBHOOK_BASE_URL=https://app.kermesse.app
```

Cadastre no gateway a URL completa do endpoint, por exemplo:

```text
https://app.kermesse.app/api/payments/webhook/mercado-pago
```

## 9. Configurar o Supabase para produção

No Supabase:

1. Abra o projeto de produção.
2. Execute as migrations do diretório `supabase/migrations`.

Para cadastrar credenciais de gateways, configure também na Vercel uma variável
de ambiente `PAYMENT_CREDENTIALS_ENCRYPTION_KEY` com 64 caracteres
hexadecimais. Gere uma chave aleatória forte e use o mesmo valor em todos os
deploys da aplicação. Não publique essa chave no repositório.

Para criar cobranças Pix no backend, configure também
`SUPABASE_SERVICE_ROLE_KEY` com a Secret key do mesmo projeto Supabase. Essa
variável é exclusiva do servidor, nunca deve começar com `NEXT_PUBLIC_` e nunca
deve ser enviada ao navegador ou commitada no repositório.
Configure também `ASAAS_WEBHOOK_TOKEN` com o token definido no webhook do Asaas.
No painel do Asaas, use `https://seu-dominio/api/webhooks/asaas` como URL e
habilite os eventos de pagamento confirmado, recebido, vencido, excluído e
estornado.
3. Confirme as políticas de RLS.
4. Copie a URL do projeto.
5. Copie a chave pública.
6. Cadastre os valores na Vercel.
7. Faça um novo deploy.

Não use o banco de desenvolvimento como banco de produção sem uma decisão
consciente. O recomendado é separar:

```text
Supabase Development → Preview
Supabase Production  → Production
```

## 10. Configurar previews

Para evitar que previews alterem dados de produção:

1. Use um projeto Supabase separado para Preview.
2. Configure as variáveis de Preview com esse projeto.
3. Use gateway em sandbox nos previews.
4. Nunca use credenciais de produção em Pull Requests.

Exemplo:

```text
Preview  → Supabase staging + gateway sandbox
Produção → Supabase production + gateway production
```

## 11. Validação pós-deploy

Depois de cada deploy de produção, verifique:

- [ ] A página inicial abre.
- [ ] O evento público abre.
- [ ] O CSS está carregando.
- [ ] O cardápio funciona no celular.
- [ ] O carrinho calcula o total.
- [ ] O checkout abre.
- [ ] As imagens carregam.
- [ ] O Supabase responde, quando conectado.
- [ ] O login funciona, quando implementado.
- [ ] O webhook está acessível via HTTPS, quando implementado.
- [ ] Nenhum segredo aparece no navegador.
- [ ] O domínio correto está sendo usado.

Teste também em:

- Chrome mobile.
- Safari mobile.
- Uma janela anônima.
- Uma conexão de celular.

## 12. Inspecionar logs

Na Vercel:

1. Abra o projeto.
2. Acesse **Deployments**.
3. Selecione o deployment.
4. Confira **Build Logs** para erros de compilação.
5. Confira **Runtime Logs** para erros durante as requisições.

Em caso de falha no build, reproduza localmente:

```powershell
npm run lint
npm run build
```

Não copie tokens ou dados pessoais ao compartilhar logs.

## 13. Rollback

Se uma publicação quebrar o sistema:

1. Abra **Deployments**.
2. Localize o último deployment saudável.
3. Selecione o menu de ações.
4. Escolha a opção de promover ou reverter para produção.
5. Confirme o funcionamento do domínio.

Depois do rollback:

1. Preserve os logs do deployment com problema.
2. Abra uma branch para corrigir a causa.
3. Teste em Preview.
4. Publique novamente somente após validar.

Rollback da aplicação não desfaz automaticamente alterações já aplicadas no
banco. Migrations precisam de estratégia própria de reversão.

## 14. Checklist de segurança

- [ ] Repositório sem `.env.local`.
- [ ] Segredos configurados somente na Vercel.
- [ ] Produção e Preview separados.
- [ ] Domínio com HTTPS.
- [ ] RLS configurado no Supabase.
- [ ] Webhook validando assinatura.
- [ ] Tokens de produção restritos.
- [ ] Acesso ao time com os menores privilégios necessários.
- [ ] MFA ativado nas contas GitHub, Vercel e gateway.
- [ ] Nenhum segredo inserido em código ou documentação.

## 15. Checklist de entrega

- [ ] Conta da Vercel criada em nome da organização responsável.
- [ ] Repositório conectado.
- [ ] Primeiro deployment concluído.
- [ ] Variáveis configuradas por ambiente.
- [ ] Supabase de produção conectado.
- [ ] Domínio configurado.
- [ ] URL de produção registrada.
- [ ] Deploy de Preview testado.
- [ ] Deploy de produção testado.
- [ ] Logs acessíveis ao responsável técnico.
- [ ] Processo de rollback conhecido.
- [ ] Gateway configurado em sandbox.
- [ ] Webhook testado antes da produção.
