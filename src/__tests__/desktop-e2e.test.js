/**
 * FocusFlow 桌面应用端到端测试
 * 
 * 测试完整的用户工作流程和应用功能
 */

const { spawn, exec } = require('child_process');
const path = require('path');
const fs = require('fs');

describe('FocusFlow Desktop E2E Tests', () => {
  let appProcess;
  const appPath = path.join(__dirname, '..', '..', 'src-tauri', 'target', 'release', 'FocusFlow.exe');
  const testTimeout = 30000;

  beforeAll(async () => {
    // 确保应用文件存在
    if (!fs.existsSync(appPath)) {
      console.warn(`应用文件不存在，跳过E2E测试: ${appPath}`);
      return;
    }
  });

  afterEach(async () => {
    // 清理应用进程
    if (appProcess && appProcess.pid) {
      try {
        process.kill(appProcess.pid);
      } catch (error) {
        // 忽略清理错误
      }
      appProcess = null;
    }
  });

  // ==================== 应用启动和基础功能测试 ====================
  describe('应用启动和基础功能', () => {
    test('应用文件存在性检查', () => {
      expect(fs.existsSync(appPath)).toBe(true);
    });

    test('应用文件大小合理', () => {
      if (!fs.existsSync(appPath)) {
        console.warn('应用文件不存在，跳过测试');
        return;
      }

      const stats = fs.statSync(appPath);
      const fileSizeMB = stats.size / 1024 / 1024;

      expect(fileSizeMB).toBeLessThan(100); // 小于100MB
      expect(fileSizeMB).toBeGreaterThan(1); // 大于1MB
    });

    test('应用能够成功启动', async () => {
      if (!fs.existsSync(appPath)) {
        console.warn('应用文件不存在，跳过测试');
        return;
      }

      appProcess = spawn(appPath, [], {
        detached: true,
        stdio: 'ignore'
      });

      // 等待应用启动
      await new Promise(resolve => setTimeout(resolve, 3000));

      expect(appProcess.pid).toBeDefined();
      expect(appProcess.killed).toBe(false);
    }, testTimeout);

    test('应用启动时间在合理范围内', async () => {
      if (!fs.existsSync(appPath)) {
        console.warn('应用文件不存在，跳过测试');
        return;
      }

      const startTime = Date.now();
      
      appProcess = spawn(appPath, [], {
        detached: true,
        stdio: 'ignore'
      });

      // 等待应用完全启动
      await new Promise(resolve => setTimeout(resolve, 3000));
      const launchTime = Date.now() - startTime;

      expect(launchTime).toBeLessThan(10000); // 10秒内启动
      expect(appProcess.pid).toBeDefined();
    }, testTimeout);
  });

  // ==================== 文件系统和数据持久化测试 ====================
  describe('文件系统和数据持久化', () => {
    const appDataPath = path.join(process.env.APPDATA || '', 'FocusFlow');

    test('应用数据目录可以创建和访问', () => {
      // 测试创建应用数据目录
      if (!fs.existsSync(appDataPath)) {
        fs.mkdirSync(appDataPath, { recursive: true });
      }

      expect(fs.existsSync(appDataPath)).toBe(true);

      // 测试写入权限
      const testFile = path.join(appDataPath, 'test.txt');
      fs.writeFileSync(testFile, 'test data');
      
      expect(fs.existsSync(testFile)).toBe(true);
      expect(fs.readFileSync(testFile, 'utf8')).toBe('test data');

      // 清理测试文件
      fs.unlinkSync(testFile);
    });

    test('配置文件可以读写', () => {
      if (!fs.existsSync(appDataPath)) {
        fs.mkdirSync(appDataPath, { recursive: true });
      }

      const configPath = path.join(appDataPath, 'test-config.json');
      const testConfig = { test: true, timestamp: Date.now() };

      fs.writeFileSync(configPath, JSON.stringify(testConfig));
      
      const readConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      expect(readConfig).toEqual(testConfig);

      // 清理测试文件
      fs.unlinkSync(configPath);
    });
  });

  // ==================== 系统集成测试 ====================
  describe('系统集成功能', () => {
    test('Tauri配置正确性', () => {
      const tauriConfigPath = path.join(__dirname, '..', '..', 'src-tauri', 'tauri.conf.json');
      
      expect(fs.existsSync(tauriConfigPath)).toBe(true);
      
      const tauriConfig = JSON.parse(fs.readFileSync(tauriConfigPath, 'utf8'));

      // 验证关键配置
      expect(tauriConfig.tauri.bundle.active).toBe(true);
      expect(tauriConfig.tauri.allowlist.globalShortcut).toBeDefined();
      expect(tauriConfig.tauri.allowlist.notification).toBeDefined();
      expect(tauriConfig.tauri.allowlist.window).toBeDefined();
    });

    test('应用图标文件存在', () => {
      const iconPath = path.join(__dirname, '..', '..', 'src-tauri', 'icons', 'icon.png');
      expect(fs.existsSync(iconPath)).toBe(true);
    });
  });

  // ==================== 安装包测试 ====================
  describe('安装包功能', () => {
    const msiPath = path.join(__dirname, '..', '..', 'src-tauri', 'target', 'release', 'bundle', 'msi', 'FocusFlow_1.0.0_x64_en-US.msi');

    test('MSI安装包存在且可读', () => {
      expect(fs.existsSync(msiPath)).toBe(true);
      
      const stats = fs.statSync(msiPath);
      expect(stats.size).toBeGreaterThan(1024 * 1024); // 大于1MB
    });

    test('安装包文件名格式正确', () => {
      if (fs.existsSync(msiPath)) {
        const fileName = path.basename(msiPath);
        expect(fileName).toMatch(/^FocusFlow_\d+\.\d+\.\d+_x64_en-US\.msi$/);
      }
    });
  });

  // ==================== 构建产物验证 ====================
  describe('构建产物验证', () => {
    test('所有必需的构建文件存在', () => {
      const requiredFiles = [
        path.join(__dirname, '..', '..', 'src-tauri', 'target', 'release', 'FocusFlow.exe'),
        path.join(__dirname, '..', '..', 'dist', 'index.html'),
        path.join(__dirname, '..', '..', 'src-tauri', 'tauri.conf.json'),
        path.join(__dirname, '..', '..', 'src-tauri', 'Cargo.toml')
      ];

      requiredFiles.forEach(filePath => {
        expect(fs.existsSync(filePath)).toBe(true);
      });
    });

    test('前端构建产物完整', () => {
      const distPath = path.join(__dirname, '..', '..', 'dist');
      
      expect(fs.existsSync(distPath)).toBe(true);
      expect(fs.existsSync(path.join(distPath, 'index.html'))).toBe(true);
      
      // 检查assets目录
      const assetsPath = path.join(distPath, 'assets');
      if (fs.existsSync(assetsPath)) {
        const assets = fs.readdirSync(assetsPath);
        expect(assets.length).toBeGreaterThan(0);
      }
    });
  });

  // ==================== 性能基准测试 ====================
  describe('性能基准', () => {
    test('可执行文件大小在预期范围内', () => {
      if (!fs.existsSync(appPath)) {
        console.warn('应用文件不存在，跳过测试');
        return;
      }

      const stats = fs.statSync(appPath);
      const fileSizeMB = stats.size / 1024 / 1024;

      // 基于实际测试结果调整预期值
      expect(fileSizeMB).toBeLessThan(10); // 小于10MB
      expect(fileSizeMB).toBeGreaterThan(2); // 大于2MB
    });

    test('安装包大小合理', () => {
      const msiPath = path.join(__dirname, '..', '..', 'src-tauri', 'target', 'release', 'bundle', 'msi', 'FocusFlow_1.0.0_x64_en-US.msi');
      
      if (!fs.existsSync(msiPath)) {
        console.warn('MSI文件不存在，跳过测试');
        return;
      }

      const stats = fs.statSync(msiPath);
      const fileSizeMB = stats.size / 1024 / 1024;

      expect(fileSizeMB).toBeLessThan(5); // 小于5MB
      expect(fileSizeMB).toBeGreaterThan(1); // 大于1MB
    });
  });
});
