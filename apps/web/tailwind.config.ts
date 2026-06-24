import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // tokens antigos (telas legadas) — manter
        primary: "#135bec",
        "background-light": "#f6f6f8",
        "background-dark": "#101622",
        "card-light": "#ffffff",
        "card-dark": "#1a2230",
        "text-light-primary": "#111318",
        "text-dark-primary": "#f0f2f4",
        "text-light-secondary": "#616f89",
        "text-dark-secondary": "#909cb5",
        // novos tokens do redesign (CSS vars)
        app: "var(--bg)",
        surface: "var(--surface)",
        "surface-2": "var(--surface-2)",
        inset: "var(--inset)",
        stroke: "var(--border)",
        line: "var(--line)",
        ink: "var(--text)",
        "ink-2": "var(--text-2)",
        "ink-3": "var(--text-3)",
        teal: "var(--teal)",
        navy: "var(--navy)",
        hero: "var(--hero)",
        brand: "var(--primary)",
        "brand-fg": "var(--primary-text)"
      },
      fontFamily: {
        display: ["Archivo", "system-ui", "sans-serif"],
        sans: ["IBM Plex Sans", "system-ui", "sans-serif"],
        mono: ["IBM Plex Mono", "ui-monospace", "monospace"]
      },
      boxShadow: {
        DEFAULT: "var(--shadow)",
        sm: "var(--shadow-sm)",
        lg: "var(--shadow-lg)"
      },
      borderRadius: {
        DEFAULT: "0.5rem",
        lg: "0.75rem",
        xl: "1rem",
        card: "14px",
        hero: "20px",
        modal: "18px",
        full: "9999px"
      }
    }
  },
  plugins: []
};

export default config;
