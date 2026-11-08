"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { setProductHidden } from "@/app/admin/actions";

export function ToggleProductHiddenButton({ id, hidden }: { id: string; hidden: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setError(null);
    const result = await setProductHidden(id, !hidden);
    setLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="text-xs font-medium text-stone-900/60 hover:text-stone-900 disabled:opacity-50"
      >
        {loading ? "A guardar…" : hidden ? "Mostrar" : "Ocultar"}
      </button>
      {error && <p className="max-w-[14rem] text-right text-xs text-red-600">{error}</p>}
    </div>
  );
}
