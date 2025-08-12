/**
 * FocusFlow 项目清理脚本
 * 自动化清理冗余文件和代码
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// 需要删除的文件列表
const filesToDelete = [
  'CODE_QUALITY_REPORT.md',
  'code-quality-improvement-report.md',
  'performance-benchmark-report.md',
  'performance-optimization-report.md',
  'performance-validation-report.json',
  'UNIFIED_TIMER_UPDATE.md',
  'PHASE1_IMPLEMENTATION_SUMMARY.md',
  'test-core-functions.js',
  'test-database-functions.js',
  'test-functionality.html',
  'test-sqlite-integration.html',
  'test-zustand-integration.html',
  'test-style.json',
  'test-repair-analysis.json',
  'vite.config.desktop.ts'
];

// 需要移动到docs目录的文件
const filesToMove = [
  { from: 'CODE_QUALITY_REPORT.md', to: 'docs/CODE_QUALITY_REPORT.md' },
  { from: 'performance-benchmark-report.md', to: 'docs/PERFORMANCE_REPORT.md' },
  { from: 'performance-optimization-report.md', to: 'docs/PERFORMANCE_REPORT.md' },
  { from: 'performance-validation-report.json', to: 'docs/PERFORMANCE_REPORT.md' },
  { from: 'UNIFIED_TIMER_UPDATE.md', to: 'docs/TIMER_SYSTEM_UPDATE.md' },
  { from: 'PHASE1_IMPLEMENTATION_SUMMARY.md', to: 'docs/TIMER_SYSTEM_UPDATE.md' }
];

// 需要合并的内容
const contentToMerge = {
  'docs/CODE_QUALITY_REPORT.md': [
    'CODE_QUALITY_REPORT.md',
    'code-quality-improvement-report.md'
  ],
  'docs/PERFORMANCE_REPORT.md': [
    'performance-benchmark-report.md',
    'performance-optimization-report.md',
    'performance-validation-report.json'
  ],
  'docs/TIMER_SYSTEM_UPDATE.md': [
    'UNIFIED_TIMER_UPDATE.md',
    'PHASE1_IMPLEMENTATION_SUMMARY.md'
  ]
};

function deleteFiles() {
  log('\n🗑️ 删除冗余文件...', 'yellow');

  let deletedCount = 0;

  filesToDelete.forEach(file => {
    if (fs.existsSync(file)) {
      try {
        fs.unlinkSync(file);
        log(`✅ 已删除: ${file}`, 'green');
        deletedCount++;
      } catch (error) {
        log(`❌ 删除失败: ${file} - ${error.message}`, 'red');
      }
    } else {
      log(`⚠️ 文件不存在: ${file}`, 'yellow');
    }
  });

  log(`\n总共删除了 ${deletedCount} 个文件`, 'cyan');
  return deletedCount;
}

function moveFiles() {
  log('\n📁 移动文件到docs目录...', 'yellow');

  let movedCount = 0;

  filesToMove.forEach(item => {
    if (fs.existsSync(item.from)) {
      try {
        // 确保目标目录存在
        const dir = path.dirname(item.to);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }

        // 移动文件
        fs.renameSync(item.from, item.to);
        log(`✅ 已移动: ${item.from} -> ${item.to}`, 'green');
        movedCount++;
      } catch (error) {
        log(`❌ 移动失败: ${item.from} -> ${item.to} - ${error.message}`, 'red');
      }
    } else {
      log(`⚠️ 源文件不存在: ${item.from}`, 'yellow');
    }
  });

  log(`\n总共移动了 ${movedCount} 个文件`, 'cyan');
  return movedCount;
}

function mergeContent() {
  log('\n📝 合并文档内容...', 'yellow');

  let mergedCount = 0;

  for (const [targetFile, sourceFiles] of Object.entries(contentToMerge)) {
    try {
      let mergedContent = '';

      // 添加文件头
      mergedContent += `# FocusFlow ${targetFile.split('/')[1].replace('.md', '')}\n\n`;
      mergedContent += `**整合日期**: ${new Date().toISOString().split('T')[0]}\n\n`;
      mergedContent += `本文件整合了以下文档的内容:\n`;
      mergedContent += `- ${sourceFiles.join('\n- ')}\n\n`;
      mergedContent += '---\n\n';

      // 合并每个源文件的内容
      sourceFiles.forEach(sourceFile => {
        if (fs.existsSync(sourceFile)) {
          const content = fs.readFileSync(sourceFile, 'utf8');
          // 移除源文件的标题（避免重复）
          const lines = content.split('\n');
          let fileContent = '';
          let skipHeader = true;

          for (const line of lines) {
            if (skipHeader && line.startsWith('# ')) {
              continue; // 跳过标题行
            }
            if (line.trim() === '---') {
              skipHeader = false; // 跳过文件分隔符
              continue;
            }
            fileContent += line + '\n';
          }

          mergedContent += `## ${sourceFile}\n\n`;
          mergedContent += fileContent;
          mergedContent += '\n\n';
        }
      });

      // 确保目标目录存在
      const dir = path.dirname(targetFile);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // 写入合并后的内容
      fs.writeFileSync(targetFile, mergedContent);
      log(`✅ 已合并: ${targetFile}`, 'green');
      mergedCount++;
    } catch (error) {
      log(`❌ 合并失败: ${targetFile} - ${error.message}`, 'red');
    }
  }

  log(`\n总共合并了 ${mergedCount} 个文件`, 'cyan');
  return mergedCount;
}

function optimizeConfigFiles() {
  log('\n⚙️ 优化配置文件...', 'yellow');

  try {
    // 优化vite配置
    if (fs.existsSync('vite.config.ts') && fs.existsSync('vite.config.desktop.ts')) {
      const mainConfig = fs.readFileSync('vite.config.ts', 'utf8');
      const desktopConfig = fs.readFileSync('vite.config.desktop.ts', 'utf8');

      // 创建优化后的配置
      const optimizedConfig = mainConfig.replace(
        /server:\s*{[^}]+}/,
        `server: {
    port: process.env.VITE_DESKTOP ? 1420 : 3000,
    host: process.env.VITE_DESKTOP ? 'localhost' : '0.0.0.0',
    strictPort: !!process.env.VITE_DESKTOP
  }`
      ).replace(
        /build:\s*{[^}]+}/,
        `build: {
    outDir: process.env.VITE_DESKTOP ? 'dist-desktop' : 'dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, process.env.VITE_DESKTOP ? 'src/desktop.tsx' : 'index.html'),
      },
    },
    target: process.env.VITE_DESKTOP ? (process.env.TAURI_PLATFORM == 'windows' ? 'chrome105' : 'safari13') : 'esnext',
    minify: process.env.VITE_DESKTOP ? (!process.env.TAURI_DEBUG ? 'esbuild' : false) : 'esbuild',
    sourcemap: process.env.VITE_DESKTOP ? !!process.env.TAURI_DEBUG : false,
  }`
      );

      fs.writeFileSync('vite.config.ts', optimizedConfig);
      fs.unlinkSync('vite.config.desktop.ts');

      log('✅ 已优化Vite配置文件', 'green');
    }

    return 1;
  } catch (error) {
    log(`❌ 配置文件优化失败: ${error.message}`, 'red');
    return 0;
  }
}

function runCleanup() {
  log('🧹 FocusFlow 项目清理工具', 'bright');
  log('================================', 'bright');

  const startTime = Date.now();

  // 执行清理步骤
  const deletedCount = deleteFiles();
  const movedCount = moveFiles();
  const mergedCount = mergeContent();
  const optimizedCount = optimizeConfigFiles();

  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);

  log('\n🎉 清理完成！', 'green');
  log('--------------------------------', 'green');
  log(`删除文件: ${deletedCount}`, 'cyan');
  log(`移动文件: ${movedCount}`, 'cyan');
  log(`合并文档: ${mergedCount}`, 'cyan');
  log(`优化配置: ${optimizedCount}`, 'cyan');
  log(`\n总耗时: ${duration} 秒`, 'magenta');

  log('\n📋 下一步建议:', 'yellow');
  log('1. 运行 `npm install` 更新依赖', 'cyan');
  log('2. 运行 `npm run lint` 检查代码质量', 'cyan');
  log('3. 运行 `npm test` 确保功能正常', 'cyan');
  log('4. 提交更改到版本控制系统', 'cyan');
}

// 处理命令行参数
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const help = args.includes('--help') || args.includes('-h');

if (help) {
  console.log(`
FocusFlow 项目清理工具

用法: node CLEANUP_SCRIPT.js [选项]

选项:
  --dry-run  仅显示将要执行的操作，不实际执行
  --help, -h 显示此帮助信息

示例:
  node CLEANUP_SCRIPT.js          # 执行清理操作
  node CLEANUP_SCRIPT.js --dry-run # 预览清理操作
`);
  process.exit(0);
}

if (dryRun) {
  log('🔍 预览模式 - 不会实际执行任何操作', 'yellow');
  log('将要删除的文件:', 'cyan');
  filesToDelete.forEach(file => log(`  - ${file}`, 'cyan'));

  log('\n将要移动的文件:', 'cyan');
  filesToMove.forEach(item => log(`  - ${item.from} -> ${item.to}`, 'cyan'));

  log('\n将要合并的文档:', 'cyan');
  Object.keys(contentToMerge).forEach(target => {
    log(`  - ${target} <- ${contentToMerge[target].join(', ')}`, 'cyan');
  });

  log('\n将要优化的配置文件:', 'cyan');
  log('  - 合并 vite.config.ts 和 vite.config.desktop.ts', 'cyan');
} else {
  runCleanup();
}
