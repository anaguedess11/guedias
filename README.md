# Guedias — Loja de produtos impressos em 3D

Loja online da Guedias (marca fictícia de produtos impressos em 3D, numa
impressora Creality Hi Combo). Construída com **Next.js 14 (App Router) +
TypeScript + Tailwind CSS**, com:

- **Base de dados real** — [Supabase](https://supabase.com) (Postgres) para
  produtos, categorias, perfis de utilizador e encomendas.
- **Contas de utilizador reais** — registo/login por email+password via
  Supabase Auth, com histórico de encomendas em `/conta`.
- **Pagamentos por MB WAY ou transferência bancária** — sem gateway de
  pagamentos nesta fase inicial (sem taxas de plataforma): o cliente escolhe
  o método no checkout, recebe as instruções por email, e um admin confirma
  manualmente a receção em `/admin/encomendas`.

Nada disto funciona "out of the box" sem as tuas próprias credenciais — são
contas que só tu podes criar. Este guia mostra exatamente os passos.

## 1. Correr localmente (sem nada configurado)

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000). O site funciona e
navega-se todo, mas mostra um aviso amarelo/laranja no topo e a loja aparece
vazia — porque ainda não há Supabase ligado. Os passos abaixo resolvem isso.

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

## 3. Configurar pagamentos (MB WAY / transferência bancária)

Sem gateway de pagamentos nesta fase inicial — evita as taxas de uma
plataforma como o Stripe enquanto a loja está a arrancar. O fluxo é manual:

1. No checkout, o cliente escolhe **MB WAY** ou **Transferência bancária** e
   confirma a encomenda (sem cartão, sem redireção para terceiros).
2. A encomenda fica com estado **"Pagamento pendente"** e o cliente recebe
   um email com as instruções (o teu número MB WAY, ou o IBAN e referência a
   usar na transferência).
3. Depois de veres o pagamento a entrar (na app MB WAY ou no homebanking),
   abre a encomenda em `/admin/encomendas/[id]` e clica **"Marcar como
   paga"** — isto atualiza o estado e envia o email de confirmação ao
   cliente.

Preenche estes valores no `.env.local` (aparecem na página de confirmação e
nos emails):

```bash
NEXT_PUBLIC_MBWAY_PHONE=9xx xxx xxx
NEXT_PUBLIC_BANK_HOLDER=Nome do titular da conta
NEXT_PUBLIC_BANK_IBAN=PT50 0000 0000 0000 0000 0000 0
NEXT_PUBLIC_BANK_NAME=Nome do banco
```

Se mais tarde quiseres pagamentos automáticos (cartão, referência
Multibanco, etc.), o sítio a mexer é `src/app/api/checkout/route.ts` — hoje
grava a encomenda diretamente na base de dados; um gateway substituiria isso
por uma sessão de pagamento e um webhook de confirmação.

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
   no menu, que leva a `/admin`: **Painel** (métricas), **Produtos**
   (criar/editar/apagar por formulário — nome, preço, categoria, cores,
   materiais, personalização, foto, etc., sem SQL manual), **Encomendas** e
   **Calculadora**.
5. Para **carregar fotografias** dos produtos (em vez de colar um URL), corre
   [`supabase/migrations/0005_product_images_storage.sql`](supabase/migrations/0005_product_images_storage.sql)
   no SQL Editor — cria o bucket de Storage `product-images` (público para
   leitura, escrita só para admins). Sem isto, o botão "Carregar foto" dá erro
   mas o campo "colar um URL externo" continua a funcionar.
6. Para a **conta do cliente** (editar perfil + morada guardada, detalhe da
   encomenda com rastreio, favoritos), corre
   [`supabase/migrations/0006_customer_account.sql`](supabase/migrations/0006_customer_account.sql).
   A morada guardada no perfil aparece pré-preenchida no formulário de
   checkout.
7. Para os **pagamentos por MB WAY / transferência** (sem Stripe), corre
   [`supabase/migrations/0007_manual_payments.sql`](supabase/migrations/0007_manual_payments.sql)
   — adiciona `payment_method` às encomendas e remove as colunas do Stripe.

Só contas com `is_admin = true` conseguem escrever na tabela `products` —
é uma regra da própria base de dados (Row Level Security), não só da
interface, por isso mesmo alguém a tentar contornar a página de admin não
consegue escrever produtos sem essa permissão.

