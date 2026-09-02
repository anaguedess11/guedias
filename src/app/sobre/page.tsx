import type { Metadata } from "next";
import Link from "next/link";
import { PrintedObject } from "@/components/PrintedObject";

export const metadata: Metadata = {
  title: "Sobre — Guedias",
  description: "Conhece a Guedias e o processo de impressão 3D por trás de cada peça, feita numa Creality Hi Combo.",
};

const STEPS = [
  {
    title: "1. Desenho digital",
    text: "Cada peça começa como um modelo 3D — desenhado de raiz ou adaptado a partir de esboços — onde definimos forma, espessura de parede e encaixes.",
  },
  {
    title: "2. Fatiamento",
    text: "O modelo é convertido em milhares de camadas finas (entre 0.12 e 0.28 mm cada), que a impressora vai depositar uma a uma.",
  },
  {
    title: "3. Impressão na Creality Hi Combo",
    text: "O filamento — PLA, PETG ou TPU consoante a peça — é fundido e depositado camada sobre camada, até o objeto ganhar forma por completo. Cada peça demora entre 1 a 10 horas a imprimir.",
  },
  {
    title: "4. Acabamento e controlo de qualidade",
    text: "Removemos suportes, lixamos arestas quando necessário e verificamos cada peça individualmente antes de embalar.",
  },
];

const VALUES = [
  {
    title: "Produção sob encomenda",
    text: "Não temos stock em massa — cada peça é impressa quando é encomendada, o que reduz desperdício.",
  },
  {
    title: "Materiais mais conscientes",
    text: "Damos prioridade ao PLA, um bioplástico derivado de recursos renováveis (como amido de milho), sempre que a aplicação o permite.",
  },
  {
    title: "Peso e defeito controlados",
    text: "Cada objeto é inspecionado à saída da impressora — o que não cumpre o nosso padrão não sai da oficina.",
  },
];

export default function SobrePage() {
  return (
    <div>
      <section className="bg-stone-50">
        <div className="container-page grid gap-10 py-16 sm:py-20 lg:grid-cols-2 lg:items-center lg:gap-16">
          <div>
            <p className="eyebrow">A nossa história</p>
            <h1 className="mt-2 font-display text-3xl font-semibold leading-tight text-stone-900 sm:text-4xl">
              Objetos que nascem em ficheiro digital e ganham forma, a sério, camada a camada.
            </h1>
            <p className="mt-5 text-base leading-relaxed text-stone-900/65">
              A Guedias nasceu da vontade de mostrar o que a impressão 3D consegue fazer para
              além de protótipos: peças de decoração, utilidades para o dia a dia e presentes
              verdadeiramente personalizados — todos produzidos na nossa impressora, uma
              Creality Hi Combo, aqui em Portugal.
            </p>
            <p className="mt-4 text-base leading-relaxed text-stone-900/65">
              Não vendemos objetos de fábrica. Vendemos peças impressas uma a uma, muitas vezes
              com o teu nome, a tua cor ou a tua ideia — porque é isso que a impressão 3D torna
              possível: produção pequena, feita à medida, sem moldes nem grandes lotes.
            </p>
            <Link href="/loja" className="btn-primary mt-7 inline-flex">
              Ver a coleção
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <PrintedObject profile={[0.34, 0.48, 0.62, 0.78, 0.88, 0.8, 0.62]} color="#C7430F" className="aspect-[3/4] rounded-xl2 shadow-card" />
            <PrintedObject profile={[0.9, 0.35, 0.3, 0.3, 0.35, 0.9]} color="#3C61A6" className="mt-8 aspect-[3/4] rounded-xl2 shadow-card" />
            <PrintedObject profile={[0.4, 0.6, 0.6, 0.4]} color="#E98F63" className="aspect-[3/4] rounded-xl2 shadow-card" />
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container-page">
          <div className="max-w-xl">
            <p className="eyebrow">O processo</p>
            <h2 className="mt-2 font-display text-2xl font-semibold text-stone-900 sm:text-3xl">
              Como uma peça Guedias é feita
            </h2>
          </div>

          <div className="mt-10 grid gap-8 sm:grid-cols-2">
            {STEPS.map((step) => (
              <div key={step.title} className="card p-6">
                <h3 className="font-display text-lg font-semibold text-stone-900">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-stone-900/60">{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section bg-pine-700">
        <div className="container-page">
          <div className="max-w-xl">
            <p className="eyebrow text-clay-200">A nossa máquina</p>
            <h2 className="mt-2 font-display text-2xl font-semibold text-white sm:text-3xl">
              Creality Hi Combo
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-white/70 sm:text-base">
              Todas as peças da Guedias passam pela nossa Creality Hi Combo, uma impressora 3D
              de deposição de filamento (FDM) que usamos diariamente para transformar modelos
              digitais em objetos físicos. É com ela que testamos novas formas, afinamos
              tolerâncias e produzimos, peça a peça, tudo o que vês na loja.
            </p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container-page">
          <div className="max-w-xl">
            <p className="eyebrow">Compromissos</p>
            <h2 className="mt-2 font-display text-2xl font-semibold text-stone-900 sm:text-3xl">
              O que nos importa
            </h2>
          </div>

          <div className="mt-10 grid gap-8 sm:grid-cols-3">
            {VALUES.map((v) => (
              <div key={v.title}>
                <h3 className="text-base font-semibold text-stone-900">{v.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-stone-900/60">{v.text}</p>
              </div>
            ))}
          </div>

          <div className="mt-14 flex flex-col items-center gap-4 rounded-xl2 bg-stone-50 px-6 py-12 text-center">
            <h2 className="font-display text-xl font-semibold text-stone-900 sm:text-2xl">
              Pronta para encontrar a tua próxima peça?
            </h2>
            <Link href="/loja" className="btn-primary">
              Explorar a loja
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
