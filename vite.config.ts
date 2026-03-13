import legacy from '@vitejs/plugin-legacy';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  const apiProxyTarget = env.VITE_API_PROXY_TARGET || 'http://127.0.0.1:8080';

  return {
    plugins: [
      react(),
      tailwindcss(),
      ...legacy({
        targets: [
          'chrome >= 61',
          'chromeAndroid >= 61',
          'edge >= 79',
          'firefox >= 60',
          'safari >= 10.1',
          'iOS >= 10.3',
        ],
      }),
    ],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      proxy: {
        '/api': {
          target: apiProxyTarget,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, '/index.php/api'),
        },
        '/storage': {
          target: apiProxyTarget,
          changeOrigin: true,
        },
        '/uploads': {
          target: apiProxyTarget,
          changeOrigin: true,
        },
        '/static': {
          target: apiProxyTarget,
          changeOrigin: true,
        },
      },
    },
  };
});

