"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function RegistarPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("A palavra-passe deve ter pelo menos 6 caracteres.");
      return;
    }
    if (password !== confirmPassword) {
      setError("As palavras-passe não coincidem.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    setLoading(false);

    if (signUpError) {
      setError(traduzirErro(signUpError.message));
      return;
    }

    if (data.session) {
      window.location.assign("/conta");
    } else {
      setAwaitingConfirmation(true);
    }
  }

  if (awaitingConfirmation) {
    return (
      <div className="container-page flex justify-center py-16 sm:py-24">
        <div className="card w-full max-w-sm p-6 text-center">
          <h1 className="font-display text-xl font-semibold text-stone-900">Confirma o teu email</h1>
          <p className="mt-3 text-sm leading-relaxed text-stone-900/60">
            Enviámos um link de confirmação para <strong>{email}</strong>. Abre-o para ativares a
            tua conta e depois volta para entrares.
          </p>
          <Link href="/conta/entrar" className="btn-secondary mt-6 inline-flex">
            Ir para o login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container-page flex justify-center py-16 sm:py-24">
      <div className="w-full max-w-sm">
        <p className="eyebrow text-center">Junta-te à Guedias</p>
        <h1 className="mt-2 text-center font-display text-2xl font-semibold text-stone-900 sm:text-3xl">
          Criar conta
        </h1>

        <form onSubmit={handleSubmit} className="card mt-8 space-y-4 p-6">
          <div>
            <label className="label" htmlFor="fullName">Nome</label>
            <input
              id="fullName"
              type="text"
              required
              autoComplete="name"
              className="input"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>
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
              autoComplete="new-password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div>
            <label className="label" htmlFor="confirmPassword">Confirmar palavra-passe</label>
            <input
              id="confirmPassword"
              type="password"
              required
              autoComplete="new-password"
              className="input"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "A criar conta…" : "Criar conta"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-stone-900/55">
          Já tens conta?{" "}
          <Link href="/conta/entrar" className="font-medium text-clay-600 hover:text-clay-700">
            Entra
          </Link>
        </p>
      </div>
    </div>
  );
}

function traduzirErro(message: string) {
  if (message.includes("already registered")) return "Já existe uma conta com este email.";
  if (message.includes("Password should be")) return "A palavra-passe é demasiado fraca.";
  return message;
}
