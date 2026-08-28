import Link from "next/link";
import { categories } from "@/data/categories";

export function Footer() {
  return (
    <footer className="border-t border-black/5 bg-white">
      <div className="container-page grid gap-10 py-14 sm:grid-cols-2 md:grid-cols-4">
        <div className="sm:col-span-2 md:col-span-1">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-clay-500 font-display text-base font-bold text-white">
              G
            </span>
            <span className="font-display text-xl font-semibold text-stone-900">Guedias</span>
          </Link>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-stone-900/60">
            Objetos impressos em 3D, camada a camada, numa Creality Hi Combo.
            Design pensado, produção cuidada, peças com significado.
          </p>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-stone-900">Categorias</h3>
          <ul className="mt-4 space-y-2.5">
            {categories.map((c) => (
              <li key={c.key}>
                <Link
                  href={`/loja?categoria=${c.key}`}
                  className="text-sm text-stone-900/60 transition-colors hover:text-clay-600"
                >
                  {c.label}
                </Link>
              </li>
            ))}
          </ul>
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
                Sobre a Guedias
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
          <h3 className="text-sm font-semibold text-stone-900">Contacto</h3>
          <ul className="mt-4 space-y-2.5 text-sm text-stone-900/60">
            <li>ola@guedias.pt</li>
            <li>Feito à mão, à máquina, em Portugal</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-black/5 py-6">
        <div className="container-page flex flex-col items-center justify-between gap-2 text-xs text-stone-900/45 sm:flex-row">
          <p>© {new Date().getFullYear()} Guedias. Todos os direitos reservados.</p>
          <p>Loja de demonstração — sem processamento de pagamentos reais.</p>
        </div>
      </div>
    </footer>
  );
}
