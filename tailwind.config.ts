import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-geist-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        obsidian: {
          950: "#07080a",
          900: "#0b0d11",
          850: "#101217",
          800: "#14171e",
          750: "#181c25",
          700: "#1f242f",
          600: "#2a313f",
          500: "#3d4659",
        },
        copper: {
          50: "#fffbeb",
          100: "#fef3c7",
          200: "#fde68a",
          300: "#fcd34d",
          400: "#fbbf24",
          500: "#f59e0b",
          600: "#d97706",
          700: "#b45309",
          800: "#92400e",
          900: "#78350f",
        },
      },
      boxShadow: {
        "2xs": "0 1px rgb(0 0 0 / 0.05)",
        "xs": "0 1px 2px 0 rgb(0 0 0 / 0.05)",
        "glow-copper": "0 0 24px -4px rgba(245, 158, 11, 0.22)",
        "glow-emerald": "0 0 24px -4px rgba(16, 185, 129, 0.22)",
        "glow-rose": "0 0 24px -4px rgba(244, 63, 94, 0.22)",
        "glass": "0 8px 32px 0 rgba(0, 0, 0, 0.37)",
        "card-dark": "0 10px 30px -10px rgba(0, 0, 0, 0.5)",
      },
    },
  },
};
export default config;
