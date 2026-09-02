import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/components/CartProvider";
import { FavoritesProvider } from "@/components/FavoritesProvider";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SupabaseSetupNotice } from "@/components/SupabaseSetupNotice";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { getCurrentUser } from "@/lib/auth";

// Contraste editorial: serifa expressiva para títulos, sans limpa para o resto.
const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

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
    <html lang="pt-PT" className={`${fraunces.variable} ${inter.variable}`}>
      <body className="flex min-h-screen flex-col font-sans antialiased">
        <CartProvider>
          <FavoritesProvider>
            {!isSupabaseConfigured && <SupabaseSetupNotice />}
            <Header user={user ? { email: user.email, isAdmin: user.isAdmin } : null} />
            <main className="flex-1">{children}</main>
            <Footer />
          </FavoritesProvider>
        </CartProvider>
      </body>
    </html>
  );
}
