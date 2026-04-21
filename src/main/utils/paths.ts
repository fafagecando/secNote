import { app } from 'electron'
import path from 'path'
import fs from 'fs-extra'

export function getNotesDir(): string {
  const userData = app.getPath('userData')
  const dir = path.join(userData, 'notes')
  try {
    fs.ensureDirSync(dir)
  } catch (err) {
    const fallbackDir = path.join(app.getPath('documents'), 'secNote-data', 'notes')
    fs.ensureDirSync(fallbackDir)
    return fallbackDir
  }
  return dir
}

export function getNoteFilePath(id: string, folder?: string): string {
  const notesDir = getNotesDir()
  const dir = folder ? path.join(notesDir, folder) : notesDir
  fs.ensureDirSync(dir)
  return path.join(dir, `${id}.md`)
}

export function getFolderDir(folder: string): string {
  const notesDir = getNotesDir()
  const dir = path.join(notesDir, folder)
  fs.ensureDirSync(dir)
  return dir
}

export function getTrashDir(): string {
  const notesDir = getNotesDir()
  const dir = path.join(notesDir, '.trash')
  fs.ensureDirSync(dir)
  return dir
}

export function ensureNotesDir(): void {
  getNotesDir()
}
