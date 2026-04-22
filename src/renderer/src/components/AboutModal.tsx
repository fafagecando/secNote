import React, { useEffect } from 'react'
import { useLanguage } from '../context/LanguageContext'

interface AboutModalProps {
  onClose: () => void
}

export const AboutModal: React.FC<AboutModalProps> = ({ onClose }) => {
  const { t } = useLanguage()

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
      <div className="alert-modal about-modal">
        <div className="alert-modal-content about-content">
          <div className="about-logo">
            <div className="about-icon">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zM6 20V4h7v5h5v11H6z"/>
                <path d="M8 12h8v2H8zm0 4h5v2H8z"/>
              </svg>
            </div>
          </div>
          <h2 className="about-title">{t.about.title}</h2>
          <p className="about-version">{t.about.version}</p>
          <p className="about-description">
            {t.about.description}
          </p>
          <a
            href="https://github.com/fafagecando/secNote"
            className="about-github-link"
            onClick={(e) => {
              e.preventDefault()
              window.open('https://github.com/fafagecando/secNote', '_blank')
            }}
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="github-icon">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
            </svg>
            {t.about.githubRepo}
          </a>
        </div>
        <div className="alert-modal-footer">
          <button className="btn btn-primary" onClick={onClose}>{t.about.close}</button>
        </div>
      </div>
    </div>
  )
}
