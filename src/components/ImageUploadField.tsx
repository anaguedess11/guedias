"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const BUCKET = "product-images";
const MAX_BYTES = 5 * 1024 * 1024;

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(new RegExp("[\\u0300-\\u036f]", "g"), "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function ImageUploadField({
  value,
  onChange,
  slug,
}: {
  value: string;
  onChange: (url: string) => void;
  slug?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showUrl, setShowUrl] = useState(false);

  async function handleFile(file: File) {
    setError(null);

    if (!file.type.startsWith("image/")) {
      setError("O ficheiro tem de ser uma imagem.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("A imagem é demasiado grande (máximo 5 MB).");
      return;
    }

    setUploading(true);
    const supabase = createClient();
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const base = slug ? slugify(slug) : "produto";
    const path = `${base}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, { cacheControl: "3600", upsert: false, contentType: file.type });

    if (uploadError) {
      console.error("[guedias] erro ao carregar imagem:", uploadError.message);
      setError(
        uploadError.message.includes("row-level security") || uploadError.message.includes("Unauthorized")
          ? "Sem permissões para carregar. Confirma que a tua conta é administradora e que a migração 0005 foi corrida."
          : "Não foi possível carregar a imagem."
      );
      setUploading(false);
      return;
    }

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    onChange(data.publicUrl);
    setUploading(false);
  }

  return (
    <div>
      <span className="label">Fotografia (opcional)</span>

      <div className="flex items-start gap-4">
        <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-pine-900/10 bg-stone-50">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-[11px] text-stone-900/40">
              Sem foto
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="btn-secondary text-xs"
            >
              {uploading ? "A carregar…" : value ? "Trocar foto" : "Carregar foto"}
            </button>
            {value && (
              <button
                type="button"
                onClick={() => {
                  onChange("");
                  setError(null);
                }}
                className="text-xs font-medium text-stone-900/45 hover:text-red-600"
              >
                Remover
              </button>
            )}
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
              e.target.value = "";
            }}
          />

          <p className="mt-2 text-xs text-stone-900/45">
            JPG, PNG ou WebP até 5 MB. Sem foto, mostra-se a silhueta gerada
            automaticamente.
          </p>

          <button
            type="button"
            onClick={() => setShowUrl((v) => !v)}
            className="mt-2 text-xs font-medium text-clay-600 hover:text-clay-700"
          >
            {showUrl ? "Esconder" : "ou colar um URL externo"}
          </button>
          {showUrl && (
            <input
              className="input mt-2"
              placeholder="https://..."
              value={value}
              onChange={(e) => onChange(e.target.value)}
            />
          )}

          {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
        </div>
      </div>
    </div>
  );
}
