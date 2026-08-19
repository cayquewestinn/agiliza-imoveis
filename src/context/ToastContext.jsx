import { createContext, useCallback, useContext, useRef, useState } from 'react'

const ToastContext = createContext(null)

const TOAST_DURATION_MS = 5000

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const nextId = useRef(0)

  const dismissToast = useCallback(id => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const showError = useCallback(message => {
    const id = nextId.current++
    setToasts(prev => [...prev, { id, message }])
    setTimeout(() => dismissToast(id), TOAST_DURATION_MS)
  }, [dismissToast])

  return (
    <ToastContext.Provider value={{ toasts, showError, dismissToast }}>
      {children}
    </ToastContext.Provider>
  )
}

export function useToast() {
  return useContext(ToastContext)
}
