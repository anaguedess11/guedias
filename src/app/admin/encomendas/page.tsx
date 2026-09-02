import type { Metadata } from "next";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatPrice } from "@/lib/format";
import { OrderStatusSelect } from "@/components/OrderStatusSelect";
import { AdminFilters } from "@/components/AdminFilters";

export const metadata: Metadata = {
  title: "Encomendas — Guedias",
};

interface OrderItemRow {
  name: string;
  qty: number;
  price_cents: number;
  color: string | null;
  material: string | null;
  personalization: string | null;
}

interface OrderRow {
  id: string;
  email: string;
  status: "pending" | "paid" | "failed" | "canceled" | "refunded";
  fulfillment_status: "not_started" | "in_production" | "shipped" | "delivered";
  total_cents: number;
  created_at: string;
  shipping_name: string | null;
  order_items: OrderItemRow[];
}

const PAYMENT_STATUS_LABEL: Record<OrderRow["status"], string> = {
  pending: "Pagamento pendente",
  paid: "Pago",
  failed: "Falhou",
  canceled: "Cancelada",
  refunded: "Reembolsada",
};

const PERIOD_DAYS: Record<string, number> = { "7d": 7, "30d": 30, "90d": 90 };

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: { estado?: string; producao?: string; periodo?: string; q?: string };
}) {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("orders")
    .select(
      "id, email, status, fulfillment_status, total_cents, created_at, shipping_name, order_items(name, qty, price_cents, color, material, personalization)"
    )
    .order("created_at", { ascending: false })
    .returns<OrderRow[]>();

  const all = data ?? [];

  const q = (searchParams.q ?? "").toLowerCase().trim();
  const periodDays = PERIOD_DAYS[searchParams.periodo ?? ""];
  const since = periodDays ? Date.now() - periodDays * 86400_000 : null;

  const orders = all.filter((o) => {
    if (searchParams.estado && o.status !== searchParams.estado) return false;
    if (searchParams.producao && o.fulfillment_status !== searchParams.producao) return false;
    if (since && new Date(o.created_at).getTime() < since) return false;
    if (q) {
      const hay = `${o.id} ${o.email} ${o.shipping_name ?? ""}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  const filtered = orders.length !== all.length;
  const shownTotal = orders
    .filter((o) => o.status === "paid" || o.status === "refunded")
    .reduce((s, o) => s + o.total_cents, 0);

  return (
    <div>
      <p className="eyebrow">Administração</p>
      <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl">
        Encomendas
      </h1>
      <p className="mb-6 mt-1 text-sm text-stone-900/55">
        {filtered ? `${orders.length} de ${all.length}` : `${all.length}`} encomendas
        {shownTotal > 0 && ` · ${formatPrice(shownTotal / 100)} em vendas`}
      </p>

      <AdminFilters
        search={{ param: "q", placeholder: "Procurar por #, email ou nome…" }}
        selects={[
          {
            param: "estado",
            label: "Pagamento",
            options: [
              { value: "paid", label: "Pago" },
              { value: "pending", label: "Pendente" },
              { value: "refunded", label: "Reembolsada" },
              { value: "failed", label: "Falhou" },
              { value: "canceled", label: "Cancelada" },
            ],
          },
          {
            param: "producao",
            label: "Produção",
            options: [
              { value: "not_started", label: "Por começar" },
              { value: "in_production", label: "Em produção" },
              { value: "shipped", label: "Enviada" },
              { value: "delivered", label: "Entregue" },
            ],
          },
          {
            param: "periodo",
            label: "Período",
            options: [
              { value: "7d", label: "7 dias" },
              { value: "30d", label: "30 dias" },
              { value: "90d", label: "90 dias" },
            ],
          },
        ]}
      />

      {orders.length === 0 ? (
        <div className="card p-6 text-center text-sm text-stone-900/55">
          {all.length === 0 ? "Ainda não há encomendas." : "Nenhuma encomenda corresponde aos filtros."}
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <Link
                    href={`/admin/encomendas/${order.id}`}
                    className="text-sm font-medium text-stone-900 hover:text-clay-700"
                  >
                    #{order.id.slice(0, 8)} · {order.shipping_name ?? order.email}
                  </Link>
                  <p className="mt-0.5 text-xs text-stone-900/45">
                    {new Date(order.created_at).toLocaleDateString("pt-PT", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}{" "}
                    · {order.email}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      order.status === "paid"
                        ? "bg-pine-50 text-pine-600"
                        : order.status === "failed"
                        ? "bg-red-50 text-red-600"
                        : order.status === "refunded"
                        ? "bg-amber-50 text-amber-700"
                        : "bg-black/5 text-stone-900/50"
                    }`}
                  >
                    {PAYMENT_STATUS_LABEL[order.status]}
                  </span>
                  {order.status === "paid" || order.status === "refunded" ? (
                    <OrderStatusSelect orderId={order.id} status={order.fulfillment_status} />
                  ) : null}
                </div>
              </div>

              <ul className="mt-4 divide-y divide-black/5 border-t border-black/5">
                {order.order_items.map((item, i) => (
                  <li key={i} className="flex justify-between gap-3 py-2.5 text-sm">
                    <span className="text-stone-900/70">
                      {item.qty}× {item.name}
                      {item.color ? ` · ${item.color}` : ""}
                    </span>
                    <span className="whitespace-nowrap font-medium text-stone-900">
                      {formatPrice((item.price_cents * item.qty) / 100)}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="mt-3 flex justify-between border-t border-black/5 pt-3 text-sm font-semibold text-stone-900">
                <span>Total</span>
                <span>{formatPrice(order.total_cents / 100)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
