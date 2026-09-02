import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { PrintButton } from "@/components/PrintButton";

export const metadata: Metadata = {
  title: "Etiqueta de envio — Guedias",
};

/* ─────────────────────────────────────────────────────────────
   REMETENTE — preenche com a morada real da Guedias.
   ───────────────────────────────────────────────────────────── */
const SENDER = {
  name: "Guedias",
  lines: ["[Rua e número]", "[Andar / porta — opcional]"],
  postalCity: "[Código postal] [Localidade]",
  country: "Portugal",
  phone: "[Telefone — opcional]",
};

interface OrderRow {
  id: string;
  email: string;
  created_at: string;
  shipping_name: string | null;
  shipping_method: string | null;
  shipping_address: {
    line1?: string | null;
    line2?: string | null;
    postal_code?: string | null;
    city?: string | null;
  } | null;
}

export default async function EtiquetaPage({ params }: { params: { id: string } }) {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("orders")
    .select("id, email, created_at, shipping_name, shipping_method, shipping_address")
    .eq("id", params.id)
    .maybeSingle();

  const order = data as OrderRow | null;
  if (!order) notFound();

  const addr = order.shipping_address;
  const shortId = order.id.slice(0, 8);
  const date = new Date(order.created_at).toLocaleDateString("pt-PT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  return (
    <div>
      {/* Regras de impressão — só ativas enquanto esta página está aberta.
          Escondem tudo o resto e imprimem apenas .print-label numa folha 100×150 mm. */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @media print {
              @page { size: 100mm 150mm; margin: 0; }
              body { background: #fff; }
              body * { visibility: hidden; }
              .print-hide { display: none !important; }
              .print-label, .print-label * { visibility: visible; }
              .print-label {
                position: absolute;
                left: 0;
                top: 0;
                margin: 0;
                border: none !important;
                box-shadow: none !important;
                border-radius: 0 !important;
              }
            }
          `,
        }}
      />

      {/* Barra de ferramentas — não aparece na impressão */}
      <div className="print-hide mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link
          href={`/admin/encomendas/${order.id}`}
          className="text-xs font-medium text-clay-600 hover:text-clay-700"
        >
          ← Voltar à encomenda
        </Link>
        <PrintButton />
      </div>

      <p className="print-hide mb-4 text-sm text-stone-900/55">
        Pré-visualização da etiqueta (100 × 150 mm). Confirma que a morada do
        remetente está preenchida em{" "}
        <code className="rounded bg-black/5 px-1">src/app/admin/encomendas/[id]/etiqueta/page.tsx</code>
        .
      </p>

      {/* A etiqueta */}
      <div
        className="print-label mx-auto box-border flex flex-col border border-black bg-white text-black"
        style={{ width: "100mm", height: "150mm", padding: "7mm" }}
      >
        <div className="flex items-start justify-between border-b-2 border-black pb-2">
          <span className="font-display text-lg font-bold tracking-tight">Guedias</span>
          <span className="text-[10px] font-semibold uppercase tracking-[0.15em]">
            Etiqueta de envio
          </span>
        </div>

        <div className="mt-3">
          <p className="text-[9px] font-semibold uppercase tracking-[0.15em]">Remetente</p>
          <div className="mt-1 text-[11px] leading-snug">
            <p className="font-semibold">{SENDER.name}</p>
            {SENDER.lines.filter(Boolean).map((line, i) => (
              <p key={i}>{line}</p>
            ))}
            <p>{SENDER.postalCity}</p>
            <p>{SENDER.country}</p>
            {SENDER.phone && <p>Tel.: {SENDER.phone}</p>}
          </div>
        </div>

        <div className="mt-4 border-t border-black pt-3">
          <p className="text-[9px] font-semibold uppercase tracking-[0.15em]">Destinatário</p>
          <div className="mt-1 text-[15px] font-medium leading-snug">
            <p className="text-base font-bold">{order.shipping_name ?? "—"}</p>
            {addr ? (
              <>
                {addr.line1 && <p>{addr.line1}</p>}
                {addr.line2 && <p>{addr.line2}</p>}
                <p>{[addr.postal_code, addr.city].filter(Boolean).join(" ") || "—"}</p>
                <p>Portugal</p>
              </>
            ) : (
              <p className="text-[11px]">Sem morada de envio guardada nesta encomenda.</p>
            )}
          </div>
          <p className="mt-1 text-[10px]">{order.email}</p>
        </div>

        <div className="mt-auto border-t-2 border-black pt-2">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-[0.15em]">Encomenda</p>
              <p className="font-display text-2xl font-bold leading-none">#{shortId}</p>
            </div>
            <div className="text-right text-[10px] leading-tight">
              <p>{date}</p>
              {order.shipping_method && <p>{order.shipping_method}</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
