"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatPrice } from "@/lib/format";
import {
  cancelOrder,
  refundOrder,
  resendConfirmationEmail,
  saveOrderNotes,
  updateOrderShipping,
} from "@/app/admin/encomendas/actions";

interface OrderActionsProps {
  order: {
    id: string;
    status: "pending" | "paid" | "failed" | "canceled" | "refunded";
    total_cents: number;
    refunded_cents: number;
    hasPaymentIntent: boolean;
    admin_notes: string;
    shipping_name: string;
    line1: string;
    line2: string;
    postal_code: string;
    city: string;
  };
}

type Feedback = { kind: "ok" | "error"; message: string } | null;

export function OrderActions({ order }: OrderActionsProps) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback>(null);

  const [notes, setNotes] = useState(order.admin_notes);
  const [editingShipping, setEditingShipping] = useState(false);
  const [shipping, setShipping] = useState({
    shipping_name: order.shipping_name,
    line1: order.line1,
    line2: order.line2,
    postal_code: order.postal_code,
    city: order.city,
  });
  const [refundAmount, setRefundAmount] = useState("");

  const remainingCents = order.total_cents - order.refunded_cents;
  const canRefund =
    order.hasPaymentIntent &&
    (order.status === "paid" || order.status === "canceled") &&
    remainingCents > 0;

  async function run(key: string, fn: () => Promise<{ error?: string; ok?: boolean }>, okMsg: string) {
    setBusy(key);
    setFeedback(null);
    const result = await fn();
    setBusy(null);
    if (result?.error) {
      setFeedback({ kind: "error", message: result.error });
      return false;
    }
    setFeedback({ kind: "ok", message: okMsg });
    router.refresh();
    return true;
  }

  return (
    <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
      <div className="card space-y-3 p-5">
        <h2 className="text-sm font-semibold text-stone-900">Ações</h2>

        {feedback && (
          <p
            className={`rounded-lg px-3 py-2 text-xs ${
              feedback.kind === "ok"
                ? "bg-pine-50 text-pine-700"
                : "bg-red-50 text-red-700"
            }`}
          >
            {feedback.message}
          </p>
        )}

        <button
          type="button"
          disabled={busy !== null}
          onClick={() =>
            run("resend", () => resendConfirmationEmail(order.id), "Email de confirmação reenviado.")
          }
          className="btn-secondary w-full"
        >
          {busy === "resend" ? "A enviar…" : "Reenviar email de confirmação"}
        </button>

        {order.status !== "canceled" && order.status !== "refunded" && (
          <button
            type="button"
            disabled={busy !== null}
            onClick={() => {
              if (!window.confirm("Cancelar esta encomenda? O reembolso (se houver) é feito à parte.")) return;
              run("cancel", () => cancelOrder(order.id), "Encomenda cancelada.");
            }}
            className="btn-ghost w-full text-red-600 hover:bg-red-50"
          >
            {busy === "cancel" ? "A cancelar…" : "Cancelar encomenda"}
          </button>
        )}
      </div>

      {canRefund && (
        <div className="card space-y-3 p-5">
          <h2 className="text-sm font-semibold text-stone-900">Reembolso</h2>
          <p className="text-xs text-stone-900/55">
            Disponível para reembolso: <strong>{formatPrice(remainingCents / 100)}</strong>
            {order.refunded_cents > 0 && (
              <> (já reembolsado {formatPrice(order.refunded_cents / 100)})</>
            )}
          </p>
          <div>
            <label className="label">Valor parcial (€, opcional)</label>
            <input
              className="input"
              inputMode="decimal"
              placeholder={`Deixa vazio para ${formatPrice(remainingCents / 100)}`}
              value={refundAmount}
              onChange={(e) => setRefundAmount(e.target.value)}
            />
          </div>
          <button
            type="button"
            disabled={busy !== null}
            onClick={() => {
              const euros = refundAmount.trim()
                ? parseFloat(refundAmount.replace(",", "."))
                : null;
              if (euros !== null && (!Number.isFinite(euros) || euros <= 0)) {
                setFeedback({ kind: "error", message: "Indica um valor válido." });
                return;
              }
              const label = euros !== null ? formatPrice(euros) : formatPrice(remainingCents / 100);
              if (!window.confirm(`Reembolsar ${label} no Stripe?`)) return;
              run(
                "refund",
                () => refundOrder(order.id, euros !== null ? Math.round(euros * 100) : undefined),
                "Reembolso processado no Stripe."
              ).then((ok) => ok && setRefundAmount(""));
            }}
            className="btn-primary w-full"
          >
            {busy === "refund" ? "A reembolsar…" : "Reembolsar via Stripe"}
          </button>
        </div>
      )}

      <div className="card space-y-3 p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-stone-900">Morada de envio</h2>
          <button
            type="button"
            onClick={() => setEditingShipping((v) => !v)}
            className="text-xs font-medium text-clay-600 hover:text-clay-700"
          >
            {editingShipping ? "Fechar" : "Editar"}
          </button>
        </div>
        {editingShipping && (
          <div className="space-y-2">
            <input
              className="input"
              placeholder="Nome"
              value={shipping.shipping_name}
              onChange={(e) => setShipping((s) => ({ ...s, shipping_name: e.target.value }))}
            />
            <input
              className="input"
              placeholder="Morada"
              value={shipping.line1}
              onChange={(e) => setShipping((s) => ({ ...s, line1: e.target.value }))}
            />
            <input
              className="input"
              placeholder="Morada (linha 2, opcional)"
              value={shipping.line2}
              onChange={(e) => setShipping((s) => ({ ...s, line2: e.target.value }))}
            />
            <div className="flex gap-2">
              <input
                className="input"
                placeholder="Código postal"
                value={shipping.postal_code}
                onChange={(e) => setShipping((s) => ({ ...s, postal_code: e.target.value }))}
              />
              <input
                className="input"
                placeholder="Localidade"
                value={shipping.city}
                onChange={(e) => setShipping((s) => ({ ...s, city: e.target.value }))}
              />
            </div>
            <button
              type="button"
              disabled={busy !== null}
              onClick={() =>
                run("shipping", () => updateOrderShipping(order.id, shipping), "Morada atualizada.").then(
                  (ok) => ok && setEditingShipping(false)
                )
              }
              className="btn-secondary w-full"
            >
              {busy === "shipping" ? "A guardar…" : "Guardar morada"}
            </button>
          </div>
        )}
      </div>

      <div className="card space-y-3 p-5">
        <h2 className="text-sm font-semibold text-stone-900">Notas internas</h2>
        <textarea
          className="input min-h-[100px] resize-y"
          placeholder="Só visível aqui no admin."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
        <button
          type="button"
          disabled={busy !== null || notes === order.admin_notes}
          onClick={() => run("notes", () => saveOrderNotes(order.id, notes), "Notas guardadas.")}
          className="btn-secondary w-full disabled:opacity-50"
        >
          {busy === "notes" ? "A guardar…" : "Guardar notas"}
        </button>
      </div>
    </aside>
  );
}
