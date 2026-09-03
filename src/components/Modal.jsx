import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { useBodyScrollLock } from '../hooks/useBodyScrollLock'

const FOCUSABLE = [
  'a[href]', 'button:not([disabled])', 'input:not([disabled])',
  'select:not([disabled])', 'textarea:not([disabled])', '[tabindex]:not([tabindex="-1"])',
].join(',')

// Pilha de modais abertos. Só o topo responde ao Esc e prende o foco — sem
// isso, fechar a galeria de fotos aberta de dentro do detalhe do imóvel
// fecharia os dois de uma vez.
const stack = []

// A galeria de fotos (PhotoGallery) tem seu próprio overlay e seu próprio
// Esc, fora deste componente — mas precisa entrar na mesma pilha, senão o Esc
// do <Modal> que a envolve fecha o imóvel inteiro em vez de só a foto.
export function useModalStackLayer() {
  const token = useRef(null)
  if (token.current === null) token.current = {}

  useEffect(() => {
    const t = token.current
    stack.push(t)
    return () => {
      const i = stack.indexOf(t)
      if (i !== -1) stack.splice(i, 1)
    }
  }, [])

  return useCallback(() => stack[stack.length - 1] === token.current, [])
}

const CLOSE_DURATION_MS = 180

/**
 * Casca única de modal do sistema: `role="dialog"`, Esc, foco preso enquanto
 * aberto e foco devolvido a quem abriu. Cada tela continua dona do próprio
 * corpo e rodapé — este componente cuida só do comportamento de diálogo.
 */
export function Modal({ titulo, tituloNode, wide = false, onClose, children, labelledBy }) {
  const overlayRef = useRef(null)
  const shellRef = useRef(null)
  const abriuCom = useRef(null)
  const [closing, setClosing] = useState(false)
  const fecharTimer = useRef(null)
  const geradoId = useId()
  const tituloId = labelledBy ?? `${geradoId}-titulo`

  const requestClose = useCallback(() => {
    setClosing(true)
    fecharTimer.current = setTimeout(onClose, CLOSE_DURATION_MS)
  }, [onClose])

  // Um close disparado durante a animação não pode deixar um setState órfão
  // atrás dele quando o pai desmonta primeiro.
  useEffect(() => () => clearTimeout(fecharTimer.current), [])

  useBodyScrollLock()

  useEffect(() => {
    const token = {}
    stack.push(token)
    abriuCom.current = document.activeElement

    // Só foca sozinho se nada dentro do modal já tomou o foco (um campo com
    // autoFocus, por exemplo) — o autor da tela sabe melhor onde começar.
    const t = setTimeout(() => {
      const shell = shellRef.current
      if (!shell || shell.contains(document.activeElement)) return
      const alvo = shell.querySelector(FOCUSABLE)
      if (alvo) alvo.focus()
      else shell.focus()
    }, 0)

    function handleKeyDown(e) {
      if (stack[stack.length - 1] !== token) return

      if (e.key === 'Escape') {
        e.stopPropagation()
        requestClose()
        return
      }

      if (e.key !== 'Tab') return
      const shell = shellRef.current
      if (!shell) return
      const focaveis = Array.from(shell.querySelectorAll(FOCUSABLE))
        .filter(el => el.offsetParent !== null || el === document.activeElement)
      if (focaveis.length === 0) {
        e.preventDefault()
        return
      }
      const primeiro = focaveis[0]
      const ultimo = focaveis[focaveis.length - 1]
      if (e.shiftKey && document.activeElement === primeiro) {
        e.preventDefault()
        ultimo.focus()
      } else if (!e.shiftKey && document.activeElement === ultimo) {
        e.preventDefault()
        primeiro.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown, true)
    return () => {
      clearTimeout(t)
      document.removeEventListener('keydown', handleKeyDown, true)
      stack.splice(stack.indexOf(token), 1)
      // Devolve o foco a quem abriu, mas só se ele ainda existir na página —
      // uma linha que sumiu da lista não pode receber foco de volta.
      const origem = abriuCom.current
      if (origem && document.contains(origem)) origem.focus()
    }
  }, [requestClose])

  return (
    <div
      ref={overlayRef}
      className={`modal-overlay ${closing ? 'closing' : ''}`}
      onMouseDown={e => { if (e.target === overlayRef.current) requestClose() }}
    >
      <div
        ref={shellRef}
        className={`modal ${wide ? 'modal-wide' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={tituloId}
        tabIndex={-1}
        // Alguns modais (o do imóvel, por exemplo) nascem dentro de um cartão
        // que também reage a clique — sem isto, qualquer clique no conteúdo
        // do modal borbulharia até o cartão por trás dele.
        onClick={e => e.stopPropagation()}
      >
        <div className="modal-header">
          {tituloNode ? tituloNode(tituloId) : <h2 id={tituloId}>{titulo}</h2>}
          <button type="button" className="icon-btn" onClick={requestClose} aria-label="Fechar">
            <X size={18} />
          </button>
        </div>
        {typeof children === 'function' ? children({ requestClose, tituloId }) : children}
      </div>
    </div>
  )
}
