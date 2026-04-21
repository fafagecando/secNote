import fs from 'fs-extra'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import type {
  Note,
  NoteMetadata,
  Folder,
  NoteServiceInterface,
  CreateNoteInput,
  UpdateNoteInput,
} from '../../shared/types'
import { getNotesDir, getFolderDir, getTrashDir } from '../utils/paths'
import { getBackupNotesDir, isBackupDirConfigured } from './settingsService'

const FRONT_MATTER_REGEX = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/
const MAX_TITLE_LENGTH = 64

function sanitizeFileName(name: string): string {
  return name
    .replace(/[\\/:*?"<>|]/g, '_')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .substring(0, MAX_TITLE_LENGTH)
}

function parseFrontMatter(content: string): { metadata: Record<string, string>; body: string } {
  const normalized = content.replace(/\r\n/g, '\n')
  const match = normalized.match(FRONT_MATTER_REGEX)
  if (!match) {
    return { metadata: {}, body: normalized }
  }

  const metadata: Record<string, string> = {}
  match[1].split('\n').forEach((line) => {
    const colonIndex = line.indexOf(':')
    if (colonIndex !== -1) {
      const key = line.slice(0, colonIndex).trim()
      const value = line.slice(colonIndex + 1).trim().replace(/\r$/, '')
      metadata[key] = value
    }
  })

  return { metadata, body: match[2] }
}

function buildFrontMatter(id: string, title: string, folder: string, tags: string[], starred: boolean, createdAt: string, updatedAt: string): string {
  const tagsYaml = tags.length > 0 ? tags.map(t => `"${t}"`).join(', ') : '[]'
  return `---
title: "${title.replace(/"/g, '\\"')}"
id: "${id}"
folder: "${folder}"
tags: [${tagsYaml}]
starred: ${starred}
created: ${createdAt}
updated: ${updatedAt}
---

`
}

function readNoteFromFile(filePath: string): Note | null {
  if (!fs.existsSync(filePath)) return null

  const raw = fs.readFileSync(filePath, 'utf-8')
  const { metadata, body } = parseFrontMatter(raw)
  const fileName = path.basename(filePath, '.md')
  const stat = fs.statSync(filePath)
  const fallbackTime = stat.mtime.toISOString()
  const createdAt = metadata.created || fallbackTime
  const updatedAt = metadata.updated || fallbackTime

  return {
    id: parseYamlString(metadata.id) || fileName,
    title: parseYamlString(metadata.title) || fileName,
    content: body.trim(),
    folder: parseYamlString(metadata.folder) || '',
    tags: parseTags(metadata.tags),
    starred: metadata.starred === 'true',
    createdAt,
    updatedAt,
  }
}

function parseTags(tagsStr: string): string[] {
  if (!tagsStr || tagsStr === '[]') return []
  const cleaned = tagsStr.replace(/^\[|\]$/g, '')
  if (!cleaned.trim()) return []
  return cleaned.split(',').map(t => t.replace(/^"|"$/g, '').trim()).filter(Boolean)
}

function parseYamlString(value: string | undefined): string {
  if (!value) return ''
  const trimmed = value.trim()
  if (trimmed.length >= 2 && trimmed.startsWith('"') && trimmed.endsWith('"')) {
    const inner = trimmed.slice(1, -1)
    return inner.replace(/\\"/g, '"').replace(/\\\\/g, '\\')
  }
  return trimmed
}

function getBackupPathForNoteFile(noteFilePath: string): string | null {
  const backupNotesDir = getBackupNotesDir()
  if (!backupNotesDir) return null
  const notesDir = getNotesDir()
  const relative = path.relative(notesDir, noteFilePath)
  if (relative.startsWith('..') || path.isAbsolute(relative)) return null
  const target = path.join(backupNotesDir, relative)
  fs.ensureDirSync(path.dirname(target))
  return target
}

function mirrorFileToBackup(noteFilePath: string): void {
  const target = getBackupPathForNoteFile(noteFilePath)
  if (!target) return
  try {
    fs.copyFileSync(noteFilePath, target)
  } catch {
    // best-effort backup
  }
}

function removeFromBackup(noteFilePath: string): void {
  const target = getBackupPathForNoteFile(noteFilePath)
  if (!target) return
  try {
    if (fs.existsSync(target)) fs.unlinkSync(target)
  } catch {
    // best-effort backup
  }
}

function getTrashPathForExistingFile(existingFilePath: string): string {
  const notesDir = getNotesDir()
  const trashDir = getTrashDir()
  const relative = path.relative(notesDir, existingFilePath)
  const baseTarget = path.join(trashDir, relative)
  fs.ensureDirSync(path.dirname(baseTarget))

  const ext = path.extname(baseTarget)
  const base = baseTarget.slice(0, -ext.length)
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  const seconds = String(now.getSeconds()).padStart(2, '0')
  const timestamp = `${year}${month}${day}_${hours}${minutes}${seconds}`

  let trashPath = `${base}_${timestamp}${ext}`
  let counter = 1
  while (fs.existsSync(trashPath)) {
    trashPath = `${base}_${timestamp}_${counter}${ext}`
    counter++
  }
  return trashPath
}

let serviceInstance: NoteServiceInterface | null = null

export function getNoteService(): NoteServiceInterface {
  if (!serviceInstance) {
    serviceInstance = createNoteService()
  }
  return serviceInstance
}

function titleToFileName(title: string): string {
  const base = sanitizeFileName(title)
  return base + '.md'
}

function getNoteFilePathByTitle(title: string, folder?: string): string {
  const notesDir = getNotesDir()
  const dir = folder ? getFolderDir(folder) : notesDir
  return path.join(dir, titleToFileName(title))
}

function noteExistsByTitle(title: string, folder?: string): boolean {
  const filePath = getNoteFilePathByTitle(title, folder)
  return fs.existsSync(filePath)
}

function createNoteService(): NoteServiceInterface {
  return {
    async createNote(data: CreateNoteInput): Promise<Note> {
      if (!isBackupDirConfigured()) {
        throw new Error('请先设置备份路径后再创建笔记')
      }

      const folder = data.folder || ''

      if (noteExistsByTitle(data.title, folder)) {
        throw new Error(`笔记 "${data.title}" 已存在，请使用其他标题`)
      }

      const id = uuidv4()
      const now = new Date().toISOString()

      const frontMatter = buildFrontMatter(id, data.title, folder, data.tags || [], false, now, now)
      const content = frontMatter + (data.content || '')

      const filePath = getNoteFilePathByTitle(data.title, folder)
      fs.ensureDirSync(path.dirname(filePath))
      fs.writeFileSync(filePath, content, 'utf-8')
      mirrorFileToBackup(filePath)

      return {
        id,
        title: data.title,
        content: data.content || '',
        folder,
        tags: data.tags || [],
        starred: false,
        createdAt: now,
        updatedAt: now,
      }
    },

    async getNote(id: string): Promise<Note | null> {
      const filePath = findNoteFile(id)
      if (!filePath) return null
      return readNoteFromFile(filePath)
    },

    async updateNote(id: string, data: UpdateNoteInput): Promise<Note> {
      const existingFilePath = findNoteFile(id)
      if (!existingFilePath) throw new Error(`Note "${id}" not found`)
      const existing = readNoteFromFile(existingFilePath)
      if (!existing) throw new Error(`Note "${id}" not found`)

      const newTitle = data.title ?? existing.title
      const folderChanged = data.folder !== undefined && data.folder !== existing.folder
      const titleChanged = data.title !== undefined && data.title !== existing.title

      if (titleChanged && newTitle !== existing.title) {
        if (noteExistsByTitle(newTitle, data.folder ?? existing.folder)) {
          throw new Error(`笔记 "${newTitle}" 已存在，请使用其他标题`)
        }
      }

      const updated: Note = {
        ...existing,
        title: newTitle,
        content: data.content ?? existing.content,
        folder: data.folder ?? existing.folder,
        tags: data.tags ?? existing.tags,
        starred: data.starred ?? existing.starred,
        updatedAt: new Date().toISOString(),
      }

      const frontMatter = buildFrontMatter(updated.id, updated.title, updated.folder, updated.tags, updated.starred, updated.createdAt, updated.updatedAt)
      const fullContent = frontMatter + updated.content

      let targetPath: string
      if (folderChanged || titleChanged) {
        targetPath = getNoteFilePathByTitle(newTitle, updated.folder)
      } else {
        targetPath = existingFilePath
      }

      fs.ensureDirSync(path.dirname(targetPath))
      fs.writeFileSync(targetPath, fullContent, 'utf-8')

      if (targetPath !== existingFilePath) {
        if (fs.existsSync(existingFilePath)) {
          fs.unlinkSync(existingFilePath)
          removeFromBackup(existingFilePath)
        }
      }
      mirrorFileToBackup(targetPath)

      return updated
    },

    async deleteNote(id: string): Promise<void> {
      const filePath = findNoteFile(id)
      if (!filePath || !fs.existsSync(filePath)) return
      const trashPath = getTrashPathForExistingFile(filePath)
      fs.moveSync(filePath, trashPath, { overwrite: false })
      removeFromBackup(filePath)
      mirrorFileToBackup(trashPath)
    },

    async listNotes(folder?: string): Promise<NoteMetadata[]> {
      const notesDir = getNotesDir()
      const targetDir = folder ? getFolderDir(folder) : notesDir

      if (!fs.existsSync(targetDir)) return []

      const notes: NoteMetadata[] = []
      const walk = (dir: string) => {
        const entries = fs.readdirSync(dir, { withFileTypes: true })
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name)
          if (entry.isDirectory()) {
            if (entry.name === '.trash') continue
            if (!folder) walk(fullPath)
            continue
          }
          if (!entry.isFile() || !entry.name.endsWith('.md')) continue
          const note = readNoteFromFile(fullPath)
          if (note) notes.push(toMetadata(note))
        }
      }
      walk(targetDir)

      notes.sort((a, b) => {
        if (a.starred !== b.starred) {
          return a.starred ? -1 : 1
        }
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      })
      return notes
    },

    async listFolders(): Promise<Folder[]> {
      const notesDir = getNotesDir()
      if (!fs.existsSync(notesDir)) return []

      const entries = fs.readdirSync(notesDir, { withFileTypes: true })
      const folders: Folder[] = []

      for (const entry of entries) {
        if (entry.isDirectory()) {
          if (entry.name === '.trash') continue
          const files = fs.readdirSync(path.join(notesDir, entry.name)).filter(f => f.endsWith('.md'))
          folders.push({
            name: entry.name,
            path: entry.name,
            noteCount: files.length,
          })
        }
      }

      return folders
    },

    async searchNotes(query: string): Promise<NoteMetadata[]> {
      const allNotes = await this.listNotes()
      const lowerQuery = query.toLowerCase()

      const results: NoteMetadata[] = []
      for (const meta of allNotes) {
        const note = await this.getNote(meta.id)
        if (note) {
          const titleMatch = note.title.toLowerCase().includes(lowerQuery)
          const contentMatch = note.content.toLowerCase().includes(lowerQuery)
          const tagMatch = note.tags.some(t => t.toLowerCase().includes(lowerQuery))

          if (titleMatch || contentMatch || tagMatch) {
            results.push(meta)
          }
        }
      }

      return results
    },
  }
}

function findNoteFile(id: string): string | null {
  const notesDir = getNotesDir()

  const searchInDir = (dir: string): string | null => {
    if (!fs.existsSync(dir)) return null
    const entries = fs.readdirSync(dir)
    for (const entry of entries) {
      if (entry === '.trash') continue
      const fullPath = path.join(dir, entry)
      const stat = fs.statSync(fullPath)
      if (stat.isDirectory()) {
        const found = searchInDir(fullPath)
        if (found) return found
      } else if (entry.endsWith('.md')) {
        const note = readNoteFromFile(fullPath)
        if (note && (note.id === id || note.title === id)) {
          return fullPath
        }
      }
    }
    return null
  }

  return searchInDir(notesDir)
}

function toMetadata(note: Note): NoteMetadata {
  return {
    id: note.id,
    title: note.title,
    folder: note.folder,
    tags: note.tags,
    starred: note.starred,
    createdAt: note.createdAt,
    updatedAt: note.updatedAt,
  }
}
