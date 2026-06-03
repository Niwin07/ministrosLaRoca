import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
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
        card: "0 2px 10px rgba(0,0,0,0.08)",
      },
    },
  },
  plugins: [],
};
export default config;
