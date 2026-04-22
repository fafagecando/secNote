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

import type { Language } from '../shared/i18n'
import { translations, languageNames } from '../shared/i18n'

let currentLang: Language = 'zh-CN'

function createMenu() {
  const t = translations[currentLang].menu
  const langItems: Electron.MenuItemConstructorOptions[] = (Object.keys(languageNames) as Language[]).map((lang) => ({
    label: languageNames[lang],
    type: 'radio' as const,
    checked: lang === currentLang,
    click: () => {
      currentLang = lang
      createMenu()
      if (mainWindow) {
        mainWindow.webContents.send('menu:languageChanged', lang)
      }
    },
  }))

  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: t.file,
      submenu: [
        {
          label: t.newNote,
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            mainWindow?.webContents.send('menu:new-note')
          }
        },
        { type: 'separator' },
        {
          label: t.exit,
          accelerator: 'CmdOrCtrl+Q',
          role: 'quit'
        }
      ]
    },
    {
      label: t.edit,
      submenu: [
        { label: t.undo, role: 'undo' },
        { label: t.redo, role: 'redo' },
        { type: 'separator' },
        { label: t.cut, role: 'cut' },
        { label: t.copy, role: 'copy' },
        { label: t.paste, role: 'paste' },
        { label: t.selectAll, role: 'selectAll' }
      ]
    },
    {
      label: t.view,
      submenu: [
        { label: t.reload, role: 'reload' },
        { label: t.forceReload, role: 'forceReload' },
        { label: t.devTools, role: 'toggleDevTools' },
        { type: 'separator' },
        { label: t.actualSize, role: 'resetZoom' },
        { label: t.zoomIn, role: 'zoomIn' },
        { label: t.zoomOut, role: 'zoomOut' },
        { type: 'separator' },
        { 
          label: t.fullscreen, 
          role: 'togglefullscreen',
          accelerator: 'F11'
        }
      ]
    },
    {
      label: t.language,
      submenu: langItems
    },
    {
      label: t.help,
      submenu: [
        {
          label: t.about,
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send('menu:about')
            }
          }
        },
        { type: 'separator' },
        {
          label: t.visitGitHub,
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
