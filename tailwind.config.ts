import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",

        // ── Legacy glass tokens (kept for any unfixed files) ──────────
        glass: {
          subtle:    "rgba(255,255,255,0.04)",
          base:      "rgba(255,255,255,0.06)",
          elevated:  "rgba(255,255,255,0.10)",
          highlight: "rgba(255,255,255,0.20)",
        },
        content: {
          primary:   "rgba(255,255,255,0.90)",
          secondary: "rgba(255,255,255,0.60)",
          muted:     "rgba(255,255,255,0.40)",
        },

        // ── Semantic theme tokens (light + dark via CSS vars) ─────────
        // bg-base   = page background
        // bg-card   = card / panel surface
        // bg-input  = input / elevated surface
        // bg-mark   = strong hover / separator
        // border-line  = standard border
        // border-mark  = input / strong border
        // text-hi   = primary text
        // text-mid  = secondary text
        // text-lo   = muted text
        // text-gone = placeholder / very subtle
        base:  "rgb(var(--base)  / <alpha-value>)",
        card:  "rgb(var(--card)  / <alpha-value>)",
        input: "rgb(var(--input) / <alpha-value>)",
        mark:  "rgb(var(--mark)  / <alpha-value>)",
        line:  "rgb(var(--line)  / <alpha-value>)",
        hi:    "rgb(var(--hi)    / <alpha-value>)",
        mid:   "rgb(var(--mid)   / <alpha-value>)",
        lo:    "rgb(var(--lo)    / <alpha-value>)",
        gone:  "rgb(var(--gone)  / <alpha-value>)",
      },
      boxShadow: {
        // Doble capa con tinte violeta: las tarjetas "flotan" sobre el fondo
        // claro con un poco de carácter de marca (en dark se usa shadow-none).
        card: "0 1px 2px rgba(24,24,40,0.06), 0 8px 24px -6px rgba(70,50,140,0.20)",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0" },
          to:   { opacity: "1" },
        },
        "fade-in-up": {
          from: { opacity: "0", transform: "translateY(14px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in-down": {
          from: { opacity: "0", transform: "translateY(-12px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.95)" },
          to:   { opacity: "1", transform: "scale(1)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%":      { opacity: "0.55" },
        },
      },
      animation: {
        "fade-in":      "fade-in 0.4s ease-out both",
        "fade-in-up":   "fade-in-up 0.5s cubic-bezier(0.22,1,0.36,1) both",
        "fade-in-down": "fade-in-down 0.4s cubic-bezier(0.22,1,0.36,1) both",
        "scale-in":     "scale-in 0.35s cubic-bezier(0.22,1,0.36,1) both",
        shimmer:        "shimmer 1.6s infinite",
        "pulse-soft":   "pulse-soft 2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
export default config;
