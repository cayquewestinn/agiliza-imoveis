import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useUser } from './UserContext'

const VisitsContext = createContext(null)

const VISITA_SELECT = 'id, tipo, lote_id, lead_id, data, hora, responsavel_id, status, recepcao_nome_completo, recepcao_cpf, recepcao_telefone, profiles(nome)'

function fromRow(row) {
  const visita = {
    id: row.id,
    tipo: row.tipo,
    loteId: row.lote_id,
    leadId: row.lead_id,
    data: row.data,
    hora: row.hora?.slice(0, 5) ?? row.hora,
    responsavelId: row.responsavel_id,
    responsavel: row.profiles?.nome ?? '',
    status: row.status,
  }
  if (row.tipo === 'empresa') {
    visita.recepcao = {
      nomeCompleto: row.recepcao_nome_completo ?? '',
      cpf: row.recepcao_cpf ?? '',
      telefone: row.recepcao_telefone ?? '',
    }
  }
  return visita
}

function toRow(visita) {
  return {
    tipo: visita.tipo,
    lote_id: visita.loteId ?? null,
    lead_id: visita.leadId ?? null,
    data: visita.data,
    hora: visita.hora,
    responsavel_id: visita.responsavelId,
    status: visita.status,
    recepcao_nome_completo: visita.recepcao?.nomeCompleto ?? null,
    recepcao_cpf: visita.recepcao?.cpf ?? null,
    recepcao_telefone: visita.recepcao?.telefone ?? null,
  }
}

export function VisitsProvider({ children }) {
  const { currentUser } = useUser()
  const [visitas, setVisitas] = useState([])
  const [loading, setLoading] = useState(true)

  async function refetch() {
    const { data, error } = await supabase
      .from('visitas')
      .select(VISITA_SELECT)
      .order('data', { ascending: true })
      .order('hora', { ascending: true })
    if (error) {
      console.error('Erro ao carregar visitas:', error)
      return
    }
    setVisitas(data.map(fromRow))
  }

  useEffect(() => {
    let active = true

    if (!currentUser) {
      setVisitas([])
      setLoading(false)
      return
    }

    refetch().then(() => { if (active) setLoading(false) })

    const channel = supabase
      .channel('visitas-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'visitas' }, () => {
        refetch()
      })
      .subscribe()

    return () => {
      active = false
      supabase.removeChannel(channel)
    }
  }, [currentUser?.id])

  async function addVisita(visita) {
    const { error } = await supabase.from('visitas').insert(toRow(visita))
    if (error) {
      console.error('Erro ao criar visita:', error)
      return
    }
    await refetch()
  }

  async function updateVisita(id, updates) {
    const current = visitas.find(v => v.id === id)
    const merged = { ...current, ...updates }
    const { error } = await supabase.from('visitas').update(toRow(merged)).eq('id', id)
    if (error) {
      console.error('Erro ao atualizar visita:', error)
      return
    }
    await refetch()
  }

  async function deleteVisita(id) {
    const { error } = await supabase.from('visitas').delete().eq('id', id)
    if (error) {
      console.error('Erro ao excluir visita:', error)
      return
    }
    await refetch()
  }

  return (
    <VisitsContext.Provider value={{ visitas, addVisita, updateVisita, deleteVisita, loading }}>
      {children}
    </VisitsContext.Provider>
  )
}

export function useVisits() {
  const context = useContext(VisitsContext)
  if (!context) throw new Error('useVisits deve ser usado dentro de um VisitsProvider')
  return context
}
