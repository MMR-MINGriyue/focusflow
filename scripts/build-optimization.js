/**
 * 构建优化脚本
 * 自动化构建过程和质量检查
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const chalk = require('chalk');

// 构建配置
const BUILD_CONFIG = {
  // 输出目录
  outputDir: 'dist',
  
  // 质量检查阈值
  thresholds: {
    bundleSize: 2 * 1024 * 1024, // 2MB
    chunkSize: 500 * 1024, // 500KB
    assetSize: 100 * 1024, // 100KB
    gzipRatio: 0.3, // 压缩率
    duplicateCode: 0.05 // 重复代码率
  },
  
  // 需要检查的文件类型
  checkExtensions: ['.js', '.ts', '.tsx', '.css'],
  
  // 忽略的文件/目录
  ignorePatterns: [
    'node_modules',
    '.git',
    'dist',
    'coverage',
    '*.test.*',
    '*.spec.*'
  ]
};

class BuildOptimizer {
  constructor() {
    this.startTime = Date.now();
    this.buildStats = {
      totalSize: 0,
      gzipSize: 0,
      chunks: [],
      assets: [],
      warnings: [],
      errors: []
    };
  }

  // 主构建流程
  async build() {
    console.log(chalk.blue('🚀 开始构建优化流程...\n'));

    try {
      // 1. 预构建检查
      await this.preBuildCheck();
      
      // 2. 清理旧构建
      await this.cleanBuild();
      
      // 3. 代码质量检查
      await this.codeQualityCheck();
      
      // 4. 执行构建
      await this.executeBuild();
      
      // 5. 构建后分析
      await this.postBuildAnalysis();
      
      // 6. 生成报告
      await this.generateReport();
      
      console.log(chalk.green('✅ 构建优化完成！'));
      
    } catch (error) {
      console.error(chalk.red('❌ 构建失败:'), error.message);
      process.exit(1);
    }
  }

  // 预构建检查
  async preBuildCheck() {
    console.log(chalk.yellow('📋 执行预构建检查...'));
    
    // 检查Node.js版本
    const nodeVersion = process.version;
    console.log(`Node.js版本: ${nodeVersion}`);
    
    // 检查依赖
    if (!fs.existsSync('node_modules')) {
      console.log('安装依赖...');
      execSync('npm install', { stdio: 'inherit' });
    }
    
    // 检查TypeScript配置
    if (!fs.existsSync('tsconfig.json')) {
      throw new Error('缺少TypeScript配置文件');
    }
    
    // 检查环境变量
    const requiredEnvVars = ['NODE_ENV'];
    for (const envVar of requiredEnvVars) {
      if (!process.env[envVar]) {
        console.warn(chalk.yellow(`⚠️  环境变量 ${envVar} 未设置`));
      }
    }
    
    console.log(chalk.green('✅ 预构建检查完成\n'));
  }

  // 清理旧构建
  async cleanBuild() {
    console.log(chalk.yellow('🧹 清理旧构建文件...'));
    
    if (fs.existsSync(BUILD_CONFIG.outputDir)) {
      fs.rmSync(BUILD_CONFIG.outputDir, { recursive: true, force: true });
      console.log(`删除 ${BUILD_CONFIG.outputDir} 目录`);
    }
    
    console.log(chalk.green('✅ 清理完成\n'));
  }

  // 代码质量检查
  async codeQualityCheck() {
    console.log(chalk.yellow('🔍 执行代码质量检查...'));
    
    try {
      // TypeScript类型检查
      console.log('TypeScript类型检查...');
      execSync('npx tsc --noEmit', { stdio: 'pipe' });
      
      // ESLint检查
      console.log('ESLint代码检查...');
      execSync('npx eslint src --ext .ts,.tsx --max-warnings 0', { stdio: 'pipe' });
      
      // 代码重复检查
      await this.checkDuplicateCode();
      
      console.log(chalk.green('✅ 代码质量检查通过\n'));
      
    } catch (error) {
      console.error(chalk.red('❌ 代码质量检查失败'));
      throw error;
    }
  }

  // 检查重复代码
  async checkDuplicateCode() {
    console.log('检查代码重复...');
    
    const sourceFiles = this.getSourceFiles('src');
    const duplicates = this.findDuplicates(sourceFiles);
    
    if (duplicates.length > 0) {
      console.warn(chalk.yellow(`⚠️  发现 ${duplicates.length} 处重复代码`));
      duplicates.forEach(duplicate => {
        console.warn(`  - ${duplicate.file1} 和 ${duplicate.file2}`);
      });
    }
  }

  // 获取源文件列表
  getSourceFiles(dir) {
    const files = [];
    
    const scan = (currentDir) => {
      const items = fs.readdirSync(currentDir);
      
      for (const item of items) {
        const fullPath = path.join(currentDir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          if (!BUILD_CONFIG.ignorePatterns.some(pattern => item.includes(pattern))) {
            scan(fullPath);
          }
        } else {
          const ext = path.extname(item);
          if (BUILD_CONFIG.checkExtensions.includes(ext)) {
            files.push(fullPath);
          }
        }
      }
    };
    
    scan(dir);
    return files;
  }

  // 查找重复代码（简化版）
  findDuplicates(files) {
    const duplicates = [];
    const fileContents = new Map();
    
    // 读取文件内容
    files.forEach(file => {
      try {
        const content = fs.readFileSync(file, 'utf8');
        const lines = content.split('\n').filter(line => line.trim().length > 10);
        fileContents.set(file, lines);
      } catch (error) {
        console.warn(`无法读取文件: ${file}`);
      }
    });
    
    // 简单的重复检测（实际项目中应使用更复杂的算法）
    const fileArray = Array.from(fileContents.entries());
    for (let i = 0; i < fileArray.length; i++) {
      for (let j = i + 1; j < fileArray.length; j++) {
        const [file1, lines1] = fileArray[i];
        const [file2, lines2] = fileArray[j];
        
        const similarity = this.calculateSimilarity(lines1, lines2);
        if (similarity > BUILD_CONFIG.thresholds.duplicateCode) {
          duplicates.push({ file1, file2, similarity });
        }
      }
    }
    
    return duplicates;
  }

  // 计算相似度
  calculateSimilarity(lines1, lines2) {
    const set1 = new Set(lines1);
    const set2 = new Set(lines2);
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    
    return intersection.size / union.size;
  }

  // 执行构建
  async executeBuild() {
    console.log(chalk.yellow('🔨 执行构建...'));
    
    const buildStart = Date.now();
    
    try {
      // 使用生产配置构建
      execSync('npx vite build --config vite.config.production.ts', { 
        stdio: 'inherit',
        env: { ...process.env, NODE_ENV: 'production' }
      });
      
      const buildTime = Date.now() - buildStart;
      console.log(chalk.green(`✅ 构建完成，耗时: ${buildTime}ms\n`));
      
    } catch (error) {
      throw new Error(`构建失败: ${error.message}`);
    }
  }

  // 构建后分析
  async postBuildAnalysis() {
    console.log(chalk.yellow('📊 分析构建结果...'));
    
    if (!fs.existsSync(BUILD_CONFIG.outputDir)) {
      throw new Error('构建输出目录不存在');
    }
    
    // 分析文件大小
    await this.analyzeBundleSize();
    
    // 检查资源优化
    await this.checkAssetOptimization();
    
    // 验证构建质量
    await this.validateBuildQuality();
    
    console.log(chalk.green('✅ 构建分析完成\n'));
  }

  // 分析包大小
  async analyzeBundleSize() {
    const distPath = BUILD_CONFIG.outputDir;
    const stats = this.getDirectoryStats(distPath);
    
    this.buildStats.totalSize = stats.totalSize;
    this.buildStats.chunks = stats.jsFiles;
    this.buildStats.assets = stats.otherFiles;
    
    console.log(`总大小: ${this.formatSize(stats.totalSize)}`);
    console.log(`JS文件: ${stats.jsFiles.length} 个`);
    console.log(`其他资源: ${stats.otherFiles.length} 个`);
    
    // 检查大小阈值
    if (stats.totalSize > BUILD_CONFIG.thresholds.bundleSize) {
      this.buildStats.warnings.push({
        type: 'size',
        message: `构建总大小 ${this.formatSize(stats.totalSize)} 超过阈值 ${this.formatSize(BUILD_CONFIG.thresholds.bundleSize)}`
      });
    }
    
    // 检查单个chunk大小
    stats.jsFiles.forEach(file => {
      if (file.size > BUILD_CONFIG.thresholds.chunkSize) {
        this.buildStats.warnings.push({
          type: 'chunk-size',
          message: `文件 ${file.name} 大小 ${this.formatSize(file.size)} 超过阈值`
        });
      }
    });
  }

  // 获取目录统计信息
  getDirectoryStats(dir) {
    const stats = {
      totalSize: 0,
      jsFiles: [],
      cssFiles: [],
      otherFiles: []
    };
    
    const scan = (currentDir) => {
      const items = fs.readdirSync(currentDir);
      
      for (const item of items) {
        const fullPath = path.join(currentDir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          scan(fullPath);
        } else {
          const fileInfo = {
            name: path.relative(dir, fullPath),
            size: stat.size,
            path: fullPath
          };
          
          stats.totalSize += stat.size;
          
          const ext = path.extname(item);
          if (ext === '.js') {
            stats.jsFiles.push(fileInfo);
          } else if (ext === '.css') {
            stats.cssFiles.push(fileInfo);
          } else {
            stats.otherFiles.push(fileInfo);
          }
        }
      }
    };
    
    scan(dir);
    return stats;
  }

  // 检查资源优化
  async checkAssetOptimization() {
    console.log('检查资源优化...');
    
    // 检查Gzip压缩
    const gzipFiles = this.buildStats.chunks.filter(file => 
      fs.existsSync(file.path + '.gz')
    );
    
    if (gzipFiles.length > 0) {
      console.log(`✅ ${gzipFiles.length} 个文件已Gzip压缩`);
      
      // 计算压缩率
      gzipFiles.forEach(file => {
        const gzipSize = fs.statSync(file.path + '.gz').size;
        const ratio = gzipSize / file.size;
        
        if (ratio > BUILD_CONFIG.thresholds.gzipRatio) {
          this.buildStats.warnings.push({
            type: 'compression',
            message: `文件 ${file.name} 压缩率 ${(ratio * 100).toFixed(1)}% 较低`
          });
        }
      });
    }
    
    // 检查图片优化
    const imageFiles = this.buildStats.assets.filter(file => 
      /\.(png|jpg|jpeg|gif|svg|webp)$/i.test(file.name)
    );
    
    console.log(`图片文件: ${imageFiles.length} 个`);
  }

  // 验证构建质量
  async validateBuildQuality() {
    console.log('验证构建质量...');
    
    // 检查必要文件
    const requiredFiles = ['index.html'];
    for (const file of requiredFiles) {
      const filePath = path.join(BUILD_CONFIG.outputDir, file);
      if (!fs.existsSync(filePath)) {
        this.buildStats.errors.push({
          type: 'missing-file',
          message: `缺少必要文件: ${file}`
        });
      }
    }
    
    // 检查HTML文件
    const htmlPath = path.join(BUILD_CONFIG.outputDir, 'index.html');
    if (fs.existsSync(htmlPath)) {
      const htmlContent = fs.readFileSync(htmlPath, 'utf8');
      
      // 检查是否包含必要的meta标签
      const requiredMeta = ['viewport', 'description'];
      for (const meta of requiredMeta) {
        if (!htmlContent.includes(`name="${meta}"`)) {
          this.buildStats.warnings.push({
            type: 'html-meta',
            message: `HTML缺少 ${meta} meta标签`
          });
        }
      }
    }
  }

  // 生成构建报告
  async generateReport() {
    console.log(chalk.yellow('📄 生成构建报告...'));
    
    const buildTime = Date.now() - this.startTime;
    
    const report = {
      buildTime: new Date().toISOString(),
      duration: buildTime,
      stats: this.buildStats,
      summary: {
        totalSize: this.buildStats.totalSize,
        chunkCount: this.buildStats.chunks.length,
        assetCount: this.buildStats.assets.length,
        warningCount: this.buildStats.warnings.length,
        errorCount: this.buildStats.errors.length
      }
    };
    
    // 保存JSON报告
    const reportPath = path.join(BUILD_CONFIG.outputDir, 'build-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    // 生成HTML报告
    await this.generateHtmlReport(report);
    
    // 控制台输出摘要
    this.printSummary(report);
    
    console.log(chalk.green(`✅ 构建报告已生成: ${reportPath}\n`));
  }

  // 生成HTML报告
  async generateHtmlReport(report) {
    const htmlTemplate = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>FocusFlow 构建报告</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1 { color: #333; border-bottom: 2px solid #007acc; padding-bottom: 10px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
        .metric { background: #f8f9fa; padding: 20px; border-radius: 6px; text-align: center; }
        .metric-value { font-size: 2em; font-weight: bold; color: #007acc; }
        .metric-label { color: #666; margin-top: 5px; }
        .files { margin: 20px 0; }
        .file-list { max-height: 300px; overflow-y: auto; border: 1px solid #ddd; border-radius: 4px; }
        .file-item { padding: 10px; border-bottom: 1px solid #eee; display: flex; justify-content: between; }
        .file-name { flex: 1; }
        .file-size { color: #666; }
        .warnings { background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 4px; padding: 15px; margin: 20px 0; }
        .errors { background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 4px; padding: 15px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <h1>FocusFlow 构建报告</h1>
        <p>构建时间: ${report.buildTime}</p>
        <p>构建耗时: ${report.duration}ms</p>
        
        <div class="summary">
            <div class="metric">
                <div class="metric-value">${this.formatSize(report.summary.totalSize)}</div>
                <div class="metric-label">总大小</div>
            </div>
            <div class="metric">
                <div class="metric-value">${report.summary.chunkCount}</div>
                <div class="metric-label">JS文件</div>
            </div>
            <div class="metric">
                <div class="metric-value">${report.summary.assetCount}</div>
                <div class="metric-label">资源文件</div>
            </div>
            <div class="metric">
                <div class="metric-value">${report.summary.warningCount}</div>
                <div class="metric-label">警告</div>
            </div>
        </div>
        
        <div class="files">
            <h2>JavaScript文件</h2>
            <div class="file-list">
                ${report.stats.chunks.map(file => `
                    <div class="file-item">
                        <span class="file-name">${file.name}</span>
                        <span class="file-size">${this.formatSize(file.size)}</span>
                    </div>
                `).join('')}
            </div>
        </div>
        
        ${report.stats.warnings.length > 0 ? `
            <div class="warnings">
                <h3>⚠️ 警告</h3>
                ${report.stats.warnings.map(warning => `<p>${warning.message}</p>`).join('')}
            </div>
        ` : ''}
        
        ${report.stats.errors.length > 0 ? `
            <div class="errors">
                <h3>❌ 错误</h3>
                ${report.stats.errors.map(error => `<p>${error.message}</p>`).join('')}
            </div>
        ` : ''}
    </div>
</body>
</html>`;
    
    const htmlPath = path.join(BUILD_CONFIG.outputDir, 'build-report.html');
    fs.writeFileSync(htmlPath, htmlTemplate);
  }

  // 打印摘要
  printSummary(report) {
    console.log(chalk.blue('\n📊 构建摘要:'));
    console.log(`总大小: ${chalk.cyan(this.formatSize(report.summary.totalSize))}`);
    console.log(`构建耗时: ${chalk.cyan(report.duration + 'ms')}`);
    console.log(`JS文件: ${chalk.cyan(report.summary.chunkCount + ' 个')}`);
    console.log(`资源文件: ${chalk.cyan(report.summary.assetCount + ' 个')}`);
    
    if (report.summary.warningCount > 0) {
      console.log(`警告: ${chalk.yellow(report.summary.warningCount + ' 个')}`);
    }
    
    if (report.summary.errorCount > 0) {
      console.log(`错误: ${chalk.red(report.summary.errorCount + ' 个')}`);
    }
  }

  // 格式化文件大小
  formatSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// 主函数
async function main() {
  const optimizer = new BuildOptimizer();
  await optimizer.build();
}

// 如果直接运行此脚本
if (require.main === module) {
  main().catch(error => {
    console.error(chalk.red('构建失败:'), error);
    process.exit(1);
  });
}

module.exports = BuildOptimizer;