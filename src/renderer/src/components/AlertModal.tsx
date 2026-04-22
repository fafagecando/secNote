import React, { useEffect, useRef } from 'react'
import { useLanguage } from '../context/LanguageContext'

interface AlertModalProps {
  message: string
  onClose: () => void
}

export const AlertModal: React.FC<AlertModalProps> = ({ message, onClose }) => {
  const { t } = useLanguage()
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <div className="alert-modal-backdrop" onClick={handleBackdropClick}>
      <div className="alert-modal" ref={modalRef}>
        <div className="alert-modal-content">
          <pre className="alert-modal-text">{message}</pre>
        </div>
        <div className="alert-modal-footer">
          <button className="btn btn-primary" onClick={onClose}>{t.common.ok}</button>
        </div>
      </div>
    </div>
  )
}
