import React, { useEffect, useState, useRef, useCallback, useContext } from 'react'
import { useNoteStore } from '../store/noteStore'
import { AlertContext } from '../context/AlertContext'
import { useLanguage } from '../context/LanguageContext'

const MIN_SIDEBAR_WIDTH = 200
const MAX_SIDEBAR_WIDTH = 600
const DEFAULT_SIDEBAR_WIDTH = 260
const MAX_NOTE_TITLE_LENGTH = 64

function formatUserError(error: unknown, t: ReturnType<typeof useLanguage>['t']): string {
  const message = error instanceof Error ? error.message : String(error)

  if (message.includes('请先设置备份路径') || message.includes('backup')) {
    return t.sidebar.backupDirRequired
  }

  if (message.includes('已存在') || message.includes('already exists')) {
    return t.sidebar.titleExists
  }

  if (message.includes('设置备份路径失败') || message.includes('Failed to set backup')) {
    return t.sidebar.setBackupFailed
  }

  if (message.includes('迁移备份文件') || message.includes('Failed to migrate')) {
    return t.sidebar.migrateBackupFailed
  }

  return t.sidebar.operationFailed
}

export const Sidebar: React.FC = () => {
  const { showAlert, showConfirm } = useContext(AlertContext)
  const { t } = useLanguage()
  const notes = useNoteStore((state) => state.notes)
  const currentNote = useNoteStore((state) => state.currentNote)
  const searchQuery = useNoteStore((state) => state.searchQuery)
  const openNote = useNoteStore((state) => state.openNote)
  const createNote = useNoteStore((state) => state.createNote)
  const deleteNote = useNoteStore((state) => state.deleteNote)
  const searchNotes = useNoteStore((state) => state.searchNotes)
  const toggleStar = useNoteStore((state) => state.toggleStar)

  const [newNoteTitle, setNewNoteTitle] = useState('')
  const [showNewNoteInput, setShowNewNoteInput] = useState(false)
  const [backupDir, setBackupDir] = useState<string | null>(null)
  const [sidebarWidth, setSidebarWidth] = useState(DEFAULT_SIDEBAR_WIDTH)
  const [isResizing, setIsResizing] = useState(false)
  const [hoveredNoteId, setHoveredNoteId] = useState<string | null>(null)
  const sidebarRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const savedWidth = localStorage.getItem('sidebarWidth')
    if (savedWidth) {
      const width = parseInt(savedWidth, 10)
      if (width >= MIN_SIDEBAR_WIDTH && width <= MAX_SIDEBAR_WIDTH) {
        setSidebarWidth(width)
      }
    }
  }, [])

  useEffect(() => {
    window.secNoteApi.settings
      .get()
      .then((s: { backupDir: string | null }) => setBackupDir(s.backupDir))
      .catch(() => setBackupDir(null))
  }, [])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizing(true)
  }, [])

  useEffect(() => {
    if (!isResizing) return

    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = e.clientX
      if (newWidth >= MIN_SIDEBAR_WIDTH && newWidth <= MAX_SIDEBAR_WIDTH) {
        setSidebarWidth(newWidth)
        localStorage.setItem('sidebarWidth', String(newWidth))
      }
    }

    const handleMouseUp = () => {
      setIsResizing(false)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isResizing])

  const handleCreate = async () => {
    const trimmedTitle = newNoteTitle.trim()
    if (!trimmedTitle) {
      showAlert(t.sidebar.titleRequired)
      return
    }
    if (trimmedTitle.length > MAX_NOTE_TITLE_LENGTH) {
      showAlert(t.sidebar.titleTooLong.replace('{max}', String(MAX_NOTE_TITLE_LENGTH)))
      return
    }
    try {
      await createNote(trimmedTitle)
      setNewNoteTitle('')
      setShowNewNoteInput(false)
    } catch (error) {
      showAlert(`${t.sidebar.createNoteFailed}: ${formatUserError(error, t)}`)
    }
  }

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    searchNotes(e.target.value)
  }

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    const confirmed = await showConfirm(t.sidebar.deleteConfirm)
    if (confirmed) {
      await deleteNote(id)
    }
  }

  const handleToggleStar = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    await toggleStar(id)
  }

  const handleChooseBackupDir = async () => {
    const selected = await window.secNoteApi.dialog.selectDirectory({ title: t.sidebar.selectBackupDirTitle })
    if (!selected) return

    const validation = await window.secNoteApi.settings.validateBackupDir(selected)
    if (!validation.valid) {
      showAlert(`${t.sidebar.setBackupFailed}: ${validation.error || 'Invalid path'}`)
      return
    }

    const result = await window.secNoteApi.settings.setBackupDir(selected)
    if (result.error) {
      showAlert(`${t.sidebar.setBackupFailed}: ${result.error || 'Unknown error'}`)
      return
    }

    setBackupDir(result.settings.backupDir)
    let message = t.sidebar.backupSetSuccess + selected
    if (result.migrated) {
      message += t.sidebar.backupMigrated
    }
    showAlert(message)
  }

  const handleClearBackupDir = async () => {
    if (!confirm(t.sidebar.clearBackupConfirm)) return
    const s = await window.secNoteApi.settings.setBackupDir(null)
    setBackupDir(s.backupDir)
  }

  const handleShowStoragePaths = async () => {
    const notesDir = await window.secNoteApi.paths.getNotesDir()
    const backupPath = backupDir ? `${backupDir}\\notes` : t.sidebar.notSet

    const message =
      t.sidebar.storagePathTitle + '\n\n' +
      t.sidebar.storagePathMessage
        .replace('{notesDir}', notesDir)
        .replace('{backupPath}', backupPath)

    showAlert(message)
  }

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    const seconds = String(date.getSeconds()).padStart(2, '0')
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
  }

  return (
    <aside
      ref={sidebarRef}
      className="sidebar"
      style={{ width: sidebarWidth, minWidth: sidebarWidth, maxWidth: sidebarWidth }}
    >
      <div className="sidebar-header">
        <h1>{t.sidebar.title}</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-new" onClick={() => setShowNewNoteInput(true)}>
            {t.sidebar.newNote}
          </button>
          <button className="btn" onClick={handleChooseBackupDir} title={backupDir ?? t.sidebar.noBackupDir}>
            {t.sidebar.backupPath}
          </button>
          <button className="btn" onClick={handleShowStoragePaths}>
            {t.sidebar.clearNotes}
          </button>
        </div>
      </div>

      <div className="sidebar-search">
        <input
          type="text"
          placeholder={t.sidebar.searchPlaceholder}
          value={searchQuery}
          onChange={handleSearch}
        />
      </div>

      {showNewNoteInput && (
        <div className="new-note-form">
          <input
            type="text"
            placeholder={t.sidebar.newNoteTitlePlaceholder.replace('{max}', String(MAX_NOTE_TITLE_LENGTH))}
            value={newNoteTitle}
            onChange={(e) => setNewNoteTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            maxLength={MAX_NOTE_TITLE_LENGTH}
            autoFocus
          />
          <div className="new-note-actions">
            <button className="btn btn-primary" onClick={handleCreate}>{t.sidebar.create}</button>
            <button className="btn" onClick={() => setShowNewNoteInput(false)}>{t.sidebar.cancel}</button>
          </div>
        </div>
      )}

      <ul className="note-list">
        {notes.map((note) => (
          <li
            key={note.id}
            className={`note-item ${currentNote?.id === note.id ? 'active' : ''}`}
            onClick={() => openNote(note.id)}
            onMouseEnter={() => setHoveredNoteId(note.id)}
            onMouseLeave={() => setHoveredNoteId(null)}
          >
            <div className="note-item-content">
              <div className="note-item-header">
                <button
                  className={`btn-star ${note.starred ? 'starred' : ''}`}
                  onClick={(e) => handleToggleStar(e, note.id)}
                  title={note.starred ? t.sidebar.starred : t.sidebar.unstarred}
                >
                  {note.starred ? '★' : '☆'}
                </button>
                <span
                  className="note-title"
                  title={note.title}
                >
                  {note.title}
                </span>
              </div>
              <span className="note-date">
                {formatDateTime(note.updatedAt)}
              </span>
            </div>
            <button
              className="btn-delete"
              onClick={(e) => handleDelete(e, note.id)}
            >
              {t.sidebar.delete}
            </button>
          </li>
        ))}
      </ul>

      <div
        className={`sidebar-resize-handle ${isResizing ? 'active' : ''}`}
        onMouseDown={handleMouseDown}
      />
    </aside>
  )
}
