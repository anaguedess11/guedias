import type { Config } from "tailwindcss";

/**
 * A paleta vive em variáveis CSS (ver src/app/globals.css :root) como
 * triplos RGB, para ser trivial reajustar tons sem tocar em componentes.
 * Aqui só as mapeamos para os nomes de cor do Tailwind, mantendo o
 * suporte a opacidade (bg-pine-700/80, text-stone-900/55, ...).
 */
const withVar = (name: string) => `rgb(var(${name}) / <alpha-value>)`;

const config: Config = {
  content: ["./src/app/**/*.{ts,tsx}", "./src/components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Neutros frios — corpo do site (era bege quente).
        stone: {
          25: withVar("--c-stone-25"),
          50: withVar("--c-stone-50"),
          100: withVar("--c-stone-100"),
          200: withVar("--c-stone-200"),
          300: withVar("--c-stone-300"),
          400: withVar("--c-stone-400"),
          500: withVar("--c-stone-500"),
          600: withVar("--c-stone-600"),
          700: withVar("--c-stone-700"),
          800: withVar("--c-stone-800"),
          900: withVar("--c-stone-900"),
        },
        // Cor primária — azul-marinho profundo (era verde "pine").
        pine: {
          50: withVar("--c-navy-50"),
          100: withVar("--c-navy-100"),
          200: withVar("--c-navy-200"),
          400: withVar("--c-navy-400"),
          500: withVar("--c-navy-500"),
          600: withVar("--c-navy-600"),
          700: withVar("--c-navy-700"),
          800: withVar("--c-navy-800"),
          900: withVar("--c-navy-900"),
        },
        // Cor de acento / CTA — coral quente que contrasta com o azul (era terracota "clay").
        clay: {
          50: withVar("--c-coral-50"),
          100: withVar("--c-coral-100"),
          200: withVar("--c-coral-200"),
          300: withVar("--c-coral-300"),
          400: withVar("--c-coral-400"),
          500: withVar("--c-coral-500"),
          600: withVar("--c-coral-600"),
          700: withVar("--c-coral-700"),
          800: withVar("--c-coral-800"),
          900: withVar("--c-coral-900"),
        },
        // Alias semântico para novo código.
        navy: {
          50: withVar("--c-navy-50"),
          100: withVar("--c-navy-100"),
          200: withVar("--c-navy-200"),
          400: withVar("--c-navy-400"),
          500: withVar("--c-navy-500"),
          600: withVar("--c-navy-600"),
          700: withVar("--c-navy-700"),
          800: withVar("--c-navy-800"),
          900: withVar("--c-navy-900"),
        },
        accent: {
          50: withVar("--c-coral-50"),
          100: withVar("--c-coral-100"),
          200: withVar("--c-coral-200"),
          300: withVar("--c-coral-300"),
          400: withVar("--c-coral-400"),
          500: withVar("--c-coral-500"),
          600: withVar("--c-coral-600"),
          700: withVar("--c-coral-700"),
        },
      },
      fontFamily: {
        sans: [
          "var(--font-sans)",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "sans-serif",
        ],
        display: ["var(--font-display)", "Georgia", "Cambria", "Times New Roman", "serif"],
      },
      boxShadow: {
        soft: "0 2px 12px rgb(11 30 61 / 0.06)",
        card: "0 6px 28px rgb(11 30 61 / 0.09)",
        lift: "0 16px 40px rgb(11 30 61 / 0.16)",
      },
      borderRadius: {
        xl2: "1.25rem",
      },
      animation: {
        "fade-in": "fade-in 0.4s ease-out",
        "slide-up": "slide-up 0.5s ease-out",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "slide-up": {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
