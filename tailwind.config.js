/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        festou: {
          // Cores oficiais da marca (flyer)
          primary: '#E11D48', // Rosa Magenta profundo: CTAs e texto sobre superfície clara (AA)
          magenta: '#FF5E62', // Rosa Magenta puro: gradientes, brilhos e decoração
          secondary: '#4F46E5', // Roxo Profundo / Noite Festiva
          accent: '#B45309', // Amarelo Ouro escuro: texto sobre superfície clara (AA)
          yellow: '#F59E0B', // Amarelo Ouro puro: destaques, badges e estrelas
          turquoise: '#0E7490', // Azul Turquesa escuro: texto sobre superfície clara (AA)
          cyan: '#06B6D4', // Azul Turquesa puro: acentos e gradientes
          // Cores de apoio da marca
          midnight: '#1A134D',
          purple: '#7B12A2',
          lemon: '#FFD938',
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
        display: ['Poppins', 'Baloo 2', 'Inter', 'ui-sans-serif', 'sans-serif'],
      },
      opacity: {
        12: '0.12',
        18: '0.18',
        45: '0.45',
        55: '0.55',
        65: '0.65',
        85: '0.85',
      },
      backgroundImage: {
        'festou-night': 'linear-gradient(135deg, #4F46E5 0%, #8B5CF6 45%, #FF5E62 100%)',
        'festou-dusk': 'linear-gradient(135deg, #1A134D 0%, #4F46E5 55%, #FF5E62 100%)',
        'festou-aurora': 'linear-gradient(135deg, #06B6D4 0%, #4F46E5 50%, #7B12A2 100%)',
        'festou-candy': 'linear-gradient(135deg, #F59E0B 0%, #FF5E62 50%, #8B5CF6 100%)',
        'festou-ring': 'linear-gradient(135deg, #FF5E62 0%, #8B5CF6 50%, #06B6D4 100%)',
        'festou-sheen':
          'linear-gradient(115deg, transparent 30%, rgba(255, 255, 255, 0.35) 50%, transparent 70%)',
      },
      boxShadow: {
        festive: '0 12px 30px -8px rgba(255, 94, 98, 0.45)',
        'festive-strong': '0 18px 40px -10px rgba(225, 29, 72, 0.45)',
        'festive-soft': '0 20px 40px -15px rgba(79, 70, 229, 0.28)',
        'festive-glow': '0 0 0 1px rgba(255, 255, 255, 0.12), 0 22px 50px -14px rgba(124, 58, 237, 0.5)',
        card: '0 6px 24px -6px rgba(26, 19, 77, 0.08)',
        'card-hover': '0 20px 40px -10px rgba(26, 19, 77, 0.18)',
        'inner-festive': 'inset 0 1px 0 0 rgba(255, 255, 255, 0.35)',
      },
      keyframes: {
        'festou-float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-14px)' },
        },
        'festou-drift': {
          '0%, 100%': { transform: 'translate3d(0, 0, 0) rotate(0deg)' },
          '50%': { transform: 'translate3d(16px, -22px, 0) rotate(12deg)' },
        },
        'festou-twinkle': {
          '0%, 100%': { opacity: '0.2', transform: 'scale(0.85)' },
          '50%': { opacity: '0.95', transform: 'scale(1.15)' },
        },
        'festou-pop': {
          '0%': { transform: 'scale(0.94)', opacity: '0.6' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      animation: {
        'festou-float': 'festou-float 6s ease-in-out infinite',
        'festou-drift': 'festou-drift 14s ease-in-out infinite',
        'festou-twinkle': 'festou-twinkle 3.6s ease-in-out infinite',
        'festou-pop': 'festou-pop 0.3s ease-out both',
      },
    },
  },
  plugins: [],
}
