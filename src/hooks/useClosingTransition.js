import { useState } from 'react'

export function useClosingTransition(onClose, duration = 180) {
  const [closing, setClosing] = useState(false)
  function requestClose() {
    setClosing(true)
    setTimeout(onClose, duration)
  }
  return { closing, requestClose }
}
