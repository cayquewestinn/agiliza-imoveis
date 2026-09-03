import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useUser } from './UserContext'
import { useToast } from './ToastContext'

const LeadsContext = createContext(null)

const LEAD_COLUMNS = 'id, lote_id, nome, telefone, etapa, origem, data_recebimento, vendedor_id, agendador_id, arquivado, observacoes'

function fromRow(row) {
  return {
    id: row.id,
    loteId: row.lote_id,
    nome: row.nome,
    telefone: row.telefone,
    etapa: row.etapa,
    origem: row.origem ?? '',
    dataRecebimento: row.data_recebimento,
    vendedorId: row.vendedor_id,
    agendadorId: row.agendador_id,
    arquivado: row.arquivado ?? false,
    observacoes: row.observacoes ?? '',
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
    vendedor_id: lead.vendedorId ?? null,
    agendador_id: lead.agendadorId ?? null,
    arquivado: lead.arquivado ?? false,
    observacoes: lead.observacoes || null,
  }
}

const PAGE_SIZE = 1000

async function fetchAllLeads() {
  const rows = []
  let from = 0
  while (true) {
    const { data, error } = await supabase
      .from('leads')
      .select(LEAD_COLUMNS)
      .order('created_at', { ascending: false })
      .range(from, from + PAGE_SIZE - 1)
    if (error) return { rows: null, error }
    rows.push(...data)
    if (data.length < PAGE_SIZE) break
    from += PAGE_SIZE
  }
  return { rows, error: null }
}

export function LeadsProvider({ children }) {
  const { currentUser } = useUser()
  const { showError, showSuccess } = useToast()
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    if (!currentUser) {
      setLeads([])
      setLoading(false)
      return
    }

    fetchAllLeads().then(({ rows, error }) => {
      if (!active) return
      if (error) {
        console.error('Erro ao carregar leads:', error)
        setLeads([])
      } else {
        setLeads(rows.map(fromRow))
      }
      setLoading(false)
    })
    return () => { active = false }
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- refetch only when the logged-in user's id actually changes, not on every currentUser object identity change
  }, [currentUser?.id])

  async function addLead(lead) {
    const { data, error } = await supabase
      .from('leads')
      .insert(toRow(lead))
      .select(LEAD_COLUMNS)
      .single()
    if (error) {
      console.error('Erro ao criar lead:', error)
      showError('Não foi possível criar o lead. Tente novamente.')
      return null
    }
    const created = fromRow(data)
    setLeads(prev => [created, ...prev])
    return created
  }

  // `opcoes.silencioso` cala a confirmação nas gravações que a interface já
  // anuncia por conta própria (o desfazer do arquivamento, os avanços de
  // etapa disparados por uma visita) — dois avisos para a mesma ação leem
  // como duas coisas tendo acontecido.
  async function updateLead(id, updates, opcoes = {}) {
    const current = leads.find(l => l.id === id)
    if (!current) return
    const merged = { ...current, ...updates }

    // Aplica na hora e desfaz se o banco recusar: o operador vê o chip mudar
    // no clique, não depois da ida e volta ao Supabase.
    setLeads(prev => prev.map(l => (l.id === id ? merged : l)))

    const { data, error } = await supabase
      .from('leads')
      .update(toRow(merged))
      .eq('id', id)
      .select(LEAD_COLUMNS)
      .single()
    if (error) {
      console.error('Erro ao atualizar lead:', error)
      setLeads(prev => prev.map(l => (l.id === id ? current : l)))
      showError('Não foi possível salvar as alterações do lead. A alteração foi desfeita.')
      return
    }
    setLeads(prev => prev.map(l => (l.id === id ? fromRow(data) : l)))
    if (!opcoes.silencioso) showSuccess(`Lead ${merged.nome} atualizado.`)
  }

  async function deleteLead(id) {
    const { error } = await supabase.from('leads').delete().eq('id', id)
    if (error) {
      console.error('Erro ao excluir lead:', error)
      showError('Não foi possível excluir o lead. Tente novamente.')
      return
    }
    setLeads(prev => prev.filter(l => l.id !== id))
  }

  function leadsByLote(loteId, { includeArchived = false } = {}) {
    return leads.filter(l => l.loteId === loteId && (includeArchived || !l.arquivado))
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
