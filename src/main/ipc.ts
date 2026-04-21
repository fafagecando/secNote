import { BrowserWindow, IpcMain, dialog } from 'electron'
import { getNoteService } from './services/noteService'
import { getSettings, setBackupDir, isBackupDirConfigured, validateBackupDir } from './services/settingsService'
import type { CreateNoteInput, UpdateNoteInput } from '../shared/types'

export function registerIpcHandlers(ipc: IpcMain) {
  const service = getNoteService()

  ipc.handle('notes:list', async (_event, folder?: string) => {
    return service.listNotes(folder)
  })

  ipc.handle('notes:get', async (_event, id: string) => {
    return service.getNote(id)
  })

  ipc.handle('notes:create', async (_event, data: CreateNoteInput) => {
    console.log('[IPC] notes:create called with data:', data)
    try {
      const result = await service.createNote(data)
      console.log('[IPC] notes:create result:', result)
      return result
    } catch (error) {
      console.error('[IPC] notes:create error:', error)
      throw error
    }
  })

  ipc.handle('notes:update', async (_event, id: string, data: UpdateNoteInput) => {
    return service.updateNote(id, data)
  })

  ipc.handle('notes:delete', async (_event, id: string) => {
    return service.deleteNote(id)
  })

  ipc.handle('notes:toggleStar', async (_event, id: string) => {
    const note = await service.getNote(id)
    if (!note) throw new Error('笔记不存在')
    return service.updateNote(id, { starred: !note.starred } as any)
  })

  ipc.handle('notes:search', async (_event, query: string) => {
    return service.searchNotes(query)
  })

  ipc.handle('folders:list', async () => {
    return service.listFolders()
  })

  ipc.handle('settings:get', async () => {
    return getSettings()
  })

  ipc.handle('settings:setBackupDir', async (_event, backupDir: string | null) => {
    const result = setBackupDir(backupDir)
    return result
  })

  ipc.handle('settings:isBackupConfigured', async () => {
    return isBackupDirConfigured()
  })

  ipc.handle('settings:validateBackupDir', async (_event, backupDir: string) => {
    return validateBackupDir(backupDir)
  })

  ipc.handle('dialog:selectDirectory', async (event, options?: { title?: string }) => {
    const win = BrowserWindow.fromWebContents(event.sender) ?? undefined
    const dialogOptions = {
      title: options?.title ?? '选择文件夹',
      properties: ['openDirectory', 'createDirectory'] as ('openDirectory' | 'createDirectory')[],
    }
    const result = win
      ? await dialog.showOpenDialog(win, dialogOptions)
      : await dialog.showOpenDialog(dialogOptions)
    if (result.canceled) return null
    return result.filePaths[0] ?? null
  })

  ipc.handle('window:toggleFullscreen', async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (win) {
      win.setFullScreen(!win.isFullScreen())
    }
  })

  ipc.handle('paths:getNotesDir', async () => {
    const { getNotesDir } = await import('./utils/paths')
    return getNotesDir()
  })
}
