"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function EntrarPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);
    if (signInError) {
      setError(traduzirErro(signInError.message));
      return;
    }
    router.refresh();
    router.push("/conta");
  }

  return (
    <div className="container-page flex justify-center py-16 sm:py-24">
      <div className="w-full max-w-sm">
        <p className="eyebrow text-center">Bem-vinda de volta</p>
        <h1 className="mt-2 text-center font-display text-2xl font-semibold text-stone-900 sm:text-3xl">
          Entrar
        </h1>

        <form onSubmit={handleSubmit} className="card mt-8 space-y-4 p-6">
          <div>
            <label className="label" htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="label" htmlFor="password">Palavra-passe</label>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "A entrar…" : "Entrar"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-stone-900/55">
          Ainda não tens conta?{" "}
          <Link href="/conta/registar" className="font-medium text-clay-600 hover:text-clay-700">
            Regista-te
          </Link>
        </p>
      </div>
    </div>
  );
}

function traduzirErro(message: string) {
  if (message.includes("Invalid login credentials")) return "Email ou palavra-passe incorretos.";
  if (message.includes("Email not confirmed")) return "Confirma o teu email antes de entrares — verifica a tua caixa de correio.";
  return message;
}
