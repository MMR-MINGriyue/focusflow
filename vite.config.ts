import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const isDesktop = mode === 'desktop';
  const isDev = process.env.NODE_ENV === 'development';

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
      },
    },
    // 服务器配置
    server: {
      port: isDesktop ? 3001 : 3000, // 使用3001端口避免冲突
      host: '0.0.0.0', // 监听所有接口
      strictPort: false, // 如果端口被占用，尝试其他端口
      open: true, // 自动打开浏览器
    },
    // 构建配置
    build: {
      outDir: isDesktop ? 'dist-desktop' : 'dist',
      // 桌面应用使用特定的入口文件
      rollupOptions: {
        input: {
          main: resolve(__dirname, isDesktop ? 'public/index-desktop.html' : 'index.html'),
        },
        output: {
          // 确保资源路径正确
          assetFileNames: (assetInfo) => {
            const info = assetInfo.name.split('.');
            const ext = info[info.length - 1];
            if (/\.(mp4|webm|ogg|mp3|wav|flac|aac)(\?.*)?$/i.test(assetInfo.name)) {
              return `assets/media/[name]-[hash][extname]`;
            }
            if (/\.(png|jpe?g|gif|svg)(\?.*)?$/i.test(assetInfo.name)) {
              return `assets/images/[name]-[hash][extname]`;
            }
            if (/\.css$/.test(assetInfo.name)) {
              return `assets/css/[name]-[hash][extname]`;
            }
            return `assets/[name]-[hash][extname]`;
          },
          chunkFileNames: 'assets/js/[name]-[hash].js',
          entryFileNames: 'assets/js/[name]-[hash].js',
        },
      },
      // 桌面应用的目标环境
      target: isDesktop ? (process.env.TAURI_PLATFORM === 'windows' ? 'chrome105' : 'safari13') : 'esnext',
      // 桌面应用的压缩配置
      minify: isDesktop ? (!process.env.TAURI_DEBUG ? 'esbuild' : false) : 'esbuild',
      // 桌面应用的源码映射
      sourcemap: isDesktop ? !!process.env.TAURI_DEBUG : false,
      // 桌面应用的代码分割配置
      chunkSizeWarningLimit: 1000,
      // 桌面应用的资源内联限制
      assetsInlineLimit: isDesktop ? 4096 : 4096,
    },
    // CSS 配置
    css: {
      // 桌面应用的 CSS 模块配置
      modules: {
        localsConvention: 'camelCase',
      },
    },
    // 优化配置
    optimizeDeps: {
      include: ['react', 'react-dom', 'react-router-dom'],
    },
    // 定义全局变量
    define: {
      __DEV__: JSON.stringify(isDev),
      __DESKTOP__: JSON.stringify(isDesktop),
      // __TAURI__ 变量由 Tauri 自身提供，不需要在这里定义
    },
    // 环境变量前缀
    envPrefix: ['VITE_', 'TAURI_'],
    // 清除输出目录
    emptyOutDir: true,
  };
});
