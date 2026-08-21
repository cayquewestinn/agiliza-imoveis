import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useUser } from './UserContext'
import { useToast } from './ToastContext'

const VisitsContext = createContext(null)

const VISITA_SELECT = 'id, tipo, lote_id, lead_id, data, hora, responsavel_id, status, recepcao_nome_completo, recepcao_cpf, recepcao_telefone, feedback, profiles(nome)'

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
    feedback: row.feedback ?? '',
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
    feedback: visita.feedback || null,
    recepcao_nome_completo: visita.recepcao?.nomeCompleto ?? null,
    recepcao_cpf: visita.recepcao?.cpf ?? null,
    recepcao_telefone: visita.recepcao?.telefone ?? null,
  }
}

// A visit left "Agendada" past its own date/time almost always means nobody
// showed up and nobody updated the status — auto-flip it instead of letting
// it sit forever as if it were still upcoming.
function isOverdueAgendada(visita) {
  return visita.status === 'Agendada' && new Date(`${visita.data}T${visita.hora}`) < new Date()
}

const PAGE_SIZE = 1000

async function fetchAllVisitas() {
  const rows = []
  let from = 0
  while (true) {
    const { data, error } = await supabase
      .from('visitas')
      .select(VISITA_SELECT)
      .order('data', { ascending: true })
      .order('hora', { ascending: true })
      .range(from, from + PAGE_SIZE - 1)
    if (error) return { rows: null, error }
    rows.push(...data)
    if (data.length < PAGE_SIZE) break
    from += PAGE_SIZE
  }
  return { rows, error: null }
}

export function VisitsProvider({ children }) {
  const { currentUser } = useUser()
  const { showError } = useToast()
  const [visitas, setVisitas] = useState([])
  const [loading, setLoading] = useState(true)

  async function refetch(isActive = () => true) {
    const { rows, error } = await fetchAllVisitas()
    if (error) {
      console.error('Erro ao carregar visitas:', error)
      return
    }
    if (!isActive()) return

    const parsed = rows.map(fromRow)
    const overdueIds = parsed.filter(isOverdueAgendada).map(v => v.id)
    if (overdueIds.length > 0) {
      for (const v of parsed) {
        if (overdueIds.includes(v.id)) v.status = 'Não Compareceu'
      }
      supabase.from('visitas').update({ status: 'Não Compareceu' }).in('id', overdueIds)
        .then(({ error: updateError }) => {
          if (updateError) console.error('Erro ao marcar visitas atrasadas como Não Compareceu:', updateError)
        })
    }
    setVisitas(parsed)
  }

  useEffect(() => {
    let active = true

    if (!currentUser) {
      setVisitas([])
      setLoading(false)
      return
    }

    refetch(() => active).then(() => { if (active) setLoading(false) })

    const channel = supabase
      .channel('visitas-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'visitas' }, () => {
        refetch(() => active)
      })
      .subscribe()

    return () => {
      active = false
      supabase.removeChannel(channel)
    }
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- refetch only when the logged-in user's id actually changes, not on every currentUser object identity change
  }, [currentUser?.id])

  async function addVisita(visita) {
    const { error } = await supabase.from('visitas').insert(toRow(visita))
    if (error) {
      console.error('Erro ao criar visita:', error)
      showError('Não foi possível marcar a visita. Tente novamente.')
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
      showError('Não foi possível salvar as alterações da visita. Tente novamente.')
      return
    }
    await refetch()
  }

  async function deleteVisita(id) {
    const { error } = await supabase.from('visitas').delete().eq('id', id)
    if (error) {
      console.error('Erro ao excluir visita:', error)
      showError('Não foi possível excluir a visita. Tente novamente.')
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
