"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateOrderFulfillment } from "@/app/admin/encomendas/actions";

const OPTIONS: { value: string; label: string }[] = [
  { value: "not_started", label: "Por começar" },
  { value: "in_production", label: "Em produção" },
  { value: "shipped", label: "Enviada" },
  { value: "delivered", label: "Entregue" },
];

export function OrderStatusSelect({
  orderId,
  status,
}: {
  orderId: string;
  status: string;
}) {
  const router = useRouter();
  const [value, setValue] = useState(status);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleChange(newValue: string) {
    const previous = value;
    setValue(newValue);
    setSaving(true);
    setError(null);
    const result = await updateOrderFulfillment(
      orderId,
      newValue as "not_started" | "in_production" | "shipped" | "delivered"
    );
    setSaving(false);
    if (result.error) {
      setValue(previous);
      setError(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <div>
      <select
        value={value}
        disabled={saving}
        onChange={(e) => handleChange(e.target.value)}
        className="rounded-full border border-black/10 bg-white px-3 py-1.5 text-xs font-medium text-stone-900 disabled:opacity-50"
      >
        {OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
