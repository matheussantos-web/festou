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
          midnight: '#1A134D',
          magenta: '#FF2D98',
          purple: '#7B12A2',
          turquoise: '#00C2D1',
          yellow: '#FFD938',
          orange: '#FF6B00',
          background: '#0F0A2C',
          surface: '#FFFFFF',
          text: '#1E293B',
          soft: '#F8FAFC',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        heading: ['Baloo 2', 'Poppins', 'Inter', 'ui-sans-serif', 'sans-serif'],
      },
      boxShadow: {
        festive: '0 10px 25px -5px rgba(255, 45, 152, 0.35)',
        'festive-soft': '0 20px 40px -15px rgba(123, 18, 162, 0.25)',
        card: '0 4px 20px -2px rgba(26, 19, 77, 0.06)',
        'card-hover': '0 14px 32px -4px rgba(26, 19, 77, 0.12)',
      },
    },
  },
  plugins: [],
}
