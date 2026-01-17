import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f5f9ff",
          100: "#e8f1ff",
          200: "#cfdcff",
          300: "#a6bbff",
          400: "#6c8dff",
          500: "#3c66ff",
          600: "#1d45f0",
          700: "#1636c4",
          800: "#162f99",
          900: "#172c78"
        }
      }
    }
  },
  plugins: []
};

export default config;
