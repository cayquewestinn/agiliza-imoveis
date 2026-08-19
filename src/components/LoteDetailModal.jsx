import { useState } from 'react'
import {
  X, MapPin, Bed, Bath, Car, Ruler, Building2, Home, Gavel,
  Users, MessageCircle, CalendarClock, CheckCircle2, ImageOff, Images,
} from 'lucide-react'
import { statusToClassName, formatCurrency, formatDate } from '../utils/loteHelpers'
import { etapaToClassName, formatPhone, whatsappLink, LEAD_ETAPA_OPTIONS } from '../utils/leadHelpers'
import { useLeads } from '../context/LeadsContext'
import { useProfiles } from '../context/ProfilesContext'
import { useClosingTransition } from '../hooks/useClosingTransition'
import { PhotoGallery } from './PhotoGallery'

function LeadRow({ lead, lote, vendedores, agendadores, updateLead, onScheduleVisit }) {
  const [editing, setEditing] = useState(null) // null | 'etapa' | 'vendedor' | 'agendador'
  const vendedor = vendedores.find(p => p.id === lead.vendedorId)
  const agendador = agendadores.find(p => p.id === lead.agendadorId)
  const isSold = lead.etapa === 'Convertido'

  return (
    <div className="lead-row">
      <div className="lote-lead-info">
        <div className="lote-lead-name">{lead.nome}</div>
        <span className="lote-lead-phone">{formatPhone(lead.telefone)}</span>
      </div>

      <div className="lead-row-chips">
        {editing === 'etapa' ? (
          <select
            className={`visit-status-select status-badge status-${etapaToClassName(lead.etapa)}`}
            value={lead.etapa}
            autoFocus
            onChange={e => { updateLead(lead.id, { etapa: e.target.value }); setEditing(null) }}
            onBlur={() => setEditing(null)}
            aria-label={`Etapa de ${lead.nome}`}
          >
            {LEAD_ETAPA_OPTIONS.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        ) : (
          <button
            type="button"
            className={`status-badge status-chip status-${etapaToClassName(lead.etapa)}`}
            onClick={() => setEditing('etapa')}
            aria-label={`Etapa de ${lead.nome}: ${lead.etapa}. Clique para alterar.`}
          >
            {lead.etapa}
          </button>
        )}

        {editing === 'vendedor' ? (
          <select
            className="lote-lead-select"
            value={lead.vendedorId ?? ''}
            autoFocus
            onChange={e => { updateLead(lead.id, { vendedorId: e.target.value || null }); setEditing(null) }}
            onBlur={() => setEditing(null)}
            aria-label={`Vendedor responsável por ${lead.nome}`}
          >
            <option value="">— Vendedor —</option>
            {vendedores.map(p => (
              <option key={p.id} value={p.id}>{p.nome}</option>
            ))}
          </select>
        ) : (
          <button
            type="button"
            className="lead-assign-chip"
            onClick={() => setEditing('vendedor')}
            aria-label={`Vendedor responsável por ${lead.nome}: ${vendedor?.nome ?? 'nenhum'}. Clique para alterar.`}
          >
            {`Vendedor: ${vendedor?.nome ?? '—'}`}
          </button>
        )}

        {editing === 'agendador' ? (
          <select
            className="lote-lead-select"
            value={lead.agendadorId ?? ''}
            autoFocus
            onChange={e => { updateLead(lead.id, { agendadorId: e.target.value || null }); setEditing(null) }}
            onBlur={() => setEditing(null)}
            aria-label={`Agendador responsável por ${lead.nome}`}
          >
            <option value="">— Agendador —</option>
            {agendadores.map(p => (
              <option key={p.id} value={p.id}>{p.nome}</option>
            ))}
          </select>
        ) : (
          <button
            type="button"
            className="lead-assign-chip"
            onClick={() => setEditing('agendador')}
            aria-label={`Agendador responsável por ${lead.nome}: ${agendador?.nome ?? 'nenhum'}. Clique para alterar.`}
          >
            {`Agendador: ${agendador?.nome ?? '—'}`}
          </button>
        )}
      </div>

      <div className="lead-row-actions">
        <button
          type="button"
          className="icon-btn"
          onClick={() => onScheduleVisit(lote, lead)}
          aria-label={`Marcar visita com ${lead.nome}`}
        >
          <CalendarClock size={16} />
        </button>
        <a
          className="whatsapp-btn"
          href={whatsappLink(lead.telefone, `Olá ${lead.nome.split(' ')[0]}, tudo bem? Sou da Agiliza Imóveis e gostaria de falar sobre o imóvel ${lote.codigo}.`)}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Chamar ${lead.nome} no WhatsApp`}
        >
          <MessageCircle size={16} />
        </a>
        <button
          type="button"
          className={`icon-btn${isSold ? ' is-sold' : ''}`}
          onClick={() => updateLead(lead.id, { etapa: 'Convertido' })}
          disabled={isSold}
          aria-disabled={isSold}
          aria-label={isSold ? `${lead.nome} já foi marcado como vendido` : `Marcar ${lead.nome} como vendido`}
        >
          <CheckCircle2 size={16} />
        </button>
      </div>
    </div>
  )
}

export function LoteDetailModal({ lote, leads, onScheduleVisit, onClose }) {
  const { updateLead } = useLeads()
  const { profiles } = useProfiles()
  const vendedores = profiles.filter(p => p.cargo === 'Vendedor')
  const agendadores = profiles.filter(p => p.cargo.includes('Agendador'))
  const { closing, requestClose } = useClosingTransition(onClose)
  const [galleryOpen, setGalleryOpen] = useState(false)
  const fotos = lote.fotos ?? []

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
            <h3 className="lote-detail-section-title">
              <Users size={14} /> {leads.length} lead{leads.length !== 1 ? 's' : ''}
            </h3>

            <div className="lote-leads-list">
              {leads.length === 0 && (
                <div className="lote-leads-empty">Nenhum lead para este lote ainda.</div>
              )}
              {leads.map(lead => (
                <LeadRow
                  key={lead.id}
                  lead={lead}
                  lote={lote}
                  vendedores={vendedores}
                  agendadores={agendadores}
                  updateLead={updateLead}
                  onScheduleVisit={onScheduleVisit}
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
