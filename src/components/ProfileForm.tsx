"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateProfile, type ProfileInput } from "@/app/conta/actions";

export function ProfileForm({ initial }: { initial: ProfileInput }) {
  const router = useRouter();
  const [form, setForm] = useState<ProfileInput>(initial);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ kind: "ok" | "error"; msg: string } | null>(null);

  function set<K extends keyof ProfileInput>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
    setFeedback(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const result = await updateProfile(form);
    setSaving(false);
    if (result.error) {
      setFeedback({ kind: "error", msg: result.error });
      return;
    }
    setFeedback({ kind: "ok", msg: "Perfil guardado." });
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="card space-y-4 p-6">
        <h2 className="text-sm font-semibold text-stone-900">Dados pessoais</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Nome</label>
            <input className="input" value={form.full_name} onChange={(e) => set("full_name", e.target.value)} />
          </div>
          <div>
            <label className="label">Telefone</label>
            <input
              className="input"
              inputMode="tel"
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="card space-y-4 p-6">
        <h2 className="text-sm font-semibold text-stone-900">Morada de envio</h2>
        <p className="-mt-1 text-xs text-stone-900/50">
          Guardada para pré-preencher o checkout. Podes sempre alterá-la no pagamento.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="label">Nome para entrega</label>
            <input
              className="input"
              value={form.shipping_name}
              onChange={(e) => set("shipping_name", e.target.value)}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Morada</label>
            <input
              className="input"
              value={form.shipping_line1}
              onChange={(e) => set("shipping_line1", e.target.value)}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Morada (linha 2, opcional)</label>
            <input
              className="input"
              value={form.shipping_line2}
              onChange={(e) => set("shipping_line2", e.target.value)}
            />
          </div>
          <div>
            <label className="label">Código postal</label>
            <input
              className="input"
              value={form.shipping_postal_code}
              onChange={(e) => set("shipping_postal_code", e.target.value)}
            />
          </div>
          <div>
            <label className="label">Localidade</label>
            <input
              className="input"
              value={form.shipping_city}
              onChange={(e) => set("shipping_city", e.target.value)}
            />
          </div>
        </div>
      </div>

      {feedback && (
        <p
          className={`rounded-lg px-3 py-2 text-sm ${
            feedback.kind === "ok" ? "bg-pine-50 text-pine-700" : "bg-red-50 text-red-700"
          }`}
        >
          {feedback.msg}
        </p>
      )}

      <button type="submit" disabled={saving} className="btn-primary">
        {saving ? "A guardar…" : "Guardar alterações"}
      </button>
    </form>
  );
}
