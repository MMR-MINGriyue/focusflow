/**
 * 构建产物验证测试
 * 
 * 验证桌面应用构建的完整性和正确性
 */

import * as fs from 'fs';
import * as path from 'path';

describe('Build Verification Tests', () => {
  const projectRoot = path.join(__dirname, '..', '..');
  const tauriRoot = path.join(projectRoot, 'src-tauri');
  const releaseDir = path.join(tauriRoot, 'target', 'release');
  const bundleDir = path.join(releaseDir, 'bundle');

  // ==================== 基础文件存在性测试 ====================
  describe('基础文件存在性', () => {
    test('项目配置文件存在', () => {
      const configFiles = [
        path.join(projectRoot, 'package.json'),
        path.join(projectRoot, 'vite.config.ts'),
        path.join(tauriRoot, 'tauri.conf.json'),
        path.join(tauriRoot, 'Cargo.toml'),
        path.join(tauriRoot, 'src', 'main.rs')
      ];

      configFiles.forEach(file => {
        expect(fs.existsSync(file)).toBe(true);
      });
    });

    test('前端构建产物存在', () => {
      const distDir = path.join(projectRoot, 'dist');
      const indexFile = path.join(distDir, 'index.html');

      expect(fs.existsSync(distDir)).toBe(true);
      expect(fs.existsSync(indexFile)).toBe(true);

      // 检查index.html内容
      const indexContent = fs.readFileSync(indexFile, 'utf8');
      expect(indexContent).toContain('<title>');
      expect(indexContent).toContain('</html>');
    });

    test('Tauri可执行文件存在', () => {
      const exePath = path.join(releaseDir, 'FocusFlow.exe');
      
      expect(fs.existsSync(exePath)).toBe(true);
      
      const stats = fs.statSync(exePath);
      expect(stats.size).toBeGreaterThan(1024 * 1024); // 大于1MB
    });

    test('安装包文件存在', () => {
      const msiDir = path.join(bundleDir, 'msi');
      const msiFile = path.join(msiDir, 'FocusFlow_1.0.0_x64_en-US.msi');

      expect(fs.existsSync(msiDir)).toBe(true);
      expect(fs.existsSync(msiFile)).toBe(true);

      const stats = fs.statSync(msiFile);
      expect(stats.size).toBeGreaterThan(1024 * 1024); // 大于1MB
    });
  });

  // ==================== 配置文件验证 ====================
  describe('配置文件验证', () => {
    test('Tauri配置正确', () => {
      const configPath = path.join(tauriRoot, 'tauri.conf.json');
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

      // 验证关键配置
      expect(config.build.beforeBuildCommand).toBe('npm run build');
      expect(config.build.distDir).toBe('../dist');
      expect(config.tauri.bundle.active).toBe(true);
      expect(config.tauri.bundle.identifier).toBe('com.focusflow.app');
      expect(config.package.productName).toBe('FocusFlow');
      expect(config.package.version).toBe('1.0.0');
    });

    test('Cargo配置正确', () => {
      const cargoPath = path.join(tauriRoot, 'Cargo.toml');
      const cargoContent = fs.readFileSync(cargoPath, 'utf8');

      expect(cargoContent).toContain('name = "focus-flow"');
      expect(cargoContent).toContain('version = "1.0.0"');
      expect(cargoContent).toContain('tauri = {');
      expect(cargoContent).toContain('[profile.release]');
    });

    test('package.json脚本配置正确', () => {
      const packagePath = path.join(projectRoot, 'package.json');
      const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

      expect(packageJson.scripts).toHaveProperty('tauri:dev');
      expect(packageJson.scripts).toHaveProperty('tauri:build');
      expect(packageJson.scripts['tauri:build']).toContain('tauri build');
    });
  });

  // ==================== 资源文件验证 ====================
  describe('资源文件验证', () => {
    test('应用图标存在', () => {
      const iconDir = path.join(tauriRoot, 'icons');
      const iconFiles = [
        path.join(iconDir, 'icon.png'),
        path.join(iconDir, 'icon.ico')
      ];

      expect(fs.existsSync(iconDir)).toBe(true);
      
      iconFiles.forEach(iconFile => {
        if (fs.existsSync(iconFile)) {
          const stats = fs.statSync(iconFile);
          expect(stats.size).toBeGreaterThan(1024); // 大于1KB
        }
      });
    });

    test('前端资源文件完整', () => {
      const distDir = path.join(projectRoot, 'dist');
      const assetsDir = path.join(distDir, 'assets');

      if (fs.existsSync(assetsDir)) {
        const assets = fs.readdirSync(assetsDir);
        expect(assets.length).toBeGreaterThan(0);

        // 检查是否有CSS和JS文件
        const hasCSS = assets.some(file => file.endsWith('.css'));
        const hasJS = assets.some(file => file.endsWith('.js'));
        
        expect(hasCSS || hasJS).toBe(true);
      }
    });
  });

  // ==================== 文件大小和性能验证 ====================
  describe('文件大小和性能', () => {
    test('可执行文件大小合理', () => {
      const exePath = path.join(releaseDir, 'FocusFlow.exe');
      
      if (fs.existsSync(exePath)) {
        const stats = fs.statSync(exePath);
        const sizeMB = stats.size / 1024 / 1024;

        expect(sizeMB).toBeLessThan(20); // 小于20MB
        expect(sizeMB).toBeGreaterThan(1); // 大于1MB
      }
    });

    test('安装包大小合理', () => {
      const msiFile = path.join(bundleDir, 'msi', 'FocusFlow_1.0.0_x64_en-US.msi');
      
      if (fs.existsSync(msiFile)) {
        const stats = fs.statSync(msiFile);
        const sizeMB = stats.size / 1024 / 1024;

        expect(sizeMB).toBeLessThan(10); // 小于10MB
        expect(sizeMB).toBeGreaterThan(0.5); // 大于0.5MB
      }
    });

    test('前端资源大小合理', () => {
      const distDir = path.join(projectRoot, 'dist');
      
      if (fs.existsSync(distDir)) {
        const calculateDirSize = (dirPath: string): number => {
          let totalSize = 0;
          const files = fs.readdirSync(dirPath);
          
          files.forEach(file => {
            const filePath = path.join(dirPath, file);
            const stats = fs.statSync(filePath);
            
            if (stats.isDirectory()) {
              totalSize += calculateDirSize(filePath);
            } else {
              totalSize += stats.size;
            }
          });
          
          return totalSize;
        };

        const totalSize = calculateDirSize(distDir);
        const sizeMB = totalSize / 1024 / 1024;

        expect(sizeMB).toBeLessThan(5); // 前端资源小于5MB
      }
    });
  });

  // ==================== 版本一致性验证 ====================
  describe('版本一致性', () => {
    test('所有配置文件版本一致', () => {
      const packageJson = JSON.parse(fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf8'));
      const tauriConfig = JSON.parse(fs.readFileSync(path.join(tauriRoot, 'tauri.conf.json'), 'utf8'));
      const cargoToml = fs.readFileSync(path.join(tauriRoot, 'Cargo.toml'), 'utf8');

      const packageVersion = packageJson.version;
      const tauriVersion = tauriConfig.package.version;
      
      // 从Cargo.toml中提取版本
      const cargoVersionMatch = cargoToml.match(/version = "([^"]+)"/);
      const cargoVersion = cargoVersionMatch ? cargoVersionMatch[1] : null;

      expect(tauriVersion).toBe(packageVersion);
      expect(cargoVersion).toBe(packageVersion);
    });

    test('应用标识符一致', () => {
      const tauriConfig = JSON.parse(fs.readFileSync(path.join(tauriRoot, 'tauri.conf.json'), 'utf8'));
      
      expect(tauriConfig.tauri.bundle.identifier).toBe('com.focusflow.app');
      expect(tauriConfig.package.productName).toBe('FocusFlow');
    });
  });

  // ==================== 安全配置验证 ====================
  describe('安全配置验证', () => {
    test('权限配置合理', () => {
      const tauriConfig = JSON.parse(fs.readFileSync(path.join(tauriRoot, 'tauri.conf.json'), 'utf8'));
      const allowlist = tauriConfig.tauri.allowlist;

      // 验证权限配置存在
      expect(allowlist).toBeDefined();
      expect(allowlist.all).toBe(false); // 不应该开启所有权限
      
      // 验证具体权限配置
      expect(allowlist.fs).toBeDefined();
      expect(allowlist.window).toBeDefined();
      expect(allowlist.notification).toBeDefined();
      expect(allowlist.globalShortcut).toBeDefined();
    });

    test('文件系统权限限制正确', () => {
      const tauriConfig = JSON.parse(fs.readFileSync(path.join(tauriRoot, 'tauri.conf.json'), 'utf8'));
      const fsConfig = tauriConfig.tauri.allowlist.fs;

      expect(fsConfig.all).toBe(false); // 不应该开启所有文件系统权限
      expect(fsConfig.scope).toContain('$APPDATA/*'); // 应该限制在应用数据目录
    });
  });
});
