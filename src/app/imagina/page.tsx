import type { Metadata } from "next";
import { CustomRequestForm } from "@/components/CustomRequestForm";

export const metadata: Metadata = {
  title: "Imagina a tua peça — Gu3Dias",
  description: "Conta-nos a peça que imaginaste. Vemos contigo como a transformar num objeto real, impresso em 3D.",
};

export default function ImaginaPage() {
  return (
    <div className="container-page py-10 sm:py-14">
      <div className="mx-auto max-w-2xl">
        <p className="eyebrow">Peças à medida</p>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-pine-800 sm:text-5xl">
          Imagina a tua peça
        </h1>
        <p className="mt-4 text-base leading-relaxed text-stone-900/65">
          Tens uma ideia que não está na loja? Conta-nos o que imaginaste, mesmo que ainda não saibas
          todos os pormenores. Respondemos com o preço e o prazo, por email ou WhatsApp.
        </p>

        <div className="mt-8">
          <CustomRequestForm />
        </div>
      </div>
    </div>
  );
}
