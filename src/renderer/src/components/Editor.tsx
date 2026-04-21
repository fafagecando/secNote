import React, { useState, useCallback, useEffect, useRef } from 'react'
import { useNoteStore } from '../store/noteStore'

export const Editor: React.FC = () => {
  const currentNote = useNoteStore((state) => state.currentNote)
  const saveNote = useNoteStore((state) => state.saveNote)
  const setCurrentNote = useNoteStore((state) => state.setCurrentNote)

  const [content, setContent] = useState('')
  const [isPreview, setIsPreview] = useState(false)
  const [isAutoSaving, setIsAutoSaving] = useState(false)
  const lastSavedContentRef = useRef<string>('')
  const autoSaveTimerRef = useRef<number | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (currentNote) {
      setContent(currentNote.content)
      lastSavedContentRef.current = currentNote.content
    }
  }, [currentNote?.id])

  useEffect(() => {
    if (currentNote && !isPreview && textareaRef.current) {
      const timer = setTimeout(() => {
        textareaRef.current?.focus()
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [currentNote?.id, isPreview])

  useEffect(() => {
    const handleFocus = () => {
      if (currentNote && !isPreview && textareaRef.current) {
        textareaRef.current.focus()
      }
    }
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [currentNote?.id, isPreview])

  const handleSave = useCallback(async () => {
    await saveNote(content)
    lastSavedContentRef.current = content
  }, [content, saveNote])

  useEffect(() => {
    if (!currentNote) return

    // Skip autosave when content matches last saved state.
    if (content === lastSavedContentRef.current) return

    if (autoSaveTimerRef.current !== null) {
      window.clearTimeout(autoSaveTimerRef.current)
    }

    autoSaveTimerRef.current = window.setTimeout(async () => {
      try {
        setIsAutoSaving(true)
        await saveNote(content, { refreshList: false })
        lastSavedContentRef.current = content
      } finally {
        setIsAutoSaving(false)
      }
    }, 800)

    return () => {
      if (autoSaveTimerRef.current !== null) {
        window.clearTimeout(autoSaveTimerRef.current)
      }
    }
  }, [content, currentNote?.id, saveNote])

  const handleClose = () => {
    setCurrentNote(null)
  }

  if (!currentNote) return null

  return (
    <div className="editor">
        <div className="editor-header">
          <h2>{currentNote.title}</h2>
          <div className="editor-actions">
          {isAutoSaving && <span className="editor-autosave-status">自动保存中…</span>}
          <button className={`btn ${isPreview ? '' : 'btn-primary'}`} onClick={() => setIsPreview(false)}>
            编辑
          </button>
          <button className={`btn ${isPreview ? 'btn-primary' : ''}`} onClick={() => setIsPreview(true)}>
            预览
          </button>
          <button className="btn btn-success" onClick={handleSave}>
            保存
          </button>
          <button className="btn" onClick={handleClose}>
            关闭
          </button>
        </div>
      </div>

      {isPreview ? (
        <div className="preview-pane">
          <p className="preview-placeholder">预览模式 - Markdown 渲染功能正在开发中（阶段2）</p>
          <pre className="preview-raw">{content}</pre>
        </div>
      ) : (
        <textarea
          ref={textareaRef}
          className="editor-textarea"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="请使用 Markdown 语法书写笔记..."
          spellCheck={false}
        />
      )}
    </div>
  )
}
