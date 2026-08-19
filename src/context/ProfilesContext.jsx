import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useUser } from './UserContext'

const ProfilesContext = createContext(null)

export function ProfilesProvider({ children }) {
  const { currentUser } = useUser()
  const [profiles, setProfiles] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    if (!currentUser) {
      setProfiles([])
      setLoading(false)
      return
    }

    supabase
      .from('profiles')
      .select('id, nome, cargo, is_admin')
      .order('nome', { ascending: true })
      .then(({ data, error }) => {
        if (!active) return
        if (error) {
          console.error('Erro ao carregar profiles:', error)
          setProfiles([])
        } else {
          setProfiles(data)
        }
        setLoading(false)
      })
    return () => { active = false }
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- refetch only when the logged-in user's id actually changes, not on every currentUser object identity change
  }, [currentUser?.id])

  return (
    <ProfilesContext.Provider value={{ profiles, loading }}>
      {children}
    </ProfilesContext.Provider>
  )
}

export function useProfiles() {
  const context = useContext(ProfilesContext)
  if (!context) throw new Error('useProfiles deve ser usado dentro de um ProfilesProvider')
  return context
}
