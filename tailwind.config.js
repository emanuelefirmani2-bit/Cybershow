/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        cyber: {
          blue: '#00AEEF',
          pink: '#ED008C',
          tiffany: '#B2EBF2',
          green: '#2E8B57',
          red: '#B22222',
          bg: '#1A1A2E',
          dark: '#0D0D1A',
          panel: '#16213E',
        },
      },
      fontFamily: {
        cyber: ['Orbitron', 'Exo 2', 'sans-serif'],
        display: ['Bangers', 'Impact', 'sans-serif'],
      },
      borderRadius: {
        cyber: '1rem',
        xl: '1.5rem',
        '2xl': '2rem',
      },
      boxShadow: {
        'cyber-blue': '0 0 20px #00AEEF, 0 0 40px rgba(0, 174, 239, 0.3)',
        'cyber-pink': '0 0 20px #ED008C, 0 0 40px rgba(237, 0, 140, 0.3)',
        'cyber-green': '0 0 20px #2E8B57, 0 0 40px rgba(46, 139, 87, 0.3)',
        'cyber-red': '0 0 20px #B22222, 0 0 40px rgba(178, 34, 34, 0.3)',
        'ice': '0 0 15px #B2EBF2, 0 0 30px rgba(178, 235, 242, 0.5)',
        neon: '0 0 5px currentColor, 0 0 20px currentColor',
      },
      animation: {
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'scanlines': 'scanlines 8s linear infinite',
        'glitch': 'glitch 0.3s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
        'shake': 'shake 0.5s ease-in-out',
        'ice-appear': 'iceAppear 0.5s ease-out forwards',
        'gold-rain': 'goldRain 1s ease-in infinite',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 10px #00AEEF, 0 0 20px rgba(0, 174, 239, 0.3)' },
          '50%': { boxShadow: '0 0 30px #00AEEF, 0 0 60px rgba(0, 174, 239, 0.6)' },
        },
        scanlines: {
          '0%': { backgroundPosition: '0 0' },
          '100%': { backgroundPosition: '0 100%' },
        },
        glitch: {
          '0%': { transform: 'translate(0)' },
          '20%': { transform: 'translate(-2px, 2px)' },
          '40%': { transform: 'translate(-2px, -2px)' },
          '60%': { transform: 'translate(2px, 2px)' },
          '80%': { transform: 'translate(2px, -2px)' },
          '100%': { transform: 'translate(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-5px)' },
          '20%, 40%, 60%, 80%': { transform: 'translateX(5px)' },
        },
        iceAppear: {
          '0%': { opacity: '0', filter: 'blur(10px)' },
          '100%': { opacity: '1', filter: 'blur(0)' },
        },
        goldRain: {
          '0%': { transform: 'translateY(-100vh)', opacity: '1' },
          '100%': { transform: 'translateY(100vh)', opacity: '0' },
        },
      },
    },
  },
  plugins: [],
}
