import type { Metadata } from "next";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatPrice } from "@/lib/format";

export const metadata: Metadata = {
  title: "Painel — Guedias",
};

interface OrderRow {
  id: string;
  status: "pending" | "paid" | "failed" | "canceled" | "refunded";
  fulfillment_status: "not_started" | "in_production" | "shipped" | "delivered";
  total_cents: number;
  refunded_cents: number | null;
  created_at: string;
}

interface ItemRow {
  name: string;
  qty: number;
  price_cents: number;
  order_id: string;
}

const MONTHS_PT = [
  "jan", "fev", "mar", "abr", "mai", "jun",
  "jul", "ago", "set", "out", "nov", "dez",
];

function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default async function AdminDashboardPage() {
  const supabase = createAdminClient();

  const [ordersRes, itemsRes, productsRes, featuredRes] = await Promise.all([
    supabase
      .from("orders")
      .select("id, status, fulfillment_status, total_cents, refunded_cents, created_at")
      .returns<OrderRow[]>(),
    supabase.from("order_items").select("name, qty, price_cents, order_id").returns<ItemRow[]>(),
    supabase.from("products").select("id", { count: "exact", head: true }),
    supabase.from("products").select("id", { count: "exact", head: true }).eq("featured", true),
  ]);

  const orders = ordersRes.data ?? [];
  const items = itemsRes.data ?? [];
  const productCount = productsRes.count ?? 0;
  const featuredCount = featuredRes.count ?? 0;

  const isSale = (s: OrderRow["status"]) => s === "paid" || s === "refunded";
  const paidOrders = orders.filter((o) => isSale(o.status));
  const paidOrderIds = new Set(paidOrders.map((o) => o.id));

  const grossCents = paidOrders.reduce((sum, o) => sum + o.total_cents, 0);
  const refundedCents = orders.reduce((sum, o) => sum + (o.refunded_cents ?? 0), 0);
  const netCents = grossCents - refundedCents;
  const avgTicketCents = paidOrders.length ? Math.round(grossCents / paidOrders.length) : 0;

  const statusCounts = orders.reduce<Record<string, number>>((acc, o) => {
    acc[o.status] = (acc[o.status] ?? 0) + 1;
    return acc;
  }, {});
  const toPrepare = orders.filter(
    (o) => o.status === "paid" && (o.fulfillment_status === "not_started" || o.fulfillment_status === "in_production")
  ).length;

  // Vendas dos últimos 8 meses
  const now = new Date();
  const buckets = Array.from({ length: 8 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (7 - i), 1);
    return { key: monthKey(d), label: MONTHS_PT[d.getMonth()], cents: 0 };
  });
  const bucketByKey = new Map(buckets.map((b) => [b.key, b]));
  for (const o of paidOrders) {
    const b = bucketByKey.get(monthKey(new Date(o.created_at)));
    if (b) b.cents += o.total_cents;
  }
  const maxBucket = Math.max(1, ...buckets.map((b) => b.cents));

  // Produtos mais vendidos (de encomendas pagas)
  const soldByName = new Map<string, { qty: number; cents: number }>();
  for (const it of items) {
    if (!paidOrderIds.has(it.order_id)) continue;
    const cur = soldByName.get(it.name) ?? { qty: 0, cents: 0 };
    cur.qty += it.qty;
    cur.cents += it.price_cents * it.qty;
    soldByName.set(it.name, cur);
  }
  const topProducts = [...soldByName.entries()]
    .map(([name, v]) => ({ name, ...v }))
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);

  const STATUS_LABELS: Record<string, string> = {
    paid: "Pagas",
    pending: "Pendentes",
    refunded: "Reembolsadas",
    failed: "Falhadas",
    canceled: "Canceladas",
  };

  return (
    <div>
      <p className="eyebrow">Administração</p>
      <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl">
        Painel
      </h1>
      <p className="mt-1 text-sm text-stone-900/55">Uma vista geral da loja.</p>

      {/* KPIs */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Receita líquida" value={formatPrice(netCents / 100)} hint="Pago menos reembolsos" />
        <Kpi label="Encomendas pagas" value={String(paidOrders.length)} />
        <Kpi label="Ticket médio" value={formatPrice(avgTicketCents / 100)} />
        <Kpi
          label="Reembolsado"
          value={formatPrice(refundedCents / 100)}
          tone={refundedCents > 0 ? "warn" : undefined}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        {/* Vendas por mês */}
        <div className="card p-5">
          <div className="flex items-baseline justify-between">
            <h2 className="text-sm font-semibold text-stone-900">Vendas por mês</h2>
            <span className="text-xs text-stone-900/45">últimos 8 meses</span>
          </div>
          <div className="mt-5 flex h-40 items-end gap-2 border-b border-black/10 sm:gap-3">
            {buckets.map((b) => (
              <div
                key={b.key}
                className="min-h-[2px] flex-1 rounded-t-md bg-clay-500/85"
                style={{ height: `${(b.cents / maxBucket) * 100}%` }}
                title={`${b.label}: ${formatPrice(b.cents / 100)}`}
              />
            ))}
          </div>
          <div className="mt-1.5 flex gap-2 sm:gap-3">
            {buckets.map((b) => (
              <span key={b.key} className="flex-1 text-center text-[10px] text-stone-900/45">
                {b.label}
              </span>
            ))}
          </div>
        </div>

        {/* Estado das encomendas */}
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-stone-900">Estado das encomendas</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {["paid", "pending", "refunded", "failed", "canceled"].map((s) => (
              <li key={s} className="flex items-center justify-between text-stone-900/70">
                <span>{STATUS_LABELS[s]}</span>
                <span className="font-medium text-stone-900">{statusCounts[s] ?? 0}</span>
              </li>
            ))}
          </ul>
          <Link
            href="/admin/encomendas"
            className="mt-4 flex items-center justify-between rounded-lg bg-clay-50 px-3 py-2.5 text-sm font-medium text-clay-700 hover:bg-clay-100"
          >
            <span>Por preparar</span>
            <span>{toPrepare} →</span>
          </Link>
        </div>
      </div>

      {/* Mais vendidos */}
      <div className="mt-6 card p-5">
        <h2 className="text-sm font-semibold text-stone-900">Produtos mais vendidos</h2>
        {topProducts.length === 0 ? (
          <p className="mt-3 text-sm text-stone-900/50">Ainda não há vendas registadas.</p>
        ) : (
          <ul className="mt-4 divide-y divide-black/5">
            {topProducts.map((p, i) => (
              <li key={p.name} className="flex items-center gap-3 py-2.5 text-sm">
                <span className="w-5 text-stone-900/40">{i + 1}</span>
                <span className="min-w-0 flex-1 truncate text-stone-900/80">{p.name}</span>
                <span className="text-stone-900/50">{p.qty} un.</span>
                <span className="w-24 text-right font-medium text-stone-900">
                  {formatPrice(p.cents / 100)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Atalhos */}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Link href="/admin/produtos" className="card p-5 hover:shadow-card">
          <p className="text-sm font-semibold text-stone-900">Produtos</p>
          <p className="mt-1 text-xs text-stone-900/55">
            {productCount} na loja · {featuredCount} em destaque
          </p>
        </Link>
        <Link href="/admin/encomendas" className="card p-5 hover:shadow-card">
          <p className="text-sm font-semibold text-stone-900">Encomendas</p>
          <p className="mt-1 text-xs text-stone-900/55">{orders.length} no total</p>
        </Link>
        <Link href="/admin/calculadora" className="card p-5 hover:shadow-card">
          <p className="text-sm font-semibold text-stone-900">Calculadora de preço</p>
          <p className="mt-1 text-xs text-stone-900/55">Estimar um preço justo</p>
        </Link>
      </div>
    </div>
  );
}

function Kpi({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "warn";
}) {
  return (
    <div className="card p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-stone-900/50">{label}</p>
      <p
        className={`mt-2 font-display text-2xl font-semibold ${
          tone === "warn" ? "text-amber-700" : "text-stone-900"
        }`}
      >
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-stone-900/45">{hint}</p>}
    </div>
  );
}
