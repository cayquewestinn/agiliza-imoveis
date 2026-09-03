import { X, CheckCircle2, AlertCircle } from 'lucide-react'
import { useToast } from '../context/ToastContext'

export function Toast() {
  const { toasts, dismissToast } = useToast()

  if (toasts.length === 0) return null

  return (
    <div className="toast-stack">
      {toasts.map(toast => {
        const erro = toast.tipo === 'erro'
        const Icon = erro ? AlertCircle : CheckCircle2
        return (
          <div
            className={`toast toast-${toast.tipo ?? 'erro'}`}
            key={toast.id}
            // Erro interrompe; confirmação de rotina não deve atropelar o
            // leitor de tela no meio de outra leitura.
            role={erro ? 'alert' : 'status'}
            aria-live={erro ? 'assertive' : 'polite'}
          >
            <Icon size={15} className="toast-icon" aria-hidden="true" />
            <span className="toast-message">{toast.message}</span>
            {toast.onUndo && (
              <button
                type="button"
                className="toast-undo"
                onClick={() => { toast.onUndo(); dismissToast(toast.id) }}
              >
                {toast.undoLabel}
              </button>
            )}
            <button
              type="button"
              className="icon-btn"
              onClick={() => dismissToast(toast.id)}
              aria-label="Fechar aviso"
            >
              <X size={14} />
            </button>
          </div>
        )
      })}
    </div>
  )
}