## 5. Emails transacionais (Resend)

Confirmação de encomenda e atualizações de estado (em produção / enviada /
entregue) são enviadas por email via [Resend](https://resend.com).

1. Cria uma conta em [resend.com](https://resend.com) (tem plano gratuito).
2. Em **API Keys**, cria uma chave e copia para `RESEND_API_KEY`.
3. Sem verificares o teu próprio domínio, deixa `EMAIL_FROM` como
   `Guedias <onboarding@resend.dev>` — o Resend permite enviar de teste com
   este remetente. Quando tiveres um domínio, verifica-o em **Domains** no
   Resend e muda `EMAIL_FROM` para algo como `Guedias <encomendas@oteudominio.pt>`.
4. Se já tinhas a base de dados criada antes desta funcionalidade, corre
   também [`supabase/migrations/0003_order_fulfillment.sql`](supabase/migrations/0003_order_fulfillment.sql)
   no SQL Editor (adiciona o estado de produção/envio às encomendas).
5. Testa: faz uma compra de teste no checkout — chega um email de "encomenda
   recebida" com as instruções de pagamento ao endereço que indicaste. Marca
   a encomenda como paga em `/admin/encomendas/[id]` — chega um segundo
   email de confirmação. Depois muda o estado para "Em produção", "Enviada"
   ou "Entregue" — cada mudança envia um novo email ao cliente.
6. Se já tinhas a base de dados criada antes desta funcionalidade, corre
   também [`supabase/migrations/0004_order_admin_actions.sql`](supabase/migrations/0004_order_admin_actions.sql).
   Clica no número de uma encomenda para abrir o detalhe: aí podes marcar
   como paga, cancelar, registar um reembolso (feito à parte, por MB WAY ou
   transferência), editar a morada de envio, deixar notas internas e
   reenviar o email de confirmação.

Sem `RESEND_API_KEY` configurada, a loja continua a funcionar normalmente —
só não envia emails (fica um aviso na consola do servidor).

## 6. Publicar (Vercel)

1. Cria um repositório Git e envia o projeto para o GitHub (ou outro).
2. Em [vercel.com](https://vercel.com), importa o repositório.
3. Em **Settings → Environment Variables**, adiciona as mesmas variáveis do
   `.env.local` (Supabase, MB WAY/IBAN, Resend), e define
   `NEXT_PUBLIC_SITE_URL` para o domínio que o Vercel te der (ex:
   `https://guedias.vercel.app`).

## Estrutura

```
src/
  app/
    page.tsx                     → Página inicial
    loja/page.tsx                 → Catálogo (filtro por categoria + pesquisa)
    produto/[slug]/page.tsx       → Página de detalhe do produto
    carrinho/page.tsx             → Carrinho de compras (localStorage)
    checkout/page.tsx             → Contacto + morada + envio + método de pagamento (MB WAY/transferência)
    checkout/confirmacao/         → Confirmação + instruções de pagamento (lê a encomenda gravada)
    conta/entrar, conta/registar  → Login e registo (Supabase Auth)
    conta/page.tsx                → Resumo: encomendas + atalhos
    conta/perfil/                 → Editar nome, telefone e morada de envio guardada
    conta/encomendas/[id]/        → Detalhe da encomenda + linha do tempo do estado
    conta/favoritos/              → Lista de desejos (produtos guardados)
    admin/                        → Painel de administração (só is_admin=true)
      page.tsx                    → Painel: receita, encomendas por estado, mais vendidos, vendas/mês
      produtos/page.tsx            → Lista de produtos (filtros: categoria, destaque, foto… + pesquisa)
      produtos/novo/               → Criar produto (com upload de foto p/ Supabase Storage)
      produtos/[id]/editar/        → Editar produto
      actions.ts                  → Server Actions (criar/editar/apagar produto)
      encomendas/page.tsx          → Lista de encomendas (filtros: pagamento, produção, período + pesquisa)
      encomendas/[id]/page.tsx     → Detalhe da encomenda + ações
      encomendas/[id]/etiqueta/    → Etiqueta de envio otimizada para impressão (100×150 mm)
      encomendas/actions.ts        → Server Actions (marcar paga, cancelar, registar reembolso, notas, morada, reenviar email)
      calculadora/page.tsx         → Calculadora de preço justo (só no browser)
    api/checkout/route.ts         → Valida o carrinho e grava a encomenda (status "pending") diretamente na BD
  components/                     → Header, Footer, carrinho, ProductForm, etc.
  data/categories.ts              → As 4 categorias (taxonomia fixa)
  lib/
    data/products.ts              → Consultas de produtos ao Supabase
    supabase/                     → Clientes Supabase (browser/servidor/admin)
    payment-details.ts            → Dados de MB WAY/IBAN (a partir de variáveis de ambiente)
    site.ts                       → URL pública do site
    email.ts                      → Cliente Resend + templates de email
    auth.ts                       → Utilizador autenticado atual (+ isAdmin)
supabase/
  schema.sql                      → Tabelas + Row Level Security (versão completa)
  migrations/0002_admin_products.sql   → Incremento: admin + foto por URL
  migrations/0003_order_fulfillment.sql → Incremento: estado de produção/envio
  migrations/0004_order_admin_actions.sql → Incremento: notas, reembolsos, estado "refunded"
  migrations/0005_product_images_storage.sql → Incremento: bucket de Storage p/ fotos de produtos
  migrations/0006_customer_account.sql → Incremento: morada no perfil, cliente Stripe, favoritos
  migrations/0007_manual_payments.sql → Incremento: payment_method (MB WAY/transferência), remove colunas Stripe
  seed.sql                        → Categorias e 18 produtos fictícios
middleware.ts                     → Refresca a sessão Supabase em cada pedido
```

## Como o pagamento fica ligado à base de dados

1. `/checkout` recolhe email, morada e método de pagamento (MB WAY ou
   transferência) e envia tudo para `POST /api/checkout`, que **recalcula os
   preços a partir da base de dados** (nunca confia no preço guardado no
   browser).
2. O endpoint grava a encomenda (`orders`, estado `"pending"`) e os seus
   itens (`order_items`) com a service role key (ignora RLS de propósito —
   é o único sítio do código, a par do admin, que escreve encomendas), e
   envia por email as instruções de pagamento (número MB WAY ou IBAN).
3. `/checkout/confirmacao?order_id=...` lê essa encomenda diretamente da
   base de dados e mostra o resumo + instruções de pagamento.
4. Depois de confirmares a receção do pagamento (na app MB WAY ou no
   homebanking), clicas **"Marcar como paga"** em `/admin/encomendas/[id]` —
   isto muda o estado para `"paid"` e envia o email de confirmação.
5. Em `/admin/encomendas`, mudar o estado de produção/envio de uma encomenda
   paga envia automaticamente um email de atualização ao cliente.

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
- A **calculadora de preço** (`/admin/calculadora`) é só uma ferramenta de
  apoio — não escreve nada na base de dados. Os valores (preço do filamento,
  eletricidade, valor à hora, etc.) ficam guardados no `localStorage` do teu
  navegador.
- `SUPABASE_SERVICE_ROLE_KEY` e `RESEND_API_KEY` nunca devem ter o prefixo
  `NEXT_PUBLIC_` nem ser expostas ao browser — só são usadas em Route
  Handlers e Server Actions (servidor). `NEXT_PUBLIC_MBWAY_PHONE` e as
  variáveis `NEXT_PUBLIC_BANK_*` são públicas de propósito — aparecem na
  página de confirmação e nos emails.
- **Paleta:** grafite (`pine`) + cobre (`clay`) sobre neutros quentes
  (`stone`) — tirada diretamente do logótipo (`public/logo-full.png`,
  `public/logo-wordmark.png`). Todos os tons vivem como variáveis CSS em
  `src/app/globals.css` (`:root`, triplos RGB) e são mapeados para o
  Tailwind em `tailwind.config.ts` — mudas um tom num sítio e o site inteiro
  acompanha. Tipografia: Fraunces (títulos) + Inter (texto), via `next/font`
  em `src/app/layout.tsx`.

## Próximos passos sugeridos

- Upload de fotografias (Supabase Storage) em vez de colar um URL.
- Gestão de stock/disponibilidade por produto.
- Número de seguimento (tracking) no email de "encomenda enviada".
- Alargar o checkout a mais países (hoje assume sempre Portugal).
- Mais adiante, se fizer sentido pagar a taxa, trocar o registo manual em
  `src/app/api/checkout/route.ts` por um gateway de pagamentos automático.
