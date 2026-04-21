import type { SecNoteApi } from '../../../preload/index'

declare global {
  interface Window {
    secNoteApi: SecNoteApi
  }
}

export {}
