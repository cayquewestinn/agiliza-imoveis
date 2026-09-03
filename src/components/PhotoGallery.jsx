import { useCallback, useEffect, useState } from 'react'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import { useClosingTransition } from '../hooks/useClosingTransition'
import { useBodyScrollLock } from '../hooks/useBodyScrollLock'
import { useModalStackLayer } from './Modal'

export function PhotoGallery({ fotos, startIndex, titulo, onClose }) {
  const [index, setIndex] = useState(startIndex)
  const { closing, requestClose } = useClosingTransition(onClose)
  const souTopo = useModalStackLayer()
  useBodyScrollLock()

  const prev = useCallback(() => {
    setIndex(i => (i === 0 ? fotos.length - 1 : i - 1))
  }, [fotos.length])

  const next = useCallback(() => {
    setIndex(i => (i === fotos.length - 1 ? 0 : i + 1))
  }, [fotos.length])

  useEffect(() => {
    function handleKey(e) {
      // Só reage se a galeria for a camada mais no topo — aberta de dentro
      // de outro modal, é ela quem deve fechar com Esc, não o modal por trás.
      if (!souTopo()) return
      if (e.key === 'Escape') requestClose()
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'ArrowRight') next()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [fotos.length, requestClose, next, prev, souTopo])

  return (
    <div className={`gallery-overlay ${closing ? 'closing' : ''}`} onClick={requestClose}>
      <button type="button" className="gallery-close" onClick={requestClose} aria-label="Fechar galeria">
        <X size={22} />
      </button>

      <div className="gallery-content" onClick={e => e.stopPropagation()}>
        {fotos.length > 1 && (
          <button type="button" className="gallery-nav gallery-nav-prev" onClick={prev} aria-label="Foto anterior">
            <ChevronLeft size={28} />
          </button>
        )}

        <img src={fotos[index]} alt={`${titulo} — foto ${index + 1} de ${fotos.length}`} className="gallery-image" />

        {fotos.length > 1 && (
          <button type="button" className="gallery-nav gallery-nav-next" onClick={next} aria-label="Próxima foto">
            <ChevronRight size={28} />
          </button>
        )}
      </div>

      {fotos.length > 1 && (
        <div className="gallery-counter">{index + 1} / {fotos.length}</div>
      )}
    </div>
  )
}
