import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        atlas: {
          energy: "#C6FF00",
          "energy-dim": "#9ECC00",
          focus: "#0F0F12",
          "focus-2": "#1A1A1F",
          balance: "#2A2A31",
          structure: "#3B3B45",
          contrast: "#EDEDED",
          muted: "#8B8B95",
        },
      },
      fontFamily: {
        sans: ["var(--font-space-grotesk)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        atlas: "1.25rem",
      },
      boxShadow: {
        glow: "0 0 24px rgba(198,255,0,0.25)",
      },
      backgroundImage: {
        "atlas-grid":
          "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.06) 1px, transparent 0)",
      },
    },
  },
  plugins: [],
};

export default config;
