import Link from "next/link";
import { getFeaturedProducts } from "@/lib/data/products";
import { categories } from "@/data/categories";
import { ProductCard } from "@/components/ProductCard";
import { PrintedObject } from "@/components/PrintedObject";
import { PrintProcessScroll } from "@/components/PrintProcessScroll";

const PROCESS_STEPS = [
  {
    title: "Modelação",
    description: "Cada peça começa em software 3D, desenhada ao milímetro antes de tocar na impressora.",
  },
  {
    title: "Impressão",
    description: "A Creality Hi Combo constrói a peça camada a camada, em filamento PLA, PETG ou TPU.",
  },
  {
    title: "Acabamento",
    description: "Remoção de suportes, lixagem quando necessário, e controlo de qualidade peça a peça.",
  },
  {
    title: "Envio",
    description: "Embalamos com cuidado e enviamos — cada objeto é feito por encomenda, não em massa.",
  },
];

export default async function HomePage() {
  const featured = await getFeaturedProducts();
  const showcase = featured[0];
  const showcaseName = showcase?.name ?? "um objeto Guedias";

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-pine-700 text-white">
        <div
          className="pointer-events-none absolute -right-32 -top-24 h-[32rem] w-[32rem] rounded-full opacity-40 blur-3xl"
          style={{ background: "radial-gradient(circle, rgba(199,67,15,0.55), transparent 65%)" }}
        />
        <div
          className="pointer-events-none absolute -bottom-40 -left-24 h-[28rem] w-[28rem] rounded-full opacity-30 blur-3xl"
          style={{ background: "radial-gradient(circle, rgba(60,97,166,0.7), transparent 65%)" }}
        />
        <div className="container-page relative grid gap-10 py-20 sm:py-28 lg:grid-cols-2 lg:items-center lg:gap-16">
          <div className="animate-slide-up">
            <p className="eyebrow text-clay-300">Impressão 3D · Feito em Portugal</p>
            <h1 className="mt-5 font-display text-[2.25rem] font-semibold leading-[1.03] tracking-[-0.02em] text-white sm:text-5xl lg:text-[4rem]">
              Design em cada{" "}
              <span className="italic text-clay-300">camada</span>.
            </h1>
            <p className="mt-6 max-w-md text-base leading-relaxed text-white/70 sm:text-lg">
              A Guedias transforma ideias em objetos reais através da impressão 3D.
              Decoração, utilidades e peças personalizadas, desenhadas e impressas
              uma a uma numa Creality Hi Combo.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link href="/loja" className="btn-primary">
                Explorar a loja
                <ArrowIcon />
              </Link>
              <Link
                href="/sobre"
                className="btn border border-white/25 bg-white/5 text-white hover:-translate-y-0.5 hover:bg-white/10 active:translate-y-0 active:scale-[0.97]"
              >
                Como fazemos
              </Link>
            </div>
          </div>

          <div className="relative">
            <div className="grid grid-cols-2 gap-4 sm:gap-5">
              <PrintedObject
                profile={[0.34, 0.48, 0.62, 0.78, 0.88, 0.8, 0.62, 0.46, 0.55, 0.66]}
                color="#C7430F"
                className="aspect-[3/4] rounded-xl2 shadow-lift ring-1 ring-white/10"
              />
              <PrintedObject
                profile={[0.9, 0.35, 0.3, 0.3, 0.35, 0.9]}
                color="#3C61A6"
                className="mt-8 aspect-[3/4] rounded-xl2 shadow-lift ring-1 ring-white/10"
              />
              <PrintedObject
                profile={[0.4, 0.6, 0.6, 0.4]}
                color="#A8B7CC"
                className="aspect-[3/4] rounded-xl2 shadow-lift ring-1 ring-white/10"
              />
              <PrintedObject
                profile={[0.9, 0.75, 0.6, 0.75, 0.9]}
                color="#E98F63"
                className="-mt-8 aspect-[3/4] rounded-xl2 shadow-lift ring-1 ring-white/10"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Do ficheiro ao objeto — animação controlada pelo scroll */}
      <PrintProcessScroll
        productName={showcaseName}
        photoUrl={showcase?.imageUrl}
        profile={showcase?.profile}
        color={showcase?.colors[0]?.hex}
      />

      {/* Categorias */}
      <section className="section">
        <div className="container-page">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Explorar</p>
              <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl">
                Categorias
              </h2>
            </div>
            <Link href="/loja" className="hidden text-sm font-medium text-clay-600 hover:text-clay-700 sm:block">
              Ver tudo →
            </Link>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">
            {categories.map((c, i) => (
              <Link
                key={c.key}
                href={`/loja?categoria=${c.key}`}
                className="card group relative overflow-hidden p-6 hover:shadow-card"
              >
                <div
                  className="absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-20 transition-transform duration-500 group-hover:scale-125"
                  style={{ background: CATEGORY_TINTS[i % CATEGORY_TINTS.length] }}
                />
                <p className="relative font-display text-lg font-semibold text-stone-900">
                  {c.label}
                </p>
                <p className="relative mt-2 text-sm leading-relaxed text-stone-900/55">
                  {c.description}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Produtos em destaque */}
      <section className="section bg-stone-50">
        <div className="container-page">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Seleção Guedias</p>
              <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl">
                Produtos em destaque
              </h2>
            </div>
            <Link href="/loja" className="hidden text-sm font-medium text-clay-600 hover:text-clay-700 sm:block">
              Ver tudo →
            </Link>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
            {featured.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>

          <div className="mt-8 text-center sm:hidden">
            <Link href="/loja" className="btn-secondary">
              Ver todos os produtos
            </Link>
          </div>
        </div>
      </section>

      {/* Como funciona */}
      <section className="section">
        <div className="container-page">
          <div className="mx-auto max-w-xl text-center">
            <p className="eyebrow">O processo</p>
            <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl">
              Da ideia ao objeto, camada a camada
            </h2>
          </div>

          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {PROCESS_STEPS.map((step, i) => (
              <div key={step.title} className="relative">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-clay-500/10 font-display text-lg font-semibold text-clay-600">
                  {i + 1}
                </div>
                <h3 className="mt-4 text-base font-semibold text-stone-900">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-stone-900/60">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA / Sobre teaser */}
      <section className="section bg-pine-700">
        <div className="container-page flex flex-col items-center gap-6 text-center">
          <p className="eyebrow text-clay-300">Feito com a Creality Hi Combo</p>
          <h2 className="max-w-2xl font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Cada peça Guedias nasce de um ficheiro digital e ganha forma física, a sério, na nossa impressora.
          </h2>
          <p className="max-w-lg text-sm leading-relaxed text-white/70 sm:text-base">
            Sem moldes, sem produção em massa. Só design, filamento e paciência
            — impressa camada a camada até estar pronta para ti.
          </p>
          <Link href="/sobre" className="btn-primary">
            Conhecer a nossa história
          </Link>
        </div>
      </section>
    </div>
  );
}

const CATEGORY_TINTS = ["#C7430F", "#3C61A6", "#0B1E3D", "#E98F63"];

function ArrowIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
