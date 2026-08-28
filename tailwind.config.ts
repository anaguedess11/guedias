import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        stone: {
          25: "#FBFAF8",
          50: "#F7F5F1",
          100: "#EFEBE4",
        },
        clay: {
          50: "#FBF0EA",
          100: "#F5DCCE",
          200: "#EAB99C",
          300: "#DE9A72",
          400: "#D07E51",
          500: "#C0663E",
          600: "#A24F30",
          700: "#813E27",
          800: "#5E2D1C",
          900: "#3D1D12",
        },
        pine: {
          50: "#EEF3F1",
          100: "#D6E2DD",
          400: "#5A7C73",
          500: "#3F5F58",
          600: "#2F4A45",
          700: "#233833",
        },
      },
      fontFamily: {
        sans: [
          "var(--font-sans)",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "sans-serif",
        ],
        display: [
          "var(--font-display)",
          "Georgia",
          "serif",
        ],
      },
      boxShadow: {
        soft: "0 2px 12px rgba(61, 29, 18, 0.06)",
        card: "0 4px 24px rgba(61, 29, 18, 0.08)",
        lift: "0 12px 32px rgba(61, 29, 18, 0.14)",
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
