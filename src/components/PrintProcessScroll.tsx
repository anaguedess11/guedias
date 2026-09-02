"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from "framer-motion";

/* ────────────────────────────────────────────────────────────────
   Geometria da peça — um vaso/porta-velas em silhueta de "blocos
   empilhados", coerente com o placeholder visual do resto do site.
   Tudo em unidades do viewBox (0 0 200 288).
   ──────────────────────────────────────────────────────────────── */
const LAYER_COUNT = 26;
const BED_Y = 250;
const TOP_Y = 30;
const TOTAL_H = BED_Y - TOP_Y;
const LAYER_H = TOTAL_H / LAYER_COUNT;
const MAX_HALF = 76;

// Larguras de controlo (0–1) da base ao topo — perfil de vaso com bojo e gargalo.
const CONTROL = [
  0.3, 0.42, 0.53, 0.63, 0.7, 0.735, 0.72, 0.66, 0.55, 0.44, 0.38, 0.4, 0.47, 0.52, 0.5,
];

function widthAt(t: number): number {
  const seg = t * (CONTROL.length - 1);
  const i = Math.min(Math.floor(seg), CONTROL.length - 2);
  const f = seg - i;
  return CONTROL[i] * (1 - f) + CONTROL[i + 1] * f;
}

// Terracota (clay-500) com opacidade a variar pela altura, como no PrintedObject.
function layerFill(t: number): string {
  return `rgba(192, 102, 62, ${(0.58 + t * 0.36).toFixed(3)})`;
}

const PHASES = [
  {
    title: "Desenhamos a peça",
    body: "Cada objeto começa como um ficheiro 3D, desenhado ao milímetro.",
  },
  {
    title: "Fatiamos em camadas",
    body: "O software corta o modelo em centenas de camadas muito finas.",
  },
  {
    title: "Imprimimos, uma camada de cada vez",
    body: "A Creality Hi Combo deposita filamento, camada sobre camada.",
  },
];

