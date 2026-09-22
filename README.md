# Kermesse

MVP para reduzir filas em festas de igreja e escolas: cardápio por QR code,
pagamento digital e retirada por senha.

## Stack

- Next.js 16 com App Router, TypeScript e Tailwind CSS
- Supabase Auth, PostgreSQL e Realtime (integração preparada)
- Deploy recomendado: Vercel + Supabase

## Rodando localmente

```bash
npm install
Copy-Item .env.example .env.local
npm run dev
```

Preencha `.env.local` com a URL e a chave pública do projeto Supabase antes de
usar autenticação ou dados reais. A migração inicial está em
`supabase/migrations/0001_initial_schema.sql` e
`supabase/migrations/0002_multi_tenant_members_and_payments.sql`.

## Estrutura

```text
src/
  app/                 Rotas e telas do App Router
  lib/supabase/        Clientes browser/server e renovação de sessão
  proxy.ts             Atualização da sessão Supabase
supabase/
  migrations/          Schema inicial do domínio
```

O landing page atual é apenas a primeira tela do produto. As próximas rotas
podem ser organizadas por fluxo:

- `/evento/[slug]`: cardápio público e carrinho conectado ao Supabase
- O checkout permite escolher Pix ou pagamento com cartão no caixa. Para Pix,
  exibe o QR/copia e cola real do gateway, e a confirmação é recebida pelo
  webhook do Asaas.
- `/pedido/[id]`: acompanhamento e QR de retirada
- `/painel`: produtor, produção e retirada

## Tutoriais

- [Tutorial do organizador](./docs/tutorial-organizador.md): configuração do
  evento, produtos, pagamentos, voluntários e encerramento.
- [Fluxo do usuário](./docs/fluxo-do-usuario.md): jornada para escanear o QR
  code, comprar, pagar e retirar o pedido.
- [Integração com gateways](./docs/tutorial-integracao-gateways.md): guia
  técnico para conectar Mercado Pago ou Asaas com segurança.
- [Conta e deploy na Vercel](./docs/tutorial-conta-e-deploy-vercel.md): criação
  da conta, conexão com GitHub, variáveis de ambiente e publicação.
- [Criação do projeto Supabase](./docs/tutorial-criacao-projeto-supabase.md):
  criação do banco, Auth, Storage, Realtime, RLS e conexão com a Vercel.
