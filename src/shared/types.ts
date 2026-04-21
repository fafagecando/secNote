export interface Note {
  id: string
  title: string
  content: string
  folder: string
  tags: string[]
  starred: boolean
  createdAt: string
  updatedAt: string
}

export interface NoteMetadata {
  id: string
  title: string
  folder: string
  tags: string[]
  starred: boolean
  createdAt: string
  updatedAt: string
}

export interface Folder {
  name: string
  path: string
  noteCount: number
}

export interface AppSettings {
  backupDir: string | null
}

export interface NoteServiceInterface {
  createNote(data: CreateNoteInput): Promise<Note>
  getNote(id: string): Promise<Note | null>
  updateNote(id: string, data: UpdateNoteInput): Promise<Note>
  deleteNote(id: string): Promise<void>
  listNotes(folder?: string): Promise<NoteMetadata[]>
  listFolders(): Promise<Folder[]>
  searchNotes(query: string): Promise<NoteMetadata[]>
}

export interface CreateNoteInput {
  title: string
  content?: string
  folder?: string
  tags?: string[]
}

export interface UpdateNoteInput {
  title?: string
  content?: string
  folder?: string
  tags?: string[]
  starred?: boolean
}
