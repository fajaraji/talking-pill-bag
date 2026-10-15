import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Calm, trustworthy health palette for older adults and families.
        primary: { DEFAULT: "#0F766E", hover: "#115E59" },
        attention: { text: "#92400E", bg: "#FEF3C7", border: "#FDE68A" },
        danger: { text: "#B91C1C", bg: "#FEE2E2", border: "#FECACA" },
        success: { text: "#15803D", bg: "#DCFCE7", border: "#BBF7D0" },
        page: "#F8FAF9",
        ink: "#0F172A",
        muted: "#475569",
        line: "#E2E8F0",
      },
      fontSize: {
        // Mobile-first, large text per project rules (18px base on mobile)
        base: ["1.125rem", { lineHeight: "1.625rem" }],
        xl: ["1.5rem", { lineHeight: "2rem" }],
        "2xl": ["1.75rem", { lineHeight: "2.25rem" }],
      },
      spacing: {
        tap: "3rem", // 48px minimum tap target
      },
    },
  },
  plugins: [],
};

export default config;
