import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useUser } from './UserContext'
import { useToast } from './ToastContext'
import { useLeads } from './LeadsContext'
import { toISODate } from '../utils/visitHelpers'

const VisitsContext = createContext(null)

// "profiles!responsavel_id" desambigua o embed: a coluna visitas.criado_por
// também referencia profiles(id), então há duas relações entre visitas e
// profiles e o PostgREST não sabe mais qual usar pro join implícito sem essa
// anotação (erro PGRST201).
const VISITA_SELECT = 'id, tipo, lote_id, lead_id, data, hora, responsavel_id, status, recepcao_nome_completo, recepcao_cpf, recepcao_telefone, feedback, profiles!responsavel_id(nome)'

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

// NÃO reintroduzir um auto-flip de "Agendada" -> "Não Compareceu" aqui.
// Existiu até 2026-08-26 e gravava a falta no banco assim que o horário de
// início passava, sem tolerância: visita em andamento e visita que de fato
// aconteceu (mas cujo status ninguém atualizou no mesmo dia) eram marcadas
// como falta, o status original era sobrescrito de forma irrecuperável e o
// lead ainda era arquivado por tabela, sumindo do funil. O sistema não sabe
// se o cliente compareceu — quem sabe é o corretor. Visitas vencidas agora
// aparecem como "a confirmar" (estado derivado em visitHelpers.js), cobrando
// a confirmação sem afirmar nada.

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
  const { leads, updateLead } = useLeads()
  const [visitas, setVisitas] = useState([])
  const [loading, setLoading] = useState(true)

  // A lead whose only pending contact was a no-show visit is dead weight in
  // the active lists — archive it (not the sales-funnel "Perdido", just set
  // aside) unless it already has another visit today or later. Runs off
  // committed `visitas`/`leads` state (not the freshly-fetched rows inside
  // refetch) because LeadsContext can still be mid-fetch — empty — at the
  // exact moment a visitas refetch lands; reacting to both keeps this
  // self-healing once leads finish loading, and it's idempotent (already
  // -arquivado leads are skipped) so re-running on every leads/visitas
  // change is safe.
  useEffect(() => {
    if (visitas.length === 0 || leads.length === 0) return
    const todayStr = toISODate(new Date())
    const noShowLeadIds = new Set(
      visitas.filter(v => v.status === 'Não Compareceu' && v.leadId).map(v => v.leadId)
    )
    for (const leadId of noShowLeadIds) {
      const lead = leads.find(l => l.id === leadId)
      if (!lead || lead.arquivado) continue
      const hasPending = visitas.some(v =>
        v.leadId === leadId && v.status !== 'Não Compareceu' && v.data >= todayStr
      )
      if (!hasPending) updateLead(leadId, { arquivado: true })
    }
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- updateLead/leads change identity on every LeadsContext update; the idempotent guard above (skip already-arquivado leads) makes re-running safe instead of chasing a stable reference here
  }, [visitas, leads])

  async function refetch(isActive = () => true) {
    const { rows, error } = await fetchAllVisitas()
    if (error) {
      console.error('Erro ao carregar visitas:', error)
      return
    }
    if (!isActive()) return

    setVisitas(rows.map(fromRow))
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
