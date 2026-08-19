import { useCallback, useEffect, useState } from 'react'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'

export function PhotoGallery({ fotos, startIndex, titulo, onClose }) {
  const [index, setIndex] = useState(startIndex)

  const prev = useCallback(() => {
    setIndex(i => (i === 0 ? fotos.length - 1 : i - 1))
  }, [fotos.length])

  const next = useCallback(() => {
    setIndex(i => (i === fotos.length - 1 ? 0 : i + 1))
  }, [fotos.length])

  useEffect(() => {
    function handleKey(e) {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'ArrowRight') next()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [fotos.length, onClose, next, prev])

  return (
    <div className="gallery-overlay" onClick={onClose}>
      <button type="button" className="gallery-close" onClick={onClose} aria-label="Fechar galeria">
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
