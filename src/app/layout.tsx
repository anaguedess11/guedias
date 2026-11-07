import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/components/CartProvider";
import { FavoritesProvider } from "@/components/FavoritesProvider";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SupabaseSetupNotice } from "@/components/SupabaseSetupNotice";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { getCurrentUser } from "@/lib/auth";
import { getSiteUrl } from "@/lib/site";

// Serifa de alto contraste para títulos, próxima das letras do logótipo.
const playfair = Playfair_Display({
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

const description =
  "Gu3Dias, criamos o que imaginas. Peças impressas em 3D em Portugal, feitas por encomenda e personalizadas.";

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: "Gu3Dias — Criamos o que imaginas",
  description,
  openGraph: {
    title: "Gu3Dias — Criamos o que imaginas",
    description,
    siteName: "Gu3Dias",
    locale: "pt_PT",
    type: "website",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Gu3Dias" }],
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  return (
    <html lang="pt-PT" className={`${playfair.variable} ${inter.variable}`}>
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
