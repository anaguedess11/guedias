import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/format";
import { OrderTimeline } from "@/components/OrderTimeline";

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
  status: "pending" | "paid" | "failed" | "canceled" | "refunded";
  fulfillment_status: "not_started" | "in_production" | "shipped" | "delivered";
  subtotal_cents: number;
  shipping_cents: number;
  total_cents: number;
  created_at: string;
  shipping_method: string | null;
  shipping_name: string | null;
  shipping_address: {
    line1?: string | null;
    line2?: string | null;
    postal_code?: string | null;
    city?: string | null;
  } | null;
  order_items: OrderItemRow[];
}

export default async function ContaOrderDetailPage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect("/conta/entrar");

  const supabase = createClient();
  const { data } = await supabase
    .from("orders")
    .select(
      "id, status, fulfillment_status, subtotal_cents, shipping_cents, total_cents, created_at, shipping_method, shipping_name, shipping_address, order_items(name, qty, price_cents, color, material, personalization)"
    )
    .eq("id", params.id)
    .maybeSingle();

  // RLS já garante que só devolve encomendas do próprio utilizador.
  const order = data as OrderRow | null;
  if (!order) notFound();

  const addr = order.shipping_address;

  return (
    <div className="container-page py-10 sm:py-14">
      <Link href="/conta" className="text-xs font-medium text-clay-600 hover:text-clay-700">
        ← As minhas encomendas
      </Link>

      <p className="eyebrow mt-3">Encomenda</p>
      <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl">
        #{order.id.slice(0, 8)}
      </h1>
      <p className="mt-2 text-sm text-stone-900/55">
        {new Date(order.created_at).toLocaleDateString("pt-PT", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        })}
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_18rem]">
        <div className="space-y-6">
          <div className="card p-5">
            <h2 className="text-sm font-semibold text-stone-900">Artigos</h2>
            <ul className="mt-3 divide-y divide-black/5 border-t border-black/5">
              {order.order_items.map((item, i) => (
                <li key={i} className="py-3 text-sm">
                  <div className="flex justify-between gap-3">
                    <span className="text-stone-900/75">
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
                <dd>
                  {order.shipping_cents === 0 ? "Grátis" : formatPrice(order.shipping_cents / 100)}
                </dd>
              </div>
              <div className="flex justify-between border-t border-black/5 pt-1.5 font-semibold text-stone-900">
                <dt>Total</dt>
                <dd>{formatPrice(order.total_cents / 100)}</dd>
              </div>
            </dl>
          </div>

          {addr && (
            <div className="card p-5">
              <h2 className="text-sm font-semibold text-stone-900">Envio para</h2>
              <p className="mt-2 text-sm text-stone-900/70">
                {order.shipping_name && <span className="block">{order.shipping_name}</span>}
                {[addr.line1, addr.line2].filter(Boolean).join(", ")}
                <br />
                {[addr.postal_code, addr.city].filter(Boolean).join(" ")}
              </p>
            </div>
          )}
        </div>

        <div className="card h-fit p-5">
          <h2 className="mb-4 text-sm font-semibold text-stone-900">Estado</h2>
          <OrderTimeline status={order.status} fulfillmentStatus={order.fulfillment_status} />
        </div>
      </div>
    </div>
  );
}
