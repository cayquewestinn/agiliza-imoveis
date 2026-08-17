import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useUser } from './UserContext'

const LeadsContext = createContext(null)

const LEAD_COLUMNS = 'id, lote_id, nome, telefone, etapa, origem, data_recebimento'

function fromRow(row) {
  return {
    id: row.id,
    loteId: row.lote_id,
    nome: row.nome,
    telefone: row.telefone,
    etapa: row.etapa,
    origem: row.origem ?? '',
    dataRecebimento: row.data_recebimento,
  }
}

function toRow(lead) {
  return {
    lote_id: lead.loteId ?? null,
    nome: lead.nome,
    telefone: lead.telefone,
    etapa: lead.etapa,
    origem: lead.origem,
    data_recebimento: lead.dataRecebimento,
  }
}

export function LeadsProvider({ children }) {
  const { currentUser } = useUser()
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    if (!currentUser) {
      setLeads([])
      setLoading(false)
      return
    }

    supabase
      .from('leads')
      .select(LEAD_COLUMNS)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (!active) return
        if (error) {
          console.error('Erro ao carregar leads:', error)
          setLeads([])
        } else {
          setLeads(data.map(fromRow))
        }
        setLoading(false)
      })
    return () => { active = false }
  }, [currentUser?.id])

  async function addLead(lead) {
    const { data, error } = await supabase
      .from('leads')
      .insert(toRow(lead))
      .select(LEAD_COLUMNS)
      .single()
    if (error) {
      console.error('Erro ao criar lead:', error)
      return null
    }
    const created = fromRow(data)
    setLeads(prev => [created, ...prev])
    return created
  }

  async function updateLead(id, updates) {
    const current = leads.find(l => l.id === id)
    const merged = { ...current, ...updates }
    const { data, error } = await supabase
      .from('leads')
      .update(toRow(merged))
      .eq('id', id)
      .select(LEAD_COLUMNS)
      .single()
    if (error) {
      console.error('Erro ao atualizar lead:', error)
      return
    }
    setLeads(prev => prev.map(l => (l.id === id ? fromRow(data) : l)))
  }

  async function deleteLead(id) {
    const { error } = await supabase.from('leads').delete().eq('id', id)
    if (error) {
      console.error('Erro ao excluir lead:', error)
      return
    }
    setLeads(prev => prev.filter(l => l.id !== id))
  }

  function leadsByLote(loteId) {
    return leads.filter(l => l.loteId === loteId)
  }

  return (
    <LeadsContext.Provider value={{ leads, addLead, updateLead, deleteLead, leadsByLote, loading }}>
      {children}
    </LeadsContext.Provider>
  )
}

export function useLeads() {
  const context = useContext(LeadsContext)
  if (!context) throw new Error('useLeads deve ser usado dentro de um LeadsProvider')
  return context
}
