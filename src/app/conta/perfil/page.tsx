import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ProfileForm } from "@/components/ProfileForm";
import type { ProfileInput } from "@/app/conta/actions";

export const metadata: Metadata = {
  title: "Editar perfil — Guedias",
};

export default async function PerfilPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/conta/entrar");

  const supabase = createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "full_name, phone, shipping_name, shipping_line1, shipping_line2, shipping_postal_code, shipping_city"
    )
    .eq("id", user.id)
    .maybeSingle();

  const initial: ProfileInput = {
    full_name: profile?.full_name ?? "",
    phone: profile?.phone ?? "",
    shipping_name: profile?.shipping_name ?? "",
    shipping_line1: profile?.shipping_line1 ?? "",
    shipping_line2: profile?.shipping_line2 ?? "",
    shipping_postal_code: profile?.shipping_postal_code ?? "",
    shipping_city: profile?.shipping_city ?? "",
  };

  return (
    <div className="container-page py-10 sm:py-14">
      <Link href="/conta" className="text-xs font-medium text-clay-600 hover:text-clay-700">
        ← A minha conta
      </Link>
      <p className="eyebrow mt-3">A minha conta</p>
      <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl">
        Editar perfil
      </h1>
      <p className="mt-2 text-sm text-stone-900/55">{user.email}</p>

      <div className="mt-8 max-w-2xl">
        <ProfileForm initial={initial} />
      </div>
    </div>
  );
}
