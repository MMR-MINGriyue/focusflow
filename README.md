# 🎯 FocusFlow

一个现代化的专注时间管理桌面应用，基于番茄工作法，帮助您提高工作效率和专注力。

![FocusFlow](https://img.shields.io/badge/FocusFlow-v1.0.0-blue.svg)
![Tauri](https://img.shields.io/badge/Tauri-1.5-orange.svg)
![React](https://img.shields.io/badge/React-18-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)

## ✨ 特性

### 🎯 核心功能
- **智能计时器**: 支持专注时间、休息时间和微休息
- **数据统计**: 详细的专注数据分析和可视化
- **设置定制**: 灵活的时间配置和个性化设置
- **音效提醒**: 可配置的音效和桌面通知

### 🎨 用户界面
- **现代化设计**: 基于 Radix UI 的专业界面
- **无障碍访问**: 完整的键盘导航和屏幕阅读器支持
- **响应式布局**: 适配不同屏幕尺寸
- **流畅动画**: 优雅的过渡效果和交互反馈

### 📊 数据管理
- **SQLite 数据库**: 本地数据存储，保护隐私
- **实时统计**: 专注时间、效率评分、趋势分析
- **数据导出**: 支持数据查询和分析
- **自动备份**: 数据安全保障

## 🛠️ 技术栈

### 前端技术
- **React 18** - 现代前端框架
- **TypeScript** - 类型安全的 JavaScript
- **Zustand** - 轻量级状态管理
- **Radix UI** - 无障碍组件库
- **Tailwind CSS** - 实用优先的样式框架
- **Lucide React** - 现代图标库

### 后端技术
- **Tauri** - 跨平台桌面应用框架
- **Rust** - 高性能系统编程语言
- **SQLite** - 轻量级数据库

### 开发工具
- **Vite** - 快速构建工具
- **ESLint** - 代码质量检查

## 🚀 快速开始

### 环境要求
- Node.js 18+
- Rust 1.70+
- Git

### 安装步骤

1. **克隆仓库**
```bash
git clone https://github.com/MMR-MINGriyue/focusflow.git
cd focusflow
```

2. **安装依赖**
```bash
npm install
```

3. **启动开发服务器**
```bash
npm run dev
```

4. **构建应用**
```bash
npm run build
```

## 📱 功能展示

### 主要界面
- **计时器**: 清晰的时间显示和进度条
- **统计**: 详细的数据分析图表
- **数据库**: 完整的历史记录管理

### 设置功能
- **时间配置**: 灵活的专注和休息时间设置
- **音效设置**: 可配置的提醒音效和音量
- **快速配置**: 预设的工作模式选择

## 🎯 使用指南

### 基本使用
1. **开始专注**: 点击开始按钮启动专注计时器
2. **休息提醒**: 专注时间结束后自动进入休息模式
3. **微休息**: 在长时间专注中自动提醒短暂休息
4. **数据查看**: 在统计页面查看专注数据和趋势

### 高级功能
- **自定义时间**: 根据个人习惯调整专注和休息时间
- **效率评分**: 基于专注质量的智能评分系统
- **数据分析**: 详细的统计图表和趋势分析
- **数据管理**: 数据库管理和测试功能

## 🔧 开发

### 项目结构
```
src/
├── components/          # React 组件
│   ├── Timer/          # 计时器组件
│   ├── Stats/          # 统计组件
│   ├── Settings/       # 设置组件
│   └── ui/             # UI 组件库
├── hooks/              # 自定义 Hooks
├── stores/             # Zustand 状态管理
├── services/           # 服务层
├── utils/              # 工具函数
└── pages/              # 页面组件
```

### 开发命令
```bash
npm run dev          # 启动开发服务器
npm run build        # 构建生产版本
npm run preview      # 预览构建结果
npm run lint         # 代码检查
```

## 🤝 贡献

欢迎贡献代码！请遵循以下步骤：

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📄 许可证

本项目采用 MIT 许可证。

## 🙏 致谢

- [Tauri](https://tauri.app/) - 跨平台桌面应用框架
- [Radix UI](https://www.radix-ui.com/) - 无障碍组件库
- [Lucide](https://lucide.dev/) - 美观的图标库
- [Tailwind CSS](https://tailwindcss.com/) - 实用优先的 CSS 框架

---

⭐ 如果这个项目对您有帮助，请给它一个星标！ - 专注与休息循环管理应用

FocusFlow是一个基于Tauri + React开发的跨平台专注管理应用，帮助用户建立健康的工作节奏。

## 核心功能

### 1. 智能计时系统
- 基础循环：90分钟专注 + 20分钟休息
- 随机微休息：每10-30分钟随机触发3-5分钟微休息
- 使用Web Crypto API生成真随机数

### 2. 智能提醒
- 多通道提示：音频（Howler.js）+ 视觉（桌面通知）
- 任务栏状态显示

### 3. 数据统计
- 每日专注时长统计
- 效率评分趋势
- 本地数据持久化

## 技术栈

- 前端：React + TypeScript + TailwindCSS
- 桌面端：Tauri (Rust)
- 数据可视化：Recharts
- 状态管理：React Hooks
- 数据存储：Tauri Store

## 开发指南

### 环境要求
- Node.js >= 16
- Rust >= 1.69
- 系统要求参考 [Tauri 预备条件](https://tauri.app/v1/guides/getting-started/prerequisites)

### 安装依赖
```bash
# 安装 Node.js 依赖
npm install

# 安装 Rust 依赖
cd src-tauri
cargo install
```

### 开发命令
```bash
# 开发模式
npm run tauri dev

# 构建应用
npm run tauri build
```

### 项目结构
```
src/
  ├── components/        # React组件
  │   ├── Timer/        # 计时器组件
  │   └── Stats/        # 数据统计组件
  ├── services/         # 服务层
  │   └── storage.ts    # 数据存储服务
  └── pages/            # 页面组件
      └── index.tsx     # 主页面

src-tauri/             # Tauri/Rust代码
  └── src/
      └── main.rs      # 主程序入口
```

## 贡献指南

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 开源协议

本项目采用 MIT 协议 - 详见 [LICENSE](LICENSE) 文件

一、核心功能：专注与休息循环管理
1. 智能计时系统
基础循环设置
固定每 90 分钟专注 + 20 分钟休息（符合生理节律），支持自定义调整（如 60 分钟专注 + 15 分钟休息）。
新增随机休息插入：在专注时段内，每 10-30 分钟随机触发 3-5 分钟 “微休息”（可配置时间区间），匹配视频中 “随机提示音 + 10 秒闭眼” 逻辑，通过算法避免规律化（如变比率强化机制）。
<<< 技术实现：使用 Web Crypto API 生成真随机数，防止伪随机导致规律可预测 >>>

2. 智能提醒与反馈
多通道提示
音频提醒：支持自定义提示音（如清脆铃声、自然音效），苹果用户适配系统通知权限，默认采用 0.5 秒白噪音淡入（Howler.js 实现）。
视觉提醒：桌面弹窗、任务栏图标变色（专注时绿色，休息时红色）、<<< 屏幕边缘色带渐变替代屏幕闪烁（CSS 实现）>>>。

二、辅助功能：效率与健康优化
1. 数据统计与分析
可视化报表
每日 / 每周专注时长（<<< 异常检测：连续>120分钟时要求用户确认 >>>）、微休息次数、效率评分（基于反馈问卷）趋势图，标注高效时段（如上午 9-11 点专注度峰值）。
对比功能：查看采用该方法后，记忆力提升数据（如通过内置单词速记测试模块 <<< 增加干扰项提升测试有效性 >>>，前后成绩对比）。
<<< 数据可信保障：关联微休息次数与效率评分相关性分析 >>>

目标管理
设置每日专注时长目标（<<< 动态调整算法：基于上周表现自动优化目标值 >>>），完成后解锁 “成就勋章”（如 “新芽勋章” “心流入门” “深度专注者”），激励持续使用。

三、拓展功能：跨设备协同与生态整合
1. 跨平台同步
多端适配
Windows/macOS/Linux 桌面端 + 手机 APP（Android/iOS），通过账号同步设置、统计数据和进度（<<< 采用 CRDT 无冲突数据结构解决同步冲突 >>>）。
手机 APP 支持后台运行，<<< Android 使用 React Native Background Timer，iOS 采用地理围栏触发 >>>，微休息时触发锁屏壁纸（如护眼纯色图）+ 深呼吸引导音频。

2. 第三方工具集成
笔记软件对接：专注期结束后，<<< 休息开始10秒后延迟弹出 >>> “是否记录本次学习要点？” 提示，一键同步至 Notion、印象笔记等。
<<< 可选集成：Anki API 获取真实记忆曲线数据 >>>

四、高级功能：个性化与自动化
1. AI 智能适配
机器学习优化
通过用户的专注时长、效率评分、休息反馈等数据，训练模型自动调整：
微休息间隔（如高频低效用户增加休息次数）；
白噪音类型（如检测到分心时切换为高强度专注音效）。

五、界面与交互设计原则
极简主界面
核心显示区：大字体倒计时、当前模式（专注 / 休息）、效率评分星级。
隐藏式功能栏：右键托盘图标或滑动呼出设置、统计、工具等模块，避免干扰专注。
<<< 防干扰模式：支持开启全局勿扰屏蔽非紧急通知 >>>

游戏化元素
勋章系统：<<< 分层成就设计（新芽勋章/心流入门/深度专注者）>>>，连续 7 天完成目标解锁 “自律之星”，累计专注 100 小时解锁 “神经重放研究员”。
社交分享：可匿名分享每日专注数据至软件内社区，参与 “专注挑战” 活动（如与全球用户比拼效率）。

六、开发与运营建议
技术栈选择
<<< 跨平台框架：Tauri（桌面端，Rust底层内存<50MB） + React Native（手机端） >>>
<<< 替代方案：原Electron方案内存>200MB >>>
数据存储：本地 SQLite + 云端 Redis（用户偏好、统计数据），保障隐私安全。