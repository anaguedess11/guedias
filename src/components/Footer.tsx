import Image from "next/image";
import Link from "next/link";
import { isBankTransferAvailable } from "@/lib/payment-details";

const CONTACT_EMAIL = "guediasgeral@gmail.com";

export function Footer() {
  return (
    <footer className="bg-white">
      <div className="copper-bar" />
      <div className="container-page grid gap-10 py-14 sm:grid-cols-2 md:grid-cols-4">
        <div className="sm:col-span-2 md:col-span-1">
          <Link href="/" className="flex items-center">
            <Image
              src="/logo-full.png"
              alt="Gu3Dias — Criamos o que imaginas"
              width={793}
              height={262}
              className="h-16 w-auto"
            />
          </Link>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-stone-900/60">
            Peças impressas em 3D em Portugal, feitas por encomenda.
          </p>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-stone-900">Loja</h3>
          <ul className="mt-4 space-y-2.5">
            <li>
              <Link href="/loja" className="text-sm text-stone-900/60 transition-colors hover:text-clay-600">
                Todos os produtos
              </Link>
            </li>
            <li>
              <Link href="/sobre" className="text-sm text-stone-900/60 transition-colors hover:text-clay-600">
                Sobre a Gu3Dias
              </Link>
            </li>
            <li>
              <Link href="/carrinho" className="text-sm text-stone-900/60 transition-colors hover:text-clay-600">
                Carrinho
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-stone-900">Entrega e pagamento</h3>
          <ul className="mt-4 space-y-2.5 text-sm text-stone-900/60">
            <li>Envio para Portugal</li>
            <li>Entrega em mão grátis em Coimbra e Santarém</li>
            <li>Pagamento por {isBankTransferAvailable ? "MB WAY ou transferência" : "MB WAY"}</li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-stone-900">Contacto</h3>
          <ul className="mt-4 space-y-2.5 text-sm text-stone-900/60">
            <li>
              <a href={`mailto:${CONTACT_EMAIL}`} className="break-all transition-colors hover:text-clay-600">
                {CONTACT_EMAIL}
              </a>
            </li>
            <li>
              <Link href="/imagina" className="transition-colors hover:text-clay-600">
                Tens uma ideia? Imagina a tua peça.
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-black/5 py-6">
        <div className="container-page text-center text-xs text-stone-900/45 sm:text-left">
          © {new Date().getFullYear()} Gu3Dias. Todos os direitos reservados.
        </div>
      </div>
    </footer>
  );
}
