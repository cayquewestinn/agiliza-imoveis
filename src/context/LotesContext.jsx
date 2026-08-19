import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useUser } from './UserContext'

const LotesContext = createContext(null)

const LOTE_COLUMNS = 'id, codigo, titulo, tipo_imovel, endereco, bairro, cidade, uf, area_util, quartos, banheiros, vagas, valor_avaliacao, lance_inicial, status, data_leilao, comitente, fotos'

function fromRow(row) {
  return {
    id: row.id,
    codigo: row.codigo,
    titulo: row.titulo,
    tipoImovel: row.tipo_imovel,
    endereco: row.endereco ?? '',
    bairro: row.bairro ?? '',
    cidade: row.cidade ?? '',
    uf: row.uf ?? '',
    areaUtil: row.area_util ?? 0,
    quartos: row.quartos,
    banheiros: row.banheiros,
    vagas: row.vagas,
    valorAvaliacao: row.valor_avaliacao,
    lanceInicial: row.lance_inicial,
    status: row.status,
    dataLeilao: row.data_leilao,
    comitente: row.comitente ?? '',
    fotos: row.fotos ?? [],
  }
}

function toRow(lote) {
  return {
    codigo: lote.codigo,
    titulo: lote.titulo,
    tipo_imovel: lote.tipoImovel,
    endereco: lote.endereco,
    bairro: lote.bairro,
    cidade: lote.cidade,
    uf: lote.uf,
    area_util: lote.areaUtil,
    quartos: lote.quartos,
    banheiros: lote.banheiros,
    vagas: lote.vagas,
    valor_avaliacao: lote.valorAvaliacao,
    lance_inicial: lote.lanceInicial,
    status: lote.status,
    data_leilao: lote.dataLeilao || null,
    comitente: lote.comitente,
  }
}

const PAGE_SIZE = 1000

async function fetchAllLotes() {
  const rows = []
  let from = 0
  while (true) {
    const { data, error } = await supabase
      .from('lotes')
      .select(LOTE_COLUMNS)
      .order('created_at', { ascending: false })
      .range(from, from + PAGE_SIZE - 1)
    if (error) return { rows: null, error }
    rows.push(...data)
    if (data.length < PAGE_SIZE) break
    from += PAGE_SIZE
  }
  return { rows, error: null }
}

export function LotesProvider({ children }) {
  const { currentUser } = useUser()
  const [lotes, setLotes] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    if (!currentUser) {
      setLotes([])
      setLoading(false)
      return
    }

    fetchAllLotes().then(({ rows, error }) => {
      if (!active) return
      if (error) {
        console.error('Erro ao carregar lotes:', error)
        setLotes([])
      } else {
        setLotes(rows.map(fromRow))
      }
      setLoading(false)
    })
    return () => { active = false }
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- refetch only when the logged-in user's id actually changes, not on every currentUser object identity change
  }, [currentUser?.id])

  async function addLote(lote) {
    const { data, error } = await supabase
      .from('lotes')
      .insert(toRow(lote))
      .select(LOTE_COLUMNS)
      .single()
    if (error) {
      console.error('Erro ao criar lote:', error)
      return
    }
    setLotes(prev => [fromRow(data), ...prev])
  }

  async function updateLote(id, updates) {
    const current = lotes.find(l => l.id === id)
    const merged = { ...current, ...updates }
    const { data, error } = await supabase
      .from('lotes')
      .update(toRow(merged))
      .eq('id', id)
      .select(LOTE_COLUMNS)
      .single()
    if (error) {
      console.error('Erro ao atualizar lote:', error)
      return
    }
    setLotes(prev => prev.map(l => (l.id === id ? fromRow(data) : l)))
  }

  async function deleteLote(id) {
    const { error } = await supabase.from('lotes').delete().eq('id', id)
    if (error) {
      console.error('Erro ao excluir lote:', error)
      return
    }
    setLotes(prev => prev.filter(l => l.id !== id))
  }

  return (
    <LotesContext.Provider value={{ lotes, addLote, updateLote, deleteLote, loading }}>
      {children}
    </LotesContext.Provider>
  )
}

export function useLotes() {
  const context = useContext(LotesContext)
  if (!context) throw new Error('useLotes deve ser usado dentro de um LotesProvider')
  return context
}
