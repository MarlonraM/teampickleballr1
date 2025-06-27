// tailwind.config.js
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // <--- ¡Esta línea es CRÍTICA!
                                   // Asegúrate de que cubre todos tus componentes React
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
