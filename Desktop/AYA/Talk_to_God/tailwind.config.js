/** @type {import('tailwindcss').Config} */
export default {
  // Mode sombre piloté par la classe `dark` sur <html> (bascule manuelle).
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        // Police arabe élégante pour le verset (chargée via Google Fonts).
        quran: ['"Amiri Quran"', '"Amiri"', 'serif'],
        arabic: ['"Amiri"', 'serif'],
        // Police lisible pour le tafsir (texte plus long, plus petit).
        tafsir: ['"Noto Naskh Arabic"', '"Amiri"', 'serif'],
      },
      colors: {
        // Couleur dominante pilotée par des variables CSS (voir index.css) :
        // bascule vert / bleu Majorelle / terre cuite via `data-palette`.
        emerald: {
          deep: 'rgb(var(--c-deep) / <alpha-value>)',
          night: 'rgb(var(--c-night) / <alpha-value>)',
        },
        midnight: 'rgb(var(--c-darkbg) / <alpha-value>)', // fond sombre
        // Constantes communes à toutes les palettes (sable + safran/or).
        cream: '#f6edd9',
        gold: '#cf9f3b',
        terracotta: {
          DEFAULT: '#b85c38',
          deep: '#9c4a2c',
        },
        majorelle: '#2f5d8a',
      },
      keyframes: {
        'fade-slide': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'spin-slow': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
      },
      animation: {
        'fade-slide': 'fade-slide 0.6s cubic-bezier(0.22, 1, 0.36, 1)',
        'spin-slow': 'spin-slow 60s linear infinite',
      },
    },
  },
  plugins: [],
}
