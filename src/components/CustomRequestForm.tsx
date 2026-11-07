"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  MAX_DESCRIPTION_LENGTH,
  MAX_IDEA_IMAGES,
  MAX_IDEA_IMAGE_BYTES,
  MIN_DESCRIPTION_LENGTH,
} from "@/lib/custom-requests";

interface PickedImage {
  blob: Blob;
  previewUrl: string;
}

// Reduz a foto no browser: as fotos de telemóvel excedem o limite de envio da Vercel.
async function shrinkImage(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  for (const quality of [0.85, 0.7, 0.55, 0.4]) {
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
    if (blob && blob.size <= MAX_IDEA_IMAGE_BYTES) return blob;
  }
  throw new Error("imagem demasiado grande");
}

export function CustomRequestForm() {
  const [images, setImages] = useState<PickedImage[]>([]);
  const [processing, setProcessing] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const imagesRef = useRef(images);
  imagesRef.current = images;
  useEffect(() => () => imagesRef.current.forEach((i) => URL.revokeObjectURL(i.previewUrl)), []);

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    setError(null);
    const room = MAX_IDEA_IMAGES - images.length;
    const picked = Array.from(files);
    if (picked.length > room) setError(`Podes enviar até ${MAX_IDEA_IMAGES} imagens.`);

    setProcessing(true);
    const added: PickedImage[] = [];
    for (const file of picked.slice(0, room)) {
      try {
        const blob = await shrinkImage(file);
        added.push({ blob, previewUrl: URL.createObjectURL(blob) });
      } catch {
        setError(`Não conseguimos ler "${file.name}". Experimenta uma imagem JPG ou PNG.`);
      }
    }
    setImages((current) => [...current, ...added]);
    setProcessing(false);
    if (fileInput.current) fileInput.current.value = "";
  }

  function removeImage(index: number) {
    URL.revokeObjectURL(images[index].previewUrl);
    setImages((current) => current.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSending(true);

    const data = new FormData(e.currentTarget);
    data.delete("images");
    images.forEach((image, i) => data.append("images", image.blob, `imagem-${i + 1}.jpg`));

    try {
      const response = await fetch("/api/ideias", { method: "POST", body: data });
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        setError(result?.error ?? "Não foi possível enviar a tua ideia. Tenta novamente.");
        return;
      }
      setSent(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setError("Não foi possível enviar a tua ideia. Confirma a ligação e tenta novamente.");
    } finally {
      setSending(false);
    }
  }

  if (sent) {
    return (
      <div className="card p-8 text-center">
        <h2 className="font-display text-2xl font-semibold text-stone-900">Recebemos a tua ideia!</h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-stone-900/65">
          Vamos analisá-la e respondemos com o preço e o prazo, ou com alguma dúvida que tenhamos.
        </p>
        <Link href="/loja" className="btn-primary mt-6 inline-flex">
          Explorar a loja
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-6 p-6 sm:p-8">
      <div>
        <label className="label" htmlFor="description">
          O que imaginaste?
        </label>
        <textarea
          id="description"
          name="description"
          required
          minLength={MIN_DESCRIPTION_LENGTH}
          maxLength={MAX_DESCRIPTION_LENGTH}
          className="input min-h-[140px] resize-y"
          placeholder="Por exemplo: um suporte para o comando da televisão, com o nome do meu filho."
        />
      </div>

      <div>
        <span className="label">Fotos ou desenhos (opcional)</span>
        <p className="mb-2 text-xs text-stone-900/50">
          Até {MAX_IDEA_IMAGES} imagens. Um esboço no papel também ajuda.
        </p>
        <div className="flex flex-wrap gap-3">
          {images.map((image, i) => (
            <div key={image.previewUrl} className="relative h-24 w-24 overflow-hidden rounded-xl border border-black/10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image.previewUrl} alt={`Imagem ${i + 1}`} className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => removeImage(i)}
                aria-label={`Remover imagem ${i + 1}`}
                className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-sm text-stone-900 shadow-soft"
              >
                ×
              </button>
            </div>
          ))}
          {images.length < MAX_IDEA_IMAGES && (
            <label className="flex h-24 w-24 cursor-pointer items-center justify-center rounded-xl border border-dashed border-pine-900/25 text-center text-xs text-stone-900/60 transition-colors hover:border-clay-500">
              {processing ? "A preparar…" : "+ Juntar imagem"}
              <input
                ref={fileInput}
                type="file"
                accept="image/*"
                multiple
                disabled={processing}
                className="sr-only"
                onChange={(e) => handleFiles(e.target.files)}
              />
            </label>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="size">
            Tamanho aproximado (opcional)
          </label>
          <input id="size" name="size" maxLength={120} className="input" placeholder="Por exemplo: 10 x 15 cm" />
        </div>
        <div>
          <label className="label" htmlFor="colors">
            Cores (opcional)
          </label>
          <input id="colors" name="colors" maxLength={120} className="input" placeholder="Por exemplo: preto e dourado" />
        </div>
        <div>
          <label className="label" htmlFor="neededBy">
            Para quando precisas (opcional)
          </label>
          <input id="neededBy" name="neededBy" maxLength={120} className="input" placeholder="Por exemplo: até ao Natal" />
        </div>
        <div>
          <label className="label" htmlFor="quantity">
            Quantas peças (opcional)
          </label>
          <input id="quantity" name="quantity" type="number" min={1} max={1000} className="input" placeholder="1" />
        </div>
      </div>

      <div className="grid gap-4 border-t border-black/5 pt-6 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="label" htmlFor="name">
            O teu nome
          </label>
          <input id="name" name="name" required maxLength={120} autoComplete="name" className="input" />
        </div>
        <div>
          <label className="label" htmlFor="email">
            Email
          </label>
          <input id="email" name="email" type="email" required maxLength={200} autoComplete="email" className="input" />
        </div>
        <div>
          <label className="label" htmlFor="phone">
            Telemóvel (opcional)
          </label>
          <input id="phone" name="phone" type="tel" maxLength={30} autoComplete="tel" className="input" />
          <p className="mt-1.5 text-xs text-stone-900/50">Se preferires falar por WhatsApp.</p>
        </div>
      </div>

      {/* Armadilha para robôs: invisível para as pessoas. */}
      <div className="absolute -left-[9999px] h-0 w-0 overflow-hidden" aria-hidden="true">
        <label htmlFor="website">Não preencher</label>
        <input id="website" name="website" tabIndex={-1} autoComplete="off" />
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}

      <div>
        <button type="submit" disabled={sending || processing} className="btn-primary w-full sm:w-auto">
          {sending ? "A enviar…" : "Enviar a minha ideia"}
        </button>
        <p className="mt-3 text-xs leading-relaxed text-stone-900/50">
          Enviar a ideia não é uma encomenda e não tem custos. Só usamos estes dados para responder ao
          teu pedido. Podemos recusar pedidos que não seja possível imprimir ou que copiem uma marca.
        </p>
      </div>
    </form>
  );
}
