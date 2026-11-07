"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const BUCKET = "product-images";
const MAX_BYTES = 5 * 1024 * 1024;
const MAX_IMAGES = 10;

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(new RegExp("[\\u0300-\\u036f]", "g"), "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function ImageGalleryField({
  value,
  onChange,
  slug,
}: {
  value: string[];
  onChange: (urls: string[]) => void;
  slug?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showUrl, setShowUrl] = useState(false);
  const [externalUrl, setExternalUrl] = useState("");

  async function handleFiles(files: File[]) {
    setError(null);

    const free = MAX_IMAGES - value.length;
    if (files.length > free) {
      setError(`Cada produto pode ter no máximo ${MAX_IMAGES} fotos.`);
    }
    const selected = files.slice(0, Math.max(free, 0));
    if (selected.length === 0) return;

    setUploading(true);
    const supabase = createClient();
    const base = slug ? slugify(slug) : "produto";
    const uploaded: string[] = [];

    for (const file of selected) {
      if (!file.type.startsWith("image/")) {
        setError(`"${file.name}" não é uma imagem.`);
        continue;
      }
      if (file.size > MAX_BYTES) {
        setError(`"${file.name}" é demasiado grande (máximo 5 MB).`);
        continue;
      }

      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${base}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { cacheControl: "3600", upsert: false, contentType: file.type });

      if (uploadError) {
        console.error("[guedias] erro ao carregar imagem:", uploadError.message);
        setError(
          uploadError.message.includes("row-level security") || uploadError.message.includes("Unauthorized")
            ? "Sem permissões para carregar. Confirma que a tua conta é administradora."
            : `Não foi possível carregar "${file.name}".`
        );
        continue;
      }

      uploaded.push(supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl);
    }

    if (uploaded.length > 0) onChange([...value, ...uploaded]);
    setUploading(false);
  }

  function move(index: number, delta: number) {
    const target = index + delta;
    if (target < 0 || target >= value.length) return;
    const next = [...value];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  function addExternal() {
    const url = externalUrl.trim();
    if (!/^https?:\/\//i.test(url)) {
      setError("Indica um URL completo, a começar por https://");
      return;
    }
    if (value.length >= MAX_IMAGES) {
      setError(`Cada produto pode ter no máximo ${MAX_IMAGES} fotos.`);
      return;
    }
    setError(null);
    onChange([...value, url]);
    setExternalUrl("");
  }

  return (
    <div>
      <span className="label">Fotografias</span>

      {value.length > 0 && (
        <ul className="mb-3 grid grid-cols-3 gap-3 sm:grid-cols-5">
          {value.map((url, i) => (
            <li key={url} className="overflow-hidden rounded-xl border border-pine-900/10 bg-stone-50">
              <div className="relative aspect-square">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt={`Foto ${i + 1}`} className="h-full w-full object-cover" />
                {i === 0 && (
                  <span className="absolute left-1.5 top-1.5 rounded bg-pine-800 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                    Capa
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between px-1.5 py-1 text-xs">
                <span className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => move(i, -1)}
                    disabled={i === 0}
                    aria-label={`Mover foto ${i + 1} para a esquerda`}
                    className="px-1 text-stone-900/60 hover:text-stone-900 disabled:opacity-25"
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    onClick={() => move(i, 1)}
                    disabled={i === value.length - 1}
                    aria-label={`Mover foto ${i + 1} para a direita`}
                    className="px-1 text-stone-900/60 hover:text-stone-900 disabled:opacity-25"
                  >
                    →
                  </button>
                </span>
                <button
                  type="button"
                  onClick={() => onChange(value.filter((_, index) => index !== i))}
                  aria-label={`Remover foto ${i + 1}`}
                  className="px-1 font-medium text-stone-900/45 hover:text-red-600"
                >
                  ✕
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading || value.length >= MAX_IMAGES}
        className="btn-secondary text-xs disabled:opacity-50"
      >
        {uploading ? "A carregar…" : value.length > 0 ? "Adicionar mais fotos" : "Carregar fotos"}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          e.target.value = "";
          if (files.length > 0) handleFiles(files);
        }}
      />

      <p className="mt-2 text-xs text-stone-900/45">
        Podes escolher várias de uma vez (até {MAX_IMAGES}, JPG, PNG ou WebP, 5 MB cada). A primeira
        é a capa; usa as setas para mudar a ordem.
      </p>

      <button
        type="button"
        onClick={() => setShowUrl((v) => !v)}
        className="mt-2 text-xs font-medium text-clay-600 hover:text-clay-700"
      >
        {showUrl ? "Esconder" : "ou colar o URL de uma foto"}
      </button>
      {showUrl && (
        <div className="mt-2 flex gap-2">
          <input
            className="input"
            placeholder="https://..."
            value={externalUrl}
            onChange={(e) => setExternalUrl(e.target.value)}
          />
          <button type="button" onClick={addExternal} className="btn-secondary shrink-0 text-xs">
            Adicionar
          </button>
        </div>
      )}

      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}
