import { useEffect, useMemo, useState } from 'react'
import { X, Search } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { useLeads } from '../context/LeadsContext'
import { useLotes } from '../context/LotesContext'
import { useProfiles } from '../context/ProfilesContext'
import { useUser } from '../context/UserContext'
import { useToast } from '../context/ToastContext'
import { useClosingTransition } from '../hooks/useClosingTransition'
import { useBodyScrollLock } from '../hooks/useBodyScrollLock'
import { useEscapeClose } from '../hooks/useEscapeClose'
import { LeadRow } from './LeadRow'
import { LeadDetailModal } from './LeadDetailModal'

const PAGE_SIZE = 50

const SELECT_COLUMNS = 'id, lote_id, nome, telefone, etapa, origem, data_recebimento, vendedor_id, agendador_id, arquivado'

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
  }
}

// Ordenação hoje é fixa (mais antigo primeiro) pra todas as etapas — a fila
// de "Novo" pede FIFO, mas as demais etapas podem querer outro critério
// (atividade recente, responsável) no futuro. Isolado aqui pra trocar sem
// mexer no resto do fetch.
function applyOrder(query) {
  return query
    .order('data_recebimento', { ascending: true })
    .order('id', { ascending: true })
}

// PostgREST usa vírgula e parênteses como sintaxe estrutural dentro de um
// filtro .or() — um nome com vírgula ou parênteses quebraria o parsing se
// fosse interpolado direto. Aspas duplas escapam o valor.
function escapeOrValue(value) {
  return `"${value.replace(/"/g, '\\"')}"`
}

async function buscarLeadsDaEtapa({ etapa, isAdmin, currentUserId, termo, loteIds, offset }) {
  let query = supabase
    .from('leads')
    .select(SELECT_COLUMNS, { count: 'exact' })
    .eq('etapa', etapa)
    .or('arquivado.eq.false,arquivado.is.null')

  if (!isAdmin) {
    query = query.or(`vendedor_id.eq.${currentUserId},agendador_id.eq.${currentUserId}`)
  }

  if (termo) {
    const termoDigits = termo.replace(/\D/g, '')
    const clauses = [`nome.ilike.${escapeOrValue(`%${termo}%`)}`]
    if (termoDigits) clauses.push(`telefone.ilike.${escapeOrValue(`%${termoDigits}%`)}`)
    if (loteIds.length > 0) clauses.push(`lote_id.in.(${loteIds.join(',')})`)
    query = query.or(clauses.join(','))
  }

  query = applyOrder(query).range(offset, offset + PAGE_SIZE - 1)

  const { data, error, count } = await query
  if (error) return { rows: null, count: 0, error }
  return { rows: data.map(fromRow), count, error: null }
}

