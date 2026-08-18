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

  // Fetches the profiles row for userId and applies it to currentUser.
  // Returns true iff a profile row was actually found (i.e. the account is
  // fully provisioned), independent of the token race-guard below — the
  // guard only decides whether THIS call is allowed to write state (to
  // avoid a stale/late-resolving fetch clobbering newer state after a
  // sign-out or user switch), it must not distort the success/failure
  // signal callers (like login()) rely on.
  async function loadProfile(userId) {
    const token = ++requestTokenRef.current
    const { data, error } = await supabase
      .from('profiles')
      .select('id, nome, cargo, is_admin')
      .eq('id', userId)
      .single()

    const found = !error && !!data
    if (!found) {
      console.error('Erro ao carregar profile:', error)
      // Auth sign-in succeeded but there's no matching profiles row (or the
      // lookup failed) — don't leave a half-authenticated Auth session lingering.
      await supabase.auth.signOut()
    }

    if (token === requestTokenRef.current) {
      setCurrentUser(found ? data : null)
    }

    return found
  }

  useEffect(() => {
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
    const { data, error } = await supabase.auth.signInWithPassword({
      email: toEmail(usuario),
      password: senha,
    })
    if (error || !data?.user) return false
    // Auth sign-in alone isn't enough — the account also needs a matching
    // profiles row. loadProfile() signs the session back out and returns
    // false when that row is missing, so login() correctly reports failure
    // instead of leaving the UI stuck on a silently-broken "successful" login.
    return await loadProfile(data.user.id)
  }

  async function logout() {
    requestTokenRef.current++
    await supabase.auth.signOut()
    setCurrentUser(null)
  }

  async function changePassword(novaSenha) {
    const { error } = await supabase.auth.updateUser({ password: novaSenha })
    if (error) return { ok: false, message: error.message }
    return { ok: true }
  }

  const isAdmin = currentUser?.is_admin === true

  return (
    <UserContext.Provider value={{ currentUser, login, logout, changePassword, isAdmin, loading }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const context = useContext(UserContext)
  if (!context) throw new Error('useUser deve ser usado dentro de um UserProvider')
  return context
}
