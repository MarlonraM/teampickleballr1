// tailwind.config.js
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // <--- ¡Esta línea es CRÍTICA!
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}