export function PrintProcessScroll({ productName }: { productName: string }) {
  const reduceMotion = useReducedMotion();
  const targetRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ["start start", "end end"],
  });

  const geometry = useMemo(() => {
    const layers = Array.from({ length: LAYER_COUNT }, (_, i) => {
      const tMid = (i + 0.5) / LAYER_COUNT;
      const halfW = widthAt(tMid) * MAX_HALF;
      return {
        x: 100 - halfW,
        y: BED_Y - (i + 1) * LAYER_H,
        width: halfW * 2,
        height: LAYER_H - 1.2,
        fill: layerFill(i / (LAYER_COUNT - 1)),
        halfW,
      };
    });

    const steps = 44;
    const left: string[] = [];
    const right: string[] = [];
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const halfW = widthAt(t) * MAX_HALF;
      const y = BED_Y - t * TOTAL_H;
      left.push(`${(100 - halfW).toFixed(2)} ${y.toFixed(2)}`);
      right.push(`${(100 + halfW).toFixed(2)} ${y.toFixed(2)}`);
    }
    const outline = `M ${left[0]} L ${left.join(" L ")} L ${right
      .reverse()
      .join(" L ")} Z`;

    return { layers, outline };
  }, []);

  /* Transformações ligadas ao scroll */
  const outlineOpacity = useTransform(scrollYProgress, [0, 0.04, 0.4, 0.5], [0, 1, 1, 0]);
  const outlineDraw = useTransform(scrollYProgress, [0.02, 0.2], [0, 1]);
  const sliceOpacity = useTransform(
    scrollYProgress,
    [0.2, 0.3, 0.44, 0.56],
    [0, 1, 1, 0.12]
  );
  const printProgress = useTransform(scrollYProgress, [0.44, 0.82], [0, 1]);
  const groupRotate = useTransform(scrollYProgress, [0, 0.2, 0.85, 1], [-5, 0, 0, 3]);
  const groupScale = useTransform(scrollYProgress, [0.8, 0.9, 1], [1, 1.05, 1.02]);
  const nozzleY = useTransform(printProgress, [0, 1], [BED_Y - 6, TOP_Y - 4]);
  const nozzleOpacity = useTransform(
    scrollYProgress,
    [0.42, 0.46, 0.8, 0.85],
    [0, 1, 1, 0]
  );
  const shadowScale = useTransform(printProgress, [0, 1], [0.55, 1]);
  const hintOpacity = useTransform(scrollYProgress, [0, 0.08], [1, 0]);
  const ctaOpacity = useTransform(scrollYProgress, [0.85, 0.93], [0, 1]);
  const barScale = scrollYProgress;

  const [ctaActive, setCtaActive] = useState(false);
  useMotionValueEvent(scrollYProgress, "change", (v) => setCtaActive(v > 0.86));

  /* ── Fallback sem animação (prefers-reduced-motion) ────────────── */
  if (reduceMotion) {
    return (
      <section className="border-y border-black/5 bg-stone-50 py-16 sm:py-24">
        <div className="container-page grid items-center gap-10 lg:grid-cols-2">
          <div>
            <p className="eyebrow">Do ficheiro ao objeto</p>
            <h2 className="mt-2 font-display text-2xl font-semibold text-stone-900 sm:text-3xl">
              Impressa camada a camada
            </h2>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-stone-900/65 sm:text-base">
              Desenhamos a peça, fatiamo-la em centenas de camadas e a impressora
              constrói-a de baixo para cima. O resultado: {productName}.
            </p>
            <Link href="/loja" className="btn-primary mt-6">
              Ver a loja
            </Link>
          </div>
          <div className="mx-auto w-full max-w-xs">
            <VaseSvg geometry={geometry} />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      ref={targetRef}
      className="relative h-[240vh] bg-stone-50 sm:h-[380vh]"
      aria-label="Animação: do ficheiro ao objeto impresso em 3D"
    >
      <div className="sticky top-0 h-screen overflow-hidden">
        {/* brilho de fundo, na cor da marca */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(60% 50% at 50% 12%, rgba(192,102,62,0.10), transparent 70%)",
          }}
        />

        <div className="absolute inset-0 flex flex-col">
          {/* Texto das fases */}
          <div className="relative h-[40vh] shrink-0 px-6 pt-[13vh] text-center sm:h-[34vh] sm:pt-[15vh]">
            {PHASES.map((phase, i) => {
              const start = i * 0.24 + 0.02;
              const end = start + 0.24;
              return (
                <PhaseText key={phase.title} progress={scrollYProgress} start={start} end={end}>
                  <p className="eyebrow">Do ficheiro ao objeto</p>
                  <h2 className="mx-auto mt-2 max-w-lg font-display text-xl font-semibold text-stone-900 sm:text-4xl">
                    {phase.title}
                  </h2>
                  <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-stone-900/60 sm:text-base">
                    {phase.body}
                  </p>
                </PhaseText>
              );
            })}

            {/* Fase final — resultado */}
            <PhaseText progress={scrollYProgress} start={0.84} end={1} last>
              <p className="eyebrow">O resultado</p>
              <h2 className="mx-auto mt-2 max-w-lg font-display text-xl font-semibold text-stone-900 sm:text-4xl">
                {productName}
              </h2>
              <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-stone-900/60 sm:text-base">
                De um ficheiro digital a um objeto que podes segurar.
              </p>
            </PhaseText>
          </div>

          {/* Peça */}
          <div className="relative flex flex-1 items-center justify-center px-6 pb-6">
          <motion.svg
            viewBox="0 0 200 288"
            className="h-full max-h-[44vh] w-full max-w-sm sm:max-h-[50vh]"
            style={{ rotate: groupRotate, scale: groupScale }}
          >
            {/* sombra / base de impressão */}
            <motion.ellipse
              cx={100}
              cy={BED_Y + 12}
              rx={78}
              ry={9}
              fill="rgba(35,56,51,0.14)"
              style={{ scaleX: shadowScale, transformOrigin: "100px 262px" }}
            />
            <rect x={22} y={BED_Y + 4} width={156} height={4} rx={2} fill="rgba(35,56,51,0.25)" />

            {/* contorno "desenho" */}
            <motion.path
              d={geometry.outline}
              fill="none"
              stroke="#233833"
              strokeWidth={1.6}
              strokeLinejoin="round"
              style={{ opacity: outlineOpacity, pathLength: outlineDraw }}
            />

            {/* camadas impressas progressivamente */}
            {geometry.layers.map((layer, i) => (
              <PrintedLayer key={i} layer={layer} index={i} printProgress={printProgress} />
            ))}

            {/* linhas de fatiamento */}
            <motion.g style={{ opacity: sliceOpacity }}>
              {geometry.layers.map((layer, i) => (
                <line
                  key={i}
                  x1={layer.x}
                  x2={layer.x + layer.width}
                  y1={layer.y}
                  y2={layer.y}
                  stroke="#233833"
                  strokeOpacity={0.5}
                  strokeWidth={0.5}
                  strokeDasharray="3 3"
                />
              ))}
            </motion.g>

            {/* bico da impressora */}
            <motion.g style={{ opacity: nozzleOpacity, y: nozzleY }}>
              <rect x={92} y={-16} width={16} height={12} rx={2} fill="#233833" />
              <path d="M94 -4 L106 -4 L101 6 L99 6 Z" fill="#233833" />
              <circle cx={100} cy={7} r={2.4} fill="#C0663E" />
            </motion.g>
          </motion.svg>
          </div>
        </div>

        {/* CTA final */}
        <motion.div
          style={{ opacity: ctaOpacity }}
          className={`absolute inset-x-0 bottom-12 flex flex-wrap items-center justify-center gap-3 px-6 sm:bottom-16 ${
            ctaActive ? "" : "pointer-events-none"
          }`}
        >
          <Link href="/loja" className="btn-primary">
            Ver a loja
          </Link>
          <Link href="/loja" className="btn-secondary">
            Explorar produtos
          </Link>
        </motion.div>

        {/* dica de scroll */}
        <motion.p
          style={{ opacity: hintOpacity }}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs font-medium uppercase tracking-[0.18em] text-stone-900/40"
        >
          Continua a fazer scroll ↓
        </motion.p>
        <div className="absolute bottom-0 left-0 h-1 w-full bg-black/5">
          <motion.div
            style={{ scaleX: barScale }}
            className="h-full w-full origin-left bg-clay-500"
          />
        </div>
      </div>
    </section>
  );
}

