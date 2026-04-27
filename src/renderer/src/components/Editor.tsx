import React, { useState, useCallback, useEffect, useRef } from 'react'
import { useNoteStore } from '../store/noteStore'
import { useLanguage } from '../context/LanguageContext'

export const Editor: React.FC = () => {
  const currentNote = useNoteStore((state) => state.currentNote)
  const saveNote = useNoteStore((state) => state.saveNote)
  const setCurrentNote = useNoteStore((state) => state.setCurrentNote)
  const { t } = useLanguage()

  const [content, setContent] = useState('')
  const [isPreview, setIsPreview] = useState(false)
  const [isAutoSaving, setIsAutoSaving] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [matchCase, setMatchCase] = useState(false)
  const [currentMatchIndex, setCurrentMatchIndex] = useState(-1)
  const [totalMatches, setTotalMatches] = useState(0)
  const lastSavedContentRef = useRef<string>('')
  const autoSaveTimerRef = useRef<number | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault()
        setShowSearch(true)
        setTimeout(() => searchInputRef.current?.focus(), 100)
      }
      if (e.key === 'Escape' && showSearch) {
        setShowSearch(false)
        setSearchQuery('')
        setCurrentMatchIndex(-1)
        setTotalMatches(0)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [showSearch])

  useEffect(() => {
    if (!searchQuery) {
      setCurrentMatchIndex(-1)
      setTotalMatches(0)
      return
    }

    const flags = matchCase ? 'g' : 'gi'
    const escapedQuery = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const regex = new RegExp(escapedQuery, flags)
    const matches = content.match(regex)
    setTotalMatches(matches ? matches.length : 0)
    setCurrentMatchIndex(0)
  }, [searchQuery, content, matchCase])

  const findNext = useCallback(() => {
    if (!searchQuery || totalMatches === 0) return
    const flags = matchCase ? 'g' : 'gi'
    const escapedQuery = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const regex = new RegExp(escapedQuery, flags)
    const matches = [...content.matchAll(regex)]
    if (matches.length === 0) return

    const nextIndex = (currentMatchIndex + 1) % matches.length
    setCurrentMatchIndex(nextIndex)

    const match = matches[nextIndex]
    if (textareaRef.current && match.index !== undefined) {
      textareaRef.current.focus()
      textareaRef.current.setSelectionRange(match.index, match.index + match[0].length)
    }
  }, [searchQuery, content, matchCase, currentMatchIndex, totalMatches])

  const findPrev = useCallback(() => {
    if (!searchQuery || totalMatches === 0) return
    const flags = matchCase ? 'g' : 'gi'
    const escapedQuery = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const regex = new RegExp(escapedQuery, flags)
    const matches = [...content.matchAll(regex)]
    if (matches.length === 0) return

    const prevIndex = (currentMatchIndex - 1 + matches.length) % matches.length
    setCurrentMatchIndex(prevIndex)

    const match = matches[prevIndex]
    if (textareaRef.current && match.index !== undefined) {
      textareaRef.current.focus()
      textareaRef.current.setSelectionRange(match.index, match.index + match[0].length)
    }
  }, [searchQuery, content, matchCase, currentMatchIndex, totalMatches])

  const handleSave = useCallback(async () => {
    await saveNote(content)
    lastSavedContentRef.current = content
  }, [content, saveNote])

  useEffect(() => {
    if (!currentNote) return

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
          {isAutoSaving && <span className="editor-autosave-status">{t.editor.autoSaving}</span>}
          <button className={`btn ${isPreview ? '' : 'btn-primary'}`} onClick={() => setIsPreview(false)}>
            {t.editor.edit}
          </button>
          <button className={`btn ${isPreview ? 'btn-primary' : ''}`} onClick={() => setIsPreview(true)}>
            {t.editor.preview}
          </button>
          <button className="btn btn-success" onClick={handleSave}>
            {t.editor.save}
          </button>
          <button className="btn" onClick={handleClose}>
            {t.editor.close}
          </button>
        </div>
      </div>

      {showSearch && (
        <div className="search-bar">
          <div className="search-bar-row">
            <input
              ref={searchInputRef}
              type="text"
              className="search-input"
              placeholder={t.editor.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.shiftKey ? findPrev() : findNext()
                }
              }}
            />
            <span className="search-count">
              {totalMatches > 0 ? `${currentMatchIndex + 1} / ${totalMatches}` : t.editor.noResults}
            </span>
            <button className="btn btn-sm" onClick={findPrev} title="上一个">
              ▲
            </button>
            <button className="btn btn-sm" onClick={findNext} title="下一个">
              ▼
            </button>
            <label className="search-checkbox">
              <input
                type="checkbox"
                checked={matchCase}
                onChange={(e) => setMatchCase(e.target.checked)}
              />
              {t.editor.matchCase}
            </label>
            <button className="btn btn-sm" onClick={() => {
              setShowSearch(false)
              setSearchQuery('')
              setCurrentMatchIndex(-1)
              setTotalMatches(0)
            }} title="关闭">
              ✕
            </button>
          </div>
        </div>
      )}

      {isPreview ? (
        <div className="preview-pane">
          <p className="preview-placeholder">{t.editor.previewPlaceholder}</p>
          <pre className="preview-raw">{content}</pre>
        </div>
      ) : (
        <textarea
          ref={textareaRef}
          className="editor-textarea"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={t.editor.placeholder}
          spellCheck={false}
        />
      )}
    </div>
  )
}
