import React, { useEffect, useRef } from 'react'
import { useLanguage } from '../context/LanguageContext'

interface ConfirmModalProps {
  message: string
  onConfirm: () => void
  onCancel: () => void
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({ message, onConfirm, onCancel }) => {
  const { t } = useLanguage()
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onCancel])

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onCancel()
  }

  return (
    <div className="alert-modal-backdrop" onClick={handleBackdropClick}>
      <div className="alert-modal" ref={modalRef}>
        <div className="alert-modal-content">
          <pre className="alert-modal-text">{message}</pre>
        </div>
        <div className="alert-modal-footer">
          <button className="btn" onClick={onCancel}>{t.common.cancel}</button>
          <button className="btn btn-danger" onClick={onConfirm}>{t.common.confirm}</button>
        </div>
      </div>
    </div>
  )
}
