import type { Metadata } from "next";
import "./globals.css";
import { CartProvider } from "@/components/CartProvider";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SupabaseSetupNotice } from "@/components/SupabaseSetupNotice";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Guedias — Objetos impressos em 3D",
  description:
    "Loja online de produtos impressos em 3D: decoração, utilidades, gadgets e peças personalizadas, feitas camada a camada numa Creality Hi Combo.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  return (
    <html lang="pt-PT">
      <body className="flex min-h-screen flex-col font-sans antialiased">
        <CartProvider>
          {!isSupabaseConfigured && <SupabaseSetupNotice />}
          <Header user={user ? { email: user.email, isAdmin: user.isAdmin } : null} />
          <main className="flex-1">{children}</main>
          <Footer />
        </CartProvider>
      </body>
    </html>
  );
}
