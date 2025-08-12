/**
 * Vite生产环境构建配置
 * 优化构建性能和产物质量
 */

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { visualizer } from 'rollup-plugin-visualizer';
import { compression } from 'vite-plugin-compression';
import { createHtmlPlugin } from 'vite-plugin-html';

export default defineConfig({
  plugins: [
    react({
      // 生产环境优化
      babel: {
        plugins: [
          // 移除开发环境的调试代码
          ['babel-plugin-transform-remove-console', { exclude: ['error', 'warn'] }],
          // 优化React组件
          ['babel-plugin-transform-react-remove-prop-types', { mode: 'remove' }]
        ]
      }
    }),
    
    // HTML模板处理
    createHtmlPlugin({
      minify: true,
      inject: {
        data: {
          title: 'FocusFlow - 专注时间管理',
          description: '高效的专注时间管理应用，帮助您提升工作效率',
          keywords: '专注,时间管理,番茄工作法,效率,生产力'
        }
      }
    }),
    
    // Gzip压缩
    compression({
      algorithm: 'gzip',
      ext: '.gz',
      threshold: 1024,
      deleteOriginFile: false
    }),
    
    // Brotli压缩
    compression({
      algorithm: 'brotliCompress',
      ext: '.br',
      threshold: 1024,
      deleteOriginFile: false
    }),
    
    // 构建分析
    visualizer({
      filename: 'dist/stats.html',
      open: false,
      gzipSize: true,
      brotliSize: true
    })
  ],
  
  // 构建配置
  build: {
    // 输出目录
    outDir: 'dist',
    
    // 静态资源目录
    assetsDir: 'assets',
    
    // 生成sourcemap
    sourcemap: false,
    
    // 最小化
    minify: 'terser',
    
    // Terser配置
    terserOptions: {
      compress: {
        // 移除console
        drop_console: true,
        drop_debugger: true,
        // 移除未使用的代码
        pure_funcs: ['console.log', 'console.info', 'console.debug'],
        // 优化
        passes: 2
      },
      mangle: {
        // 保留类名（用于调试）
        keep_classnames: false,
        keep_fnames: false
      },
      format: {
        // 移除注释
        comments: false
      }
    },
    
    // 代码分割
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html')
      },
      
      output: {
        // 手动分块
        manualChunks: {
          // React相关
          'react-vendor': ['react', 'react-dom'],
          
          // 路由
          'router': ['react-router-dom'],
          
          // 状态管理
          'state': ['zustand'],
          
          // UI组件库
          'ui': ['framer-motion', 'lucide-react'],
          
          // 图表库
          'charts': ['recharts'],
          
          // 工具库
          'utils': ['date-fns', 'clsx']
        },
        
        // 文件命名
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name!.split('.');
          const ext = info[info.length - 1];
          
          if (/\.(mp3|wav|ogg|m4a)$/.test(assetInfo.name!)) {
            return `assets/audio/[name]-[hash].${ext}`;
          }
          
          if (/\.(png|jpe?g|gif|svg|webp|ico)$/.test(assetInfo.name!)) {
            return `assets/images/[name]-[hash].${ext}`;
          }
          
          if (/\.(woff2?|eot|ttf|otf)$/.test(assetInfo.name!)) {
            return `assets/fonts/[name]-[hash].${ext}`;
          }
          
          return `assets/[ext]/[name]-[hash].${ext}`;
        }
      },
      
      // 外部依赖（如果需要CDN）
      external: [],
      
      // 插件
      plugins: []
    },
    
    // 资源内联阈值
    assetsInlineLimit: 4096,
    
    // CSS代码分割
    cssCodeSplit: true,
    
    // 构建目标
    target: ['es2020', 'chrome80', 'firefox78', 'safari14'],
    
    // 清空输出目录
    emptyOutDir: true,
    
    // 报告压缩后的大小
    reportCompressedSize: true,
    
    // 大文件警告阈值
    chunkSizeWarningLimit: 1000
  },
  
  // 优化配置
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'zustand',
      'framer-motion',
      'lucide-react',
      'recharts'
    ],
    exclude: ['@tauri-apps/api']
  },
  
  // 解析配置
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@components': resolve(__dirname, 'src/components'),
      '@stores': resolve(__dirname, 'src/stores'),
      '@utils': resolve(__dirname, 'src/utils'),
      '@types': resolve(__dirname, 'src/types'),
      '@assets': resolve(__dirname, 'src/assets')
    }
  },
  
  // CSS配置
  css: {
    // PostCSS配置
    postcss: {
      plugins: [
        require('tailwindcss'),
        require('autoprefixer'),
        require('cssnano')({
          preset: 'default'
        })
      ]
    },
    
    // CSS模块
    modules: {
      localsConvention: 'camelCase'
    }
  },
  
  // 服务器配置（用于预览）
  preview: {
    port: 4173,
    host: true,
    strictPort: true
  },
  
  // 环境变量
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
    __COMMIT_HASH__: JSON.stringify(process.env.COMMIT_HASH || 'unknown')
  }
});