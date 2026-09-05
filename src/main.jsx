import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import * as Sentry from '@sentry/react'
import './index.css'
import App from './App.jsx'

const sentryDsn = import.meta.env.VITE_SENTRY_DSN

// Sem DSN (dev local, previews sem a env var) o init vira um no-op — não é
// erro de configuração, é o comportamento esperado fora de produção.
if (sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,
    // Erros tratados só com console.error (sem lançar exceção) nunca
    // chegariam ao Sentry sem isso — foi exatamente esse o padrão do
    // incidente de 05/09/2026 (visitas falhando em silêncio).
    integrations: [Sentry.captureConsoleIntegration({ levels: ['error'] })],
  })
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
