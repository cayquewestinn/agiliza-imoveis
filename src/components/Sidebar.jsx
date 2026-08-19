import { useState } from 'react'
import { LayoutDashboard, CheckSquare, Building2, Users, LogOut, CalendarClock, X, Sun, Moon, KeyRound } from 'lucide-react'
import { useUser } from '../context/UserContext'
import { useTheme } from '../context/ThemeContext'
import { initials } from '../utils/teamHelpers'
import { ChangePasswordModal } from './ChangePasswordModal'

export function Sidebar({ currentView, setCurrentView, isOpen, onClose }) {
  const { currentUser, logout, isAdmin } = useUser()
  const { theme, toggleTheme } = useTheme()
  const [showChangePassword, setShowChangePassword] = useState(false)

  return (
    <aside id="sidebar-nav" className={`sidebar ${isOpen ? 'mobile-open' : ''}`}>
      <div className="sidebar-logo">
        <img
          src={theme === 'dark' ? '/logo-agiliza.png' : '/logo-agiliza-ink.png'}
          alt="Agiliza"
          className="sidebar-brand"
        />
        <button type="button" className="sidebar-close-btn" onClick={onClose} aria-label="Fechar menu">
          <X size={18} />
        </button>
      </div>

      <nav className="nav-menu">
        <button
          className={`nav-item ${currentView === 'dashboard' ? 'active' : ''}`}
          onClick={() => setCurrentView('dashboard')}
        >
          <LayoutDashboard className="nav-icon" />
          Painel Geral
        </button>

        <button
          className={`nav-item ${currentView === 'minhas-tarefas' ? 'active' : ''}`}
          onClick={() => setCurrentView('minhas-tarefas')}
        >
          <CheckSquare className="nav-icon" />
          Minhas Tarefas
        </button>

        <button
          className={`nav-item ${currentView === 'agenda' ? 'active' : ''}`}
          onClick={() => setCurrentView('agenda')}
        >
          <CalendarClock className="nav-icon" />
          Agenda
        </button>

        {isAdmin && (
          <button
            className={`nav-item ${currentView === 'equipe' ? 'active' : ''}`}
            onClick={() => setCurrentView('equipe')}
          >
            <Users className="nav-icon" />
            Equipe
          </button>
        )}

        <button
          className={`nav-item ${currentView === 'lotes' ? 'active' : ''}`}
          onClick={() => setCurrentView('lotes')}
        >
          <Building2 className="nav-icon" />
          Imóveis
        </button>
      </nav>

      <div className="sidebar-utility">
        <button
          type="button"
          className="theme-toggle-btn"
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Mudar para modo claro' : 'Mudar para modo escuro'}
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          {theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
        </button>

        <button
          type="button"
          className="theme-toggle-btn"
          onClick={() => setShowChangePassword(true)}
        >
          <KeyRound size={16} />
          Trocar Senha
        </button>
      </div>

      {currentUser && (
        <div className="sidebar-user">
          <div className="sidebar-user-avatar">{initials(currentUser.nome)}</div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{currentUser.nome}</div>
            <div className="sidebar-user-cargo">{currentUser.cargo}</div>
          </div>
          <button className="sidebar-logout-btn" onClick={logout} aria-label="Sair">
            <LogOut size={16} />
          </button>
        </div>
      )}

      {showChangePassword && (
        <ChangePasswordModal onClose={() => setShowChangePassword(false)} />
      )}
    </aside>
  )
}
