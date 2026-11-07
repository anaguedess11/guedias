import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { CustomRequestActions } from "@/components/CustomRequestActions";
import {
  CUSTOM_REQUEST_STATUS_LABEL,
  isCustomRequestStatus,
  whatsappUrl,
} from "@/lib/custom-requests";

export const metadata: Metadata = {
  title: "Ideias — Gu3Dias",
};

interface RequestRow {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  description: string;
  size: string | null;
  colors: string | null;
  needed_by: string | null;
  quantity: number | null;
  image_paths: string[];
  status: string;
  created_at: string;
}

export default async function AdminIdeiasPage() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("custom_requests")
    .select("id, name, email, phone, description, size, colors, needed_by, quantity, image_paths, status, created_at")
    .order("created_at", { ascending: false })
    .limit(100)
    .returns<RequestRow[]>();

  if (error) console.error("[guedias] erro ao carregar ideias:", error.message);
  const requests = data ?? [];

  // O bucket é privado: as imagens abrem com links temporários.
  const paths = requests.flatMap((r) => r.image_paths);
  const signed = paths.length
    ? (await supabase.storage.from("custom-request-images").createSignedUrls(paths, 3600)).data ?? []
    : [];
  const urlByPath = new Map(signed.map((s) => [s.path, s.signedUrl]));

  return (
    <div>
      <p className="eyebrow">Administração</p>
      <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl">
        Ideias
      </h1>
      <p className="mt-2 text-sm text-stone-900/55">Pedidos enviados em &quot;Imagina a tua peça&quot;.</p>

      {error ? (
        <p className="card mt-8 p-8 text-center text-sm text-red-600">Não foi possível carregar as ideias.</p>
      ) : requests.length === 0 ? (
        <p className="card mt-8 p-8 text-center text-sm text-stone-900/55">Ainda não há ideias.</p>
      ) : (
        <div className="mt-8 space-y-5">
          {requests.map((request) => {
            const firstName = request.name.split(" ")[0];
            const greeting = `Olá ${firstName}! Recebemos a tua ideia na Gu3Dias.`;
            const whatsapp = request.phone ? whatsappUrl(request.phone, greeting) : null;
            const mailto = `mailto:${request.email}?subject=${encodeURIComponent(
              "A tua ideia para a Gu3Dias"
            )}&body=${encodeURIComponent(`${greeting}\n\n`)}`;
            const details = [
              ["Tamanho", request.size],
              ["Cores", request.colors],
              ["Para quando", request.needed_by],
              ["Quantidade", request.quantity],
            ].filter(([, value]) => value);

            return (
              <article key={request.id} className="card p-5 sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-base font-semibold text-stone-900">{request.name}</h2>
                    <p className="mt-0.5 text-xs text-stone-900/50">
                      {new Date(request.created_at).toLocaleString("pt-PT", {
                        dateStyle: "medium",
                        timeStyle: "short",
                        timeZone: "Europe/Lisbon",
                      })}{" "}
                      ·{" "}
                      {isCustomRequestStatus(request.status)
                        ? CUSTOM_REQUEST_STATUS_LABEL[request.status]
                        : request.status}
                    </p>
                  </div>
                  <CustomRequestActions id={request.id} status={request.status} />
                </div>

                <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-relaxed text-stone-900/75">
                  {request.description}
                </p>

                {details.length > 0 && (
                  <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
                    {details.map(([label, value]) => (
                      <div key={String(label)}>
                        <dt className="text-xs text-stone-900/45">{label}</dt>
                        <dd className="break-words text-stone-900/75">{value}</dd>
                      </div>
                    ))}
                  </dl>
                )}

                {request.image_paths.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-3">
                    {request.image_paths.map((path, i) => {
                      const url = urlByPath.get(path);
                      if (!url) return null;
                      return (
                        <a
                          key={path}
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                          className="block h-28 w-28 overflow-hidden rounded-xl border border-black/10"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={url} alt={`Imagem ${i + 1} de ${request.name}`} className="h-full w-full object-cover" />
                        </a>
                      );
                    })}
                  </div>
                )}

                <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-black/5 pt-4">
                  <a href={mailto} className="btn-secondary px-4 py-2 text-xs">
                    Responder por email
                  </a>
                  {whatsapp && (
                    <a href={whatsapp} target="_blank" rel="noreferrer" className="btn-secondary px-4 py-2 text-xs">
                      Responder por WhatsApp
                    </a>
                  )}
                  <span className="break-all text-xs text-stone-900/50">
                    {[request.email, request.phone].filter(Boolean).join(" · ")}
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
