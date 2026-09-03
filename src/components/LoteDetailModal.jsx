import { useState } from 'react'
import {
  MapPin, Bed, Bath, Car, Ruler, Building2, Home, Gavel, Landmark,
  Users, ImageOff, Images,
} from 'lucide-react'
import {
  statusToClassName, formatCurrency, leilaoUrgenciaLabel, leilaoUrgenciaClassName,
} from '../utils/loteHelpers'
import { useLeads } from '../context/LeadsContext'
import { useProfiles } from '../context/ProfilesContext'
import { PhotoGallery } from './PhotoGallery'
import { LeadRow } from './LeadRow'
import { Modal } from './Modal'

export function LoteDetailModal({ lote, onClose }) {
  const { leadsByLote, updateLead } = useLeads()
  const { profiles } = useProfiles()
  const vendedores = profiles.filter(p => p.cargo === 'Vendedor')
  const agendadores = profiles.filter(p => p.cargo.includes('Agendador'))
  const [galleryOpen, setGalleryOpen] = useState(false)
  const [showArchived, setShowArchived] = useState(false)
  const fotos = lote.fotos ?? []
  const leads = leadsByLote(lote.id, { includeArchived: showArchived })
  const archivedCount = leadsByLote(lote.id, { includeArchived: true }).length - leadsByLote(lote.id).length

  return (
    <Modal titulo={lote.titulo} wide onClose={onClose}>
      <div className="modal-body">
        <button
          type="button"
          className="lote-detail-photo"
          onClick={() => fotos.length > 0 && setGalleryOpen(true)}
          disabled={fotos.length === 0}
        >
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
        </button>

        <div>
          <div className="lote-detail-top">
            <div className="lote-card-codigo">{lote.codigo}</div>
            <span className={`status-badge status-${statusToClassName(lote.status)}`}>
              {lote.status}
            </span>
          </div>

          <h3 className="lote-detail-title">{lote.titulo}</h3>

          {/* O leilão é o prazo que torna cada lead urgente — vem antes do
              endereço, não depois do preço. */}
          <div className={`lote-detail-leilao lote-detail-leilao-${leilaoUrgenciaClassName(lote.dataLeilao)}`}>
            <Gavel size={15} /> {leilaoUrgenciaLabel(lote.dataLeilao)}
          </div>

          <div className="lote-card-address">
            <MapPin size={14} />
            {lote.endereco ? `${lote.endereco}, ` : ''}{lote.bairro}, {lote.cidade} - {lote.uf}
          </div>

          <div className="lote-card-strip-left" style={{ marginBottom: 12 }}>
            {lote.tipoImovel === 'Comercial' ? <Building2 size={15} /> : <Home size={15} />}
            <span className="mono" style={{ fontSize: '0.76rem' }}>{lote.tipoImovel}</span>
          </div>

          {lote.comitente && (
            <div className="lote-detail-comitente">
              <Landmark size={14} /> Comitente: {lote.comitente}
            </div>
          )}

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
            {lote.lanceInicial > 0 && (
              <div>
                <div className="lote-price-label">Lance inicial</div>
                <div className="lote-price-value">{formatCurrency(lote.lanceInicial)}</div>
              </div>
            )}
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

      {galleryOpen && (
        <PhotoGallery
          fotos={fotos}
          startIndex={0}
          titulo={lote.titulo}
          onClose={() => setGalleryOpen(false)}
        />
      )}
    </Modal>
  )
}
