import React, { useState, useCallback } from 'react'
import { AlertModal } from '../components/AlertModal'
import { ConfirmModal } from '../components/ConfirmModal'
import { AboutModal } from '../components/AboutModal'

interface AlertContextValue {
  showAlert: (message: string) => void
  showConfirm: (message: string) => Promise<boolean>
  showAbout: () => void
}

export const AlertContext = React.createContext<AlertContextValue>({
  showAlert: () => {},
  showConfirm: async () => false,
  showAbout: () => {},
})

export const AlertProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [alertMessage, setAlertMessage] = useState<string | null>(null)
  const [confirmMessage, setConfirmMessage] = useState<string | null>(null)
  const [confirmResolve, setConfirmResolve] = useState<((value: boolean) => void) | null>(null)
  const [showAboutModal, setShowAboutModal] = useState(false)

  const showAlert = useCallback((msg: string) => {
    setAlertMessage(msg)
  }, [])

  const showConfirm = useCallback((msg: string) => {
    setConfirmMessage(msg)
    return new Promise<boolean>((resolve) => {
      setConfirmResolve(() => resolve)
    })
  }, [])

  const showAbout = useCallback(() => {
    setShowAboutModal(true)
  }, [])

  const handleAlertClose = useCallback(() => {
    setAlertMessage(null)
  }, [])

  const handleConfirm = useCallback(() => {
    setConfirmMessage(null)
    confirmResolve?.(true)
    setConfirmResolve(null)
  }, [confirmResolve])

  const handleCancel = useCallback(() => {
    setConfirmMessage(null)
    confirmResolve?.(false)
    setConfirmResolve(null)
  }, [confirmResolve])

  const handleAboutClose = useCallback(() => {
    setShowAboutModal(false)
  }, [])

  return (
    <AlertContext.Provider value={{ showAlert, showConfirm, showAbout }}>
      {children}
      {alertMessage && <AlertModal message={alertMessage} onClose={handleAlertClose} />}
      {confirmMessage && <ConfirmModal message={confirmMessage} onConfirm={handleConfirm} onCancel={handleCancel} />}
      {showAboutModal && <AboutModal onClose={handleAboutClose} />}
    </AlertContext.Provider>
  )
}
