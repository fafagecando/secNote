import React, { useEffect, useState, useRef, useCallback, useContext } from 'react'
import { useNoteStore } from '../store/noteStore'
import { AlertContext } from '../context/AlertContext'

const MIN_SIDEBAR_WIDTH = 200
const MAX_SIDEBAR_WIDTH = 600
const DEFAULT_SIDEBAR_WIDTH = 260
const MAX_NOTE_TITLE_LENGTH = 64

function formatUserError(error: unknown): { cn: string; en: string } {
  const message = error instanceof Error ? error.message : String(error)

  if (message.includes('请先设置备份路径')) {
    return {
      cn: '请先设置备份路径后再创建笔记',
      en: 'Please set a backup directory before creating notes',
    }
  }

  if (message.includes('已存在')) {
    return {
      cn: '该笔记标题已存在，请使用其他标题',
      en: 'This note title already exists, please use another title',
    }
  }

  if (message.includes('设置备份路径失败')) {
    return {
      cn: message,
      en: 'Failed to set backup directory',
    }
  }

  if (message.includes('迁移备份文件')) {
    return {
      cn: '迁移备份文件失败，请检查路径权限',
      en: 'Failed to migrate backup files, please check path permissions',
    }
  }

  return {
    cn: '操作失败，请稍后重试',
    en: 'Operation failed, please try again later',
  }
}

export const Sidebar: React.FC = () => {
  const { showAlert, showConfirm } = useContext(AlertContext)
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
      showAlert('请输入笔记标题\nPlease enter a note title')
      return
    }
    if (trimmedTitle.length > MAX_NOTE_TITLE_LENGTH) {
      showAlert(
        `笔记标题不能超过 ${MAX_NOTE_TITLE_LENGTH} 个字符\nNote title cannot exceed ${MAX_NOTE_TITLE_LENGTH} characters`
      )
      return
    }
    try {
      await createNote(trimmedTitle)
      setNewNoteTitle('')
      setShowNewNoteInput(false)
    } catch (error) {
      const { cn, en } = formatUserError(error)
      showAlert(`创建笔记失败: ${cn}\nFailed to create note: ${en}`)
    }
  }

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    searchNotes(e.target.value)
  }

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    const confirmed = await showConfirm(
      '确定要删除这条笔记吗？\n\n' +
      '删除后文件不会被真正移除，\n' +
      '仍可在存储目录的 .trash 文件夹中找到。\n\n' +
      '如需彻底删除，请手动前往存储目录操作。'
    )
    if (confirmed) {
      await deleteNote(id)
    }
  }

  const handleToggleStar = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    await toggleStar(id)
  }

  const handleChooseBackupDir = async () => {
    const selected = await window.secNoteApi.dialog.selectDirectory({ title: '选择备用存放路径（将创建 notes 镜像）' })
    if (!selected) return

    const validation = await window.secNoteApi.settings.validateBackupDir(selected)
    if (!validation.valid) {
      showAlert(
        `设置备份路径失败: ${validation.error}\nFailed to set backup directory: ${validation.error || 'Invalid path'}`
      )
      return
    }

    const result = await window.secNoteApi.settings.setBackupDir(selected)
    if (result.error) {
      showAlert(
        `设置备份路径失败: ${result.error}\nFailed to set backup directory: ${result.error || 'Unknown error'}`
      )
      return
    }

    setBackupDir(result.settings.backupDir)
    let message = '已设置备用存放路径：\n' + selected
    if (result.migrated) {
      message += '\n\n原有备份文件已迁移到新路径。'
    }
    showAlert(message)
  }

  const handleClearBackupDir = async () => {
    if (!confirm('确定清除备用存放路径设置吗？（不会删除已备份文件）')) return
    const s = await window.secNoteApi.settings.setBackupDir(null)
    setBackupDir(s.backupDir)
  }

  const handleShowStoragePaths = async () => {
    const notesDir = await window.secNoteApi.paths.getNotesDir()
    const backupPath = backupDir ? `${backupDir}\\notes` : '未设置'

    const message =
      '⚠️ 重要提示\n\n' +
      '本软件不支持直接删除笔记功能。\n' +
      '如需删除笔记，请手动前往以下目录操作：\n\n' +
      `📁 默认存储路径：\n${notesDir}\n\n` +
      `📁 备份存储路径：\n${backupPath}\n\n` +
      '⛔ 请谨慎操作，删除后无法恢复！'

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
        <h1>secNote</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-new" onClick={() => setShowNewNoteInput(true)}>
            新建笔记
          </button>
          <button className="btn" onClick={handleChooseBackupDir} title={backupDir ?? '未设置备用存放路径'}>
            备份路径
          </button>
          <button className="btn" onClick={handleShowStoragePaths}>
            清除笔记
          </button>
        </div>
      </div>

      <div className="sidebar-search">
        <input
          type="text"
          placeholder="Search notes..."
          value={searchQuery}
          onChange={handleSearch}
        />
      </div>

      {showNewNoteInput && (
        <div className="new-note-form">
          <input
            type="text"
            placeholder={`笔记标题... (最多${MAX_NOTE_TITLE_LENGTH}字)`}
            value={newNoteTitle}
            onChange={(e) => setNewNoteTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            maxLength={MAX_NOTE_TITLE_LENGTH}
            autoFocus
          />
          <div className="new-note-actions">
            <button className="btn btn-primary" onClick={handleCreate}>创建</button>
            <button className="btn" onClick={() => setShowNewNoteInput(false)}>取消</button>
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
                  title={note.starred ? '取消星标' : '添加星标'}
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
              删除
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