/* ── Camada individual: aparece quando a "cabeça" passa por ela ──── */
function PrintedLayer({
  layer,
  index,
  printProgress,
}: {
  layer: { x: number; y: number; width: number; height: number; fill: string };
  index: number;
  printProgress: MotionValue<number>;
}) {
  const start = index / LAYER_COUNT;
  const opacity = useTransform(printProgress, [start, start + 1.6 / LAYER_COUNT], [0, 1]);
  const y = useTransform(printProgress, [start, start + 1.6 / LAYER_COUNT], [5, 0]);

  return (
    <motion.rect
      x={layer.x}
      y={layer.y}
      width={layer.width}
      height={layer.height}
      rx={2}
      fill={layer.fill}
      style={{ opacity, y }}
    />
  );
}

/* ── Bloco de texto de uma fase ─────────────────────────────────── */
function PhaseText({
  progress,
  start,
  end,
  last = false,
  children,
}: {
  progress: MotionValue<number>;
  start: number;
  end: number;
  last?: boolean;
  children: React.ReactNode;
}) {
  const fade = Math.min(0.05, (end - start) * 0.35);
  const opacity = useTransform(
    progress,
    last ? [start, start + fade] : [start, start + fade, end - fade, end],
    last ? [0, 1] : [0, 1, 1, 0]
  );
  const y = useTransform(progress, [start, start + fade], [24, 0]);

  return (
    <motion.div style={{ opacity, y }} className="absolute left-0 right-0 px-6">
      {children}
    </motion.div>
  );
}

/* ── Vaso estático (fallback reduced-motion) ────────────────────── */
function VaseSvg({
  geometry,
}: {
  geometry: { layers: { x: number; y: number; width: number; height: number; fill: string }[] };
}) {
  return (
    <svg viewBox="0 0 200 288" className="w-full">
      <ellipse cx={100} cy={BED_Y + 12} rx={78} ry={9} fill="rgba(35,56,51,0.14)" />
      {geometry.layers.map((layer, i) => (
        <rect
          key={i}
          x={layer.x}
          y={layer.y}
          width={layer.width}
          height={layer.height}
          rx={2}
          fill={layer.fill}
        />
      ))}
    </svg>
  );
}
