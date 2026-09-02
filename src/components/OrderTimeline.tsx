type PaymentStatus = "pending" | "paid" | "failed" | "canceled" | "refunded";
type FulfillmentStatus = "not_started" | "in_production" | "shipped" | "delivered";

const STEPS: { key: FulfillmentStatus; label: string; note: string }[] = [
  { key: "not_started", label: "Pago", note: "Recebemos o pagamento." },
  { key: "in_production", label: "Em produção", note: "A tua peça está a ser impressa." },
  { key: "shipped", label: "Enviada", note: "A caminho da tua morada." },
  { key: "delivered", label: "Entregue", note: "Esperamos que gostes!" },
];

const ORDER: Record<FulfillmentStatus, number> = {
  not_started: 0,
  in_production: 1,
  shipped: 2,
  delivered: 3,
};

export function OrderTimeline({
  status,
  fulfillmentStatus,
}: {
  status: PaymentStatus;
  fulfillmentStatus: FulfillmentStatus;
}) {
  if (status === "pending" || status === "failed" || status === "canceled") {
    const copy: Record<string, { title: string; body: string; tone: string }> = {
      pending: {
        title: "Pagamento pendente",
        body: "Assim que o pagamento for confirmado, começamos a preparar a encomenda.",
        tone: "bg-clay-50 text-clay-700",
      },
      failed: {
        title: "Pagamento não concluído",
        body: "O pagamento não foi concluído. Podes tentar comprar de novo.",
        tone: "bg-red-50 text-red-700",
      },
      canceled: {
        title: "Encomenda cancelada",
        body: "Esta encomenda foi cancelada. Se tiveres dúvidas, contacta-nos.",
        tone: "bg-black/5 text-stone-900/60",
      },
    };
    const c = copy[status];
    return (
      <div className={`rounded-xl px-4 py-3 text-sm ${c.tone}`}>
        <p className="font-medium">{c.title}</p>
        <p className="mt-0.5 text-xs opacity-80">{c.body}</p>
      </div>
    );
  }

  const current = ORDER[fulfillmentStatus];

  return (
    <div>
      {status === "refunded" && (
        <p className="mb-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-700">
          Esta encomenda foi reembolsada.
        </p>
      )}
      <ol className="relative space-y-6 border-l border-black/10 pl-6">
        {STEPS.map((step, i) => {
          const done = i <= current;
          const isCurrent = i === current;
          return (
            <li key={step.key} className="relative">
              <span
                className={`absolute -left-[1.6rem] top-0.5 flex h-4 w-4 items-center justify-center rounded-full border-2 ${
                  done
                    ? "border-clay-500 bg-clay-500"
                    : "border-black/15 bg-white"
                }`}
              >
                {done && (
                  <svg width="8" height="8" viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth="2.5">
                    <path d="M2 6.5l2.5 2.5L10 3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </span>
              <p
                className={`text-sm font-medium ${
                  isCurrent ? "text-clay-700" : done ? "text-stone-900" : "text-stone-900/40"
                }`}
              >
                {step.label}
              </p>
              <p className={`mt-0.5 text-xs ${done ? "text-stone-900/55" : "text-stone-900/35"}`}>
                {step.note}
              </p>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
