import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatPrice } from "@/lib/format";
import { OrderStatusSelect } from "@/components/OrderStatusSelect";
import { OrderActions } from "@/components/OrderActions";

export const metadata: Metadata = {
  title: "Encomenda — Guedias",
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
  subtotal_cents: number;
  shipping_cents: number;
  total_cents: number;
  refunded_cents: number;
  currency: string;
  created_at: string;
  shipping_name: string | null;
  shipping_address: {
    line1?: string | null;
    line2?: string | null;
    postal_code?: string | null;
    city?: string | null;
  } | null;
  shipping_method: string | null;
  stripe_session_id: string | null;
  stripe_payment_intent: string | null;
  admin_notes: string | null;
  order_items: OrderItemRow[];
}

const PAYMENT_STATUS_LABEL: Record<OrderRow["status"], string> = {
  pending: "Pagamento pendente",
  paid: "Pago",
  failed: "Falhou",
  canceled: "Cancelada",
  refunded: "Reembolsada",
};

const PAYMENT_STATUS_STYLE: Record<OrderRow["status"], string> = {
  pending: "bg-black/5 text-stone-900/50",
  paid: "bg-pine-50 text-pine-600",
  failed: "bg-red-50 text-red-600",
  canceled: "bg-black/5 text-stone-900/50",
  refunded: "bg-amber-50 text-amber-700",
};

export default async function AdminOrderDetailPage({ params }: { params: { id: string } }) {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("orders")
    .select(
      "id, email, status, fulfillment_status, subtotal_cents, shipping_cents, total_cents, refunded_cents, currency, created_at, shipping_name, shipping_address, shipping_method, stripe_session_id, stripe_payment_intent, admin_notes, order_items(name, qty, price_cents, color, material, personalization)"
    )
    .eq("id", params.id)
    .maybeSingle();

  const order = data as OrderRow | null;
  if (!order) notFound();

  const addr = order.shipping_address;
  const refunded = order.refunded_cents ?? 0;

  return (
    <div>
      <Link
        href="/admin/encomendas"
        className="text-xs font-medium text-clay-600 hover:text-clay-700"
      >
        ← Todas as encomendas
      </Link>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="eyebrow">Encomenda</p>
          <h1 className="mt-1 font-display text-2xl font-semibold text-stone-900 sm:text-3xl">
            #{order.id.slice(0, 8)}
          </h1>
          <p className="mt-1 text-sm text-stone-900/55">
            {new Date(order.created_at).toLocaleDateString("pt-PT", {
              day: "2-digit",
              month: "long",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span
            className={`rounded-full px-3 py-1 text-xs font-medium ${PAYMENT_STATUS_STYLE[order.status]}`}
          >
            {PAYMENT_STATUS_LABEL[order.status]}
          </span>
          {(order.status === "paid" || order.status === "refunded") && (
            <OrderStatusSelect orderId={order.id} status={order.fulfillment_status} />
          )}
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-6">
          <div className="card p-5">
            <h2 className="text-sm font-semibold text-stone-900">Itens</h2>
            <ul className="mt-3 divide-y divide-black/5 border-t border-black/5">
              {order.order_items.map((item, i) => (
                <li key={i} className="py-3 text-sm">
                  <div className="flex justify-between gap-3">
                    <span className="text-stone-900/70">
                      {item.qty}× {item.name}
                    </span>
                    <span className="whitespace-nowrap font-medium text-stone-900">
                      {formatPrice((item.price_cents * item.qty) / 100)}
                    </span>
                  </div>
                  {(item.color || item.material || item.personalization) && (
                    <p className="mt-0.5 text-xs text-stone-900/45">
                      {[item.color, item.material].filter(Boolean).join(" · ")}
                      {item.personalization ? ` · “${item.personalization}”` : ""}
                    </p>
                  )}
                </li>
              ))}
            </ul>

            <dl className="mt-4 space-y-1.5 border-t border-black/5 pt-4 text-sm">
              <div className="flex justify-between text-stone-900/60">
                <dt>Subtotal</dt>
                <dd>{formatPrice(order.subtotal_cents / 100)}</dd>
              </div>
              <div className="flex justify-between text-stone-900/60">
                <dt>Envio {order.shipping_method ? `(${order.shipping_method})` : ""}</dt>
                <dd>{order.shipping_cents === 0 ? "Grátis" : formatPrice(order.shipping_cents / 100)}</dd>
              </div>
              <div className="flex justify-between border-t border-black/5 pt-1.5 font-semibold text-stone-900">
                <dt>Total</dt>
                <dd>{formatPrice(order.total_cents / 100)}</dd>
              </div>
              {refunded > 0 && (
                <div className="flex justify-between text-amber-700">
                  <dt>Reembolsado</dt>
                  <dd>− {formatPrice(refunded / 100)}</dd>
                </div>
              )}
            </dl>
          </div>

          <div className="card p-5">
            <h2 className="text-sm font-semibold text-stone-900">Cliente</h2>
            <p className="mt-2 text-sm text-stone-900/70">{order.email || "—"}</p>
            {addr && (
              <p className="mt-1 text-sm text-stone-900/70">
                {order.shipping_name && <span className="block">{order.shipping_name}</span>}
                {[addr.line1, addr.line2].filter(Boolean).join(", ")}
                <br />
                {[addr.postal_code, addr.city].filter(Boolean).join(" ")}
              </p>
            )}
            <Link
              href={`/admin/encomendas/${order.id}/etiqueta`}
              className="btn-secondary mt-4 w-full"
            >
              Imprimir etiqueta de envio
            </Link>
          </div>

          {(order.stripe_session_id || order.stripe_payment_intent) && (
            <div className="card p-5">
              <h2 className="text-sm font-semibold text-stone-900">Stripe</h2>
              <dl className="mt-2 space-y-1 text-xs text-stone-900/55">
                {order.stripe_payment_intent && (
                  <div>
                    <dt className="inline font-medium">Payment intent: </dt>
                    <dd className="inline break-all">{order.stripe_payment_intent}</dd>
                  </div>
                )}
                {order.stripe_session_id && (
                  <div>
                    <dt className="inline font-medium">Sessão: </dt>
                    <dd className="inline break-all">{order.stripe_session_id}</dd>
                  </div>
                )}
              </dl>
            </div>
          )}
        </div>

        <OrderActions
          order={{
            id: order.id,
            status: order.status,
            total_cents: order.total_cents,
            refunded_cents: refunded,
            hasPaymentIntent: Boolean(order.stripe_payment_intent),
            admin_notes: order.admin_notes ?? "",
            shipping_name: order.shipping_name ?? "",
            line1: addr?.line1 ?? "",
            line2: addr?.line2 ?? "",
            postal_code: addr?.postal_code ?? "",
            city: addr?.city ?? "",
          }}
        />
      </div>
    </div>
  );
}
