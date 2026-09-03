import { useMemo, useState } from 'react'
import { Header } from '../components/Header'
import { LeadRow } from '../components/LeadRow'
import { Search } from 'lucide-react'
import { useLeads } from '../context/LeadsContext'
import { useLotes } from '../context/LotesContext'
import { useProfiles } from '../context/ProfilesContext'
import { useUser } from '../context/UserContext'
import { LEAD_ETAPA_OPTIONS, origemLabel } from '../utils/leadHelpers'

const PAGE_SIZE = 100

export function Leads({ initialEtapa }) {
  const { leads: todosOsLeads, updateLead } = useLeads()
  const { lotes } = useLotes()
  const { profiles } = useProfiles()
  const { currentUser, isAdmin } = useUser()

  const [etapaFilter, setEtapaFilter] = useState(initialEtapa ?? 'Todos')
  const [origemFilter, setOrigemFilter] = useState('Todas')
  const [responsavelFilter, setResponsavelFilter] = useState('Todos')
  const [searchTerm, setSearchTerm] = useState('')
  const [showArchived, setShowArchived] = useState(false)
  const [limite, setLimite] = useState(PAGE_SIZE)

  const vendedores = profiles.filter(p => p.cargo === 'Vendedor')
  const agendadores = profiles.filter(p => p.cargo.includes('Agendador'))
  const loteById = useMemo(() => new Map(lotes.map(l => [l.id, l])), [lotes])

  // Cada não-admin só trabalha os próprios leads — a mesma regra de escopo
  // que já vale no Painel Geral (vendedor ou agendador atribuído).
  const meusLeads = todosOsLeads.filter(
    l => l.vendedorId === currentUser.id || l.agendadorId === currentUser.id
  )
  const leadsDoEscopo = isAdmin ? todosOsLeads : meusLeads

  const origensDisponiveis = useMemo(() => {
    const rotulos = new Set(leadsDoEscopo.map(l => origemLabel(l.origem)).filter(Boolean))
    return Array.from(rotulos).sort()
  }, [leadsDoEscopo])

  const semArquivados = leadsDoEscopo.filter(l => showArchived || !l.arquivado)

  const porEtapa = etapaFilter === 'Todos'
    ? semArquivados
    : semArquivados.filter(l => l.etapa === etapaFilter)

  const porOrigem = origemFilter === 'Todas'
    ? porEtapa
    : porEtapa.filter(l => origemLabel(l.origem) === origemFilter)

  const porResponsavel = !isAdmin || responsavelFilter === 'Todos'
    ? porOrigem
    : porOrigem.filter(l => l.vendedorId === responsavelFilter || l.agendadorId === responsavelFilter)

  const termo = searchTerm.trim().toLowerCase()
  const termoDigitos = termo.replace(/\D/g, '')
  const filtrados = termo
    ? porResponsavel.filter(l => {
        const lote = loteById.get(l.loteId)
        return (
          l.nome.toLowerCase().includes(termo) ||
          (termoDigitos && l.telefone.includes(termoDigitos)) ||
          (lote && lote.codigo.toLowerCase().includes(termo))
        )
      })
    : porResponsavel

  const visiveis = filtrados.slice(0, limite)
  const restantes = filtrados.length - visiveis.length

  function limparFiltros() {
    setEtapaFilter('Todos')
    setOrigemFilter('Todas')
    setResponsavelFilter('Todos')
    setSearchTerm('')
    setLimite(PAGE_SIZE)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Header title="Leads" />

      <div className="page-content" style={{ flex: 1, overflow: 'auto' }}>
        <div className="status-tabs">
          <button
            className={`status-tab ${etapaFilter === 'Todos' ? 'active' : ''}`}
            onClick={() => { setEtapaFilter('Todos'); setLimite(PAGE_SIZE) }}
          >
            Todos <span className="status-tab-count">{semArquivados.length}</span>
          </button>
          {LEAD_ETAPA_OPTIONS.map(opt => (
            <button
              key={opt}
              className={`status-tab ${etapaFilter === opt ? 'active' : ''}`}
              onClick={() => { setEtapaFilter(opt); setLimite(PAGE_SIZE) }}
            >
              {opt} <span className="status-tab-count">{semArquivados.filter(l => l.etapa === opt).length}</span>
            </button>
          ))}
        </div>

        <div className="search-field">
          <Search size={16} className="search-field-icon" />
          <input
            type="text"
            className="search-field-input"
            placeholder="Buscar por nome, telefone ou código do imóvel..."
            value={searchTerm}
            onChange={e => { setSearchTerm(e.target.value); setLimite(PAGE_SIZE) }}
          />
        </div>

        <div className="leads-filtros">
          <select
            className="form-input"
            value={origemFilter}
            onChange={e => { setOrigemFilter(e.target.value); setLimite(PAGE_SIZE) }}
            aria-label="Filtrar por origem"
          >
            <option value="Todas">Todas as origens</option>
            {origensDisponiveis.map(o => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>

          {isAdmin && (
            <select
              className="form-input"
              value={responsavelFilter}
              onChange={e => { setResponsavelFilter(e.target.value); setLimite(PAGE_SIZE) }}
              aria-label="Filtrar por vendedor ou agendador"
            >
              <option value="Todos">Vendedor ou agendador — todos</option>
              {vendedores.map(p => (
                <option key={p.id} value={p.id}>Vendedor: {p.nome}</option>
              ))}
              {agendadores.map(p => (
                <option key={p.id} value={p.id}>Agendador: {p.nome}</option>
              ))}
            </select>
          )}

          <label className="lote-leads-archived-toggle">
            <input
              type="checkbox"
              checked={showArchived}
              onChange={e => { setShowArchived(e.target.checked); setLimite(PAGE_SIZE) }}
            />
            Mostrar arquivados
          </label>

          {(etapaFilter !== 'Todos' || origemFilter !== 'Todas' || responsavelFilter !== 'Todos' || searchTerm) && (
            <button type="button" className="btn btn-secondary btn-sm" onClick={limparFiltros}>
              Limpar filtros
            </button>
          )}
        </div>

        <div className="lote-leads-header">
          <h3 className="lote-detail-section-title">
            {filtrados.length} lead{filtrados.length !== 1 ? 's' : ''}
          </h3>
        </div>

        <div className="card" style={{ padding: 0 }}>
          <div className="lote-leads-list" style={{ padding: '0 20px' }}>
            {visiveis.length === 0 && (
              <div className="lote-leads-empty">Nenhum lead encontrado para este filtro.</div>
            )}
            {visiveis.map(lead => (
              <LeadRow
                key={lead.id}
                lead={lead}
                lote={loteById.get(lead.loteId)}
                vendedores={vendedores}
                agendadores={agendadores}
                updateLead={updateLead}
                showLote
              />
            ))}
          </div>
        </div>

        {restantes > 0 && (
          <button
            type="button"
            className="btn btn-secondary leads-carregar-mais"
            onClick={() => setLimite(l => l + PAGE_SIZE)}
          >
            Carregar mais {Math.min(restantes, PAGE_SIZE)} de {restantes}
          </button>
        )}
      </div>
    </div>
  )
}
