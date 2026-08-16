import { createContext, useContext, useState } from 'react'
import { TEAM_MEMBERS, findByCredentials } from '../utils/teamHelpers'

const UserContext = createContext(null)

const STORAGE_KEY = 'agiliza_current_user'

function loadStoredUser() {
  const nome = localStorage.getItem(STORAGE_KEY)
  return TEAM_MEMBERS.find(m => m.nome === nome) ?? null
}

export function UserProvider({ children }) {
  const [currentUser, setCurrentUserState] = useState(loadStoredUser)

  function login(usuario, senha) {
    const member = findByCredentials(usuario, senha)
    if (!member) return false
    setCurrentUserState(member)
    localStorage.setItem(STORAGE_KEY, member.nome)
    return true
  }

  function logout() {
    setCurrentUserState(null)
    localStorage.removeItem(STORAGE_KEY)
  }

  const isAdmin = currentUser?.cargo === 'Administrador/Agendador'

  return (
    <UserContext.Provider value={{ currentUser, login, logout, isAdmin }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const context = useContext(UserContext)
  if (!context) throw new Error('useUser deve ser usado dentro de um UserProvider')
  return context
}
