import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "var(--font-sans)",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
        display: ["var(--font-display)", "ui-serif", "Georgia", "Cambria", "serif"],
      },
      colors: {
        // Premium "antique gold" accent — the upscale highlight color.
        gold: {
          50: "#FEFBEB",
          100: "#FCF3D2",
          200: "#F8E5A3",
          300: "#F0CE63",
          400: "#E0AE34",
          500: "#CA8A04",
          600: "#A66D05",
          700: "#855507",
          800: "#6E4609",
          900: "#5E3C0E",
        },
      },
      boxShadow: {
        premium:
          "0 1px 2px 0 rgba(15,23,42,0.04), 0 14px 36px -18px rgba(15,23,42,0.20)",
        "premium-lg":
          "0 1px 2px 0 rgba(15,23,42,0.05), 0 28px 60px -28px rgba(15,23,42,0.28)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.5s cubic-bezier(0.22,1,0.36,1) both",
      },
    },
  },
  plugins: [],
};

export default config;
