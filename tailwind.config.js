/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#FFFFFF',
        surface: '#F7F7F7',
        primary: '#00C16A',
        'primary-dark': '#009E55',
        'text-primary': '#111111',
        'text-secondary': '#6B6B6B',
        'text-hint': '#ABABAB',
        border: '#EFEFEF',
        error: '#FF4444',
        success: '#00C16A',
        warning: '#FF9500',
      },
      fontFamily: {
        'inter-regular': ['Inter_400Regular'],
        'inter-medium': ['Inter_500Medium'],
        'inter-semibold': ['Inter_600SemiBold'],
        'inter-bold': ['Inter_700Bold'],
      },
      borderRadius: {
        card: '16px',
        button: '14px',
        input: '12px',
        chip: '20px',
      },
    },
  },
  plugins: [],
};
