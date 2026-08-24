import { useMemo, useState } from 'react'
import { X, Search } from 'lucide-react'
import { useLeads } from '../context/LeadsContext'
import { useLotes } from '../context/LotesContext'
import { useProfiles } from '../context/ProfilesContext'
import { useClosingTransition } from '../hooks/useClosingTransition'
import { useBodyScrollLock } from '../hooks/useBodyScrollLock'
import { LeadRow } from './LeadRow'

const PREVIEW_LIMIT = 200

export function EtapaLeadsModal({ etapa, leads, onClose }) {
  const { updateLead } = useLeads()
  const { lotes } = useLotes()
  const { profiles } = useProfiles()
  const vendedores = profiles.filter(p => p.cargo === 'Vendedor')
  const agendadores = profiles.filter(p => p.cargo.includes('Agendador'))
  const { closing, requestClose } = useClosingTransition(onClose)
  useBodyScrollLock()
  const [busca, setBusca] = useState('')

  const loteById = useMemo(() => new Map(lotes.map(l => [l.id, l])), [lotes])

  const leadsDaEtapa = useMemo(
    () => leads.filter(l => l.etapa === etapa && !l.arquivado),
    [leads, etapa]
  )

  const termo = busca.trim().toLowerCase()
  const termoDigits = termo.replace(/\D/g, '')
  const leadsFiltrados = termo
    ? leadsDaEtapa.filter(l => {
        const lote = loteById.get(l.loteId)
        return (
          l.nome.toLowerCase().includes(termo) ||
          (termoDigits && l.telefone.includes(termoDigits)) ||
          (lote && lote.codigo.toLowerCase().includes(termo))
        )
      })
    : leadsDaEtapa

  const leadsExibidos = termo ? leadsFiltrados : leadsFiltrados.slice(0, PREVIEW_LIMIT)
  const truncado = !termo && leadsFiltrados.length > PREVIEW_LIMIT

  return (
    <div className={`modal-overlay ${closing ? 'closing' : ''}`} onClick={requestClose}>
      <div className="modal modal-wide" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Leads em {etapa}</h2>
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
              {leadsFiltrados.length} lead{leadsFiltrados.length !== 1 ? 's' : ''}
              {truncado ? ` — mostrando os primeiros ${PREVIEW_LIMIT}, refine a busca para ver os demais` : ''}
            </h3>
          </div>

          <div className="lote-leads-list">
            {leadsExibidos.length === 0 && (
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
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
