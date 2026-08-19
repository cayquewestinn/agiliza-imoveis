import { useState, useEffect } from 'react'
import { Menu } from 'lucide-react'
import { Sidebar } from './components/Sidebar'
import { Dashboard } from './views/Dashboard'
import { MinhasTarefas } from './views/MinhasTarefas'
import { Equipe } from './views/Equipe'
import { Lotes } from './views/Lotes'
import { Agenda } from './views/Agenda'
import { Login } from './views/Login'
import { Toast } from './components/Toast'
import { TasksProvider } from './context/TasksContext'
import { LotesProvider } from './context/LotesContext'
import { LeadsProvider } from './context/LeadsContext'
import { VisitsProvider } from './context/VisitsContext'
import { UserProvider, useUser } from './context/UserContext'
import { ThemeProvider } from './context/ThemeContext'
import { ProfilesProvider } from './context/ProfilesContext'
import { ToastProvider } from './context/ToastContext'
import './index.css'

function AppShell() {
  const { currentUser, isAdmin, loading } = useUser()
  const [currentView, setCurrentView] = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (!sidebarOpen) return
    function handleKeyDown(e) {
      if (e.key === 'Escape') setSidebarOpen(false)
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [sidebarOpen])

  if (loading) {
    return null
  }

  if (!currentUser) {
    return <Login />
  }

  const view = currentView === 'equipe' && !isAdmin ? 'dashboard' : currentView

  function handleSetView(nextView) {
    setCurrentView(nextView)
    setSidebarOpen(false)
  }

  return (
    <div className="app-container">
      <button
        type="button"
        className="mobile-menu-btn"
        onClick={() => setSidebarOpen(true)}
        aria-label="Abrir menu"
        aria-expanded={sidebarOpen}
        aria-controls="sidebar-nav"
      >
        <Menu size={20} />
      </button>

      {sidebarOpen && (
        <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} />
      )}

      <Sidebar currentView={view} setCurrentView={handleSetView} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="main-content">
        {view === 'dashboard' && <Dashboard />}
        {view === 'minhas-tarefas' && <MinhasTarefas />}
        {view === 'agenda' && <Agenda />}
        {view === 'equipe' && isAdmin && <Equipe />}
        {view === 'lotes' && <Lotes />}
      </main>
    </div>
  )
}

function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <UserProvider>
          <ProfilesProvider>
            <TasksProvider>
              <LotesProvider>
                <LeadsProvider>
                  <VisitsProvider>
                    <AppShell />
                    <Toast />
                  </VisitsProvider>
                </LeadsProvider>
              </LotesProvider>
            </TasksProvider>
          </ProfilesProvider>
        </UserProvider>
      </ToastProvider>
    </ThemeProvider>
  )
}

export default App
