# Guedias — Loja de produtos impressos em 3D

Loja online da Guedias (marca fictícia de produtos impressos em 3D, numa
impressora Creality Hi Combo). Construída com **Next.js 14 (App Router) +
TypeScript + Tailwind CSS**, com:

- **Base de dados real** — [Supabase](https://supabase.com) (Postgres) para
  produtos, categorias, perfis de utilizador e encomendas.
- **Contas de utilizador reais** — registo/login por email+password via
  Supabase Auth, com histórico de encomendas em `/conta`.
- **Pagamentos reais** — [Stripe Checkout](https://stripe.com) (cartão,
  Multibanco, MB WAY, consoante o que ativares no teu Dashboard Stripe).

Nada disto funciona "out of the box" sem as tuas próprias credenciais — são
contas que só tu podes criar. Este guia mostra exatamente os passos.

## 1. Correr localmente (sem nada configurado)

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000). O site funciona e
navega-se todo, mas mostra um aviso amarelo/laranja no topo e a loja aparece
vazia — porque ainda não há Supabase nem Stripe ligados. Os passos abaixo
resolvem isso.

## 2. Configurar a base de dados (Supabase)

1. Cria uma conta em [supabase.com](https://supabase.com) e um novo projeto
   (grátis para começar).
2. No painel do projeto, vai a **SQL Editor** → **New query**, cola o
   conteúdo de [`supabase/schema.sql`](supabase/schema.sql) e corre (▶). Isto
   cria as tabelas `categories`, `products`, `profiles`, `orders`,
   `order_items` e as respetivas regras de segurança (Row Level Security).
3. Faz o mesmo com [`supabase/seed.sql`](supabase/seed.sql) — carrega as 4
   categorias e os 18 produtos fictícios para veres a loja com conteúdo.
4. Vai a **Project Settings → API** e copia:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key (⚠️ secreta) → `SUPABASE_SERVICE_ROLE_KEY`
5. Copia `.env.local.example` para `.env.local` e cola esses três valores.
6. (Opcional, recomendado em dev) Em **Authentication → Providers → Email**,
   podes desativar "Confirm email" enquanto testas, para entrares logo após
   te registares sem teres de confirmar por email.

```bash
cp .env.local.example .env.local
```

Reinicia `npm run dev` — a loja e o registo/login já devem funcionar.

## 3. Configurar pagamentos (Stripe)

1. Cria uma conta em [stripe.com](https://stripe.com). Fica automaticamente
   em **modo de teste** — nenhum dinheiro real se move enquanto não
   ativares o modo live.
2. Em **Developers → API keys**, copia:
   - `Publishable key` (`pk_test_...`) → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - `Secret key` (`sk_test_...`) → `STRIPE_SECRET_KEY`
3. Para receberes os eventos de pagamento em localhost, instala a
   [Stripe CLI](https://docs.stripe.com/stripe-cli) e corre:
   ```bash
   stripe login
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```
   O comando mostra um `whsec_...` — copia para `STRIPE_WEBHOOK_SECRET` no
   `.env.local`. Deixa este comando a correr numa janela de terminal
   enquanto testas compras localmente.
4. Testa uma compra com um [cartão de teste do Stripe](https://docs.stripe.com/testing),
   por exemplo `4242 4242 4242 4242`, qualquer data futura e qualquer CVC.
5. (Opcional) Em **Settings → Payment methods** no Dashboard Stripe, ativa
   **Multibanco** e/ou **MB WAY** para pagamentos tipicamente portugueses —
   o código já não precisa de mudar, o Stripe Checkout mostra
   automaticamente os métodos que tiveres ativos.

## 4. Página de administração (criar/editar produtos sem SQL)

Já tens o Supabase configurado (secção 2)? Falta só tornares-te administradora:

1. Cria a tua conta em `/conta/registar`, se ainda não tiveres uma.
2. No **SQL Editor** do Supabase, corre
   [`supabase/migrations/0002_admin_products.sql`](supabase/migrations/0002_admin_products.sql)
   (se criaste o projeto de raiz depois desta funcionalidade existir, isto já
   está incluído no `schema.sql` e podes saltar este passo).
3. Ainda no SQL Editor, troca o email e corre:
   ```sql
   update profiles set is_admin = true where id =
     (select id from auth.users where email = 'o-teu-email@exemplo.com');
   ```
4. Volta a entrar no site (ou recarrega a página) — aparece um link **Admin**
   no menu, que leva a `/admin`: lista de produtos, com criar/editar/apagar,
   tudo por formulário (nome, preço, categoria, cores, materiais,
   personalização, foto opcional por URL, etc. — nada de SQL manual).

Só contas com `is_admin = true` conseguem escrever na tabela `products` —
é uma regra da própria base de dados (Row Level Security), não só da
interface, por isso mesmo alguém a tentar contornar a página de admin não
consegue escrever produtos sem essa permissão.

## 5. Publicar (Vercel) e ativar pagamentos a sério

1. Cria um repositório Git e envia o projeto para o GitHub (ou outro).
2. Em [vercel.com](https://vercel.com), importa o repositório.
3. Em **Settings → Environment Variables**, adiciona as mesmas variáveis do
   `.env.local`, e define `NEXT_PUBLIC_SITE_URL` para o domínio que o Vercel
   te der (ex: `https://guedias.vercel.app`).
4. Depois de publicado, cria um **novo webhook** no Stripe Dashboard
   (**Developers → Webhooks → Add endpoint**), com o URL
   `https://<o-teu-domínio>/api/webhooks/stripe` e o evento
   `checkout.session.completed` (+ `checkout.session.async_payment_succeeded`).
   Copia o `whsec_...` gerado para `STRIPE_WEBHOOK_SECRET` no Vercel (é
   diferente do que usas localmente com a Stripe CLI).
5. **Para aceitar dinheiro a sério**: no Dashboard Stripe, ativa o modo
   **Live**, completa a verificação da tua empresa/identidade (pedida pelo
   Stripe/legislação), e troca as chaves de teste por chaves live
   (`pk_live_...` / `sk_live_...`) nas variáveis de ambiente do Vercel — e
   cria também um webhook em modo live com o seu próprio `whsec_...`.

## Estrutura

```
src/
  app/
    page.tsx                     → Página inicial
    loja/page.tsx                 → Catálogo (filtro por categoria + pesquisa)
    produto/[slug]/page.tsx       → Página de detalhe do produto
    carrinho/page.tsx             → Carrinho de compras (localStorage)
    checkout/page.tsx             → Revisão + escolha de envio → Stripe
    checkout/confirmacao/         → Confirmação (lida diretamente do Stripe)
    conta/entrar, conta/registar  → Login e registo (Supabase Auth)
    conta/page.tsx                → Perfil + histórico de encomendas
    admin/                        → Painel de administração (só is_admin=true)
      page.tsx                    → Lista de produtos (editar/apagar)
      produtos/novo/               → Criar produto
      produtos/[id]/editar/        → Editar produto
      actions.ts                  → Server Actions (criar/editar/apagar produto)
    api/checkout/route.ts         → Cria a sessão de pagamento Stripe
    api/webhooks/stripe/route.ts  → Regista a encomenda paga na base de dados
  components/                     → Header, Footer, carrinho, ProductForm, etc.
  data/categories.ts              → As 4 categorias (taxonomia fixa)
  lib/
    data/products.ts              → Consultas de produtos ao Supabase
    supabase/                     → Clientes Supabase (browser/servidor/admin)
    stripe.ts                     → Cliente Stripe
    auth.ts                       → Utilizador autenticado atual (+ isAdmin)
supabase/
  schema.sql                      → Tabelas + Row Level Security (versão completa)
  migrations/0002_admin_products.sql → Incremento: admin + foto por URL
  seed.sql                        → Categorias e 18 produtos fictícios
middleware.ts                     → Refresca a sessão Supabase em cada pedido
```

## Como o pagamento fica ligado à base de dados

1. `/checkout` envia o carrinho para `POST /api/checkout`, que **recalcula os
   preços a partir da base de dados** (nunca confia no preço guardado no
   browser) e cria uma Stripe Checkout Session.
2. O cliente é redirecionado para a página segura do Stripe — nós nunca
   vemos nem guardamos dados de cartão.
3. Depois de pagar, o Stripe chama `POST /api/webhooks/stripe`, que confirma
   a assinatura do pedido e grava a encomenda (`orders` + `order_items`) na
   base de dados com a service role key (ignora RLS de propósito — é o único
   sítio do código que escreve encomendas).
4. `/checkout/confirmacao` lê o resultado diretamente da sessão Stripe (não
   depende do webhook já ter corrido) e `/conta` lê as encomendas gravadas
   na base de dados para o utilizador autenticado.

## Notas

- Por omissão, as imagens dos produtos são geradas visualmente (silhuetas em
  "camadas", como uma impressão FDM). Em `/admin`, o campo "Foto (URL)" deixa
  usar uma fotografia real em vez disso — se ficar vazio, mantém-se o
  placeholder gerado.
- As categorias (`src/data/categories.ts`) ficam fixas no código por
  simplicidade — são só 4 e raramente mudam. Os produtos, esses, vivem
  inteiramente na base de dados e são geridos em `/admin`.
- Só contas com `profiles.is_admin = true` conseguem criar/editar/apagar
  produtos — é imposto por Row Level Security na base de dados, não só pela
  interface. Ver secção 4 para te tornares administradora.
- Envio limitado a Portugal por agora (`shipping_address_collection` em
  `src/app/api/checkout/route.ts`) — fácil de alargar a mais países.
- `SUPABASE_SERVICE_ROLE_KEY` e `STRIPE_SECRET_KEY` nunca devem ter o
  prefixo `NEXT_PUBLIC_` nem ser expostas ao browser — só são usadas em
  Route Handlers (servidor).

## Próximos passos sugeridos

- Upload de fotografias (Supabase Storage) em vez de colar um URL.
- Gestão de stock/disponibilidade por produto.
- Emails transacionais (confirmação de encomenda, atualização de estado).
- Alargar `shipping_address_collection` a mais países, se aplicável.
