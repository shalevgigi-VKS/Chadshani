/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index_template.html"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "surface": "#f5f7f9",
        "on-surface": "#2c2f31",
        "primary": "#0050d4",
        "primary-dim": "#0046bb",
        "secondary": "#535171",
        "error": "#b31b25",
        "tertiary": "#8e3a8a",
        "outline-variant": "#abadaf",
        "surface-container-lowest": "#ffffff",
        "surface-container-low": "#eef1f3",
        "surface-container": "#e5e9eb",
      },
      fontFamily: {
        "headline": ["Space Grotesk", "sans-serif"],
        "body": ["Heebo", "sans-serif"],
        "label": ["Inter", "sans-serif"],
      },
      borderRadius: {
        "DEFAULT": "0.125rem",
        "lg": "0.25rem",
        "xl": "0.5rem",
        "full": "1.5rem",
      },
    },
  },
  plugins: [
    require("@tailwindcss/forms"),
    require("@tailwindcss/container-queries"),
  ],
};
