import { X } from 'lucide-react'
import { useToast } from '../context/ToastContext'

export function Toast() {
  const { toasts, dismissToast } = useToast()

  if (toasts.length === 0) return null

  return (
    <div className="toast-stack">
      {toasts.map(toast => (
        <div className="toast" key={toast.id} role="alert">
          <span>{toast.message}</span>
          <button
            type="button"
            className="icon-btn"
            onClick={() => dismissToast(toast.id)}
            aria-label="Fechar aviso"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  )
}
