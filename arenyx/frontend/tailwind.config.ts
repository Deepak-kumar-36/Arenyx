import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "var(--bg-primary)",
        card: "var(--bg-card)",
        accent: "var(--accent)",
        accentLight: "var(--accent-light)",
        textPrimary: "var(--text-primary)",
        textSecondary: "var(--text-secondary)",
        textMuted: "var(--text-muted)",
        status: {
          clear: "var(--status-clear)",
          filling: "var(--status-filling)",
          congested: "var(--status-congested)",
        },
      },
      backgroundImage: {
        "grad-hero": "var(--grad-hero)",
        "grad-cta": "var(--grad-cta)",
      },
    },
  },
  plugins: [],
};
export default config;
