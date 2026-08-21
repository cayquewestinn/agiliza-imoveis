import { useState } from 'react'
import {
  X, MapPin, Bed, Bath, Car, Ruler, Building2, Home, Gavel,
  Users, ImageOff, Images,
} from 'lucide-react'
import { statusToClassName, formatCurrency, formatDate } from '../utils/loteHelpers'
import { useLeads } from '../context/LeadsContext'
import { useProfiles } from '../context/ProfilesContext'
import { useClosingTransition } from '../hooks/useClosingTransition'
import { useBodyScrollLock } from '../hooks/useBodyScrollLock'
import { PhotoGallery } from './PhotoGallery'
import { LeadRow } from './LeadRow'

export function LoteDetailModal({ lote, onClose }) {
  const { leadsByLote, updateLead } = useLeads()
  const { profiles } = useProfiles()
  const vendedores = profiles.filter(p => p.cargo === 'Vendedor')
  const agendadores = profiles.filter(p => p.cargo.includes('Agendador'))
  const { closing, requestClose } = useClosingTransition(onClose)
  useBodyScrollLock()
  const [galleryOpen, setGalleryOpen] = useState(false)
  const [showArchived, setShowArchived] = useState(false)
  const fotos = lote.fotos ?? []
  const leads = leadsByLote(lote.id, { includeArchived: showArchived })
  const archivedCount = leadsByLote(lote.id, { includeArchived: true }).length - leadsByLote(lote.id).length

  return (
    <div className={`modal-overlay ${closing ? 'closing' : ''}`} onClick={requestClose}>
      <div className="modal modal-wide" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{lote.titulo}</h2>
          <button type="button" className="icon-btn" onClick={requestClose} aria-label="Fechar">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <div className="lote-detail-photo" onClick={() => fotos.length > 0 && setGalleryOpen(true)}>
            {fotos.length > 0 ? (
              <>
                <img src={fotos[0]} alt={lote.titulo} loading="lazy" />
                {fotos.length > 1 && (
                  <span className="lote-card-photo-count">
                    <Images size={13} /> {fotos.length}
                  </span>
                )}
              </>
            ) : (
              <div className="lote-card-photo-empty">
                <ImageOff size={22} />
                <span>Sem fotos</span>
              </div>
            )}
          </div>

          <div>
            <div className="lote-detail-top">
              <div className="lote-card-codigo">{lote.codigo}</div>
              <span className={`status-badge status-${statusToClassName(lote.status)}`}>
                {lote.status}
              </span>
            </div>

            <h3 className="lote-detail-title">{lote.titulo}</h3>

            <div className="lote-card-address">
              <MapPin size={14} />
              {lote.endereco ? `${lote.endereco}, ` : ''}{lote.bairro}, {lote.cidade} - {lote.uf}
            </div>

            <div className="lote-card-strip-left" style={{ marginBottom: 12 }}>
              {lote.tipoImovel === 'Comercial' ? <Building2 size={15} /> : <Home size={15} />}
              <span className="mono" style={{ fontSize: '0.76rem' }}>{lote.tipoImovel}</span>
            </div>

            <div className="lote-specs">
              <span><Ruler size={14} /> {lote.areaUtil} m²</span>
              {lote.quartos > 0 && <span><Bed size={14} /> {lote.quartos}</span>}
              {lote.banheiros > 0 && <span><Bath size={14} /> {lote.banheiros}</span>}
              {lote.vagas > 0 && <span><Car size={14} /> {lote.vagas}</span>}
            </div>

            <div className="lote-price-row">
              <div>
                <div className="lote-price-label">Avaliação</div>
                <div className="lote-price-value">{formatCurrency(lote.valorAvaliacao)}</div>
              </div>
              <div className="lote-card-meta">
                <Gavel size={14} /> {formatDate(lote.dataLeilao)}
              </div>
            </div>
          </div>

          <div>
            <div className="lote-leads-header">
              <h3 className="lote-detail-section-title">
                <Users size={14} /> {leads.length} lead{leads.length !== 1 ? 's' : ''}
              </h3>
              {archivedCount > 0 && (
                <label className="lote-leads-archived-toggle">
                  <input
                    type="checkbox"
                    checked={showArchived}
                    onChange={e => setShowArchived(e.target.checked)}
                  />
                  Mostrar arquivados ({archivedCount})
                </label>
              )}
            </div>

            <div className="lote-leads-list">
              {leads.length === 0 && (
                <div className="lote-leads-empty">Nenhum lead para este imóvel ainda.</div>
              )}
              {leads.map(lead => (
                <LeadRow
                  key={lead.id}
                  lead={lead}
                  lote={lote}
                  vendedores={vendedores}
                  agendadores={agendadores}
                  updateLead={updateLead}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {galleryOpen && (
        <div onClick={e => e.stopPropagation()}>
          <PhotoGallery
            fotos={fotos}
            startIndex={0}
            titulo={lote.titulo}
            onClose={() => setGalleryOpen(false)}
          />
        </div>
      )}
    </div>
  )
}
