"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteProduct } from "@/app/admin/actions";

export function DeleteProductButton({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    if (!window.confirm(`Apagar "${name}"? Esta ação não pode ser desfeita.`)) return;
    setLoading(true);
    setError(null);
    const result = await deleteProduct(id);
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
        onClick={handleDelete}
        disabled={loading}
        className="text-xs font-medium text-stone-900/45 hover:text-red-600"
      >
        {loading ? "A apagar…" : "Apagar"}
      </button>
      {error && <p className="max-w-[14rem] text-right text-xs text-red-600">{error}</p>}
    </div>
  );
}
