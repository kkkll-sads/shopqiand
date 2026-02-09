/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // 主色调 - 橙色系
        primary: {
          DEFAULT: '#e1251b', // JD Red
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#e1251b', // Main JD Red
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
          950: '#450a0a',
        },
        // 成功/确认 - 绿色
        success: {
          DEFAULT: '#22c55e',
          50: '#f0fdf4',
          500: '#22c55e',
          600: '#16a34a',
        },
        // 警告 - 黄色
        warning: {
          DEFAULT: '#eab308',
          50: '#fefce8',
          500: '#eab308',
          600: '#ca8a04',
        },
        // 错误/危险 - 红色
        danger: {
          DEFAULT: '#ef4444',
          50: '#fef2f2',
          500: '#ef4444',
          600: '#dc2626',
        },
        // 信息 - 蓝色
        info: {
          DEFAULT: '#3b82f6',
          50: '#eff6ff',
          500: '#3b82f6',
          600: '#2563eb',
        },
      },
      // 自定义安全区域
      padding: {
        safe: 'env(safe-area-inset-bottom)',
        'safe-top': 'env(safe-area-inset-top)',
        'safe-left': 'env(safe-area-inset-left)',
        'safe-right': 'env(safe-area-inset-right)',
      },
      // 动态视口高度
      height: {
        'screen-dynamic': '100dvh',
        'screen-small': '100svh',
        'screen-large': '100lvh',
      },
      minHeight: {
        'screen-dynamic': '100dvh',
        'screen-small': '100svh',
        'screen-large': '100lvh',
      },
      maxHeight: {
        'screen-dynamic': '100dvh',
      },
      // 自定义字体大小
      fontSize: {
        'xxs': ['0.625rem', { lineHeight: '0.875rem' }], // 10px
      },
      // 自定义圆角
      borderRadius: {
        '4xl': '2rem',
      },
      // 自定义阴影
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
        'up': '0 -4px 6px -1px rgba(0, 0, 0, 0.1), 0 -2px 4px -2px rgba(0, 0, 0, 0.1)',
      },
      // 动画
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'spin-slow': 'spin 2s linear infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      // 过渡
      transitionDuration: {
        '250': '250ms',
        '350': '350ms',
      },
      // z-index 规范
      zIndex: {
        'dropdown': '1000',
        'sticky': '1020',
        'fixed': '1030',
        'modal-backdrop': '1040',
        'modal': '1050',
        'popover': '1060',
        'tooltip': '1070',
        'toast': '1080',
      },
    },
  },
  plugins: [],
};
