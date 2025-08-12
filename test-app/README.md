# TimerStyleManager 测试应用

这是一个用于测试TimerStyleManager组件的Web应用程序。

## 功能

- 展示TimerStyleManager组件的所有功能
- 提供一个简单的界面来测试样式管理
- 包含必要的样式和依赖项

## 安装和运行

1. 安装依赖项：
   ```bash
   npm install
   ```

2. 启动开发服务器：
   ```bash
   npm run dev
   ```

3. 在浏览器中打开 http://localhost:3000 查看应用

## 使用方法

1. 使用界面上的按钮来显示/隐藏样式管理器
2. 点击"应用"按钮来应用不同的样式
3. 在预览区域查看当前选中的样式信息
4. 查看颜色预览网格，展示样式的颜色配置

## 测试功能

- 样式预览和应用
- 样式编辑
- 样式复制
- 样式导入/导出
- 样式删除
- 通知系统
- 确认对话框

## 项目结构

```
test-app/
├── index.html          # 入口HTML文件
├── App.tsx             # 主应用组件
├── TimerStyleTestApp.tsx # 测试TimerStyleManager的组件
├── main.tsx            # React应用入口点
├── styles.css          # 包含必要的Mac风格样式
├── package.json        # 项目依赖和脚本
├── vite.config.ts      # Vite配置
├── tsconfig.json       # TypeScript配置
└── tsconfig.node.json  # Node.js TypeScript配置
```

## 注意事项

这是一个测试应用，使用模拟数据来展示TimerStyleManager组件的功能。在实际项目中，您需要连接到真实的数据源和TimerStyleService。
