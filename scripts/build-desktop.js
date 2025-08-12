#!/usr/bin/env node

/**
 * FocusFlow 桌面应用构建脚本
 * 自动化构建、优化和打包流程
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// 获取当前文件的目录路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function execCommand(command, description, options = {}) {
  log(`\n🔄 ${description}...`, 'cyan');
  try {
    execSync(command, { stdio: 'inherit', ...options });
    log(`✅ ${description} 完成`, 'green');
  } catch (error) {
    log(`❌ ${description} 失败`, 'red');
    console.error(error.message);
    process.exit(1);
  }
}

function checkPrerequisites() {
  log('\n🔍 检查构建环境...', 'yellow');

  // 检查 Node.js
  try {
    const nodeVersion = execSync('node --version', { encoding: 'utf8' }).trim();
    log(`Node.js: ${nodeVersion}`, 'green');
  } catch (error) {
    log('❌ Node.js 未安装', 'red');
    process.exit(1);
  }

  // 检查 Rust
  try {
    const rustVersion = execSync('rustc --version', { encoding: 'utf8' }).trim();
    log(`Rust: ${rustVersion}`, 'green');
  } catch (error) {
    log('❌ Rust 未安装', 'red');
    process.exit(1);
  }

  // 检查 Tauri CLI
  try {
    execSync('cargo tauri --version', { encoding: 'utf8' });
    log('Tauri CLI: 已安装', 'green');
  } catch (error) {
    log('⚠️  Tauri CLI 未安装，正在安装...', 'yellow');
    execCommand('cargo install tauri-cli', '安装 Tauri CLI');
  }
}

function cleanBuild() {
  log('\n🧹 清理构建目录...', 'yellow');

  const dirsToClean = ['dist', 'src-tauri/target'];

  dirsToClean.forEach(dir => {
    if (fs.existsSync(dir)) {
      log(`删除 ${dir}`, 'cyan');
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
}

function runTests() {
  log('\n🧪 运行测试...', 'yellow');

  // 运行前端测试
  execCommand('npm test -- --passWithNoTests', '前端单元测试');

  // 运行 Rust 测试
  execCommand('cd src-tauri && cargo test', 'Rust 单元测试');
}

function buildFrontend() {
  log('\n🏗️  构建前端应用...', 'yellow');

  // 安装依赖
  execCommand('npm ci', '安装 Node.js 依赖');

  // 类型检查
  execCommand('npm run type-check', 'TypeScript 类型检查');

  // 构建前端
  const buildCommand = process.argv.includes('--dev') ? 'npm run build:dev' : 'npm run build:desktop';
  execCommand(buildCommand, '构建前端应用');
}

function buildDesktop() {
  log('\n📦 构建桌面应用...', 'yellow');

  // 构建 Tauri 应用
  const buildCommand = process.argv.includes('--dev') ? 'npm run tauri dev' : 'npm run tauri build';
  execCommand(buildCommand, '构建桌面应用');
}

function showBuildInfo() {
  log('\n📊 构建信息', 'magenta');

  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const tauriConfig = JSON.parse(fs.readFileSync('src-tauri/tauri.conf.json', 'utf8'));

  log(`应用名称: ${tauriConfig.package.productName}`, 'cyan');
  log(`版本: ${tauriConfig.package.version}`, 'cyan');
  log(`标识符: ${tauriConfig.tauri.bundle.identifier}`, 'cyan');

  // 查找构建产物
  const targetDir = 'src-tauri/target/release';
  if (fs.existsSync(targetDir)) {
    log('\n📁 构建产物:', 'magenta');

    const bundleDir = path.join(targetDir, 'bundle');
    if (fs.existsSync(bundleDir)) {
      const files = fs.readdirSync(bundleDir, { recursive: true });
      files.forEach(file => {
        if (typeof file === 'string' && (file.endsWith('.exe') || file.endsWith('.msi') || file.endsWith('.dmg') || file.endsWith('.deb') || file.endsWith('.AppImage'))) {
          const filePath = path.join(bundleDir, file);
          const stats = fs.statSync(filePath);
          const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
          log(`  ${file} (${sizeInMB} MB)`, 'green');
        }
      });
    }
  }
}

function main() {
  const args = process.argv.slice(2);
  const isDev = args.includes('--dev');
  const skipTests = args.includes('--skip-tests');
  const clean = args.includes('--clean');

  log('🎯 FocusFlow 桌面应用构建器', 'bright');
  log('================================', 'bright');

  // 检查环境
  checkPrerequisites();

  // 清理构建
  if (clean) {
    cleanBuild();
  }

  // 运行测试
  if (!skipTests && !isDev) {
    runTests();
  }

  // 构建前端
  buildFrontend();

  if (isDev) {
    // 开发模式
    log('\n🚀 启动开发模式...', 'green');
    execCommand('npm run tauri dev', '启动开发服务器');
  } else {
    // 生产构建
    buildDesktop();
    showBuildInfo();

    log('\n🎉 构建完成！', 'green');
    log('构建产物位于: src-tauri/target/release/bundle/', 'cyan');
  }
}

// 处理错误
process.on('uncaughtException', (error) => {
  log(`\n❌ 未捕获的异常: ${error.message}`, 'red');
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  log(`\n❌ 未处理的 Promise 拒绝: ${reason}`, 'red');
  process.exit(1);
});

// 运行主函数
main();
