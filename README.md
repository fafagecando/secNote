# secNote

一款安全、简洁的本地 Markdown 笔记桌面应用，完全离线运行，保护您的隐私。

A secure, clean local Markdown note desktop application that runs completely offline to protect your privacy.

[English](#english) | [中文](#中文说明)

---

## 中文说明

### 功能特性

- **完全离线**：所有数据存储在本地，无需联网即可使用
- **Markdown 编辑**：支持 Markdown 语法编写笔记
- **文件夹管理**：通过文件夹分类管理笔记
- **星标笔记**：为重要笔记添加星标，星标笔记优先展示
- **自动保存**：编辑内容自动保存，无需手动操作
- **备份迁移**：支持设置备份路径，可跨盘符迁移备份文件
- **回收站机制**：删除的笔记移至 `.trash` 文件夹，可手动恢复
- **笔记搜索**：支持按标题、内容、标签搜索笔记
- **自定义侧边栏**：可拖动调整侧边栏宽度

### 技术栈

- **Electron**：跨平台桌面应用框架
- **React 18**：前端 UI 框架
- **TypeScript**：类型安全的开发语言
- **Vite**：前端构建工具
- **Zustand**：轻量级状态管理
- **fs-extra**：文件系统操作

### 快速开始

#### 环境要求

- Node.js >= 18
- npm >= 9

#### 安装依赖

```bash
npm install
```

#### 开发模式

```bash
npm run dev
```

#### 构建应用

```bash
npm run build
```

### 数据存储

- **默认存储路径**：`%APPDATA%/secNote/notes/`
- **备份路径**：用户自定义（需与默认路径不同盘符）
- **回收站**：`%APPDATA%/secNote/notes/.trash/`
- **设置文件**：`%APPDATA%/secNote/settings.json`

### 快捷键

| 快捷键 | 功能 |
|--------|------|
| `Ctrl + N` | 新建笔记 |
| `F11` | 切换全屏 |
| `ESC` | 退出全屏 |

### 项目结构

```
secNote/
├── src/
│   ├── main/              # Electron 主进程
│   │   ├── index.ts       # 主进程入口
│   │   ├── ipc.ts         # IPC 通信处理
│   │   ├── services/      # 业务服务层
│   │   └── utils/         # 工具函数
│   ├── preload/           # 预加载脚本
│   ├── renderer/          # React 渲染进程
│   │   ├── src/
│   │   │   ├── components/  # UI 组件
│   │   │   ├── store/       # 状态管理
│   │   │   ├── context/     # React Context
│   │   │   └── styles/      # 样式文件
│   │   └── index.html
│   └── shared/            # 共享类型定义
├── package.json
└── tsconfig.json
```

### 许可证

MIT License

---

## English

### Features

- **Fully Offline**: All data stored locally, no internet required
- **Markdown Editing**: Write notes with Markdown syntax support
- **Folder Management**: Organize notes with folders
- **Starred Notes**: Star important notes for priority display
- **Auto Save**: Content automatically saved while editing
- **Backup & Migration**: Set custom backup path with cross-drive migration support
- **Trash Mechanism**: Deleted notes moved to `.trash` folder, manually recoverable
- **Note Search**: Search by title, content, or tags
- **Resizable Sidebar**: Drag to adjust sidebar width

### Tech Stack

- **Electron**: Cross-platform desktop application framework
- **React 18**: Frontend UI framework
- **TypeScript**: Type-safe development language
- **Vite**: Frontend build tool
- **Zustand**: Lightweight state management
- **fs-extra**: File system operations

### Quick Start

#### Requirements

- Node.js >= 18
- npm >= 9

#### Install Dependencies

```bash
npm install
```

#### Development Mode

```bash
npm run dev
```

#### Build Application

```bash
npm run build
```

### Data Storage

- **Default Storage Path**: `%APPDATA%/secNote/notes/`
- **Backup Path**: User-defined (must be on a different drive)
- **Trash**: `%APPDATA%/secNote/notes/.trash/`
- **Settings File**: `%APPDATA%/secNote/settings.json`

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl + N` | New Note |
| `F11` | Toggle Fullscreen |
| `ESC` | Exit Fullscreen |

### Project Structure

```
secNote/
├── src/
│   ├── main/              # Electron main process
│   │   ├── index.ts       # Main process entry
│   │   ├── ipc.ts         # IPC communication handlers
│   │   ├── services/      # Business service layer
│   │   └── utils/         # Utility functions
│   ├── preload/           # Preload scripts
│   ├── renderer/          # React renderer process
│   │   ├── src/
│   │   │   ├── components/  # UI components
│   │   │   ├── store/       # State management
│   │   │   ├── context/     # React Context
│   │   │   └── styles/      # Style files
│   │   └── index.html
│   └── shared/            # Shared type definitions
├── package.json
└── tsconfig.json
```

### License

MIT License
