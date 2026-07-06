import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        council: {
          bg: "#0A0A0F",
          surface: "#12121A",
          border: "rgba(255,255,255,0.08)",
          gold: "#C9A84C",
          "gold-dim": "#8B7332",
          blue: "#4A7CFF",
        },
      },
      fontFamily: {
        serif: ["var(--font-noto-serif)", "Noto Serif SC", "serif"],
        sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        glow: "glow 2s ease-in-out infinite alternate",
        float: "float 6s ease-in-out infinite",
      },
      keyframes: {
        glow: {
          "0%": { boxShadow: "0 0 20px rgba(201, 168, 76, 0.2)" },
          "100%": { boxShadow: "0 0 40px rgba(201, 168, 76, 0.5)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-8px)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
