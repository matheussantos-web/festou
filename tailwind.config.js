/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        festou: {
          // Papéis da marca: ação, destaque, noite e apoio
          dark: '#1A1A3D',
          pink: '#FF2D9B',
          magenta: '#FF2D9B', // Magenta puro: gradientes, brilhos e decoração
          primary: '#C4126F', // Magenta AA: fundo de botão e texto sobre superfície clara
          'primary-strong': '#A00D5B', // Hover do magenta AA
          secondary: '#7B1FA2', // Roxo profundo: texto e detalhes sobre fundo claro
          purple: '#7B1FA2', // Roxo de apoio: camadas de gradiente
          midnight: '#1A1A3D',
          night: '#1A1A3D', // Noite: texto de marca e sombreamento
          background: '#1A1A3D', // Fundo escuro mais profundo
          yellow: '#FFD93B', // Amarelo da marca: CTA principal, selos e confetes
          lemon: '#FFD93B',
          accent: '#8A5B00', // Dourado AA: texto sobre superfície clara
          orange: '#FF6B00',
          cyan: '#00C2D1', // Turquesa puro: acentos e foco
          turquoise: '#0E7490', // Turquesa AA: texto sobre superfície clara
          // Papéis neutros
          surface: '#FFFFFF',
          soft: '#F8FAFC',
          ink: '#1E293B',
          text: '#1E293B',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        heading: ['Baloo 2', 'Inter', 'ui-sans-serif', 'sans-serif'],
        display: ['Baloo 2', 'Inter', 'ui-sans-serif', 'sans-serif'],
      },
      borderRadius: {
        card: '1.5rem',
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
        'festou-night': 'linear-gradient(135deg, #1A1A3D 0%, #7B1FA2 58%, #FF2D9B 100%)',
        'festou-dusk': 'linear-gradient(135deg, #1A1A3D 0%, #7B1FA2 68%, #FF2D9B 100%)',
        'festou-aurora': 'linear-gradient(135deg, #00C2D1 0%, #7B1FA2 55%, #1A1A3D 100%)',
        'festou-candy': 'linear-gradient(135deg, #FFD93B 0%, #FF2D9B 52%, #7B1FA2 100%)',
        'festou-ring': 'linear-gradient(135deg, #FF2D9B 0%, #7B1FA2 55%, #00C2D1 100%)',
        'festou-sheen':
          'linear-gradient(115deg, transparent 30%, rgba(255, 255, 255, 0.35) 50%, transparent 70%)',
      },
      boxShadow: {
        festive: '0 12px 30px -8px rgba(255, 45, 152, 0.4)',
        'festive-strong': '0 18px 40px -10px rgba(196, 18, 111, 0.45)',
        'festive-soft': '0 20px 40px -15px rgba(123, 18, 162, 0.28)',
        'festive-glow': '0 0 0 1px rgba(255, 255, 255, 0.12), 0 22px 50px -14px rgba(123, 18, 162, 0.5)',
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
        'festou-confetti-fall': {
          '0%': { transform: 'translate3d(0, -12px, 0) rotate(0deg)', opacity: '0' },
          '12%': { opacity: '1' },
          '100%': { transform: 'translate3d(var(--festou-drift, 0px), 120px, 0) rotate(540deg)', opacity: '0' },
        },
        'festou-shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        'festou-float': 'festou-float 6s ease-in-out infinite',
        'festou-drift': 'festou-drift 14s ease-in-out infinite',
        'festou-twinkle': 'festou-twinkle 3.6s ease-in-out infinite',
        'festou-pop': 'festou-pop 0.3s ease-out both',
        'festou-confetti': 'festou-confetti-fall 1.6s ease-in forwards',
        'festou-shimmer': 'festou-shimmer 1.6s linear infinite',
      },
    },
  },
  plugins: [],
}
