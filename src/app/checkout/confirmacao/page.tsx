import Link from "next/link";
import type Stripe from "stripe";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { formatPrice } from "@/lib/format";
import { ClearCartOnSuccess } from "@/components/ClearCartOnSuccess";

export default async function ConfirmacaoPage({
  searchParams,
}: {
  searchParams: { session_id?: string };
}) {
  const sessionId = searchParams.session_id;

  if (!isStripeConfigured) {
    return (
      <StateMessage
        title="Pagamentos ainda não configurados"
        text="Falta configurar as chaves do Stripe (ver README.md) para concluir compras a sério."
      />
    );
  }

  if (!sessionId) {
    return (
      <StateMessage
        title="Não encontrámos essa encomenda"
        text="Falta o identificador da sessão de pagamento."
      />
    );
  }

  let session: Stripe.Checkout.Session;
  try {
    const stripe = getStripe();
    session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["line_items", "payment_intent"],
    });
  } catch {
    return (
      <StateMessage
        title="Não encontrámos essa encomenda"
        text="A sessão de pagamento é inválida ou já expirou."
      />
    );
  }

  const paid = session.payment_status === "paid" || session.payment_status === "no_payment_required";
  const lineItems = session.line_items?.data ?? [];
  const productLines = lineItems.filter((li) => li.metadata?.product_id);
  const shippingLine = lineItems.find((li) => !li.metadata?.product_id);
  const shippingDetails = session.collected_information?.shipping_details;
  const customerDetails = session.customer_details;

  return (
    <div className="container-page py-14 sm:py-20">
      {paid && <ClearCartOnSuccess />}

      <div className="mx-auto max-w-2xl text-center">
        <div
          className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${
            paid ? "bg-pine-50" : "bg-clay-50"
          }`}
        >
          {paid ? <CheckIcon /> : <ClockIcon />}
        </div>
        <p className="eyebrow mt-6">{paid ? "Encomenda confirmada" : "Pagamento pendente"}</p>
        <h1 className="mt-2 font-display text-3xl font-semibold text-stone-900 sm:text-4xl">
          {paid
            ? `Obrigada${customerDetails?.name ? `, ${customerDetails.name.split(" ")[0]}` : ""}!`
            : "Aguardamos a confirmação do pagamento"}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-stone-900/60 sm:text-base">
          {paid ? (
            <>
              O teu pagamento foi confirmado. Numa loja real, começaríamos agora a imprimir as
              tuas peças na Creality Hi Combo.
              {customerDetails?.email && ` Enviámos a confirmação para ${customerDetails.email}.`}
            </>
          ) : (
            "Escolheste um método de pagamento com confirmação diferida (ex: referência multibanco). Assim que recebermos a confirmação, a encomenda fica registada e recebes um email."
          )}
        </p>
      </div>

      <div className="card mx-auto mt-10 max-w-2xl p-6">
        <h2 className="text-sm font-semibold text-stone-900">Resumo da encomenda</h2>
        <ul className="mt-4 divide-y divide-black/5">
          {productLines.map((item) => (
            <li key={item.id} className="flex justify-between gap-3 py-3 text-sm">
              <span className="text-stone-900/70">
                {item.quantity}× {item.description}
                <span className="block text-xs text-stone-900/45">
                  {[item.metadata?.color, item.metadata?.material].filter(Boolean).join(" · ")}
                  {item.metadata?.personalization ? ` · “${item.metadata.personalization}”` : ""}
                </span>
              </span>
              <span className="whitespace-nowrap font-medium text-stone-900">
                {formatPrice(item.amount_total / 100)}
              </span>
            </li>
          ))}
        </ul>

        <div className="mt-2 space-y-2 border-t border-black/5 pt-4 text-sm">
          <div className="flex justify-between text-stone-900/65">
            <span>Subtotal</span>
            <span>{formatPrice((session.amount_subtotal ?? 0) / 100)}</span>
          </div>
          <div className="flex justify-between text-stone-900/65">
            <span>Envio{shippingLine ? ` (${shippingLine.description})` : ""}</span>
            <span>
              {shippingLine && shippingLine.amount_total === 0
                ? "Grátis"
                : formatPrice((shippingLine?.amount_total ?? 0) / 100)}
            </span>
          </div>
        </div>
        <div className="mt-4 flex justify-between border-t border-black/5 pt-4 font-display text-base font-semibold text-stone-900">
          <span>Total</span>
          <span>{formatPrice((session.amount_total ?? 0) / 100)}</span>
        </div>

        {shippingDetails && (
          <div className="mt-4 rounded-lg bg-stone-50 px-4 py-3 text-xs text-stone-900/55">
            A enviar para: {shippingDetails.name}, {shippingDetails.address.line1}
            {shippingDetails.address.line2 ? `, ${shippingDetails.address.line2}` : ""},{" "}
            {shippingDetails.address.postal_code} {shippingDetails.address.city}
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
