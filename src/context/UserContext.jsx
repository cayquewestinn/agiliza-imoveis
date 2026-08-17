import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

const UserContext = createContext(null)

const EMAIL_DOMAIN = 'agiliza-imoveis.app'

function toEmail(usuario) {
  return `${usuario.trim().toLowerCase()}@${EMAIL_DOMAIN}`
}

export function UserProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(true)
  // Monotonically increasing token identifying the "current" profile request.
  // Any in-flight loadProfile() whose token no longer matches this ref when it
  // resolves is stale (a sign-out, or a newer sign-in, happened meanwhile) and
  // must not be allowed to reinstate currentUser.
  const requestTokenRef = useRef(0)

  useEffect(() => {
    async function loadProfile(userId) {
      const token = ++requestTokenRef.current
      const { data, error } = await supabase
        .from('profiles')
        .select('id, nome, cargo, is_admin')
        .eq('id', userId)
        .single()
      if (token !== requestTokenRef.current) return
      if (error) {
        console.error('Erro ao carregar profile:', error)
        setCurrentUser(null)
      } else {
        setCurrentUser(data)
      }
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        loadProfile(session.user.id).then(() => setLoading(false))
      } else {
        setLoading(false)
      }
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        loadProfile(session.user.id)
      } else {
        requestTokenRef.current++
        setCurrentUser(null)
      }
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  async function login(usuario, senha) {
    const { error } = await supabase.auth.signInWithPassword({
      email: toEmail(usuario),
      password: senha,
    })
    return !error
  }

  async function logout() {
    requestTokenRef.current++
    await supabase.auth.signOut()
    setCurrentUser(null)
  }

  const isAdmin = currentUser?.is_admin === true

  return (
    <UserContext.Provider value={{ currentUser, login, logout, isAdmin, loading }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const context = useContext(UserContext)
  if (!context) throw new Error('useUser deve ser usado dentro de um UserProvider')
  return context
}
