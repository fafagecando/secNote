import { app } from 'electron'
import fs from 'fs-extra'
import path from 'path'
import type { AppSettings } from '../../shared/types'
import { getNotesDir } from '../utils/paths'

const DEFAULT_SETTINGS: AppSettings = {
  backupDir: null,
}

function getSettingsFilePath(): string {
  return path.join(app.getPath('userData'), 'settings.json')
}

export function getSettings(): AppSettings {
  const filePath = getSettingsFilePath()
  try {
    if (!fs.existsSync(filePath)) return { ...DEFAULT_SETTINGS }
    const raw = fs.readFileSync(filePath, 'utf-8')
    const parsed = JSON.parse(raw) as Partial<AppSettings>
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      backupDir: parsed.backupDir ?? null,
    }
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}

export function isBackupDirConfigured(): boolean {
  const { backupDir } = getSettings()
  return backupDir !== null && backupDir.trim() !== ''
}

function getDriveLetter(dirPath: string): string {
  const normalized = path.normalize(dirPath)
  const match = normalized.match(/^([a-zA-Z]:)/)
  return match ? match[1].toLowerCase() : ''
}

export function validateBackupDir(backupDir: string): { valid: boolean; error?: string } {
  const notesDir = getNotesDir()
  const backupDrive = getDriveLetter(backupDir)
  const notesDrive = getDriveLetter(notesDir)

  if (backupDrive && notesDrive && backupDrive === notesDrive) {
    return { valid: false, error: '备份路径不能与默认存储路径在同一盘符' }
  }

  return { valid: true }
}

function migrateBackupFiles(oldBackupDir: string, newBackupDir: string): void {
  const oldNotesBackup = path.join(oldBackupDir, 'notes')
  const newNotesBackup = path.join(newBackupDir, 'notes')

  if (!fs.existsSync(oldNotesBackup)) return

  try {
    fs.ensureDirSync(newNotesBackup)
    fs.copySync(oldNotesBackup, newNotesBackup, { overwrite: true })
    fs.removeSync(oldNotesBackup)

    const parentDir = path.dirname(oldNotesBackup)
    const entries = fs.readdirSync(parentDir)
    if (entries.length === 0) {
      fs.removeSync(parentDir)
    }
  } catch (err) {
    console.error('Failed to migrate backup files:', err)
    throw new Error('迁移备份文件失败')
  }
}

export function setBackupDir(backupDir: string | null): { settings: AppSettings; migrated?: boolean; error?: string } {
  const currentSettings = getSettings()
  const oldBackupDir = currentSettings.backupDir

  if (backupDir && backupDir.trim()) {
    const trimmed = backupDir.trim()
    const validation = validateBackupDir(trimmed)
    if (!validation.valid) {
      return { settings: currentSettings, error: validation.error }
    }

    let migrated = false
    if (oldBackupDir && oldBackupDir !== trimmed) {
      migrateBackupFiles(oldBackupDir, trimmed)
      migrated = true
    }

    const settings: AppSettings = {
      ...currentSettings,
      backupDir: trimmed,
    }
    const filePath = getSettingsFilePath()
    fs.ensureDirSync(path.dirname(filePath))
    fs.writeFileSync(filePath, JSON.stringify(settings, null, 2), 'utf-8')
    return { settings, migrated }
  }

  const settings: AppSettings = {
    ...currentSettings,
    backupDir: null,
  }
  const filePath = getSettingsFilePath()
  fs.ensureDirSync(path.dirname(filePath))
  fs.writeFileSync(filePath, JSON.stringify(settings, null, 2), 'utf-8')
  return { settings }
}

export function getBackupNotesDir(): string | null {
  const { backupDir } = getSettings()
  if (!backupDir) return null
  const dir = path.join(backupDir, 'notes')
  try {
    fs.ensureDirSync(dir)
    return dir
  } catch {
    return null
  }
}

