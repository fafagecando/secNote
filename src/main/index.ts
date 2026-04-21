import { app, BrowserWindow, ipcMain, Menu, shell } from 'electron'
import path from 'path'
import fs from 'fs-extra'
import { registerIpcHandlers } from './ipc'

let mainWindow: BrowserWindow | null = null

// Keep Chromium disk caches in a writable per-user location to avoid
// intermittent "Unable to move/create cache: Access denied (0x5)" on Windows.
try {
  const chromiumCacheDir = path.join(app.getPath('userData'), 'chromium-cache')
  fs.ensureDirSync(chromiumCacheDir)
  app.commandLine.appendSwitch('disk-cache-dir', chromiumCacheDir)
  app.commandLine.appendSwitch('disable-gpu-shader-disk-cache')
} catch {
  // If this fails, Electron will fall back to defaults.
}

function createMenu() {
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: '文件',
      submenu: [
        {
          label: '新建笔记',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            mainWindow?.webContents.send('menu:new-note')
          }
        },
        { type: 'separator' },
        {
          label: '退出',
          accelerator: 'CmdOrCtrl+Q',
          role: 'quit'
        }
      ]
    },
    {
      label: '编辑',
      submenu: [
        { label: '撤销', role: 'undo' },
        { label: '重做', role: 'redo' },
        { type: 'separator' },
        { label: '剪切', role: 'cut' },
        { label: '复制', role: 'copy' },
        { label: '粘贴', role: 'paste' },
        { label: '全选', role: 'selectAll' }
      ]
    },
    {
      label: '视图',
      submenu: [
        { label: '重新加载', role: 'reload' },
        { label: '强制重载', role: 'forceReload' },
        { label: '开发者工具', role: 'toggleDevTools' },
        { type: 'separator' },
        { label: '实际大小', role: 'resetZoom' },
        { label: '放大', role: 'zoomIn' },
        { label: '缩小', role: 'zoomOut' },
        { type: 'separator' },
        { 
          label: '全屏', 
          role: 'togglefullscreen',
          accelerator: 'F11'
        }
      ]
    },
    {
      label: '帮助',
      submenu: [
        {
          label: '关于 secNote',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send('menu:about')
            }
          }
        },
        { type: 'separator' },
        {
          label: '访问 GitHub 仓库',
          click: () => {
            shell.openExternal('https://github.com/fafagecando/secNote')
          }
        }
      ]
    }
  ]

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173')
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.whenReady().then(() => {
  registerIpcHandlers(ipcMain)
  createWindow()
  createMenu()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
