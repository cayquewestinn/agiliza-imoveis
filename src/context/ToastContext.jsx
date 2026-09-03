import { createContext, useCallback, useContext, useRef, useState } from 'react'

const ToastContext = createContext(null)

const TOAST_DURATION_MS = 5000
// Um desfazer precisa sobreviver ao tempo de perceber que errou, não só ao
// tempo de ler o aviso — por isso é mais longo que o toast comum.
const UNDO_DURATION_MS = 6000

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const nextId = useRef(0)
  // Timers pendentes por id, para que descartar um toast à mão não deixe um
  // setTimeout órfão tentando remover algo que já saiu da lista.
  const timers = useRef(new Map())

  const dismissToast = useCallback(id => {
    const timer = timers.current.get(id)
    if (timer) {
      clearTimeout(timer)
      timers.current.delete(id)
    }
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const push = useCallback((toast, duration) => {
    const id = nextId.current++
    setToasts(prev => [...prev, { id, ...toast }])
    timers.current.set(id, setTimeout(() => dismissToast(id), duration))
    return id
  }, [dismissToast])

  const showError = useCallback(
    message => push({ message, tipo: 'erro' }, TOAST_DURATION_MS),
    [push]
  )

  const showSuccess = useCallback(
    message => push({ message, tipo: 'sucesso' }, TOAST_DURATION_MS),
    [push]
  )

  // Toast com ação de desfazer. `onUndo` roda e o toast sai na mesma hora —
  // clicar "Desfazer" nunca deixa o aviso na tela sugerindo que dá para
  // desfazer duas vezes.
  const showUndo = useCallback(
    (message, onUndo) => push({ message, tipo: 'sucesso', undoLabel: 'Desfazer', onUndo }, UNDO_DURATION_MS),
    [push]
  )

  return (
    <ToastContext.Provider value={{ toasts, showError, showSuccess, showUndo, dismissToast }}>
      {children}
    </ToastContext.Provider>
  )
}

export function useToast() {
  return useContext(ToastContext)
}
