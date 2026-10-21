/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        festou: {
          primary: '#FF2D98',
          secondary: '#7B12A2',
          accent: '#FFD938',
          background: '#1A134D',
          text: '#1A134D',
          midnight: '#1A134D',
          magenta: '#FF2D98',
          purple: '#7B12A2',
          turquoise: '#00C2D1',
          yellow: '#FFD938',
          orange: '#FF6B00',
          confetti: '#FFF0FA',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        heading: ['Baloo 2', 'Poppins', 'Inter', 'ui-sans-serif', 'sans-serif'],
      },
      boxShadow: {
        festive: '0 12px 28px -10px rgb(255 94 98 / 45%)',
        'festive-soft': '0 18px 50px -24px rgb(79 70 229 / 30%)',
      },
    },
  },
  plugins: [],
}