export function EtapaLeadsModal({ etapa, onClose }) {
  const { leads: leadsContexto, updateLead } = useLeads()
  const { lotes } = useLotes()
  const { profiles } = useProfiles()
  const { currentUser, isAdmin } = useUser()
  const { showError } = useToast()
  const vendedores = profiles.filter(p => p.cargo === 'Vendedor')
  const agendadores = profiles.filter(p => p.cargo.includes('Agendador'))
  const { closing, requestClose } = useClosingTransition(onClose)
  useBodyScrollLock()
  useEscapeClose(requestClose)

  const [busca, setBusca] = useState('')
  const [termoDebounced, setTermoDebounced] = useState('')
  const [leadsCarregados, setLeadsCarregados] = useState([])
  const [total, setTotal] = useState(0)
  const [carregando, setCarregando] = useState(true)
  const [carregandoMais, setCarregandoMais] = useState(false)
  const [leadDetalheId, setLeadDetalheId] = useState(null)

  const loteById = useMemo(() => new Map(lotes.map(l => [l.id, l])), [lotes])

  // Código do imóvel vive em `lotes`, já carregado inteiro no cliente — achar
  // os ids que batem aqui evita precisar de um join no Supabase.
  const loteIdsDoTermo = useMemo(
    () => (termoDebounced ? lotes.filter(l => l.codigo.toLowerCase().includes(termoDebounced)).map(l => l.id) : []),
    [lotes, termoDebounced]
  )

  useEffect(() => {
    const t = setTimeout(() => setTermoDebounced(busca.trim().toLowerCase()), 300)
    return () => clearTimeout(t)
  }, [busca])

  useEffect(() => {
    let active = true
    setCarregando(true)
    buscarLeadsDaEtapa({
      etapa, isAdmin, currentUserId: currentUser.id, termo: termoDebounced, loteIds: loteIdsDoTermo, offset: 0,
    })
      .then(({ rows, count, error }) => {
        if (!active) return
        if (error) {
          console.error('Erro ao carregar leads da etapa:', error)
          showError('Não foi possível carregar os leads desta etapa.')
          setLeadsCarregados([])
          setTotal(0)
        } else {
          setLeadsCarregados(rows)
          setTotal(count)
        }
        setCarregando(false)
      })
    return () => { active = false }
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- showError é estável (definido no ToastContext) e não precisa disparar o fetch de novo
  }, [etapa, termoDebounced, isAdmin, currentUser.id, loteIdsDoTermo])

  async function carregarMais() {
    setCarregandoMais(true)
    const { rows, error } = await buscarLeadsDaEtapa({
      etapa, isAdmin, currentUserId: currentUser.id, termo: termoDebounced, loteIds: loteIdsDoTermo, offset: leadsCarregados.length,
    })
    if (error) {
      console.error('Erro ao carregar mais leads:', error)
      showError('Não foi possível carregar mais leads.')
    } else {
      setLeadsCarregados(prev => [...prev, ...rows])
    }
    setCarregandoMais(false)
  }

  const leadsContextoById = useMemo(() => new Map(leadsContexto.map(l => [l.id, l])), [leadsContexto])

  // As linhas já carregadas refletem edições feitas ao vivo (etapa, vendedor,
  // agendador, arquivamento) porque updateLead grava no LeadsContext
  // compartilhado — aqui só sobrepomos o que já buscamos com o estado atual.
  const leadsExibidos = useMemo(
    () => leadsCarregados
      .map(l => leadsContextoById.get(l.id) ?? l)
      .filter(l => l.etapa === etapa && !l.arquivado),
    [leadsCarregados, leadsContextoById, etapa]
  )

  // Um lead que saiu da etapa some da lista acima — o total do título precisa
  // acompanhar, não só a lista. Derivado do mesmo cruzamento, não um contador
  // separado, pra não desalinhar se o lead voltar pra etapa original.
  const removidosAoVivo = leadsCarregados.filter(l => {
    const atual = leadsContextoById.get(l.id)
    return atual && (atual.etapa !== etapa || atual.arquivado)
  }).length
  const totalExibido = Math.max(total - removidosAoVivo, 0)

  const temMais = leadsCarregados.length < total

  return (
    <>
    <div className={`modal-overlay ${closing ? 'closing' : ''}`} onClick={requestClose}>
      <div className="modal modal-wide" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Leads em {etapa} ({totalExibido})</h2>
          <button type="button" className="icon-btn" onClick={requestClose} aria-label="Fechar">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <div className="search-field">
            <Search size={16} className="search-field-icon" />
            <input
              type="text"
              className="search-field-input"
              placeholder="Buscar por nome, telefone ou código do imóvel..."
              value={busca}
              onChange={e => setBusca(e.target.value)}
            />
          </div>

          <div className="lote-leads-header">
            <h3 className="lote-detail-section-title">
              {carregando ? 'Carregando...' : `${leadsExibidos.length} de ${totalExibido} lead${totalExibido !== 1 ? 's' : ''}`}
            </h3>
          </div>

          <div className="lote-leads-list">
            {!carregando && leadsExibidos.length === 0 && (
              <div className="lote-leads-empty">Nenhum lead encontrado.</div>
            )}
            {leadsExibidos.map(lead => (
              <LeadRow
                key={lead.id}
                lead={lead}
                lote={loteById.get(lead.loteId)}
                vendedores={vendedores}
                agendadores={agendadores}
                updateLead={updateLead}
                showLote
                onOpenDetail={setLeadDetalheId}
              />
            ))}
          </div>

          {!carregando && temMais && (
            <div className="etapa-leads-footer">
              <button type="button" className="btn btn-secondary" onClick={carregarMais} disabled={carregandoMais}>
                {carregandoMais ? 'Carregando...' : 'Carregar mais'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>

    {leadDetalheId && (
      <LeadDetailModal leadId={leadDetalheId} onClose={() => setLeadDetalheId(null)} />
    )}
    </>
  )
}
