import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/format";

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
  status: "pending" | "paid" | "failed" | "canceled";
  total_cents: number;
  currency: string;
  created_at: string;
  shipping_method: string | null;
  order_items: OrderItemRow[];
}

const STATUS_LABEL: Record<OrderRow["status"], string> = {
  pending: "Pendente",
  paid: "Pago",
  failed: "Falhou",
  canceled: "Cancelada",
};

const STATUS_STYLE: Record<OrderRow["status"], string> = {
  pending: "bg-clay-500/10 text-clay-700",
  paid: "bg-pine-50 text-pine-600",
  failed: "bg-red-50 text-red-600",
  canceled: "bg-black/5 text-stone-900/50",
};

export default async function ContaPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/conta/entrar");

  const supabase = createClient();
  const { data: orders } = await supabase
    .from("orders")
    .select(
      "id, status, total_cents, currency, created_at, shipping_method, order_items(name, qty, price_cents, color, material, personalization)"
    )
    .order("created_at", { ascending: false })
    .returns<OrderRow[]>();

  return (
    <div className="container-page py-10 sm:py-14">
      <p className="eyebrow">A minha conta</p>
      <h1 className="mt-2 font-display text-3xl font-semibold text-stone-900 sm:text-4xl">
        Olá{user.fullName ? `, ${user.fullName.split(" ")[0]}` : ""}
      </h1>
      <p className="mt-2 text-sm text-stone-900/55">{user.email}</p>

      <section className="mt-10">
        <h2 className="text-sm font-semibold text-stone-900">As tuas encomendas</h2>

        {!orders || orders.length === 0 ? (
          <div className="card mt-4 p-6 text-center">
            <p className="text-sm text-stone-900/55">Ainda não tens nenhuma encomenda.</p>
            <Link href="/loja" className="btn-primary mt-4 inline-flex">
              Ir para a loja
            </Link>
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="card p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-stone-900">
                      Encomenda #{order.id.slice(0, 8)}
                    </p>
                    <p className="text-xs text-stone-900/45">
                      {new Date(order.created_at).toLocaleDateString("pt-PT", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_STYLE[order.status]}`}
                  >
                    {STATUS_LABEL[order.status]}
                  </span>
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
      </section>
    </div>
  );
}
