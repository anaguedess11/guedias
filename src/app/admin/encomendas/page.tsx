import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatPrice } from "@/lib/format";
import { OrderStatusSelect } from "@/components/OrderStatusSelect";

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
  status: "pending" | "paid" | "failed" | "canceled";
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
};

export default async function AdminOrdersPage() {
  const supabase = createAdminClient();
  const { data: orders } = await supabase
    .from("orders")
    .select(
      "id, email, status, fulfillment_status, total_cents, created_at, shipping_name, order_items(name, qty, price_cents, color, material, personalization)"
    )
    .order("created_at", { ascending: false })
    .returns<OrderRow[]>();

  return (
    <div>
      <p className="eyebrow">Administração</p>
      <h1 className="mt-1 font-display text-2xl font-semibold text-stone-900 sm:text-3xl">
        Encomendas
      </h1>
      <p className="mt-1 text-sm text-stone-900/55">{orders?.length ?? 0} encomendas.</p>

      {!orders || orders.length === 0 ? (
        <div className="card mt-8 p-6 text-center text-sm text-stone-900/55">
          Ainda não há encomendas.
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-stone-900">
                    #{order.id.slice(0, 8)} · {order.shipping_name ?? order.email}
                  </p>
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
                        : "bg-black/5 text-stone-900/50"
                    }`}
                  >
                    {PAYMENT_STATUS_LABEL[order.status]}
                  </span>
                  {order.status === "paid" && (
                    <OrderStatusSelect orderId={order.id} status={order.fulfillment_status} />
                  )}
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
