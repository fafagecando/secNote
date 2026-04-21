import { create } from 'zustand'
import type { Note, NoteMetadata } from '../../../shared/types'

interface NoteState {
  notes: NoteMetadata[]
  currentNote: Note | null
  searchQuery: string
  selectedFolder: string | null
  isLoading: boolean

  loadNotes: (folder?: string) => Promise<void>
  openNote: (id: string) => Promise<void>
  createNote: (title: string, folder?: string) => Promise<void>
  saveNote: (content: string, options?: { refreshList?: boolean }) => Promise<void>
  deleteNote: (id: string) => Promise<void>
  searchNotes: (query: string) => Promise<void>
  toggleStar: (id: string) => Promise<void>
  setCurrentNote: (note: Note | null) => void
}

export const useNoteStore = create<NoteState>((set, get) => ({
  notes: [],
  currentNote: null,
  searchQuery: '',
  selectedFolder: null,
  isLoading: false,

  loadNotes: async (folder?: string) => {
    set({ isLoading: true })
    try {
      const notes = await window.secNoteApi.notes.list(folder)
      set({ notes, selectedFolder: folder || null })
    } finally {
      set({ isLoading: false })
    }
  },

  openNote: async (id: string) => {
    const note = await window.secNoteApi.notes.get(id)
    set({ currentNote: note })
  },

  createNote: async (title: string, folder?: string) => {
    console.log('[Store] createNote called, title:', title)
    try {
      const note = await window.secNoteApi.notes.create({
        title,
        content: '',
        folder,
        tags: [],
      })
      console.log('[Store] createNote result:', note)
      await get().loadNotes(folder)
      set({ currentNote: { ...note, content: '' } })
      console.log('[Store] createNote completed')
    } catch (error) {
      console.error('[Store] createNote error:', error)
      throw error
    }
  },

  saveNote: async (content: string, options?: { refreshList?: boolean }) => {
    const current = get().currentNote
    if (!current) return

    const updated = await window.secNoteApi.notes.update(current.id, {
      title: current.title,
      content,
    })
    set({ currentNote: updated })
    await get().loadNotes(get().selectedFolder || undefined)
  },

  deleteNote: async (id: string) => {
    await window.secNoteApi.notes.delete(id)
    if (get().currentNote?.id === id) {
      set({ currentNote: null })
    }
    await get().loadNotes(get().selectedFolder || undefined)
  },

  searchNotes: async (query: string) => {
    set({ isLoading: true, searchQuery: query })
    try {
      if (!query.trim()) {
        await get().loadNotes(get().selectedFolder || undefined)
      } else {
        const notes = await window.secNoteApi.notes.search(query)
        set({ notes })
      }
    } finally {
      set({ isLoading: false })
    }
  },

  setCurrentNote: (note: Note | null) => {
    set({ currentNote: note })
  },

  toggleStar: async (id: string) => {
    await window.secNoteApi.notes.toggleStar(id)
    await get().loadNotes(get().selectedFolder || undefined)
    const current = get().currentNote
    if (current?.id === id) {
      const updated = await window.secNoteApi.notes.get(id)
      set({ currentNote: updated })
    }
  },
}))
