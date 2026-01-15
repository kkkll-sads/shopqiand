import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// 统一的后端前缀，前端代码里都以这个作为基础路径
const API_PREFIX = '/api';

const DEFAULT_API_TARGET = 'http://47.76.239.170:8080/index.php';
// const DEFAULT_API_TARGET = 'http://18.162.70.209:3005/index.php';


const resolveApiTarget = (raw?: string) => {
  const source = raw?.trim();
  if (!source) return DEFAULT_API_TARGET;

  try {
    const normalized = new URL(source);
    return normalized.toString().replace(/\/$/, '');
  } catch (error) {
    console.warn(
      `[vite] 无效的 VITE_API_TARGET: ${source}, 已回退到默认地址 ${DEFAULT_API_TARGET}`,
    );
    return DEFAULT_API_TARGET;
  }
};

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');

  // 本地开发代理目标，优先使用环境变量，便于切换不同环境
  const API_TARGET = resolveApiTarget(env.VITE_API_TARGET);

  return {
    server: {
      port: 5657,
      host: '0.0.0.0',
      allowedHosts: ['shu.gckot.cn', 'wap.dfahwk.cn', 'shu.fhsyi.cn', 'wap.bskhu.cn'],
      // 配置 history API fallback，支持单页应用路由
      historyApiFallback: true,
      // 配置代理解决 CORS 问题
      proxy: {
        [API_PREFIX]: {
          target: API_TARGET,
          changeOrigin: true,
          // 保持路径前缀一致，方便前端直接写 /api 开头的接口
          rewrite: (p) => p.replace(new RegExp(`^${API_PREFIX}`), API_PREFIX),
          secure: false,
        },
        // 图片资源代理，解决跨域问题
        '/uploads': {
          target: API_TARGET.replace(/\/index\.php$/, ''),
          changeOrigin: true,
          secure: false,
        },
        // 静态资源代理
        '/static': {
          target: API_TARGET.replace(/\/index\.php$/, ''),
          changeOrigin: true,
          secure: false,
        },
        // 存储资源代理（用户头像等）
        '/storage': {
          target: API_TARGET.replace(/\/index\.php$/, ''),
          changeOrigin: true,
          secure: false,
        },
      },
    },
    preview: {
      port: 5657,
      host: '0.0.0.0',
      allowedHosts: ['shu.gckot.cn', 'wap.dfahwk.cn', 'shu.fhsyi.cn', 'wap.bskhu.cn'],
      // 配置 history API fallback，支持单页应用路由
      historyApiFallback: true,
    },
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      chunkSizeWarningLimit: 800, // 调高警告阈值，结合手动分包
      rollupOptions: {
        output: {
          // 按需拆分常见依赖，避免引用不存在的包导致构建失败
          manualChunks: (id: string) => {
            if (id.includes('node_modules')) {
              // React 核心库单独打包
              if (id.includes('react') || id.includes('react-dom')) {
                return 'react-vendor';
              }
              // 图标库单独打包
              if (id.includes('lucide-react')) {
                return 'ui-icons';
              }
              // 大数据文件单独打包（如省市区数据）
              if (id.includes('element-china-area-data')) {
                return 'area-data';
              }
              // 其他第三方依赖
              return 'vendor';
            }
          },
        },
      },
    },
  };
});
