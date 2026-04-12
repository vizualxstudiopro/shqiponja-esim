/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        shqiponja: {
          DEFAULT: "#C8102E",
          dark: "#9B0D23",
          light: "#F4D1D7",
        },
      },
    },
  },
  plugins: [],
};
