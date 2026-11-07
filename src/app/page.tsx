import Link from "next/link";
import { getAllProducts } from "@/lib/data/products";
import { ProductCard } from "@/components/ProductCard";
import { ProductVisual } from "@/components/ProductVisual";
import { PrintProcessScroll } from "@/components/PrintProcessScroll";

const CONTACT_EMAIL = "guediasgeral@gmail.com";

const PROCESS_STEPS = [
  {
    title: "Modelação",
    description: "Cada peça começa em software 3D, desenhada ao milímetro antes de chegar à impressora.",
  },
  {
    title: "Impressão",
    description: "A Creality Hi Combo constrói a peça camada a camada, em filamento PLA.",
  },
  {
    title: "Acabamento",
    description: "Removemos suportes, lixamos quando é preciso e verificamos cada peça.",
  },
  {
    title: "Entrega",
    description: "Embalamos com cuidado e enviamos, ou entregamos em mão em Coimbra e Santarém.",
  },
];

export default async function HomePage() {
  const products = await getAllProducts();
  // A foto da peça em destaque é o rosto da página inicial.
  const showcase =
    products.find((p) => p.featured && p.imageUrl) ?? products.find((p) => p.imageUrl) ?? products[0];
  const showcaseName = showcase?.name ?? "uma peça Gu3Dias";

  return (
    <div>
      {/* Hero */}
      <section className="bg-white">
        <div className="container-page grid gap-10 py-14 sm:py-20 lg:grid-cols-[1.1fr_1fr] lg:items-center lg:gap-16">
          <div className="animate-slide-up">
            <p className="eyebrow">Impressão 3D · Feito em Portugal</p>
            <h1 className="mt-5 font-display text-[2.6rem] font-semibold leading-[1.05] tracking-[-0.01em] text-pine-800 sm:text-6xl lg:text-[4.25rem]">
              Criamos o que <span className="italic text-clay-600">imaginas</span>.
            </h1>
            <p className="mt-6 max-w-md text-base leading-relaxed text-stone-900/65 sm:text-lg">
              Peças impressas em 3D, feitas por encomenda e pensadas para ti, da decoração aos
              presentes personalizados.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link href="/loja" className="btn-primary">
                Explorar a loja
                <ArrowIcon />
              </Link>
              <Link href="/sobre" className="btn-secondary">
                Como fazemos
              </Link>
            </div>
          </div>

          {showcase && (
            <Link
              href={`/produto/${showcase.slug}`}
              className="group mx-auto block w-full max-w-md lg:mr-0"
            >
              <div className="overflow-hidden rounded-xl2 bg-stone-50 shadow-card">
                <ProductVisual
                  imageUrl={showcase.imageUrl}
                  profile={showcase.profile}
                  color={showcase.colors[0]?.hex ?? "#A97464"}
                  className="media-zoom aspect-square h-full w-full"
                />
              </div>
              <p className="mt-3 flex items-center justify-between text-sm text-stone-900/60">
                <span>{showcase.name}</span>
                <span className="font-medium text-clay-600">Ver peça →</span>
              </p>
            </Link>
          )}
        </div>
      </section>

      {/* As peças */}
      {products.length > 0 && (
        <section className="section bg-stone-50">
          <div className="container-page">
            <div className="text-center">
              <p className="eyebrow">A coleção</p>
              <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight text-pine-800 sm:text-4xl">
                As nossas peças
              </h2>
            </div>

            <div
              className={`mx-auto mt-10 grid grid-cols-2 gap-4 sm:gap-6 ${
                products.length <= 2 ? "max-w-3xl" : "lg:grid-cols-4"
              }`}
            >
              {products.slice(0, 8).map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>

            {products.length > 8 && (
              <div className="mt-10 text-center">
                <Link href="/loja" className="btn-secondary">
                  Ver todos os produtos
                </Link>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Do ficheiro ao objeto — animação controlada pelo scroll */}
      <PrintProcessScroll
        productName={showcaseName}
        photoUrl={showcase?.imageUrl}
        profile={showcase?.profile}
        color={showcase?.colors[0]?.hex}
      />

      {/* Como funciona */}
      <section className="section">
        <div className="container-page">
          <div className="mx-auto max-w-xl text-center">
            <p className="eyebrow">O processo</p>
            <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight text-pine-800 sm:text-4xl">
              Da ideia ao objeto, camada a camada
            </h2>
          </div>

          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {PROCESS_STEPS.map((step, i) => (
              <div key={step.title} className="border-t-2 border-clay-300 pt-5">
                <p className="font-display text-2xl font-semibold text-clay-600">{i + 1}</p>
                <h3 className="mt-2 text-base font-semibold text-stone-900">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-stone-900/60">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Peças à medida */}
      <section className="section bg-pine-800">
        <div className="container-page flex flex-col items-center gap-6 text-center">
          <p className="eyebrow text-clay-300">Peças à medida</p>
          <h2 className="max-w-2xl font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Tens uma ideia que não está na loja?
          </h2>
          <p className="max-w-lg text-sm leading-relaxed text-white/70 sm:text-base">
            Conta-nos o que imaginas e vemos juntos como a transformar numa peça real.
          </p>
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="btn bg-white text-pine-800 hover:-translate-y-0.5 hover:bg-clay-100 active:translate-y-0"
          >
            Falar connosco
          </a>
        </div>
      </section>
    </div>
  );
}

function ArrowIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
