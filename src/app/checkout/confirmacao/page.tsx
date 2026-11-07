import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { formatPrice } from "@/lib/format";
import { ClearCartOnSuccess } from "@/components/ClearCartOnSuccess";
import { PaymentInstructions } from "@/components/PaymentInstructions";
import { isEmailConfigured } from "@/lib/email";
import { isPaymentMethod } from "@/lib/payment-details";
import { isPickup, shippingMethodLabel } from "@/lib/shipping";

interface OrderItemRow {
  id: string;
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
  payment_method: string;
  email: string;
  shipping_name: string | null;
  shipping_address: {
    line1?: string | null;
    line2?: string | null;
    postal_code?: string | null;
    city?: string | null;
  } | null;
  shipping_method: string | null;
  subtotal_cents: number;
  shipping_cents: number;
  total_cents: number;
  order_items: OrderItemRow[];
}

export default async function ConfirmacaoPage({
  searchParams,
}: {
  searchParams: { order_id?: string };
}) {
  const orderId = searchParams.order_id;

  if (!isSupabaseConfigured) {
    return (
      <StateMessage
        title="Loja ainda não configurada"
        text="Falta configurar o Supabase (ver README.md) para concluir compras a sério."
      />
    );
  }

  if (!orderId) {
    return (
      <StateMessage
        title="Não encontrámos essa encomenda"
        text="Falta o identificador da encomenda."
      />
    );
  }

  const admin = createAdminClient();
  const { data } = await admin
    .from("orders")
    .select(
      "id, status, payment_method, email, shipping_name, shipping_address, shipping_method, subtotal_cents, shipping_cents, total_cents, order_items(id, name, qty, price_cents, color, material, personalization)"
    )
    .eq("id", orderId)
    .maybeSingle();

  const order = data as OrderRow | null;

  if (!order) {
    return (
      <StateMessage
        title="Não encontrámos essa encomenda"
        text="Verifica a hiperligação ou contacta-nos indicando o teu email."
      />
    );
  }

  const paid = order.status === "paid";
  const paymentMethod = isPaymentMethod(order.payment_method) ? order.payment_method : "transferencia";
  const addr = order.shipping_address;

  return (
    <div className="container-page py-14 sm:py-20">
      <ClearCartOnSuccess />

      <div className="mx-auto max-w-2xl text-center">
        <div
          className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${
            paid ? "bg-pine-50" : "bg-clay-50"
          }`}
        >
          {paid ? <CheckIcon /> : <ClockIcon />}
        </div>
        <p className="eyebrow mt-6">{paid ? "Encomenda confirmada" : "Encomenda recebida"}</p>
        <h1 className="mt-2 font-display text-3xl font-semibold text-stone-900 sm:text-4xl">
          {paid
            ? `Obrigada${order.shipping_name ? `, ${order.shipping_name.split(" ")[0]}` : ""}!`
            : "Falta só confirmar o pagamento"}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-stone-900/60 sm:text-base">
          {paid ? (
            <>
              O teu pagamento foi confirmado e a encomenda vai começar a ser impressa em breve na
              nossa Creality Hi Combo.
              {isEmailConfigured && ` Enviámos a confirmação para ${order.email}.`}
            </>
          ) : isEmailConfigured ? (
            <>
              Registámos a tua encomenda #{order.id.slice(0, 8)} e enviámos as instruções de
              pagamento para {order.email}. Se não as encontrares, vê a pasta de spam. Assim que
              confirmarmos a receção, recebes um novo email e a encomenda entra em produção.
            </>
          ) : (
            <>
              Registámos a tua encomenda #{order.id.slice(0, 8)}. Faz já o pagamento com os dados
              abaixo e guarda esta página. Assim que confirmarmos a receção, a encomenda entra em
              produção e, se for preciso, contactamos-te.
            </>
          )}
        </p>
      </div>

      {!paid && (
        <div className="card mx-auto mt-8 max-w-2xl p-6">
          <PaymentInstructions
            paymentMethod={paymentMethod}
            totalCents={order.total_cents}
            orderId={order.id}
          />
        </div>
      )}

      <div className="card mx-auto mt-8 max-w-2xl p-6">
        <h2 className="text-sm font-semibold text-stone-900">Resumo da encomenda</h2>
        <ul className="mt-4 divide-y divide-black/5">
          {order.order_items.map((item) => (
            <li key={item.id} className="flex justify-between gap-3 py-3 text-sm">
              <span className="text-stone-900/70">
                {item.qty}× {item.name}
                <span className="block text-xs text-stone-900/45">
                  {[item.color, item.material].filter(Boolean).join(" · ")}
                  {item.personalization ? ` · “${item.personalization}”` : ""}
                </span>
              </span>
              <span className="whitespace-nowrap font-medium text-stone-900">
                {formatPrice((item.price_cents * item.qty) / 100)}
              </span>
            </li>
          ))}
        </ul>

        <div className="mt-2 space-y-2 border-t border-black/5 pt-4 text-sm">
          <div className="flex justify-between text-stone-900/65">
            <span>Subtotal</span>
            <span>{formatPrice(order.subtotal_cents / 100)}</span>
          </div>
          <div className="flex justify-between text-stone-900/65">
            <span>{isPickup(order.shipping_method) ? "Entrega em mão" : "Envio"}</span>
            <span>
              {order.shipping_cents === 0 ? "Grátis" : formatPrice(order.shipping_cents / 100)}
            </span>
          </div>
        </div>
        <div className="mt-4 flex justify-between border-t border-black/5 pt-4 font-display text-base font-semibold text-stone-900">
          <span>Total</span>
          <span>{formatPrice(order.total_cents / 100)}</span>
        </div>

        {isPickup(order.shipping_method) && (
          <div className="mt-4 rounded-lg bg-stone-50 px-4 py-3 text-xs text-stone-900/55">
            {shippingMethodLabel(order.shipping_method)}.{" "}
            {paid
              ? "Quando a tua peça estiver pronta, contactamos-te para combinar o local e a hora."
              : "Depois de confirmarmos o pagamento, tratamos da tua peça e, quando estiver pronta, contactamos-te para combinar o local e a hora."}
          </div>
        )}
        {addr && (
          <div className="mt-4 rounded-lg bg-stone-50 px-4 py-3 text-xs text-stone-900/55">
            A enviar para: {order.shipping_name}, {addr.line1}
            {addr.line2 ? `, ${addr.line2}` : ""}, {addr.postal_code} {addr.city}
          </div>
        )}
      </div>

      <div className="mt-8 flex justify-center gap-3">
        <Link href="/loja" className="btn-primary">
          Continuar a explorar
        </Link>
        <Link href="/" className="btn-secondary">
          Voltar ao início
        </Link>
      </div>
    </div>
  );
}

function StateMessage({ title, text }: { title: string; text: string }) {
  return (
    <div className="container-page flex flex-col items-center py-24 text-center">
      <h1 className="font-display text-2xl font-semibold text-stone-900">{title}</h1>
      <p className="mt-2 max-w-sm text-sm text-stone-900/55">{text}</p>
      <Link href="/loja" className="btn-primary mt-6">
        Voltar à loja
      </Link>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#2F4A45" strokeWidth="2">
      <path d="M4.5 12.5l5 5 10-11" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#A24F30" strokeWidth="1.8">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
