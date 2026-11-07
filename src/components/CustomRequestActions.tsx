"use client";

import { useState, useTransition } from "react";
import { deleteCustomRequest, updateCustomRequestStatus } from "@/app/admin/ideias/actions";
import { CUSTOM_REQUEST_STATUS_LABEL } from "@/lib/custom-requests";

export function CustomRequestActions({ id, status }: { id: string; status: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function run(action: () => Promise<{ error?: string }>) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (result.error) setError(result.error);
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <label className="sr-only" htmlFor={`status-${id}`}>
        Estado
      </label>
      <select
        id={`status-${id}`}
        value={status}
        disabled={pending}
        onChange={(e) => run(() => updateCustomRequestStatus(id, e.target.value))}
        className="rounded-full border border-pine-900/15 bg-white px-3 py-2 text-sm text-stone-900"
      >
        {Object.entries(CUSTOM_REQUEST_STATUS_LABEL).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (window.confirm("Apagar esta ideia e as imagens? Não é possível recuperar.")) {
            run(() => deleteCustomRequest(id));
          }
        }}
        className="rounded-full px-3 py-2 text-sm text-red-700 transition-colors hover:bg-red-50 disabled:opacity-50"
      >
        Apagar
      </button>
      {error && <p className="w-full text-sm text-red-600">{error}</p>}
    </div>
  );
}
