import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        pixel: ['"Press Start 2P"', 'monospace'],
        mono: ['monospace'],
      },
      boxShadow: {
        'pixel': '8px 8px 0px 0px rgba(0,0,0,0.5)',
        'pixel-sm': '4px 4px 0px 0px rgba(0,0,0,0.5)',
      },
    },
  },
  plugins: [],
};

export default config;
