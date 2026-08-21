import { useEffect } from 'react'

// Module-level so nested overlays (e.g. PhotoGallery opened from inside
// LoteDetailModal) don't unlock the body when the inner one closes while
// the outer one is still open.
let lockCount = 0
let savedScrollY = 0

export function useBodyScrollLock() {
  useEffect(() => {
    const { body } = document
    if (lockCount === 0) {
      savedScrollY = window.scrollY
      body.style.position = 'fixed'
      body.style.top = `-${savedScrollY}px`
      body.style.left = '0'
      body.style.right = '0'
    }
    lockCount++

    return () => {
      lockCount--
      if (lockCount === 0) {
        body.style.position = ''
        body.style.top = ''
        body.style.left = ''
        body.style.right = ''
        window.scrollTo(0, savedScrollY)
      }
    }
  }, [])
}
