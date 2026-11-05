/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: {
          50: '#FAF8F5',  // 宣紙淺白底
          100: '#F3EFE6', // 宣紙暖米色
          200: '#E6DFD1', // 宣紙邊框色
          300: '#D2C7B2',
        },
        ink: {
          900: '#1C1B19', // 濃墨黑
          800: '#2E2C29', // 中墨
          600: '#5C5852', // 淡墨
          400: '#8C867E', // 淺墨灰
        },
        cinnabar: {
          600: '#B83B2B', // 硃砂印泥紅
          700: '#9A2E20',
          50: '#FDF3F2',
        },
      },
      fontFamily: {
        serif: ['"Noto Serif TC"', '"Songti TC"', '"PMingLiU"', 'serif'],
        sans: ['"Noto Sans TC"', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        scroll: '0 4px 20px -2px rgba(28, 27, 25, 0.06), 0 1px 4px -1px rgba(28, 27, 25, 0.04)',
      },
    },
  },
  plugins: [],
};
