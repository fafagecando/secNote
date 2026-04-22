import { contextBridge, ipcRenderer } from 'electron'
import type { Note, NoteMetadata, Folder, CreateNoteInput, UpdateNoteInput, AppSettings } from '../shared/types'

const api = {
  notes: {
    list: (folder?: string): Promise<NoteMetadata[]> =>
      ipcRenderer.invoke('notes:list', folder),
    get: (id: string): Promise<Note | null> =>
      ipcRenderer.invoke('notes:get', id),
    create: (data: CreateNoteInput): Promise<Note> =>
      ipcRenderer.invoke('notes:create', data),
    update: (id: string, data: UpdateNoteInput): Promise<Note> =>
      ipcRenderer.invoke('notes:update', id, data),
    delete: (id: string): Promise<void> =>
      ipcRenderer.invoke('notes:delete', id),
    search: (query: string): Promise<NoteMetadata[]> =>
      ipcRenderer.invoke('notes:search', query),
    toggleStar: (id: string): Promise<Note> =>
      ipcRenderer.invoke('notes:toggleStar', id),
  },
  folders: {
    list: (): Promise<Folder[]> =>
      ipcRenderer.invoke('folders:list'),
  },
  settings: {
    get: (): Promise<AppSettings> =>
      ipcRenderer.invoke('settings:get'),
    setBackupDir: (backupDir: string | null): Promise<{ settings: AppSettings; migrated?: boolean; error?: string }> =>
      ipcRenderer.invoke('settings:setBackupDir', backupDir),
    isBackupConfigured: (): Promise<boolean> =>
      ipcRenderer.invoke('settings:isBackupConfigured'),
    validateBackupDir: (backupDir: string): Promise<{ valid: boolean; error?: string }> =>
      ipcRenderer.invoke('settings:validateBackupDir', backupDir),
  },
  dialog: {
    selectDirectory: (options?: { title?: string }): Promise<string | null> =>
      ipcRenderer.invoke('dialog:selectDirectory', options),
  },
  window: {
    toggleFullscreen: (): Promise<void> =>
      ipcRenderer.invoke('window:toggleFullscreen'),
  },
  paths: {
    getNotesDir: (): Promise<string> =>
      ipcRenderer.invoke('paths:getNotesDir'),
  },
  onMenuAction: (callback: (action: string) => void) => {
    ipcRenderer.on('menu:new-note', () => callback('new-note'))
    ipcRenderer.on('menu:about', () => callback('menu:about'))
  },
  onLanguageChange: (callback: (lang: string) => void) => {
    ipcRenderer.on('menu:languageChanged', (_event, lang: string) => callback(lang))
  },
}

contextBridge.exposeInMainWorld('secNoteApi', api)
export type SecNoteApi = typeof api
