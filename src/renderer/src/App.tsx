import React, { useEffect, useContext } from 'react'
import { useNoteStore } from './store/noteStore'
import { Sidebar } from './components/Sidebar'
import { Editor } from './components/Editor'
import { NotePreview } from './components/NotePreview'
import { AlertProvider, AlertContext } from './context/AlertContext'
import './styles/main.css'

const AppContent: React.FC = () => {
  const loadNotes = useNoteStore((state) => state.loadNotes)
  const currentNote = useNoteStore((state) => state.currentNote)
  const createNote = useNoteStore((state) => state.createNote)
  const { showAbout } = useContext(AlertContext)

  useEffect(() => {
    loadNotes()
  }, [loadNotes])

  useEffect(() => {
    window.secNoteApi.onMenuAction(async (action: string) => {
      if (action === 'new-note') {
        const title = prompt('请输入笔记标题：')
        if (title && title.trim()) {
          await createNote(title.trim())
        }
      } else if (action === 'menu:about') {
        showAbout()
      }
    })
  }, [createNote, showAbout])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        window.secNoteApi.window.toggleFullscreen()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <div className="app-container">
      <Sidebar />
      <main className="main-content">
        {currentNote ? (
          <Editor />
        ) : (
          <NotePreview />
        )}
      </main>
    </div>
  )
}

export const App: React.FC = () => {
  return (
    <AlertProvider>
      <AppContent />
    </AlertProvider>
  )
}
